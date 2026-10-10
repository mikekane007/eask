/**
 * Plain geometry used by both the game and the OpenStreetMap build script (which runs this file directly with Node,
 * so only erasable TypeScript is used here: no enums, no parameter properties).
 */

export type Pt = [number, number];

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON_AT_EQUATOR = 111320;

/** Local metres around an origin: x east, z south (so north is up on screen), like the game world. */
export function makeProjector(lat0: number, lon0: number): (lat: number, lon: number) => Pt {
  const kx = M_PER_DEG_LON_AT_EQUATOR * Math.cos((lat0 * Math.PI) / 180);
  return (lat, lon) => [(lon - lon0) * kx, (lat0 - lat) * M_PER_DEG_LAT];
}

/** Signed area of a polygon. Its sign tells the winding direction. */
export function polygonArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return a / 2;
}

function distToSegmentSq(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx;
  const z = a[1] + t * dz;
  return (p[0] - x) ** 2 + (p[1] - z) ** 2;
}

/** Distance from a point to a line segment. */
export const distToSegment = (p: Pt, a: Pt, b: Pt): number => Math.sqrt(distToSegmentSq(p, a, b));

/** Douglas-Peucker line simplification. `tol` is in metres. Always keeps the end points. */
export function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length <= 2) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  const tol2 = tol * tol;
  while (stack.length) {
    const top = stack.pop();
    if (!top) break;
    const [s, e] = top;
    let max = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = distToSegmentSq(pts[i], pts[s], pts[e]);
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tol2 && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i] === 1);
}

/** True if (x, z) is inside the polygon (ray casting). */
export function pointInPolygon(x: number, z: number, pts: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i];
    const [xj, zj] = pts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Rounds to one decimal (decimetres) to keep stored maps small. */
export const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Total length of a polyline in metres. */
export function lineLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

/** Splits a flat [x0, z0, x1, z1, ...] array into points. */
export function toPoints(flat: readonly number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}

/** Joins points into a flat [x0, z0, x1, z1, ...] array, rounded to decimetres. */
export const flatten = (pts: Pt[]): number[] => pts.flatMap(([x, z]) => [r1(x), r1(z)]);

/** The point `d` metres along a polyline, with the direction of travel there as an angle (atan2(dx, dz)). */
export function pointAlong(pts: Pt[], d: number): { x: number; z: number; angle: number } {
  let left = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    const seg = Math.hypot(dx, dz);
    if (left <= seg || i === pts.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, left / seg);
      return { x: pts[i - 1][0] + dx * t, z: pts[i - 1][1] + dz * t, angle: Math.atan2(dx, dz) };
    }
    left -= seg;
  }
  return { x: pts[0][0], z: pts[0][1], angle: 0 };
}
