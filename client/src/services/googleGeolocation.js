/**
 * Google Geolocation API Service
 * Alternative to browser GPS using WiFi/cell tower triangulation
 */

const GOOGLE_GEOLOCATION_API_KEY = import.meta.env.VITE_GOOGLE_GEOLOCATION_API_KEY;
const GOOGLE_GEOLOCATION_URL = 'https://www.googleapis.com/geolocation/v1/geolocate';

/**
 * Get location using Google Geolocation API
 * Uses WiFi access points and cell towers for positioning
 *
 * @param {boolean} considerIp - Fallback to IP geolocation if no WiFi/cell data
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export async function getGoogleLocation(considerIp = true) {
  if (!GOOGLE_GEOLOCATION_API_KEY) {
    throw new Error('Google Geolocation API key not configured');
  }

  try {
    const response = await fetch(`${GOOGLE_GEOLOCATION_URL}?key=${GOOGLE_GEOLOCATION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: considerIp,
        // Note: WiFi and cell tower data would need to be collected from device
        // Browser API doesn't expose this, so we rely on IP-based estimation
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google Geolocation API failed');
    }

    const data = await response.json();

    return {
      lat: data.location.lat,
      lng: data.location.lng,
      accuracy: data.accuracy || 1000, // Google returns accuracy in meters
    };
  } catch (error) {
    console.error('Google Geolocation error:', error);
    throw error;
  }
}

/**
 * Watch location using Google Geolocation API
 * Simulates watchPosition() behavior with polling
 *
 * WARNING: This is expensive! Each poll = 1 API request = $0.005
 *
 * @param {Function} onSuccess - Callback with location data
 * @param {Function} onError - Error callback
 * @param {Object} options - Configuration options
 * @returns {number} Watch ID for clearing
 */
export function watchGoogleLocation(onSuccess, onError, options = {}) {
  const {
    pollInterval = 5000, // Poll every 5 seconds (minimum recommended)
    considerIp = true
  } = options;

  let watchId = 0;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const location = await getGoogleLocation(considerIp);

      // Format to match browser geolocation API
      const position = {
        coords: {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          altitude: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      onSuccess(position);
    } catch (error) {
      if (onError) {
        onError({
          code: 2, // POSITION_UNAVAILABLE
          message: error.message
        });
      }
    }

    // Schedule next poll
    if (isActive) {
      watchId = setTimeout(poll, pollInterval);
    }
  };

  // Start polling
  poll();

  // Return a clear function (wrapped in object to match watchPosition API)
  return {
    id: watchId,
    clear: () => {
      isActive = false;
      if (watchId) clearTimeout(watchId);
    }
  };
}

/**
 * Clear Google location watch
 * @param {Object} watchHandle - Handle returned from watchGoogleLocation
 */
export function clearGoogleLocationWatch(watchHandle) {
  if (watchHandle && watchHandle.clear) {
    watchHandle.clear();
  }
}
