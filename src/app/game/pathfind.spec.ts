import { describe, expect, it } from 'vitest';
import { type BlockedFn, type Pt, clearLine, findPath } from './pathfind';

/** A wall along x = 0 from z = -30 to z = 30, with the only way round at either end. */
const wall: BlockedFn = (x, z) => Math.abs(x) < 2 && Math.abs(z) < 30;

const length = (from: Pt, route: Pt[]) => {
  let at = from;
  let sum = 0;
  for (const p of route) {
    sum += Math.hypot(p.x - at.x, p.z - at.z);
    at = p;
  }
  return sum;
};

describe('pathfind', () => {
  it('says "already there" when the goal is close', () => {
    expect(findPath(wall, { x: 0, z: 40 }, { x: 1, z: 41 })).toEqual([]);
  });

  it('walks straight when nothing is in the way', () => {
    const route = findPath(() => false, { x: 0, z: 0 }, { x: 40, z: 0 });
    expect(route).not.toBeNull();
    expect(route?.length).toBe(1);
    expect(Math.hypot((route?.[0].x ?? 0) - 40, route?.[0].z ?? 0)).toBeLessThanOrEqual(3);
  });

  it('goes around a wall without touching it', () => {
    const from = { x: -20, z: 0 };
    const route = findPath(wall, from, { x: 20, z: 0 });
    expect(route).not.toBeNull();
    let at = from;
    for (const p of route ?? []) {
      expect(clearLine(wall, at, p)).toBe(true);
      at = p;
    }
    const end = route?.at(-1) ?? from;
    expect(Math.hypot(end.x - 20, end.z)).toBeLessThanOrEqual(3);
    // about the length of the detour, not wandering
    expect(length(from, route ?? [])).toBeLessThan(120);
  });

  it('reaches a goal that is itself inside a building', () => {
    const house: BlockedFn = (x, z) => Math.abs(x - 20) < 6 && Math.abs(z) < 6;
    const route = findPath(house, { x: -10, z: 0 }, { x: 20, z: 0 }, { reach: 8 });
    expect(route).not.toBeNull();
    const end = route?.at(-1) ?? { x: -10, z: 0 };
    expect(house(end.x, end.z)).toBe(false);
    expect(Math.hypot(end.x - 20, end.z)).toBeLessThanOrEqual(8);
  });

  it('gives up when the goal is walled in', () => {
    const cage: BlockedFn = (x, z) => {
      const d = Math.max(Math.abs(x - 30), Math.abs(z));
      return d > 6 && d < 10;
    };
    expect(findPath(cage, { x: 0, z: 0 }, { x: 30, z: 0 }, { reach: 1 })).toBeNull();
  });

  it('gives up rather than search for ever', () => {
    expect(findPath(() => false, { x: 0, z: 0 }, { x: 900, z: 900 }, { maxNodes: 50 })).toBeNull();
  });
});

describe('clearLine', () => {
  it('is false through a wall and true beside it', () => {
    expect(clearLine(wall, { x: -10, z: 0 }, { x: 10, z: 0 })).toBe(false);
    expect(clearLine(wall, { x: -10, z: 40 }, { x: 10, z: 40 })).toBe(true);
  });
});
