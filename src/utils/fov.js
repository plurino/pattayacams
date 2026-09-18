/**
 * CCTV Camera Field of View (FOV) Geometry Generator
 * Computes a directional spherical polygon wedge representing camera sight coverage.
 */

export function getFovPolygon(lat, lng, bearingDeg = 0, fovAngleDeg = 60, distanceMeters = 90) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const R = 6371e3; // Earth radius in meters
  const d = distanceMeters / R;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(lat);
  const lon1 = toRad(lng);

  const getPointAtBearing = (brngDeg) => {
    const brng = toRad(brngDeg);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      );
    return [toDeg(lat2), toDeg(lon2)];
  };

  // Generate intermediate arc points for smooth curvature
  const points = [[lat, lng]];
  const startAngle = bearingDeg - fovAngleDeg / 2;
  const steps = 6;
  const stepSize = fovAngleDeg / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = (startAngle + i * stepSize + 360) % 360;
    points.push(getPointAtBearing(angle));
  }

  return points;
}
