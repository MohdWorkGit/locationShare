/**
 * Platform Detection Utility
 * Provides iOS Safari detection for performance optimizations
 */

/**
 * Detects if the current device is running iOS (iPhone, iPad, iPod)
 * Includes detection for both regular and iPadOS Safari
 * @returns {boolean} True if device is iOS
 */
export const isIOS = () => {
  // Check for iOS devices via userAgent
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipod|ipad/.test(userAgent);

  // Additional check for iPad on iOS 13+ (reports as Mac)
  const isTouchDevice = navigator.maxTouchPoints > 1;
  const isMacLike = /macintosh/.test(userAgent);
  const isProbablyIPad = isMacLike && isTouchDevice;

  return isIOSDevice || isProbablyIPad;
};

/**
 * Detects if the browser is Safari (iOS or desktop)
 * @returns {boolean} True if browser is Safari
 */
export const isSafari = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /safari/.test(userAgent) && !/chrome|chromium|crios|fxios/.test(userAgent);
};

/**
 * Detects iOS Safari specifically (most restrictive browser for location tracking)
 * @returns {boolean} True if iOS Safari
 */
export const isIOSSafari = () => {
  return isIOS() && isSafari();
};

/**
 * Get platform-optimized geolocation options
 * iOS uses conservative settings to prevent lag and battery drain
 * @returns {PositionOptions} Geolocation watchPosition options
 */
export const getGeolocationOptions = () => {
  if (isIOS()) {
    // iOS-specific options: disable high-accuracy GPS to reduce lag
    // Use cached positions more aggressively to minimize main thread blocking
    return {
      enableHighAccuracy: false,  // Use network/WiFi positioning instead of GPS
      timeout: 15000,              // Allow more time for iOS to respond (15s)
      maximumAge: 5000             // Accept positions cached up to 5s ago
    };
  }

  // Android and desktop: use more accurate settings
  return {
    enableHighAccuracy: true,    // Use GPS for accuracy
    timeout: 5000,               // Faster timeout acceptable
    maximumAge: 10000            // 10s cache is fine
  };
};

/**
 * Maximum number of path points to store in memory
 * iOS: More aggressive limiting to prevent memory issues and lag during path rendering
 * Other platforms: Can handle more points
 */
export const MAX_PATH_POINTS = isIOS() ? 100 : 200;

/**
 * Limits an array of path points to prevent excessive memory usage and rendering lag
 * Keeps the most recent points up to MAX_PATH_POINTS
 * @param {Array} pathPoints - Array of location points with lat/lng/timestamp
 * @returns {Array} Limited array of path points
 */
export const limitPathPoints = (pathPoints) => {
  if (!Array.isArray(pathPoints)) return [];

  const maxPoints = isIOS() ? 100 : 200;

  if (pathPoints.length <= maxPoints) {
    return pathPoints;
  }

  // Keep only the most recent points
  // Slice from the end to preserve recent tracking data
  return pathPoints.slice(-maxPoints);
};
