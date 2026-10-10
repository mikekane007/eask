import type { Pt } from './geo';
import { toPoints } from './geo';
import type { MapRoad } from './types';

/** A point where streets meet or end. */
interface GNode {
  id: number;
  x: number;
  z: number;
  /** Ids of the straight street pieces that touch this point. */
  edges: number[];
}

/** One straight piece of street between two nodes. */
export interface GEdge {
  id: number;
  a: number;
  b: number;
  len: number;
  /** Unit direction from a to b. */
  dx: number;
  dz: number;
  kind: string;
  width: number;
  /** True if cars can use it. */
  drive: boolean;
}

export interface RoadGraph {
  nodes: GNode[];
  edges: GEdge[];
}

const SNAP = 0.7; // vertices closer than this (metres) are the same junction
const T_REACH = 1.3; // a street end this close to another street's side is joined to it

/** Cruising speed in metres per second for a street kind. */
export function speedFor(kind: string): number {
  switch (kind) {
    case 'primary':
    case 'trunk':
    case 'motorway':
      return 11;
    case 'secondary':
      return 10;
    case 'tertiary':
      return 9;
    case 'living_street':
      return 4;
    case 'service':
      return 4;
    default:
      return 7;
  }
}

function distToSeg(p: Pt, a: Pt, b: Pt): { d: number; t: number } {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2));
  return { d: Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz)), t };
}

/**
 * Builds a graph from street centre lines. Vertices that coincide become one node. A street that ends against the
 * side of another street (a T-junction whose shared point was lost when the map was simplified) is joined to it.
 */
export function buildGraph(roads: readonly MapRoad[], keep: (r: MapRoad) => boolean = () => true): RoadGraph {
  const lines = roads.filter(keep).map((r) => ({ road: r, pts: toPoints(r.p) }));

  // Join street ends to the sides of other streets by adding a vertex there.
  for (const a of lines) {
    for (const end of [0, a.pts.length - 1]) {
      const p = a.pts[end];
      for (const b of lines) {
        if (b === a) continue;
        for (let i = 0; i < b.pts.length - 1; i++) {
          const { d, t } = distToSeg(p, b.pts[i], b.pts[i + 1]);
          if (d <= T_REACH && t > 0.02 && t < 0.98 && d > 1e-6) {
            // only if the street end is not already at one of b's vertices
            if (b.pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > SNAP)) {
              b.pts.splice(i + 1, 0, [p[0], p[1]]);
              break;
            }
          }
        }
      }
    }
  }

  const nodes: GNode[] = [];
  const cells = new Map<string, number[]>();
  const cellOf = (v: number) => Math.floor(v / SNAP);
  const nodeAt = (x: number, z: number): number => {
    const cx = cellOf(x);
    const cz = cellOf(z);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const id of cells.get(`${cx + i},${cz + j}`) ?? []) {
          if (Math.hypot(nodes[id].x - x, nodes[id].z - z) <= SNAP) return id;
        }
      }
    }
    const id = nodes.length;
    nodes.push({ id, x, z, edges: [] });
    const key = `${cx},${cz}`;
    const list = cells.get(key);
    if (list) list.push(id);
    else cells.set(key, [id]);
    return id;
  };

  const edges: GEdge[] = [];
  const seen = new Set<string>();
  for (const { road, pts } of lines) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = nodeAt(pts[i][0], pts[i][1]);
      const b = nodeAt(pts[i + 1][0], pts[i + 1][1]);
      if (a === b) continue;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dx = nodes[b].x - nodes[a].x;
      const dz = nodes[b].z - nodes[a].z;
      const len = Math.hypot(dx, dz);
      const id = edges.length;
      edges.push({ id, a, b, len, dx: dx / len, dz: dz / len, kind: road.k, width: road.w, drive: road.d === 1 });
      nodes[a].edges.push(id);
      nodes[b].edges.push(id);
    }
  }
  return { nodes, edges };
}

/** The edge's direction as seen when travelling away from node `from`. */
export function directionFrom(e: GEdge, from: number): { dx: number; dz: number } {
  return from === e.a ? { dx: e.dx, dz: e.dz } : { dx: -e.dx, dz: -e.dz };
}

/**
 * Where to go next on arriving at `node` along `edge`: usually straight on or round a gentle bend, sometimes a
 * turn, and back the way you came only at a dead end. `rand` returns a number in [0, 1).
 */
export function nextEdge(graph: RoadGraph, edge: GEdge, node: number, rand: () => number): GEdge {
  const here = graph.nodes[node];
  const options = here.edges.filter((id) => id !== edge.id).map((id) => graph.edges[id]);
  if (options.length === 0) return edge; // dead end: turn round
  if (options.length === 1) return options[0];
  // travelling direction as we arrive
  const arrive = directionFrom(edge, node === edge.a ? edge.b : edge.a);
  const weights = options.map((o) => {
    const out = directionFrom(o, node);
    const straight = arrive.dx * out.dx + arrive.dz * out.dz; // 1 = straight on, -1 = back
    return 0.25 + Math.max(0, straight + 0.2);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r < 0) return options[i];
  }
  return options[options.length - 1];
}

/** Position `s` metres along `edge` starting from node `from`, with the unit direction of travel. */
export function pointOnEdge(
  graph: RoadGraph,
  edge: GEdge,
  from: number,
  s: number,
): { x: number; z: number; dx: number; dz: number } {
  const n = graph.nodes[from];
  const { dx, dz } = directionFrom(edge, from);
  return { x: n.x + dx * s, z: n.z + dz * s, dx, dz };
}

/** The node at the far end of `edge` when travelling from `from`. */
export const otherEnd = (edge: GEdge, from: number): number => (from === edge.a ? edge.b : edge.a);

/** Groups the edges into connected networks, biggest first, so vehicles only start where they can really travel. */
export function networks(graph: RoadGraph): GEdge[][] {
  const seen = new Set<number>();
  const out: GEdge[][] = [];
  for (const start of graph.edges) {
    if (seen.has(start.id)) continue;
    const group: GEdge[] = [];
    const stack = [start.id];
    seen.add(start.id);
    while (stack.length) {
      const id = stack.pop();
      if (id === undefined) break;
      const e = graph.edges[id];
      group.push(e);
      for (const n of [e.a, e.b])
        for (const id of graph.nodes[n].edges)
          if (!seen.has(id)) {
            seen.add(id);
            stack.push(id);
          }
    }
    out.push(group);
  }
  return out.sort((a, b) => b.length - a.length);
}
