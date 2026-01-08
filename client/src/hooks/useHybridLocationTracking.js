import { useEffect, useRef, useCallback, useState } from 'react'
import { updateLocation } from '../services/socketService'
import { isIOS, getGeolocationOptions } from '../utils/platformDetection'
import { watchGoogleLocation, clearGoogleLocationWatch } from '../services/googleGeolocation'

/**
 * Hybrid location tracking hook
 * Tries browser GPS first, falls back to Google Geolocation API if permission denied
 */
export function useHybridLocationTracking(userId, onLocationUpdate) {
  const watchIdRef = useRef(null)
  const googleWatchRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const lastLocationRef = useRef(null)
  const updateTimeoutRef = useRef(null)
  const errorCountRef = useRef(0)
  const isUnmountedRef = useRef(false)
  const [locationSource, setLocationSource] = useState('browser') // 'browser' or 'google'

  const THROTTLE_INTERVAL = isIOS() ? 3000 : 2000
  const MAX_CONSECUTIVE_ERRORS = 5

  // Throttled update function - prevents main thread blocking
  const throttledUpdate = useCallback((location, source = 'browser') => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current

    lastLocationRef.current = location

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      lastUpdateTimeRef.current = now

      // Add source metadata
      const locationWithMeta = {
        ...location,
        source: source // Track which API provided the location
      }

      onLocationUpdate(locationWithMeta)
      updateLocation(userId, locationWithMeta)
    } else {
      const remainingTime = THROTTLE_INTERVAL - timeSinceLastUpdate
      updateTimeoutRef.current = setTimeout(() => {
        if (isUnmountedRef.current || !lastLocationRef.current) return

        lastUpdateTimeRef.current = Date.now()
        const locationWithMeta = {
          ...lastLocationRef.current,
          source: source
        }
        onLocationUpdate(locationWithMeta)
        updateLocation(userId, locationWithMeta)
        updateTimeoutRef.current = null
      }, remainingTime)
    }
  }, [userId, onLocationUpdate, THROTTLE_INTERVAL])

  // Start Google Geolocation as fallback
  const startGoogleTracking = useCallback(() => {
    console.log('Falling back to Google Geolocation API')
    setLocationSource('google')

    googleWatchRef.current = watchGoogleLocation(
      (position) => {
        errorCountRef.current = 0
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          bearing: position.coords.heading,
          speed: position.coords.speed
        }
        throttledUpdate(location, 'google')
      },
      (error) => {
        console.error('Google Geolocation error:', error)
      },
      {
        pollInterval: THROTTLE_INTERVAL, // Match throttle interval
        considerIp: true
      }
    )
  }, [throttledUpdate, THROTTLE_INTERVAL])

  useEffect(() => {
    isUnmountedRef.current = false

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      // Try Google API as fallback
      startGoogleTracking()
      return
    }

    const handleSuccess = (position) => {
      errorCountRef.current = 0

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        bearing: position.coords.heading,
        speed: position.coords.speed
      }

      throttledUpdate(location, 'browser')
    }

    const handleError = (error) => {
      errorCountRef.current++

      let message = 'Unknown location error'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Falling back to Google Geolocation...'
          console.warn(message)

          // PERMISSION DENIED: Switch to Google API
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
          startGoogleTracking()
          return // Don't continue with browser GPS

        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.'
          break

        case error.TIMEOUT:
          message = 'Location request timeout.'
          if (isIOS()) {
            console.warn('iOS location timeout - this is normal, will retry')
          }
          break
      }
      console.error(message, error)

      // iOS-specific: Detect when location updates have completely stalled
      if (isIOS() && errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn('iOS location tracking stalled. Attempting recovery...')

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }

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

    const geolocationOptions = getGeolocationOptions()

    // Try browser GPS first
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

    // Cleanup
    return () => {
      isUnmountedRef.current = true

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      if (googleWatchRef.current) {
        clearGoogleLocationWatch(googleWatchRef.current)
        googleWatchRef.current = null
      }

      lastLocationRef.current = null
      errorCountRef.current = 0
    }
  }, [userId, throttledUpdate, startGoogleTracking])

  return locationSource // Return current source for debugging
}
