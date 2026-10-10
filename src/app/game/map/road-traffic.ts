import type * as THREE from 'three';
import type { Kit } from '../kit';
import { approach, desiredSpeed, gapAhead, trafficDensity, type Body } from '../traffic-logic';
import type { CityTheme } from '../types';
import { CAR_COLORS, createVehicleModels } from '../vehicles';
import {
  buildGraph,
  networks,
  nextEdge,
  otherEnd,
  pointOnEdge,
  speedFor,
  type GEdge,
  type RoadGraph,
} from './road-graph';
import type { MapRoad } from './types';

const FLEET = 12;
const ACCEL = 4;
const DECEL = 7;
const JUNCTION_ZONE = 9; // metres before a junction where a vehicle must have the junction to itself
const JUNCTION_SPEED = 5.5;
const WAIT_LIMIT = 6; // seconds before a vehicle stuck at a junction goes anyway, so nothing can lock up

interface Vehicle {
  obj: THREE.Group;
  edge: GEdge;
  /** The node it set off from on this edge. */
  from: number;
  /** Metres travelled along the edge. */
  s: number;
  v: number;
  vmax: number;
  len: number;
  rank: number;
  /** The junction it currently has to itself, or -1. */
  holding: number;
  waited: number;
  x: number;
  z: number;
  dx: number;
  dz: number;
}

/**
 * Cars and buses driving round the real streets of a map. They keep to the right, slow for junctions and take turns
 * through them, keep their distance from whatever is in front (another vehicle or a person) and stop for the player.
 */
export function createRoadTraffic(scene: THREE.Scene, kit: Kit, theme: CityTheme, roads: readonly MapRoad[]) {
  const { rnd } = kit;
  const { makeBus, makeCar } = createVehicleModels(kit);
  const graph: RoadGraph = buildGraph(roads, (r) => r.d === 1 && r.w >= 4);
  const net = networks(graph)[0] ?? [];
  const occupied = new Map<number, Vehicle>();
  const vehicles: Vehicle[] = [];

  const buses = Math.round(FLEET * theme.vehicles.busShare);
  for (let n = 0; net.length > 0 && n < FLEET; n++) {
    const isBus = Math.floor(((n + 1) * buses) / FLEET) > Math.floor((n * buses) / FLEET);
    const obj = isBus
      ? makeBus(
          theme.vehicles.colors[n % theme.vehicles.colors.length],
          theme.vehicles.labels[n % theme.vehicles.labels.length],
        )
      : makeCar(CAR_COLORS[n % CAR_COLORS.length]);
    scene.add(obj);
    const edge = net[Math.floor(rnd() * net.length)];
    vehicles.push({
      obj,
      edge,
      from: rnd() > 0.5 ? edge.a : edge.b,
      s: rnd() * edge.len,
      v: 0,
      vmax: 0.9 + rnd() * 0.25,
      len: isBus ? 5.2 : 4.3,
      rank: n,
      holding: -1,
      waited: 0,
      x: 0,
      z: 0,
      dx: 1,
      dz: 0,
    });
  }

  /** Puts the vehicle's model on its lane, to the right of the street's centre line. */
  function pose(vh: Vehicle): void {
    const p = pointOnEdge(graph, vh.edge, vh.from, Math.max(0, Math.min(vh.edge.len, vh.s)));
    const lane = Math.min(2.1, vh.edge.width / 4 + 0.3);
    vh.x = p.x - p.dz * lane;
    vh.z = p.z + p.dx * lane;
    vh.dx = p.dx;
    vh.dz = p.dz;
    vh.obj.position.set(vh.x, 0, vh.z);
    vh.obj.rotation.y = Math.atan2(p.dx, p.dz);
  }
  vehicles.forEach(pose);

  const release = (vh: Vehicle) => {
    if (vh.holding >= 0 && occupied.get(vh.holding) === vh) occupied.delete(vh.holding);
    vh.holding = -1;
  };

  return {
    vehicles,
    get visibleCount() {
      return vehicles.filter((v) => v.obj.visible).length;
    },
    nearCount(p: THREE.Vector3, radius: number): number {
      let n = 0;
      for (const v of vehicles) if (v.obj.visible && (v.x - p.x) ** 2 + (v.z - p.z) ** 2 < radius * radius) n++;
      return n;
    },
    /**
     * @param hour clock hour, for how many vehicles are out
     * @param player where the player stands (null to ignore)
     * @param speedFactor 1 in good weather, lower in rain and fog
     */
    update(dt: number, hour: number, player: THREE.Vector3 | null, speedFactor: number): void {
      if (!vehicles.length) return;
      const active = Math.max(2, Math.ceil(trafficDensity(hour) * vehicles.length));
      for (const vh of vehicles) {
        const was = vh.obj.visible;
        vh.obj.visible = vh.rank < active;
        if (was && !vh.obj.visible) release(vh);
      }
      const bodies: (Body & { owner: Vehicle | null })[] = vehicles
        .filter((v) => v.obj.visible)
        .map((v) => ({ x: v.x, z: v.z, len: v.len, owner: v }));
      if (player) bodies.push({ x: player.x, z: player.z, len: 1.2, owner: null });

      for (const vh of vehicles) {
        if (!vh.obj.visible) continue;
        const toNode = vh.edge.len - vh.s;
        const endNode = otherEnd(vh.edge, vh.from);
        const isJunction = graph.nodes[endNode].edges.length >= 3;

        // take turns at junctions: only one vehicle in the junction zone at a time
        let stopDistance: number | null = null;
        if (isJunction && toNode < JUNCTION_ZONE && vh.holding !== endNode) {
          const other = occupied.get(endNode);
          if (!other || other === vh || !other.obj.visible || vh.waited > WAIT_LIMIT) {
            occupied.set(endNode, vh);
            vh.holding = endNode;
            vh.waited = 0;
          } else {
            stopDistance = Math.max(0, toNode - 5.5);
            vh.waited += dt;
          }
        }
        // let go of a junction once clear of it
        if (vh.holding >= 0 && vh.holding === vh.from && vh.s > 9) release(vh);

        const gap = gapAhead(
          vh,
          bodies.filter((b) => b.owner !== vh),
        );
        const road = speedFor(vh.edge.kind) * vh.vmax * speedFactor;
        const cruise = isJunction && toNode < 14 ? Math.min(road, JUNCTION_SPEED) : road;
        vh.v = approach(
          vh.v,
          desiredSpeed({ vmax: cruise, stopDistance, obstacleGap: gap, decel: DECEL }),
          dt,
          ACCEL,
          DECEL,
        );
        vh.s += vh.v * dt;

        if (vh.s >= vh.edge.len) {
          // reached the junction: pick the next street and carry on from there
          const next = nextEdge(graph, vh.edge, endNode, rnd);
          const carry = vh.s - vh.edge.len;
          vh.edge = next;
          vh.from = endNode;
          vh.s = Math.min(carry, next.len);
        }
        pose(vh);
      }
    },
  };
}
