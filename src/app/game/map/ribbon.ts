import type { Pt } from './geo';

export interface Ribbon {
  /** x, z for each vertex, two per centre-line point (left then right). */
  xz: number[];
  /** Triangle indices into the vertices. */
  indices: number[];
}

const MITER_LIMIT = 1.8;

/**
 * Turns a street's centre line into a flat ribbon `width` metres wide. At bends the two sides are joined with a
 * mitre (limited, so sharp turns do not spike). Clean, merge-friendly geometry for a whole city's streets.
 */
export function ribbon(line: readonly Pt[], width: number): Ribbon {
  const n = line.length;
  const xz: number[] = [];
  const indices: number[] = [];
  if (n < 2) return { xz, indices };
  const half = width / 2;

  // Unit direction of every segment.
  const dir: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = line[i + 1][0] - line[i][0];
    const dz = line[i + 1][1] - line[i][1];
    const l = Math.hypot(dx, dz) || 1;
    dir.push([dx / l, dz / l]);
  }

  for (let i = 0; i < n; i++) {
    const a = dir[Math.max(0, i - 1)];
    const b = dir[Math.min(n - 2, i)];
    // normal of each adjoining segment, then their bisector
    const na: Pt = [-a[1], a[0]];
    const nb: Pt = [-b[1], b[0]];
    let mx = na[0] + nb[0];
    let mz = na[1] + nb[1];
    const ml = Math.hypot(mx, mz);
    if (ml < 1e-6) {
      mx = na[0];
      mz = na[1];
    } else {
      mx /= ml;
      mz /= ml;
    }
    const cos = mx * na[0] + mz * na[1]; // how far the bisector leans from the segment normal
    const scale = Math.min(MITER_LIMIT, 1 / Math.max(cos, 1e-3));
    const ox = mx * half * scale;
    const oz = mz * half * scale;
    xz.push(line[i][0] + ox, line[i][1] + oz, line[i][0] - ox, line[i][1] - oz);
  }

  for (let i = 0; i < n - 1; i++) {
    const l0 = i * 2;
    const r0 = l0 + 1;
    const l1 = l0 + 2;
    const r1 = l0 + 3;
    indices.push(l0, r0, l1, r0, r1, l1);
  }
  return { xz, indices };
}
