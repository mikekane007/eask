import * as THREE from 'three';
import type { Kit } from './kit';
import { CAR_COLORS, createVehicleModels } from './vehicles';
import { H, N, roadC } from './layout';
import { approach, desiredSpeed, mustStop, signalAt, signalOffset, trafficDensity, type Light } from './traffic-logic';
import type { CityTheme } from './types';

const MAX_VEHICLES = 14;
const STOP_LINE = 6.8; // metres from the intersection centre
const STOP_MARGIN = 1;
const ACCEL = 4;
const DECEL = 7;
const LANE = 2; // lane centre, from the road centre line
/** Lamp colours, converted once for the renderer's colour handling (instance colours are not converted for us). */
const LIGHT_COLORS: Record<Light, THREE.Color> = {
  green: new THREE.Color(0x2ecc71).convertSRGBToLinear(),
  amber: new THREE.Color(0xf1c40f).convertSRGBToLinear(),
  red: new THREE.Color(0xe74c3c).convertSRGBToLinear(),
};

interface Vehicle {
  obj: THREE.Group;
  horiz: boolean;
  k: number;
  dir: 1 | -1;
  /** Position along the road, from -H to H. */
  s: number;
  v: number;
  vmax: number;
  len: number;
  /** Lower ranks are on the road more of the time. */
  rank: number;
}

/** Cars and buses on every road, obeying traffic lights, keeping their distance and stopping for the player. */
export function createTraffic(scene: THREE.Scene, kit: Kit, theme: CityTheme) {
  const { M, rnd } = kit;

  const { makeBus, makeCar } = createVehicleModels(kit);

  // ---- the fleet: distinct lanes so vehicles start spread out
  const lanes: { horiz: boolean; k: number; dir: 1 | -1 }[] = [];
  for (const horiz of [true, false])
    for (let k = 0; k <= N; k++) for (const dir of [1, -1] as const) lanes.push({ horiz, k, dir });
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  const buses = Math.round(MAX_VEHICLES * theme.vehicles.busShare);
  const vehicles: Vehicle[] = [];
  for (let n = 0; n < MAX_VEHICLES; n++) {
    const lane = lanes[n % lanes.length];
    // spread the buses evenly through the fleet, so quiet hours still have a mix
    const isBus = Math.floor(((n + 1) * buses) / MAX_VEHICLES) > Math.floor((n * buses) / MAX_VEHICLES);
    const obj = isBus
      ? makeBus(
          theme.vehicles.colors[n % theme.vehicles.colors.length],
          theme.vehicles.labels[n % theme.vehicles.labels.length],
        )
      : makeCar(CAR_COLORS[n % CAR_COLORS.length]);
    scene.add(obj);
    vehicles.push({
      obj,
      ...lane,
      s: (rnd() * 2 - 1) * H,
      v: 0,
      vmax: isBus ? 8 + rnd() * 2 : 9 + rnd() * 3,
      len: isBus ? 5.2 : 4.3,
      rank: n,
    });
  }

  // ---- signal posts and lamps, drawn with instancing
  const posts: { x: number; z: number; axis: 'h' | 'v'; i: number; j: number }[] = [];
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++)
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          posts.push({ x: roadC(i) + sx * 6, z: roadC(j) + sz * 6, axis: sx * sz > 0 ? 'h' : 'v', i, j });
  const poleMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 4.4, 0.22), M(0x2b2f33), posts.length);
  const lampMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.55, 0.55),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    posts.length,
  );
  const dummy = new THREE.Object3D();
  posts.forEach((p, n) => {
    dummy.position.set(p.x, 2.2, p.z);
    dummy.updateMatrix();
    poleMesh.setMatrixAt(n, dummy.matrix);
    dummy.position.set(p.x, 4.5, p.z);
    dummy.updateMatrix();
    lampMesh.setMatrixAt(n, dummy.matrix);
    lampMesh.setColorAt(n, LIGHT_COLORS.red);
  });
  scene.add(poleMesh);
  scene.add(lampMesh);
  let lampClock = 0;

  const lightFor = (t: number, horiz: boolean, i: number, j: number): Light =>
    signalAt(t, signalOffset(i, j))[horiz ? 'h' : 'v'];

  function setPose(vh: Vehicle): void {
    const laneOff = vh.horiz ? (vh.dir > 0 ? LANE : -LANE) : vh.dir > 0 ? -LANE : LANE;
    if (vh.horiz) vh.obj.position.set(vh.s, 0, roadC(vh.k) + laneOff);
    else vh.obj.position.set(roadC(vh.k) + laneOff, 0, vh.s);
    vh.obj.rotation.y = vh.horiz ? (vh.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : vh.dir > 0 ? 0 : Math.PI;
  }
  vehicles.forEach(setPose);

  let limit = MAX_VEHICLES;
  return {
    vehicles,
    /** The most vehicles allowed on the road at once. */
    setLimit(n: number): void {
      limit = n;
    },
    get visibleCount() {
      return vehicles.filter((v) => v.obj.visible).length;
    },
    /** How many vehicles on the road are within `radius` metres of `p` (for sound). */
    nearCount(p: THREE.Vector3, radius: number): number {
      let n = 0;
      for (const v of vehicles) {
        if (v.obj.visible && v.obj.position.distanceToSquared(p) < radius * radius) n++;
      }
      return n;
    },
    /**
     * Advances every vehicle.
     * @param t seconds of play time (drives the signals)
     * @param hour clock hour, for how many vehicles are out
     * @param player where the player stands (null if they should be ignored)
     * @param speedFactor 1 in good weather, lower in rain and fog
     */
    update(dt: number, t: number, hour: number, player: THREE.Vector3 | null, speedFactor: number): void {
      const active = Math.max(2, Math.min(limit, Math.ceil(trafficDensity(hour) * vehicles.length)));
      for (const vh of vehicles) vh.obj.visible = vh.rank < active;

      for (const vh of vehicles) {
        if (!vh.obj.visible) continue;
        // nearest intersection ahead and its signal
        let aheadM = -1;
        let ahead = Infinity;
        for (let m = 0; m <= N; m++) {
          const a = (roadC(m) - vh.s) * vh.dir;
          if (a > 0 && a < ahead) {
            ahead = a;
            aheadM = m;
          }
        }
        let stopDistance: number | null = null;
        if (aheadM >= 0 && ahead > STOP_LINE - 0.3) {
          const i = vh.horiz ? aheadM : vh.k;
          const j = vh.horiz ? vh.k : aheadM;
          if (mustStop(lightFor(t, vh.horiz, i, j), ahead - STOP_LINE, vh.v, DECEL)) {
            stopDistance = ahead - STOP_LINE - STOP_MARGIN;
          }
        }

        // the nearest vehicle in front in the same lane
        let gap: number | null = null;
        for (const o of vehicles) {
          if (o === vh || !o.obj.visible || o.horiz !== vh.horiz || o.k !== vh.k || o.dir !== vh.dir) continue;
          const d = (o.s - vh.s) * vh.dir;
          if (d <= 0) continue;
          const free = d - (vh.len + o.len) / 2 - 1.5;
          if (gap === null || free < gap) gap = free;
        }

        // the player, if they are in the way
        if (player) {
          const along = vh.horiz ? player.x : player.z;
          const across = vh.horiz ? player.z : player.x;
          const laneCentre = roadC(vh.k) + (vh.horiz ? (vh.dir > 0 ? LANE : -LANE) : vh.dir > 0 ? -LANE : LANE);
          const d = (along - vh.s) * vh.dir;
          if (Math.abs(across - laneCentre) < 1.9 && d > 0 && d < 16) {
            const free = d - vh.len / 2 - 1.2;
            if (gap === null || free < gap) gap = free;
          }
        }

        const target = desiredSpeed({
          vmax: vh.vmax * speedFactor,
          stopDistance,
          obstacleGap: gap,
          decel: DECEL,
        });
        vh.v = approach(vh.v, target, dt, ACCEL, DECEL);
        vh.s += vh.dir * vh.v * dt;
        if (vh.s * vh.dir > H + 8) vh.s = -vh.dir * (H + 8);
        setPose(vh);
      }

      // refresh the signal lamps a few times a second
      lampClock += dt;
      if (lampClock > 0.4) {
        lampClock = 0;
        posts.forEach((p, n) => {
          lampMesh.setColorAt(n, LIGHT_COLORS[lightFor(t, p.axis === 'h', p.i, p.j)]);
        });
        if (lampMesh.instanceColor) lampMesh.instanceColor.needsUpdate = true;
      }
    },
  };
}
