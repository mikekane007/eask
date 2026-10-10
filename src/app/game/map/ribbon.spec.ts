import { describe, expect, it } from 'vitest';
import { ribbon } from './ribbon';

describe('ribbon', () => {
  it('makes nothing from a single point', () => {
    expect(ribbon([[0, 0]], 6)).toEqual({ xz: [], indices: [] });
  });

  it('gives a straight street the right width on both sides of the centre line', () => {
    const r = ribbon(
      [
        [0, 0],
        [10, 0],
      ],
      6,
    );
    expect(r.xz).toHaveLength(8); // 4 vertices
    const zs = [r.xz[1], r.xz[3], r.xz[5], r.xz[7]].sort((a, b) => a - b);
    expect(zs[0]).toBeCloseTo(-3);
    expect(zs[3]).toBeCloseTo(3);
    expect(r.indices).toHaveLength(6); // two triangles
  });

  it('adds two triangles for every segment', () => {
    const r = ribbon(
      [
        [0, 0],
        [10, 0],
        [20, 5],
        [30, 5],
      ],
      4,
    );
    expect(r.xz.length / 2).toBe(8);
    expect(r.indices).toHaveLength(18);
    expect(Math.max(...r.indices)).toBeLessThan(r.xz.length / 2);
  });

  it('keeps the street the same width round a right-angle bend', () => {
    const r = ribbon(
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      6,
    );
    // the middle pair of vertices sit on the corner's bisector, a mitre away from the centre
    const [lx, lz, rx, rz] = r.xz.slice(4, 8);
    expect(Math.hypot(lx - rx, lz - rz)).toBeCloseTo(6 * Math.SQRT2, 3);
  });

  it('limits the mitre on a very sharp turn so it cannot spike', () => {
    const r = ribbon(
      [
        [0, 0],
        [10, 0],
        [0, 0.5],
      ],
      6,
    );
    const [lx, lz, rx, rz] = r.xz.slice(4, 8);
    expect(Math.hypot(lx - rx, lz - rz)).toBeLessThanOrEqual(6 * 1.8 + 1e-6);
  });

  it('handles a street that doubles back on itself without NaN', () => {
    const r = ribbon(
      [
        [0, 0],
        [10, 0],
        [0, 0],
      ],
      4,
    );
    expect(r.xz.every(Number.isFinite)).toBe(true);
  });
});
