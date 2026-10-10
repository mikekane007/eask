import { describe, expect, it } from 'vitest';
import { MapCollision } from './collision';
import type { MapBuilding } from './types';

/** A 10 x 10 m building with its middle at (cx, cz). */
const house = (cx: number, cz: number, size = 10): MapBuilding => ({
  h: 8,
  a: size * size,
  p: [
    cx - size / 2,
    cz - size / 2,
    cx + size / 2,
    cz - size / 2,
    cx + size / 2,
    cz + size / 2,
    cx - size / 2,
    cz + size / 2,
  ],
});

describe('MapCollision', () => {
  const world = new MapCollision([house(0, 0), house(30, 0), house(-45, 33)], 200, 120);

  it('lets you stand in open space', () => {
    expect(world.blocked(15, 0, 0.7)).toBe(false);
    expect(world.blocked(0, 20, 0.7)).toBe(false);
  });

  it('blocks the inside of a building', () => {
    expect(world.blocked(0, 0, 0.7)).toBe(true);
    expect(world.blocked(32, 3, 0.1)).toBe(true);
  });

  it('keeps you away from walls by your radius', () => {
    // wall at x = 5; with radius 0.7 you cannot be closer than 0.7 m
    expect(world.blocked(5.8, 0, 0.7)).toBe(false);
    expect(world.blocked(5.5, 0, 0.7)).toBe(true);
    expect(world.blocked(5.5, 0, 0.3)).toBe(false);
  });

  it('feels walls at corners as well as along them', () => {
    expect(world.blocked(5.4, 5.4, 0.7)).toBe(true); // 0.57 m from the corner
    expect(world.blocked(6, 6, 0.7)).toBe(false); // 1.41 m from the corner
  });

  it('stops you leaving the map', () => {
    expect(world.blocked(99.5, 0, 0.7)).toBe(true);
    expect(world.blocked(-99.5, 0, 0.7)).toBe(true);
    expect(world.blocked(0, 59.5, 0.7)).toBe(true);
    expect(world.blocked(90, 50, 0.7)).toBe(false);
  });

  it('finds buildings that span several grid cells and negative coordinates', () => {
    const big = new MapCollision([house(0, 0, 70), house(-45, -33, 12)], 400, 300);
    expect(big.blocked(30, 30, 0.7)).toBe(true); // inside the 70 m building
    expect(big.blocked(-45, -33, 0.7)).toBe(true);
    expect(big.blocked(-60, -20, 0.7)).toBe(false);
  });

  it('treats extra solids such as water as blocked too', () => {
    const lake = [20, 20, 40, 20, 40, 40, 20, 40];
    const w = new MapCollision([], 200, 200, [lake]);
    expect(w.blocked(30, 30, 0.5)).toBe(true);
    expect(w.blocked(10, 10, 0.5)).toBe(false);
  });

  it('is fast enough to run for every step: thousands of checks in a crowded map', () => {
    const many: MapBuilding[] = [];
    for (let i = 0; i < 40; i++) for (let j = 0; j < 30; j++) many.push(house(-190 + i * 10, -140 + j * 10, 7));
    const busy = new MapCollision(many, 400, 300);
    const t0 = performance.now();
    let hits = 0;
    for (let n = 0; n < 5000; n++) if (busy.blocked(-180 + (n % 360), -130 + ((n * 7) % 260), 0.7)) hits++;
    expect(performance.now() - t0).toBeLessThan(500);
    expect(hits).toBeGreaterThan(0);
  });
});
