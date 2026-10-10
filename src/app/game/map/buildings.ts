/**
 * Building shapes for the real maps: walls with a shop-front ground floor, roofs (hipped, mansard or flat with a
 * parapet) and awnings, as flat arrays ready for one merged mesh each. Pure geometry, no three.js, so it is tested.
 */
import type { Pt } from './geo';

export type Rgb = readonly [number, number, number];
type RoofShape = 'hip' | 'mansard' | 'flat';

export interface Geo {
  p: number[];
  n: number[];
  u: number[];
  c: number[];
  i: number[];
}

export interface BlockInput {
  pts: Pt[];
  h: number;
  wall: Rgb;
  roof: Rgb;
  /** Colour of the shop fronts on the ground floor, or null for a plain ground floor. */
  shop: Rgb | null;
  /** 0..1, fixed per building, used for small variations. */
  seed: number;
}

export interface BlockStyle {
  /** The shape for roofs that can take it; awkward footprints fall back to a gentler shape. */
  roof: RoofShape;
  /** Slope of hipped roofs: height gained per metre inwards. */
  pitch: number;
  /** Height of the ground floor band, in metres. */
  groundFloor: number;
  /** Height of the low wall round flat roofs (0 for none). */
  parapet: number;
  /** Chimneys on pitched roofs (European towns). */
  chimneys: boolean;
  /** Water tanks on flat roofs (Accra). */
  tanks: boolean;
}

export interface Blocks {
  walls: Geo;
  shops: Geo;
  roofs: Geo;
  awnings: Geo;
  /** Where to stand chimneys and tanks: x, y (roof level), z. */
  chimneys: [number, number, number][];
  tanks: [number, number, number][];
  /** The highest point of each building (roof or parapet included), in the order given, 0 if it was skipped. */
  tops: number[];
}

const empty = (): Geo => ({ p: [], n: [], u: [], c: [], i: [] });

/** Facade texture tile: 6 m wide (two window bays) by 6.2 m (two storeys). */
const TILE_W = 6;
const TILE_H = 6.2;
/** Darkening at the foot of walls, which makes buildings sit on the ground. */
const FOOT_SHADE = 0.62;

/** Twice the signed area; positive when the points run anticlockwise in (x, z). */
export function area2(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a;
}

/** True if every corner turns the same way. */
export function isConvex(pts: readonly Pt[]): boolean {
  let sign = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const c = pts[(i + 2) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Adds one quad (a, b, c, d anticlockwise as seen from where it should be visible). */
function quad(
  g: Geo,
  v: readonly [number, number, number][],
  uv: readonly [number, number][],
  col: readonly Rgb[],
  normal?: readonly [number, number, number],
): void {
  const base = g.p.length / 3;
  let nx: number;
  let ny: number;
  let nz: number;
  if (normal) [nx, ny, nz] = normal;
  else {
    const e1 = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]];
    const e2 = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
    nx = e1[1] * e2[2] - e1[2] * e2[1];
    ny = e1[2] * e2[0] - e1[0] * e2[2];
    nz = e1[0] * e2[1] - e1[1] * e2[0];
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
  }
  for (let k = 0; k < 4; k++) {
    g.p.push(...v[k]);
    g.n.push(nx, ny, nz);
    g.u.push(...uv[k]);
    g.c.push(...col[k]);
  }
  g.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

const scale = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];

/**
 * Triangulates a flat polygon facing up. `triangulate` returns index triples (any winding) and is passed in so this
 * module stays free of three.js.
 */
function cap(g: Geo, pts: readonly Pt[], y: number, col: Rgb, uvScale: number, triangulate: (p: Pt[]) => number[]) {
  const tri = triangulate([...pts]);
  if (!tri.length) return;
  const base = g.p.length / 3;
  for (const [x, z] of pts) {
    g.p.push(x, y, z);
    g.n.push(0, 1, 0);
    g.u.push(x / uvScale, z / uvScale);
    g.c.push(...col);
  }
  for (let t = 0; t < tri.length; t += 3) {
    const [i0, i1, i2] = [tri[t], tri[t + 1], tri[t + 2]];
    const up =
      (pts[i1][0] - pts[i0][0]) * (pts[i2][1] - pts[i0][1]) - (pts[i2][0] - pts[i0][0]) * (pts[i1][1] - pts[i0][1]);
    if (up < 0) g.i.push(base + i0, base + i1, base + i2);
    else g.i.push(base + i0, base + i2, base + i1);
  }
}

/** Builds every building's walls, shop fronts, roof and awnings. */
export function buildBlocks(
  inputs: readonly BlockInput[],
  style: BlockStyle,
  triangulate: (p: Pt[]) => number[],
): Blocks {
  const out: Blocks = {
    walls: empty(),
    shops: empty(),
    roofs: empty(),
    awnings: empty(),
    chimneys: [],
    tanks: [],
    tops: [],
  };

  for (const b of inputs) {
    const pts = b.pts;
    const n = pts.length;
    out.tops.push(0);
    if (n < 3 || b.h <= 0) continue;
    const setTop = (y: number) => {
      out.tops[out.tops.length - 1] = y;
    };
    setTop(b.h);
    const ccw = area2(pts) > 0;
    const gf = Math.min(style.groundFloor, b.h);
    const area = Math.abs(area2(pts)) / 2;

    // ---- walls, edge by edge
    let run = b.seed * TILE_W; // start each building at a different point of the facade pattern
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % n];
      const dx = c[0] - a[0];
      const dz = c[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      // outward normal, and the two ends in the order that makes the face look outwards
      const nx = ((ccw ? 1 : -1) * dz) / len;
      const nz = ((ccw ? -1 : 1) * dx) / len;
      const [p0, p1] = ccw ? [c, a] : [a, c];
      const u0 = run / TILE_W;
      const u1 = (run + len) / TILE_W;
      const [ua, ub] = ccw ? [u1, u0] : [u0, u1];
      const normal: [number, number, number] = [nx, 0, nz];

      const s = len >= 3 ? b.shop : null;
      const shopHere = s !== null;
      if (shopHere) {
        // shop band: one texture tile per 6 m, starting on a whole tile so doors are not cut in half
        const su0 = Math.floor(b.seed * 4) * 0.5 + run / TILE_W;
        const su1 = su0 + len / TILE_W;
        const [sa, sb] = ccw ? [su1, su0] : [su0, su1];
        quad(
          out.shops,
          [
            [p0[0], 0, p0[1]],
            [p1[0], 0, p1[1]],
            [p1[0], gf, p1[1]],
            [p0[0], gf, p0[1]],
          ],
          [
            [sa, 0],
            [sb, 0],
            [sb, 1],
            [sa, 1],
          ],
          [scale(s, FOOT_SHADE + 0.18), scale(s, FOOT_SHADE + 0.18), s, s],
          normal,
        );
        // an awning over some shop fronts
        if (len >= 4 && (b.seed * 7 + i * 0.37) % 1 < 0.45) {
          const w = Math.min(len - 1, 5.5);
          const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
          const tx = dx / len;
          const tz = dz / len;
          const e0 = [mid[0] - (tx * w) / 2, mid[1] - (tz * w) / 2];
          const e1 = [mid[0] + (tx * w) / 2, mid[1] + (tz * w) / 2];
          const out1 = 1.5;
          const yTop = Math.min(gf - 0.35, 3.2);
          const yLow = yTop - 0.65;
          const [q0, q1] = ccw ? [e1, e0] : [e0, e1];
          // sloping canvas: top edge on the wall, bottom edge out over the pavement (seen from above and below)
          const top0: [number, number, number] = [q0[0], yTop, q0[1]];
          const top1: [number, number, number] = [q1[0], yTop, q1[1]];
          const low1: [number, number, number] = [q1[0] + nx * out1, yLow, q1[1] + nz * out1];
          const low0: [number, number, number] = [q0[0] + nx * out1, yLow, q0[1] + nz * out1];
          const ac = scale(s, 1.05);
          const cols = [ac, ac, ac, ac];
          quad(
            out.awnings,
            [low0, low1, top1, top0],
            [
              [0, 0],
              [w / 1.2, 0],
              [w / 1.2, 1],
              [0, 1],
            ],
            cols,
          );
          quad(
            out.awnings,
            [top0, top1, low1, low0],
            [
              [0, 1],
              [w / 1.2, 1],
              [w / 1.2, 0],
              [0, 0],
            ],
            cols,
          );
        }
      }

      // facade above the shop band (or from the ground for plain buildings)
      const y0 = shopHere ? gf : 0;
      if (b.h - y0 > 0.2) {
        const v0 = shopHere ? 0 : -gf / TILE_H;
        const v1 = (b.h - gf) / TILE_H;
        const foot = shopHere ? 0.92 : FOOT_SHADE;
        const topShade = 1.04;
        quad(
          out.walls,
          [
            [p0[0], y0, p0[1]],
            [p1[0], y0, p1[1]],
            [p1[0], b.h, p1[1]],
            [p0[0], b.h, p0[1]],
          ],
          [
            [ua, v0],
            [ub, v0],
            [ub, v1],
            [ua, v1],
          ],
          [scale(b.wall, foot), scale(b.wall, foot), scale(b.wall, topShade), scale(b.wall, topShade)],
          normal,
        );
      }
      run += len;
    }

    // ---- roof
    let shape = style.roof;
    if (shape === 'hip' && (!isConvex(pts) || area > 1200 || n > 12)) shape = 'mansard';
    if (shape === 'mansard' && area > 4000) shape = 'flat';
    const cx = pts.reduce((s, p) => s + p[0], 0) / n;
    const cz = pts.reduce((s, p) => s + p[1], 0) / n;

    if (shape === 'flat') {
      cap(out.roofs, pts, b.h, b.roof, 3, triangulate);
      if (style.parapet > 0) {
        // a low wall round the roof, seen from outside and from the roof
        const top = b.h + style.parapet;
        for (let i = 0; i < n; i++) {
          const a = pts[i];
          const c = pts[(i + 1) % n];
          const [p0, p1] = ccw ? [c, a] : [a, c];
          const wc = scale(b.wall, 1.02);
          const cols = [wc, wc, wc, wc];
          quad(
            out.roofs,
            [
              [p0[0], b.h, p0[1]],
              [p1[0], b.h, p1[1]],
              [p1[0], top, p1[1]],
              [p0[0], top, p0[1]],
            ],
            [
              [0, 0],
              [1, 0],
              [1, 0.3],
              [0, 0.3],
            ],
            cols,
          );
          const inner = scale(b.wall, 0.8);
          quad(
            out.roofs,
            [
              [p1[0], b.h, p1[1]],
              [p0[0], b.h, p0[1]],
              [p0[0], top, p0[1]],
              [p1[0], top, p1[1]],
            ],
            [
              [0, 0],
              [1, 0],
              [1, 0.3],
              [0, 0.3],
            ],
            [inner, inner, inner, inner],
          );
        }
      }
      if (style.tanks && area > 40 && b.seed < 0.7) {
        const r = b.seed * 6.28;
        out.tanks.push([cx + Math.cos(r) * 1.5, b.h, cz + Math.sin(r) * 1.5]);
      }
      setTop(b.h + Math.max(style.parapet, style.tanks ? 1.6 : 0));
      continue;
    }

    // hipped (rises almost to a ridge) or mansard (steep, short slope with a flat top)
    const radius = Math.sqrt(area / Math.PI);
    const k = shape === 'hip' ? 0.18 : Math.max(0.55, 1 - 2.2 / Math.max(radius, 2.5));
    const rise = shape === 'hip' ? Math.min(7, style.pitch * radius * (1 - k) * 0.55) : 2.6;
    const top = b.h + rise;
    const inner: Pt[] = pts.map((p) => [cx + (p[0] - cx) * k, cz + (p[1] - cz) * k]);
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % n];
      const ai = inner[i];
      const ci = inner[(i + 1) % n];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len < 0.05) continue;
      // slope texture: u along the eave, v up the slope
      const slope = Math.hypot(Math.hypot(ai[0] - a[0], ai[1] - a[1]), rise);
      const ex = (c[0] - a[0]) / len;
      const ez = (c[1] - a[1]) / len;
      const ua0 = 0;
      const uc0 = len / 2;
      const uai = ((ai[0] - a[0]) * ex + (ai[1] - a[1]) * ez) / 2;
      const uci = ((ci[0] - a[0]) * ex + (ci[1] - a[1]) * ez) / 2;
      const vt = slope / 1.6;
      const eave = scale(b.roof, 0.82);
      const ridge = scale(b.roof, 1.05);
      const verts: [number, number, number][] = [
        [a[0], b.h, a[1]],
        [c[0], b.h, c[1]],
        [ci[0], top, ci[1]],
        [ai[0], top, ai[1]],
      ];
      const uvs: [number, number][] = [
        [ua0, 0],
        [uc0, 0],
        [uci, vt],
        [uai, vt],
      ];
      const cols = [eave, eave, ridge, ridge];
      // keep the slope facing up and out
      if (ccw)
        quad(
          out.roofs,
          [verts[1], verts[0], verts[3], verts[2]],
          [uvs[1], uvs[0], uvs[3], uvs[2]],
          [eave, eave, ridge, ridge],
        );
      else quad(out.roofs, verts, uvs, cols);
    }
    cap(out.roofs, inner, top, scale(b.roof, shape === 'hip' ? 1.05 : 0.95), 3, triangulate);
    setTop(top + (style.chimneys ? 1.5 : 0));
    if (style.chimneys && b.seed > 0.25) {
      const j = Math.floor(b.seed * n) % n;
      out.chimneys.push([inner[j][0], top - 0.3, inner[j][1]]);
    }
  }
  return out;
}
