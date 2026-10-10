import fs from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CITIES } from '../cities';
import type { Kit } from '../kit';
import { createLandmarks, fitToMap } from './landmarks';
import type { MapData } from './types';

const kit = { M: () => new THREE.MeshLambertMaterial() } as unknown as Kit;

describe('landmarks', () => {
  for (const city of CITIES.filter((c) => c.landmarks?.length && c.map)) {
    it(`stand inside the ${city.id} map, as solid shapes of the right height`, () => {
      const map = JSON.parse(fs.readFileSync(`public/${city.map?.url ?? ''}`, 'utf8')) as MapData;
      const scene = new THREE.Scene();
      const placed = createLandmarks(scene, kit, map, city.landmarks ?? []);
      expect(placed).toHaveLength(city.landmarks?.length ?? 0);
      expect(scene.children).toHaveLength(placed.length);
      placed.forEach((p, i) => {
        expect(Math.abs(p.x)).toBeLessThan(map.w / 2);
        expect(Math.abs(p.z)).toBeLessThan(map.h / 2);
        const box = new THREE.Box3().setFromObject(scene.children[i]);
        expect(box.max.y).toBeGreaterThan((city.landmarks?.[i].h ?? 0) * 0.9);
        expect(box.min.y).toBeGreaterThanOrEqual(-0.01);
      });
    });
  }

  it('leaves out a landmark outside the mapped area', () => {
    const lille = CITIES.find((c) => c.id === 'lille');
    const map = JSON.parse(fs.readFileSync('public/maps/lille.json', 'utf8')) as MapData;
    const far = { kind: 'belfry' as const, lat: 51, lon: 3, h: 60, color: 0xffffff };
    expect(lille).toBeDefined();
    expect(createLandmarks(new THREE.Scene(), kit, map, [far])).toEqual([]);
  });
});

describe('fitToMap', () => {
  const square = (x: number, z: number, s: number) => [x - s, z - s, x + s, z - s, x + s, z + s, x - s, z + s];
  const map = {
    w: 400,
    h: 400,
    buildings: [
      { h: 10, a: 400, p: square(0, 0, 10) },
      { h: 10, a: 400, p: square(60, 0, 10) },
    ],
  } as unknown as MapData;

  it('puts a tower in the middle of the building at the spot', () => {
    expect(fitToMap(map, 'belfry', 4, -3)).toEqual([0, 0]);
  });

  it('puts a tower on the nearest building when the spot is in the street', () => {
    expect(fitToMap(map, 'dome', 45, 2)).toEqual([60, 0]);
  });

  it('moves a column out of a building onto open ground', () => {
    const [x, z] = fitToMap(map, 'column', 2, 2);
    expect(Math.max(Math.abs(x), Math.abs(z))).toBeGreaterThan(10);
  });

  it('leaves a column in the open where it is', () => {
    expect(fitToMap(map, 'column', 30, 30)).toEqual([30, 30]);
  });
});
