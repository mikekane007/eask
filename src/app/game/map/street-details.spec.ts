import { describe, expect, it } from 'vitest';
import { buildGraph } from './road-graph';
import { streetDetails } from './street-details';
import type { MapRoad } from './types';

const road = (p: number[], w = 8, d: 0 | 1 = 1): MapRoad => ({ k: 'residential', w, d, n: '', p });

// A crossroads: two 200 m roads that share a point at the origin, as OpenStreetMap streets do.
const cross = buildGraph([road([-100, 0, 0, 0, 100, 0]), road([0, -100, 0, 0, 0, 100])]);
const open = () => true;

describe('streetDetails', () => {
  const d = streetDetails(cross, open);

  it('paints a dashed centre line along wide roads, clear of the junction', () => {
    expect(d.dashes.length).toBeGreaterThan(40);
    for (const m of d.dashes) {
      expect(Math.hypot(m.x, m.z)).toBeGreaterThan(6.5);
      // on one of the two centre lines
      expect(Math.min(Math.abs(m.x), Math.abs(m.z))).toBeLessThan(1e-6);
    }
  });

  it('puts a zebra crossing on each of the four roads at the junction', () => {
    const near = d.crossings.filter((m) => Math.hypot(m.x, m.z) < 8);
    expect(near.length).toBeGreaterThanOrEqual(4 * 6);
    // stripes stay within the road's width
    for (const m of near) expect(Math.min(Math.abs(m.x), Math.abs(m.z))).toBeLessThanOrEqual(4);
  });

  it('places benches and bins on the pavement, not on the road', () => {
    expect(d.furniture.length).toBeGreaterThan(4);
    expect(new Set(d.furniture.map((f) => f.kind))).toEqual(new Set(['bench', 'bin']));
    for (const f of d.furniture) expect(Math.min(Math.abs(f.x), Math.abs(f.z))).toBeGreaterThan(4);
  });

  it('leaves out furniture where the pavement is blocked', () => {
    expect(streetDetails(cross, () => false).furniture).toEqual([]);
  });

  it('gives narrow streets and footpaths no lines', () => {
    const lanes = buildGraph([road([-50, 0, 50, 0], 4), road([0, -50, 0, 50], 3, 0)]);
    const s = streetDetails(lanes, open);
    expect(s.dashes).toEqual([]);
    expect(s.furniture).toEqual([]);
  });

  it('respects the limit', () => {
    const s = streetDetails(cross, open, 2);
    expect(s.furniture.length).toBeLessThanOrEqual(3);
  });
});
