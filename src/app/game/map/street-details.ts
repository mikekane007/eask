/**
 * Painted lines, zebra crossings and street furniture for the real maps, worked out from the road network.
 * Pure logic: it returns positions and sizes, and the renderer draws them with one instanced mesh per kind.
 */
import type { RoadGraph } from './road-graph';

/** A flat painted rectangle on the road: centre, direction of its length (radians, atan2(dx, dz)), size. */
interface Mark {
  x: number;
  z: number;
  angle: number;
  length: number;
  width: number;
}

/** A bench or bin on the pavement, facing `angle`. */
interface Furniture {
  x: number;
  z: number;
  angle: number;
  kind: 'bench' | 'bin';
}

export interface StreetDetails {
  dashes: Mark[];
  crossings: Mark[];
  furniture: Furniture[];
}

const DASH = 3;
const GAP = 3.5;
/** Roads at least this wide (metres) get a centre line and benches. */
const WIDE = 6;

/**
 * Centre dashes on wide roads, a zebra crossing on every road leaving a junction, and benches and bins along wide
 * roads where there is room. `free` says whether a spot on the pavement is clear of buildings.
 */
export function streetDetails(graph: RoadGraph, free: (x: number, z: number) => boolean, limit = 400): StreetDetails {
  const dashes: Mark[] = [];
  const crossings: Mark[] = [];
  const furniture: Furniture[] = [];
  const isJunction = (n: number) => graph.nodes[n].edges.filter((e) => graph.edges[e].drive).length >= 3;

  for (const e of graph.edges) {
    if (!e.drive) continue;
    const a = graph.nodes[e.a];
    const angle = Math.atan2(e.dx, e.dz);
    const startGap = isJunction(e.a) ? 7 : 1;
    const endGap = isJunction(e.b) ? 7 : 1;

    // centre line
    if (e.width >= WIDE && dashes.length < limit * 4) {
      for (let s = startGap; s + DASH <= e.len - endGap; s += DASH + GAP) {
        dashes.push({
          x: a.x + e.dx * (s + DASH / 2),
          z: a.z + e.dz * (s + DASH / 2),
          angle,
          length: DASH,
          width: 0.16,
        });
      }
    }

    // zebra crossings a little way into each road from a junction: stripes run along the road, spread across it
    for (const [node, sign] of [
      [e.a, 1],
      [e.b, -1],
    ] as const) {
      if (!isJunction(node) || e.len < 12 || crossings.length >= limit * 6) continue;
      const n = graph.nodes[node];
      const d = 3.5;
      const cx = n.x + e.dx * d * sign;
      const cz = n.z + e.dz * d * sign;
      const across = e.width - 0.8;
      for (let o = -across / 2 + 0.3; o <= across / 2 - 0.3; o += 1) {
        crossings.push({ x: cx + e.dz * o, z: cz - e.dx * o, angle, length: 2.6, width: 0.5 });
      }
    }

    // a bench or a bin on alternate sides, every 30 m or so, along wide roads
    if (e.width >= WIDE && e.len > 18 && furniture.length < limit) {
      let side = 1;
      for (let s = 9; s < e.len - 9; s += 30) {
        const off = e.width / 2 + 1.3;
        const x = a.x + e.dx * s + e.dz * off * side;
        const z = a.z + e.dz * s - e.dx * off * side;
        if (furniture.length >= limit) break;
        if (free(x, z)) {
          // benches face the road
          furniture.push({
            x,
            z,
            angle: angle + (side > 0 ? -Math.PI / 2 : Math.PI / 2),
            kind: s % 60 < 30 ? 'bench' : 'bin',
          });
        }
        side = -side;
      }
    }
  }
  return { dashes, crossings, furniture };
}
