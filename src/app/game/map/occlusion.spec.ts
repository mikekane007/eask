import { describe, expect, it } from 'vitest';
import { MapCollision } from './collision';
import { cameraSpot, easeOpen, sightBlocked } from './occlusion';

// A 20 m tall block between z = 5 and z = 15, from x = -10 to 10.
const box = (x0: number, z0: number, x1: number, z1: number) => [x0, z0, x1, z0, x1, z1, x0, z1];
const tall = new MapCollision([{ h: 20, a: 200, p: box(-10, 5, 10, 15) }], 200, 200);
const low = new MapCollision([{ h: 3, a: 200, p: box(-10, 5, 10, 15) }], 200, 200);

const eye = { x: 0, y: 1.3, z: 0 };
// The game's camera sits about 21 m behind (+z) and 19 m above the player.
const cam = { x: 0, y: 19, z: 21 };

describe('heightAt', () => {
  it('gives the building height inside it and 0 outside', () => {
    expect(tall.heightAt(0, 10)).toBe(20);
    expect(tall.heightAt(0, 0)).toBe(0);
    expect(tall.heightAt(50, 50)).toBe(0);
  });

  it('gives the tallest of overlapping buildings', () => {
    const both = new MapCollision(
      [
        { h: 6, a: 100, p: box(-10, 5, 10, 15) },
        { h: 30, a: 25, p: box(-2, 8, 3, 13) },
      ],
      200,
      200,
    );
    expect(both.heightAt(0, 10)).toBe(30);
    expect(both.heightAt(-8, 10)).toBe(6);
  });

  it('treats water as flat', () => {
    const wet = new MapCollision([], 200, 200, [box(-10, 5, 10, 15)]);
    expect(wet.heightAt(0, 10)).toBe(0);
  });
});

describe('sightBlocked', () => {
  it('is true when a tall building stands between the player and the camera', () => {
    expect(sightBlocked((x, z) => tall.heightAt(x, z), eye, cam)).toBe(true);
  });

  it('is false for a low building the camera looks over', () => {
    expect(sightBlocked((x, z) => low.heightAt(x, z), eye, cam)).toBe(false);
  });

  it('is false when the building is beside the line of sight, not on it', () => {
    expect(sightBlocked((x, z) => tall.heightAt(x, z), { x: 40, y: 1.3, z: 0 }, { x: 40, y: 19, z: 21 })).toBe(false);
  });

  it('is false when the building is behind the player, away from the camera', () => {
    expect(sightBlocked((x, z) => tall.heightAt(x, z), { x: 0, y: 1.3, z: 20 }, { x: 0, y: 19, z: 41 })).toBe(false);
  });

  it('ignores the wall right next to the player', () => {
    // standing 1 m in front of the wall, camera on the far side above it: the first metres are skipped
    const wall = new MapCollision([{ h: 20, a: 10, p: box(-10, 0.5, 10, 1.4) }], 200, 200);
    expect(sightBlocked((x, z) => wall.heightAt(x, z), { x: 0, y: 1.3, z: 0 }, { x: 0, y: 19, z: 21 })).toBe(false);
  });

  it('copes with the camera straight overhead', () => {
    expect(sightBlocked(() => 100, eye, { x: 0, y: 30, z: 0 })).toBe(false);
  });
});

describe('easeOpen', () => {
  it('opens and closes smoothly and stays within 0..1', () => {
    expect(easeOpen(0, true, 0.1)).toBeCloseTo(0.4);
    expect(easeOpen(0.9, true, 0.1)).toBe(1);
    expect(easeOpen(1, false, 0.1)).toBeCloseTo(0.6);
    expect(easeOpen(0.1, false, 0.1)).toBe(0);
  });
});

describe('cameraSpot', () => {
  const at = (c: MapCollision) => (x: number, z: number) => c.heightAt(x, z);
  const player = { x: 0, y: 1, z: 0 };

  it('keeps the usual spot when it is in the open', () => {
    expect(cameraSpot(at(low), { x: 50, y: 1, z: 50 }, { x: 50, y: 19, z: 71 })).toEqual({ x: 50, y: 19, z: 71 });
  });

  it('moves in towards the player when the usual spot is inside a building', () => {
    // a 40 m tower right where the camera would be
    const tower = new MapCollision([{ h: 40, a: 400, p: box(-10, 12, 10, 30) }], 200, 200);
    const q = cameraSpot(at(tower), player, cam);
    expect(tower.heightAt(q.x, q.z) + 1.5).toBeLessThanOrEqual(q.y);
    expect(q.z).toBeLessThan(cam.z);
    expect(q.z).toBeGreaterThan(0);
  });

  it('is fine over a building it already clears', () => {
    expect(cameraSpot(at(low), player, cam)).toEqual(cam);
  });

  it('rises above the roofs when there is no open spot on the way in', () => {
    const everywhere = () => 30;
    const q = cameraSpot(everywhere, player, cam);
    expect(q.y).toBeGreaterThan(30);
  });
});
