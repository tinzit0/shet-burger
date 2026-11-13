// Small geometry helpers for delivery polygons. Points and vertices are [lat, lng].

/** Ray casting: true when the point lies inside the polygon (edges count as inside). */
export function pointInPolygon(point, polygon) {
  if (!Array.isArray(point) || !Array.isArray(polygon) || polygon.length < 3) return false;
  const [y, x] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i], [yj, xj] = polygon[j];
    if (onSegment([y, x], [yi, xi], [yj, xj])) return true;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function onSegment([py, px], [ay, ax], [by, bx]) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-12) return false;
  return px >= Math.min(ax, bx) - 1e-12 && px <= Math.max(ax, bx) + 1e-12 && py >= Math.min(ay, by) - 1e-12 && py <= Math.max(ay, by) + 1e-12;
}

/** First active zone (in list order) whose polygon contains the point. */
export function zoneForPoint(point, zones) {
  return (zones || []).find(zone => zone.active !== false && pointInPolygon(point, zone.polygon)) || null;
}

/** Average of the vertices; good enough to center a pin inside these small, convex-ish zones. */
export function polygonCenter(polygon = []) {
  if (!polygon.length) return null;
  const sum = polygon.reduce(([a, b], [lat, lng]) => [a + lat, b + lng], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

export const isValidPolygon = polygon => Array.isArray(polygon) && polygon.length >= 3 && polygon.every(vertex => Array.isArray(vertex) && vertex.length === 2 && vertex.every(Number.isFinite) && Math.abs(vertex[0]) <= 90 && Math.abs(vertex[1]) <= 180);

export const formatPoint = point => point ? `${point[0].toFixed(5)},${point[1].toFixed(5)}` : '';

/** Reads the "lat,lng" that checkout appends at the end of a delivery address. */
export function parsePointFromAddress(address) {
  const match = String(address || '').match(/(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})\s*$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** True when the point lies on one of the polygon's edges (shared borders between zones). */
export function pointOnPolygonEdge(point, polygon = []) {
  return polygon.some((vertex, i) => onSegment(point, vertex, polygon[(i + 1) % polygon.length]));
}
