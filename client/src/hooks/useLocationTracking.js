import { useEffect, useRef, useCallback } from 'react'
import { updateLocation } from '../services/socketService'
import { isIOS, getGeolocationOptions } from '../utils/platformDetection'

export function useLocationTracking(userId, onLocationUpdate) {
  const watchIdRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const lastLocationRef = useRef(null)
  const updateTimeoutRef = useRef(null)
  const errorCountRef = useRef(0)
  const isUnmountedRef = useRef(false)

  // iOS-specific: Minimum time between updates (3 seconds)
  // Prevents excessive state updates and socket emissions that cause lag
  const THROTTLE_INTERVAL = isIOS() ? 3000 : 2000

  // iOS-specific: Maximum consecutive errors before attempting recovery
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

    const handleSuccess = (position) => {
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
      errorCountRef.current++

      let message = 'Unknown location error'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please enable location sharing.'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.'
          break
        case error.TIMEOUT:
          message = 'Location request timeout.'
          // iOS-specific: Timeouts are common, don't treat as fatal error
          if (isIOS()) {
            console.warn('iOS location timeout - this is normal, will retry')
          }
          break
      }
      console.error(message, error)

      // iOS-specific: Detect when location updates have completely stalled
      if (isIOS() && errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(
          'iOS location tracking may have stalled. ' +
          'This can happen when Safari restricts background location access. ' +
          'Attempting recovery...'
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

          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            getGeolocationOptions()
          )
        }, 2000)
      }
    }

    // Get platform-specific options (iOS uses conservative settings)
    const geolocationOptions = getGeolocationOptions()

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

    // Watch for location changes with platform-optimized options
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

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
