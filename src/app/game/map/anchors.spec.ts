import { describe, expect, it } from 'vitest';
import { clearance, pickAnchors, rng, type RawMap } from './anchors';
import { toPoints } from './geo';

/** A small town: a grid of streets with a building in every block. */
function town(): RawMap {
  const roads: RawMap['roads'] = [];
  const buildings: RawMap['buildings'] = [];
  const W = 400;
  const H = 300;
  for (let i = -3; i <= 3; i++) {
    roads.push({ k: 'residential', w: 6, d: 1, n: '', p: [i * 50, -H / 2 + 5, i * 50, H / 2 - 5] });
  }
  for (let j = -2; j <= 2; j++) {
    roads.push({ k: 'pedestrian', w: 6, d: 0, n: '', p: [-W / 2 + 5, j * 50, W / 2 - 5, j * 50] });
  }
  for (let i = -3; i < 3; i++) {
    for (let j = -2; j < 2; j++) {
      const x = i * 50 + 25;
      const z = j * 50 + 25;
      const s = 18; // 36 m wide blocks leave 14 m between buildings, minus half of 6 m road each side
      buildings.push({ h: 9, a: 4 * s * s, p: [x - s, z - s, x + s, z - s, x + s, z + s, x - s, z + s] });
    }
  }
  return { w: W, h: H, roads, buildings };
}

describe('anchors', () => {
  const map = town();
  const a = pickAnchors(map, 6);
  const rects = map.buildings.map((b) => toPoints(b.p));

  it('is repeatable: the same map always gives the same anchors', () => {
    expect(pickAnchors(map, 6)).toEqual(a);
  });

  it('puts the three places on clear street, not inside or against a building', () => {
    for (const p of [a.church, a.chop, a.home]) {
      expect(clearance(p.x, p.z, rects)).toBeGreaterThanOrEqual(2.2);
    }
  });

  it('keeps the places well apart', () => {
    const d = (p: { x: number; z: number }, q: { x: number; z: number }) => Math.hypot(p.x - q.x, p.z - q.z);
    expect(d(a.church, a.chop)).toBeGreaterThan(60);
    expect(d(a.church, a.home)).toBeGreaterThan(100);
    expect(d(a.chop, a.home)).toBeGreaterThan(60);
  });

  it('gives every sign its own building', () => {
    const used = Object.values(a.landmarks).map((l) => l.b);
    expect(new Set(used).size).toBe(used.length);
    for (const l of Object.values(a.landmarks)) expect(l.b).toBeLessThan(map.buildings.length);
  });

  it('places the requested number of people, spread out, each pacing a short clear stretch', () => {
    expect(a.people).toHaveLength(6);
    for (const p of a.people) {
      expect(clearance(p.x, p.z, rects)).toBeGreaterThanOrEqual(2.2);
      const len = Math.hypot(p.seg[2] - p.seg[0], p.seg[3] - p.seg[1]);
      expect(len).toBeGreaterThan(8);
      expect(len).toBeLessThan(20);
    }
    let nearest = Infinity;
    for (let i = 0; i < a.people.length; i++)
      for (let j = i + 1; j < a.people.length; j++)
        nearest = Math.min(nearest, Math.hypot(a.people[i].x - a.people[j].x, a.people[i].z - a.people[j].z));
    expect(nearest).toBeGreaterThan(25);
  });

  it('stays inside the map', () => {
    for (const p of [a.church, a.chop, a.home, ...a.people]) {
      expect(Math.abs(p.x)).toBeLessThan(map.w / 2 - 5);
      expect(Math.abs(p.z)).toBeLessThan(map.h / 2 - 5);
    }
  });

  it('refuses a map with no room to stand', () => {
    expect(() => pickAnchors({ w: 100, h: 100, roads: [], buildings: [] }, 6)).toThrow();
  });
});

describe('rng', () => {
  it('is deterministic and stays in [0, 1)', () => {
    const r1 = rng(42);
    const r2 = rng(42);
    for (let i = 0; i < 100; i++) {
      const v = r1();
      expect(v).toBe(r2());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('clearance', () => {
  const box = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ] as [number, number][];
  it('is zero inside a building and the wall distance outside', () => {
    expect(clearance(5, 5, [box])).toBe(0);
    expect(clearance(13, 5, [box])).toBeCloseTo(3);
    expect(clearance(13, 14, [box])).toBeCloseTo(5);
  });
});
