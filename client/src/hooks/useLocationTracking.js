import { useEffect, useRef, useCallback } from 'react'
import { updateLocation } from '../services/socketService'
import { isIOS, isSafari, getGeolocationOptions } from '../utils/platformDetection'

export function useLocationTracking(userId, onLocationUpdate) {
  const watchIdRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const lastLocationRef = useRef(null)
  const updateTimeoutRef = useRef(null)
  const errorCountRef = useRef(0)
  const isUnmountedRef = useRef(false)

  // Safari-specific: Minimum time between updates (3 seconds for Safari, 2s others)
  // Prevents excessive state updates and socket emissions that cause lag
  const THROTTLE_INTERVAL = isSafari() ? 3000 : 2000

  // Safari-specific: Maximum consecutive errors before attempting recovery
  const MAX_CONSECUTIVE_ERRORS = 5

  // Throttled update function - prevents main thread blocking
  const throttledUpdate = useCallback((location) => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current

    // Store the latest location
    lastLocationRef.current = location

    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      lastUpdateTimeRef.current = now

      // Update local state (non-blocking)
      onLocationUpdate(location)

      // Send to server (batched via throttle)
      updateLocation(userId, location)
    } else {
      // Schedule update for later to batch multiple rapid updates
      const remainingTime = THROTTLE_INTERVAL - timeSinceLastUpdate
      updateTimeoutRef.current = setTimeout(() => {
        if (isUnmountedRef.current || !lastLocationRef.current) return

        lastUpdateTimeRef.current = Date.now()
        onLocationUpdate(lastLocationRef.current)
        updateLocation(userId, lastLocationRef.current)
        updateTimeoutRef.current = null
      }, remainingTime)
    }
  }, [userId, onLocationUpdate, THROTTLE_INTERVAL])

  useEffect(() => {
    isUnmountedRef.current = false

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      return
    }

    console.log('[Geolocation] Starting location tracking...')
    console.log('[Geolocation] Browser:', isSafari() ? 'Safari' : 'Chrome/Firefox/Edge')
    console.log('[Geolocation] Platform:', isIOS() ? 'iOS' : 'Desktop/Android')
    console.log('[Geolocation] Protocol:', window.location.protocol)
    console.log('[Geolocation] User agent:', navigator.userAgent)

    const handleSuccess = (position) => {
      console.log('[Geolocation] ✅ Success! Position received:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
      // Reset error counter on successful update
      errorCountRef.current = 0

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        bearing: position.coords.heading,
        speed: position.coords.speed
      }

      // Use throttled update to prevent excessive state changes
      throttledUpdate(location)
    }

    const handleError = (error) => {
      console.error('[Geolocation] ❌ Error occurred:', {
        code: error.code,
        message: error.message,
        errorCount: errorCountRef.current + 1
      })

      errorCountRef.current++

      let message = 'Unknown location error'
      let userMessage = ''

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please enable location sharing.'
          userMessage = 'Please enable location access in your browser settings.'
          console.error('[Geolocation] PERMISSION_DENIED - User or browser blocked location access')
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.'
          console.error('[Geolocation] POSITION_UNAVAILABLE - Cannot determine position')

          if (isSafari()) {
            console.error('[Geolocation] Safari-specific POSITION_UNAVAILABLE causes:')
            console.error('  1. Location Services disabled in system settings')
            console.error('  2. Safari does not have permission to access location')
            console.error('  3. No WiFi/GPS signal available')
            console.error('  4. enableHighAccuracy:true is incompatible (we use false)')

            if (isIOS()) {
              console.error('[Geolocation] iOS Safari fix steps:')
              console.error('  → Settings → Privacy & Security → Location Services → ON')
              console.error('  → Settings → Privacy & Security → Location Services → Safari Websites → While Using')
              console.error('  → Make sure WiFi or Cellular is enabled')
              userMessage = 'Check Settings → Privacy → Location Services → Safari Websites'
            } else {
              console.error('[Geolocation] macOS Safari fix steps:')
              console.error('  → Safari → Settings → Websites → Location → Allow for this site')
              console.error('  → System Settings → Privacy & Security → Location Services → Safari (checked)')
              console.error('  → System Settings → Privacy & Security → Location Services → Enable Location Services (ON)')
              userMessage = 'Check Safari → Settings → Websites → Location'
            }
          } else {
            console.error('[Geolocation] General troubleshooting:')
            console.error('  1. Check browser location permissions')
            console.error('  2. Verify WiFi/GPS signal')
            console.error('  3. Try refreshing the page')
          }
          break
        case error.TIMEOUT:
          message = 'Location request timeout.'
          console.warn('[Geolocation] TIMEOUT - Request took too long')
          // iOS-specific: Timeouts are common, don't treat as fatal error
          if (isIOS()) {
            console.warn('[Geolocation] iOS location timeout - this is normal, will retry')
          }
          break
      }
      console.error('[Geolocation] Error message:', message, error)

      // Show user-friendly message if onLocationUpdate can handle it
      if (userMessage) {
        console.warn('User message:', userMessage)
      }

      // Safari fallback: Try recovery with ultra-conservative settings on POSITION_UNAVAILABLE
      if (error.code === error.POSITION_UNAVAILABLE && errorCountRef.current === 1) {
        console.warn('[Geolocation] POSITION_UNAVAILABLE on first try - attempting fallback...')
        console.warn('[Geolocation] Fallback strategy: using minimal options')

        // Clear existing watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }

        // Retry with absolute minimum requirements (most permissive)
        setTimeout(() => {
          if (isUnmountedRef.current) return

          console.log('[Geolocation] Retry attempt 1: Ultra-conservative settings (timeout: Infinity)')
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
              enableHighAccuracy: false,
              timeout: Infinity,        // Never timeout - wait indefinitely
              maximumAge: Infinity      // Accept any cached position, no matter how old
            }
          )
        }, 1000)
        return // Don't continue error handling, give fallback a chance
      }

      // Safari fallback: Try with NO options at all (Safari sometimes prefers this)
      if (error.code === error.POSITION_UNAVAILABLE && errorCountRef.current === 2) {
        console.warn('[Geolocation] Still failing - trying with NO options (Safari compatibility mode)')

        // Clear existing watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }

        setTimeout(() => {
          if (isUnmountedRef.current) return

          console.log('[Geolocation] Retry attempt 2: No options at all')
          // Try with NO options - let browser use defaults
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError
            // NO third parameter - use browser defaults
          )
        }, 2000)
        return
      }

      // Safari-specific: Detect when location updates have completely stalled
      if (isSafari() && errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(
          '[Geolocation] Safari location tracking has stalled after ' + MAX_CONSECUTIVE_ERRORS + ' errors. ' +
          'Attempting full recovery (clear + restart watch)...'
        )

        // Attempt recovery by restarting the watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }

        // Reset error counter and restart watch after brief delay
        setTimeout(() => {
          if (isUnmountedRef.current) return
          errorCountRef.current = 0

          console.log('[Geolocation] Restarting watchPosition after stall recovery')
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            getGeolocationOptions()
          )
        }, 2000)
      }
    }

    // Get browser-specific options (Safari uses conservative settings to avoid POSITION_UNAVAILABLE)
    const geolocationOptions = getGeolocationOptions()

    console.log('[Geolocation] Using options:', JSON.stringify(geolocationOptions, null, 2))

    // Skip getCurrentPosition and go straight to watchPosition
    // getCurrentPosition can fail on Safari while watchPosition succeeds
    console.log('[Geolocation] Starting watchPosition (skipping getCurrentPosition for Safari compatibility)...')

    // Watch for location changes with platform-optimized options
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

    console.log('[Geolocation] watchPosition started, waiting for first position...')

    // Cleanup function - critical for iOS memory management
    return () => {
      isUnmountedRef.current = true

      // Clear any pending throttled updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      // Clear geolocation watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      // Clear refs to prevent memory leaks
      lastLocationRef.current = null
      errorCountRef.current = 0
    }
  }, [userId, throttledUpdate])
}
