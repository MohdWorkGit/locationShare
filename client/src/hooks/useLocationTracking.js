import { useEffect, useRef } from 'react'
import { updateLocation } from '../services/socketService'

export function useLocationTracking(userId, onLocationUpdate) {
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      return
    }

    const handleSuccess = (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        bearing: position.coords.heading,
        speed: position.coords.speed
      }

      // Update local state
      onLocationUpdate(location)

      // Send to server
      updateLocation(userId, location)
    }

    const handleError = (error) => {
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
          break
      }
      console.error(message, error)
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true
    })

    // Watch for location changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000
      }
    )

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [userId, onLocationUpdate])
}
