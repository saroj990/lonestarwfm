/** Offset a WGS84 point by distance (meters) and bearing (degrees from north). */
export function offsetMeters(latitude, longitude, distanceMeters, bearingDegrees) {
  const R = 6371000;
  const brng = (bearingDegrees * Math.PI) / 180;
  const lat1 = (latitude * Math.PI) / 180;
  const lon1 = (longitude * Math.PI) / 180;
  const d = distanceMeters / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
}

/** Small on-site steps (meters) for photos and local GPS. */
export const SMALL_STEP_M = [5, 10, 15, 20, 25];

export function randomSmallStepMeters() {
  return SMALL_STEP_M[Math.floor(Math.random() * SMALL_STEP_M.length)];
}

/** Tiny jitter for “has not moved” scenarios (meters). */
export function jitterMeters(latitude, longitude, maxMeters = 3) {
  const d = Math.random() * maxMeters;
  return offsetMeters(latitude, longitude, d, Math.random() * 360);
}

export function randomBearing() {
  return Math.random() * 360;
}
