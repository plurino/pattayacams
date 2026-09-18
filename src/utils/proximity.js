/**
 * Pattaya Spatial Proximity & Target Handoff Engine
 * 
 * Computes great-circle distance (Haversine formula) between spatial entities
 * (venues, hotels, live cams, rovers) and municipal CCTV nodes.
 */

import cctvData from '@/public/data/cctv_cams.json';

/**
 * Calculates distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371e3; // Earth's radius in meters
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats meter distance to human-readable string (e.g. "85m", "1.2km")
 */
export function formatDistance(meters) {
  if (!meters || meters === Infinity || isNaN(meters)) return '';
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Finds the nearest municipal CCTV camera for a given lat/lng coordinate
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} maxRadiusMeters Default 3000m (3km)
 * @returns {{ camera: Object, distanceMeters: number } | null}
 */
export function findNearestCctv(lat, lng, maxRadiusMeters = 3000) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  let closest = null;
  let minDistance = Infinity;

  for (let i = 0; i < cctvData.length; i++) {
    const cam = cctvData[i];
    const dist = calculateDistanceMeters(lat, lng, cam.lat, cam.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = cam;
    }
  }

  if (closest && minDistance <= maxRadiusMeters) {
    return {
      camera: { ...closest, type: 'cctv' },
      distanceMeters: minDistance,
      formattedDistance: formatDistance(minDistance),
    };
  }

  return null;
}
