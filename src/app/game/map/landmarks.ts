import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import type { Kit } from '../kit';
import type { Landmark3d } from '../types';
import { makeProjector, pointInPolygon, toPoints, type Pt } from './geo';
import type { MapData } from './types';

type Parts = Record<'stone' | 'roof' | 'dark' | 'gold' | 'trim', THREE.BufferGeometry[]>;

const emptyParts = (): Parts => ({ stone: [], roof: [], dark: [], gold: [], trim: [] });

/** A Flemish belfry: square shaft, stone bands, clock faces, an open bell stage, corner turrets and a spire. */
function belfry(p: Parts, h: number): void {
  const shaft = h * 0.62;
  const w = Math.max(7, h * 0.13);
  p.stone.push(new THREE.BoxGeometry(w + 1.2, 3, w + 1.2).translate(0, 1.5, 0));
  p.stone.push(new THREE.BoxGeometry(w, shaft, w).translate(0, shaft / 2, 0));
  for (const y of [shaft * 0.35, shaft * 0.7, shaft])
    p.trim.push(new THREE.BoxGeometry(w + 0.6, 0.6, w + 0.6).translate(0, y, 0));
  // clock faces on all four sides
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const face = new THREE.CircleGeometry(w * 0.28, 20).translate(0, 0, w / 2 + 0.05);
    face.rotateY(a).translate(0, shaft * 0.82, 0);
    p.trim.push(face);
    const hand = new THREE.BoxGeometry(0.25, w * 0.22, 0.1).translate(0, w * 0.09, w / 2 + 0.12);
    hand.rotateY(a).translate(0, shaft * 0.82, 0);
    p.dark.push(hand);
    // tall arched openings of the bell stage
    for (const s of [-1, 1]) {
      const arch = new THREE.BoxGeometry(w * 0.2, h * 0.09, 0.2).translate(s * w * 0.2, 0, w * 0.45 + 0.15);
      arch.rotateY(a).translate(0, shaft + h * 0.07, 0);
      p.dark.push(arch);
    }
  }
  // bell stage, corner turrets with little spires, and the main spire
  const stage = h * 0.15;
  p.stone.push(new THREE.BoxGeometry(w * 0.9, stage, w * 0.9).translate(0, shaft + stage / 2, 0));
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    p.stone.push(
      new THREE.CylinderGeometry(0.7, 0.7, stage + 1.5, 8).translate(
        (sx * w) / 2,
        shaft + stage / 2 + 0.75,
        (sz * w) / 2,
      ),
    );
    p.roof.push(new THREE.ConeGeometry(0.9, 3, 8).translate((sx * w) / 2, shaft + stage + 3, (sz * w) / 2));
  }
  const spire = h - shaft - stage;
  p.roof.push(new THREE.ConeGeometry(w * 0.48, spire, 8).translate(0, shaft + stage + spire / 2, 0));
  p.gold.push(new THREE.SphereGeometry(0.5, 8, 6).translate(0, h + 0.4, 0));
}

/** A tall column on a pedestal with a gilded figure on top (Lille's Goddess). */
function column(p: Parts, h: number): void {
  p.stone.push(new THREE.BoxGeometry(5, 3, 5).translate(0, 1.5, 0));
  p.trim.push(new THREE.BoxGeometry(3.4, 1.2, 3.4).translate(0, 3.6, 0));
  p.stone.push(new THREE.CylinderGeometry(0.9, 1.1, h - 7, 14).translate(0, 4.2 + (h - 7) / 2, 0));
  p.trim.push(new THREE.BoxGeometry(2.4, 0.8, 2.4).translate(0, h - 2.6, 0));
  // the figure: a robed body, head and a raised arm
  p.gold.push(new THREE.CylinderGeometry(0.35, 0.7, 2, 10).translate(0, h - 1.2, 0));
  p.gold.push(new THREE.SphereGeometry(0.35, 10, 8).translate(0, h + 0.1, 0));
  p.gold.push(new THREE.BoxGeometry(0.22, 1.4, 0.22).translate(0.55, h + 0.3, 0));
}

/** A domed chapel: a block with a portico, a drum ringed with columns, a dome, a lantern and a cross. */
function dome(p: Parts, h: number): void {
  const base = h * 0.38;
  p.stone.push(new THREE.BoxGeometry(22, base, 30).translate(0, base / 2, 0));
  p.trim.push(new THREE.BoxGeometry(23, 1, 31).translate(0, base, 0));
  // portico: columns and a pediment facing south (towards the usual camera)
  for (let k = -2; k <= 2; k++)
    p.trim.push(new THREE.CylinderGeometry(0.5, 0.55, base - 2, 10).translate(k * 3.4, (base - 2) / 2, 16.5));
  p.stone.push(
    new THREE.CylinderGeometry(0.01, 10, 4, 3, 1)
      .rotateY(Math.PI / 6)
      .scale(1.4, 1, 0.35)
      .translate(0, base + 1.2, 16.5),
  );
  const drumH = h * 0.2;
  p.stone.push(new THREE.CylinderGeometry(7.5, 7.5, drumH, 20).translate(0, base + drumH / 2, -2));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    p.trim.push(
      new THREE.CylinderGeometry(0.35, 0.35, drumH, 8).translate(
        Math.cos(a) * 8,
        base + drumH / 2,
        -2 + Math.sin(a) * 8,
      ),
    );
  }
  const top = base + drumH;
  p.roof.push(
    new THREE.SphereGeometry(7.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.25, 1).translate(0, top, -2),
  );
  p.trim.push(new THREE.CylinderGeometry(1.2, 1.4, 3, 10).translate(0, top + 9.5 + 1.5, -2));
  p.gold.push(new THREE.BoxGeometry(0.25, 2.4, 0.25).translate(0, h, -2));
  p.gold.push(new THREE.BoxGeometry(1.2, 0.25, 0.25).translate(0, h + 0.4, -2));
}

/**
 * Coordinates typed from memory are good to a few tens of metres, so each landmark is fitted to the map:
 * a tower or dome rises from the middle of the building it belongs to (the one at, or nearest to, the spot),
 * and a column stands on the nearest open ground.
 */
export function fitToMap(map: MapData, kind: Landmark3d['kind'], x: number, z: number): Pt {
  const shapes = map.buildings.map((b) => toPoints(b.p));
  const centre = (pts: Pt[]): Pt => [
    pts.reduce((a, p) => a + p[0], 0) / pts.length,
    pts.reduce((a, p) => a + p[1], 0) / pts.length,
  ];
  if (kind === 'column') {
    const open = (px: number, pz: number) => !shapes.some((pts) => pointInPolygon(px, pz, pts));
    for (let r = 0; r <= 40; r += 2)
      for (let k = 0; k < Math.max(1, r * 2); k++) {
        const a = (k / Math.max(1, r * 2)) * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        // keep a little room round the column
        if ([0, 1, 2, 3].every((q) => open(px + Math.cos((q * Math.PI) / 2) * 3, pz + Math.sin((q * Math.PI) / 2) * 3)))
          return [px, pz];
      }
    return [x, z];
  }
  const hit = shapes.find((pts) => pointInPolygon(x, z, pts));
  if (hit) return centre(hit);
  let best: Pt = [x, z];
  let bestD = 40;
  for (const pts of shapes) {
    const c = centre(pts);
    const d = Math.hypot(c[0] - x, c[1] - z);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Where a landmark stands and how big it is, so the camera can keep clear of it. */
export interface PlacedLandmark {
  x: number;
  z: number;
  /** Half the width of its footprint. */
  r: number;
  h: number;
}

/** Builds the city's landmarks that fall inside the mapped area. Each one is a handful of merged shapes. */
export function createLandmarks(
  scene: THREE.Scene,
  kit: Kit,
  map: MapData,
  landmarks: readonly Landmark3d[],
): PlacedLandmark[] {
  const project = makeProjector(map.origin.lat, map.origin.lon);
  const placed: PlacedLandmark[] = [];
  for (const lm of landmarks) {
    const [rx, rz] = project(lm.lat, lm.lon);
    if (Math.abs(rx) > map.w / 2 - 6 || Math.abs(rz) > map.h / 2 - 6) continue;
    const [x, z] = fitToMap(map, lm.kind, rx, rz);
    const parts = emptyParts();
    if (lm.kind === 'belfry') belfry(parts, lm.h);
    else if (lm.kind === 'column') column(parts, lm.h);
    else dome(parts, lm.h);
    const colors: Record<keyof Parts, number> = {
      stone: lm.color,
      roof: lm.kind === 'dome' ? 0x5c6a72 : 0x4a545e,
      dark: 0x1d2328,
      gold: 0xd9a821,
      trim: 0xefe9dc,
    };
    const group = new THREE.Group();
    for (const key of Object.keys(parts) as (keyof Parts)[]) {
      const list = parts[key];
      if (!list.length) continue;
      const merged = BufferGeometryUtils.mergeBufferGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
      for (const g of list) g.dispose();
      const mesh = new THREE.Mesh(merged, kit.M(colors[key]));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    placed.push({
      x,
      z,
      h: lm.h,
      r: lm.kind === 'dome' ? 16 : lm.kind === 'belfry' ? Math.max(7, lm.h * 0.13) / 2 + 1 : 2.5,
    });
  }
  return placed;
}
