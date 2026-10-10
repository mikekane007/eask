import { describe, expect, it } from 'vitest';
import { validateMap } from './load';

const good = {
  name: 'x',
  credit: '© OpenStreetMap contributors',
  origin: { lat: 50, lon: 3 },
  w: 100,
  h: 100,
  roads: [],
  buildings: [],
  parks: [],
  water: [],
  anchors: {
    home: { x: 0, z: 0, a: 0 },
    church: { x: 1, z: 1, a: 0 },
    chop: { x: 2, z: 2, a: 0 },
    landmarks: {},
    people: [],
  },
};

describe('validateMap', () => {
  it('accepts a complete map', () => {
    expect(validateMap(good).w).toBe(100);
  });

  it('rejects things that are not maps', () => {
    for (const bad of [null, undefined, 42, 'map', [], {}]) expect(() => validateMap(bad)).toThrow();
  });

  it('rejects a map that is missing a part the game needs', () => {
    for (const key of ['w', 'h', 'roads', 'buildings', 'parks', 'water', 'anchors']) {
      const broken = Object.fromEntries(Object.entries(good).filter(([k]) => k !== key));
      expect(() => validateMap(broken), key).toThrow();
    }
    expect(() => validateMap({ ...good, anchors: { ...good.anchors, home: undefined } })).toThrow();
    expect(() => validateMap({ ...good, anchors: { ...good.anchors, people: 'none' } })).toThrow();
  });
});
