import * as THREE from 'three';
import { pickSchedule, ringLength, ringPoint, SCHEDULES, isOutAndAbout, staysOut } from './crowd-logic';
import type { Kit } from './kit';
import { B, N, bMin } from './layout';
import { directionFrom, nextEdge, otherEnd, pointOnEdge, type GEdge, type RoadGraph } from './map/road-graph';
import type { CityTheme } from './types';

const CROWD = 36;
const INSET = 0.55; // how far in from the block edge the pavement loop runs
const PAVE_Y = 0.35;
const SHIRTS = [0xd7263d, 0x2e86c1, 0xf2b705, 0x1e8a4c, 0x8e44ad, 0xe67e22, 0xeeeeee, 0x34495e, 0xc0392b, 0x16a085];
const PANTS = [0x1d2a36, 0x3b2a20, 0x2c3e50, 0x4a4a3a, 0x555b61];
const HAIR = [0x15100c, 0x15100c, 0x3b2a20, 0x6b4630, 0xb08a4a, 0x9a9590];
const tmpC = new THREE.Color();

const toLinear = (hex: number) => new THREE.Color(hex).convertSRGBToLinear();

interface Walker {
  i: number;
  j: number;
  /** Distance along the pavement loop. */
  u: number;
  dir: 1 | -1;
  speed: number;
  schedule: string;
  /** How much rain this person will put up with. */
  tolerance: number;
  /** 0 (indoors) to 1 (out), eased so people appear and vanish gently. */
  vis: number;
  phase: number;
  /** Metres until the next stop to chat or look around, and how long that stop lasts. */
  stopIn: number;
  pause: number;
  /** Where they were last drawn. */
  x: number;
  z: number;
  /** On a real map: the street piece they are on, where they set off from, how far along, and which side. */
  edge: GEdge | null;
  from: number;
  along: number;
  side: 1 | -1;
}

/** Where people walk on a real map: along its streets, keeping to one side. */
export interface WalkRoutes {
  graph: RoadGraph;
  /** The street pieces they may start on (one connected network). */
  edges: readonly GEdge[];
  /** True if a person of radius r standing at (x, z) would be inside a building. */
  blocked: (x: number, z: number, r: number) => boolean;
}

/** A background crowd that follows daily routines, walks the pavements and goes indoors in the rain. */
export function createPedestrians(scene: THREE.Scene, kit: Kit, theme: CityTheme, routes?: WalkRoutes) {
  const { rnd } = kit;
  const w = B - 2 * INSET;
  const len = ringLength(w, w);

  const torsoGeo = new THREE.CylinderGeometry(0.27, 0.22, 0.9, 8);
  const headGeo = new THREE.SphereGeometry(0.2, 8, 6);
  const legGeo = new THREE.BoxGeometry(0.13, 0.8, 0.15);
  legGeo.translate(0, -0.4, 0); // pivot at the hip
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const torso = new THREE.InstancedMesh(torsoGeo, white, CROWD);
  const head = new THREE.InstancedMesh(headGeo, white, CROWD);
  const legL = new THREE.InstancedMesh(legGeo, white, CROWD);
  const legR = new THREE.InstancedMesh(legGeo, white, CROWD);
  // arms swing against the legs; hair sits on the head
  const armGeo = new THREE.BoxGeometry(0.1, 0.68, 0.12);
  armGeo.translate(0, -0.34, 0); // pivot at the shoulder
  const armL = new THREE.InstancedMesh(armGeo, white, CROWD);
  const armR = new THREE.InstancedMesh(armGeo, white, CROWD);
  const hairGeo = new THREE.SphereGeometry(0.215, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const hair = new THREE.InstancedMesh(hairGeo, white, CROWD);
  const parts = [torso, head, legL, legR, armL, armR, hair];
  torso.castShadow = true;
  for (const m of parts) {
    m.frustumCulled = false;
    scene.add(m);
  }

  const walkers: Walker[] = [];
  for (let n = 0; n < CROWD; n++) {
    walkers.push({
      i: n % N,
      j: Math.floor(rnd() * N),
      u: rnd() * len,
      dir: rnd() > 0.5 ? 1 : -1,
      speed: 1.1 + rnd() * 0.8,
      schedule: pickSchedule(rnd()),
      tolerance: 0.2 + rnd() * 1.0,
      vis: 0,
      phase: rnd() * 6.28,
      stopIn: 5 + rnd() * 30,
      pause: 0,
      x: 0,
      z: 0,
      edge: null,
      from: 0,
      along: 0,
      side: rnd() > 0.5 ? 1 : -1,
    });
    if (routes?.edges.length) {
      const w0 = walkers[walkers.length - 1];
      w0.edge = routes.edges[Math.floor(rnd() * routes.edges.length)];
      w0.from = rnd() > 0.5 ? w0.edge.a : w0.edge.b;
      w0.along = rnd() * w0.edge.len;
    }
    torso.setColorAt(n, toLinear(SHIRTS[Math.floor(rnd() * SHIRTS.length)]));
    head.setColorAt(n, toLinear(theme.skins[Math.floor(rnd() * theme.skins.length)]));
    const pants = toLinear(PANTS[Math.floor(rnd() * PANTS.length)]);
    legL.setColorAt(n, pants);
    legR.setColorAt(n, pants);
    // sleeves match the shirt
    torso.getColorAt(n, tmpC);
    armL.setColorAt(n, tmpC);
    armR.setColorAt(n, tmpC);
    hair.setColorAt(n, toLinear(HAIR[Math.floor(rnd() * HAIR.length)]));
  }
  for (const m of parts) if (m.instanceColor) m.instanceColor.needsUpdate = true;

  const baseY = routes ? 0.04 : PAVE_Y;
  const dummy = new THREE.Object3D();
  const hide = (n: number) => {
    dummy.position.set(0, -10, 0);
    dummy.scale.setScalar(0);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    for (const m of parts) m.setMatrixAt(n, dummy.matrix);
  };
  walkers.forEach((_, n) => {
    hide(n);
  });

  /** How many people are visible right now (for tests, sound and the map). */
  let visible = 0;
  let limit = CROWD;

  return {
    /** The most background people allowed out at once. */
    setLimit(n: number): void {
      limit = n;
    },
    get visibleCount() {
      return visible;
    },
    /** How many people out and about are within `radius` metres of `p` (for sound). */
    nearCount(p: THREE.Vector3, radius: number): number {
      let n = 0;
      for (const w of walkers) {
        if (w.vis > 0.5 && (w.x - p.x) ** 2 + (w.z - p.z) ** 2 < radius * radius) n++;
      }
      return n;
    },
    /**
     * @param hour fractional clock hour
     * @param rain eased rain intensity, 0 to 1
     */
    update(dt: number, hour: number, rain: number): void {
      let count = 0;
      walkers.forEach((p, n) => {
        const want = n < limit && isOutAndAbout(SCHEDULES[p.schedule], hour) && staysOut(rain, p.tolerance);
        p.vis += ((want ? 1 : 0) - p.vis) * Math.min(1, dt * 1.5);
        if (p.vis < 0.03) {
          if (p.vis !== 0) {
            p.vis = 0;
            hide(n);
          }
          return;
        }
        count++;

        const walking = p.pause <= 0;
        if (walking) {
          if (routes && p.edge) {
            p.along += p.speed * dt;
            if (p.along >= p.edge.len) {
              const at = otherEnd(p.edge, p.from);
              const next = nextEdge(routes.graph, p.edge, at, rnd);
              p.along -= p.edge.len;
              p.edge = next;
              p.from = at;
              p.along = Math.min(p.along, next.len);
            }
          } else p.u += p.dir * p.speed * dt;
          p.phase += p.speed * dt * 2.4;
          p.stopIn -= p.speed * dt;
          if (p.stopIn <= 0) {
            p.pause = 2 + rnd() * 6;
            p.stopIn = 12 + rnd() * 35;
          }
        } else {
          p.pause -= dt;
        }

        let x: number;
        let z: number;
        let heading: number;
        if (routes && p.edge) {
          const at = pointOnEdge(routes.graph, p.edge, p.from, p.along);
          // keep to one side of the street, unless that would put them inside a building
          const off = Math.max(0, Math.min(p.edge.width / 2 - 0.6, 2.2)) * p.side;
          x = at.x - at.dz * off;
          z = at.z + at.dx * off;
          if (routes.blocked(x, z, 0.3)) {
            x = at.x;
            z = at.z;
          }
          const d = directionFrom(p.edge, p.from);
          heading = Math.atan2(d.dx, d.dz);
        } else {
          const pt = ringPoint(p.u, w, w);
          heading = p.dir > 0 ? pt.heading : pt.heading + Math.PI;
          x = bMin(p.i) + INSET + pt.x;
          z = bMin(p.j) + INSET + pt.z;
        }
        p.x = x;
        p.z = z;
        const bob = walking ? Math.abs(Math.sin(p.phase)) * 0.04 : 0;
        const swing = walking ? Math.sin(p.phase) * 0.7 : 0;
        const s = p.vis;

        dummy.scale.setScalar(s);
        dummy.rotation.set(0, heading, 0, 'YXZ');
        dummy.position.set(x, baseY + 1.25 * s + bob, z);
        dummy.updateMatrix();
        torso.setMatrixAt(n, dummy.matrix);
        dummy.position.set(x, baseY + 1.95 * s + bob, z);
        dummy.updateMatrix();
        head.setMatrixAt(n, dummy.matrix);
        dummy.position.set(x, baseY + 2.0 * s + bob, z);
        dummy.updateMatrix();
        hair.setMatrixAt(n, dummy.matrix);

        const cos = Math.cos(heading);
        const sin = Math.sin(heading);
        for (const [mesh, side] of [
          [legL, -1],
          [legR, 1],
        ] as const) {
          dummy.rotation.set(side * swing, heading, 0, 'YXZ');
          dummy.position.set(x + cos * 0.1 * side * s, baseY + 0.85 * s + bob, z - sin * 0.1 * side * s);
          dummy.updateMatrix();
          mesh.setMatrixAt(n, dummy.matrix);
        }
        for (const [mesh, side] of [
          [armL, -1],
          [armR, 1],
        ] as const) {
          dummy.rotation.set(-side * swing * 0.8, heading, side * 0.06, 'YXZ');
          dummy.position.set(x + cos * 0.31 * side * s, baseY + 1.66 * s + bob, z - sin * 0.31 * side * s);
          dummy.updateMatrix();
          mesh.setMatrixAt(n, dummy.matrix);
        }
      });
      visible = count;
      for (const m of parts) m.instanceMatrix.needsUpdate = true;
    },
  };
}
