/**
 * GPX Parser Utility
 * Parses GPX files and extracts route/track points
 */

/**
 * Parse GPX file content and extract coordinates
 * @param {string} gpxContent - The GPX file content as string
 * @returns {Array} Array of destination objects with lat, lng, and optional metadata
 */
function parseGPX(gpxContent) {
  const destinations = [];

  try {
    // Extract route points (rtept) from GPX
    const rteptRegex = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
    let match;

    while ((match = rteptRegex.exec(gpxContent)) !== null) {
      destinations.push({
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      });
    }

    // If no route points found, try track points (trkpt)
    if (destinations.length === 0) {
      const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;

      while ((match = trkptRegex.exec(gpxContent)) !== null) {
        destinations.push({
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        });
      }
    }

    // If still no points, try waypoints (wpt)
    if (destinations.length === 0) {
      const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;

      while ((match = wptRegex.exec(gpxContent)) !== null) {
        destinations.push({
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        });
      }
    }

    return destinations;
  } catch (error) {
    throw new Error('Failed to parse GPX file: ' + error.message);
  }
}

/**
 * Validate GPX file content
 * @param {string} gpxContent - The GPX file content as string
 * @returns {boolean} True if valid GPX
 */
function isValidGPX(gpxContent) {
  // Check for GPX root element
  if (!gpxContent.includes('<gpx')) {
    return false;
  }

  // Check for at least one point type
  const hasPoints = gpxContent.includes('<rtept') ||
                   gpxContent.includes('<trkpt') ||
                   gpxContent.includes('<wpt');

  return hasPoints;
}

module.exports = {
  parseGPX,
  isValidGPX
};
