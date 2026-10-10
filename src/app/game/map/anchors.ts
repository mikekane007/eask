import { distToSegment, lineLength, pointAlong, pointInPolygon, toPoints, type Pt } from './geo';
import type { Anchors, Landmark, MapBuilding, MapRoad, PatrolSpot, Spot } from './types';

/** Everything `pickAnchors` needs: the map without anchors. */
export interface RawMap {
  w: number;
  h: number;
  roads: MapRoad[];
  buildings: MapBuilding[];
}

interface Candidate extends Spot {
  /** Index of the road this point is on. */
  road: number;
  /** Metres from the start of that road. */
  at: number;
}

const SAMPLE_EVERY = 5;
const MIN_CLEARANCE = 2.2; // metres between a standing point and the nearest wall

/** A small deterministic random generator, so the same map always gives the same anchors. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const centroid = (pts: Pt[]): Pt => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

/** Distance from (x, z) to the nearest building wall, or 0 if inside a building. */
export function clearance(x: number, z: number, buildings: Pt[][]): number {
  let best = Infinity;
  for (const b of buildings) {
    if (pointInPolygon(x, z, b)) return 0;
    for (let i = 0, j = b.length - 1; i < b.length; j = i++) {
      best = Math.min(best, distToSegment([x, z], b[j], b[i]));
    }
  }
  return best;
}

/** Points along walkable streets where it is clear to stand: not inside, and not jammed against, a building. */
function candidates(map: RawMap, rects: Pt[][]): Candidate[] {
  const out: Candidate[] = [];
  map.roads.forEach((road, ri) => {
    if (road.k === 'steps' || road.w < 4.5) return;
    const line = toPoints(road.p);
    const len = lineLength(line);
    if (len < 12) return;
    for (let d = 4; d <= len - 4; d += SAMPLE_EVERY) {
      const pt = pointAlong(line, d);
      if (Math.abs(pt.x) > map.w / 2 - 6 || Math.abs(pt.z) > map.h / 2 - 6) continue;
      if (clearance(pt.x, pt.z, rects) < MIN_CLEARANCE) continue;
      out.push({ x: pt.x, z: pt.z, a: pt.angle, road: ri, at: d });
    }
  });
  return out;
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * Chooses where the places and the people go, automatically and repeatably:
 * places near fixed spots relative to the map centre, people spread across the streets with room between them.
 */
export function pickAnchors(map: RawMap, peopleCount: number, seed = 7): Anchors {
  const rects = map.buildings.map((b) => toPoints(b.p));
  const cands = candidates(map, rects);
  if (cands.length < peopleCount + 3) throw new Error('map has too few clear street points');
  const rand = rng(seed);

  const nearestTo = (tx: number, tz: number, avoid: Spot[], minGap: number): Candidate => {
    let best: Candidate | null = null;
    let bestD = Infinity;
    for (const c of cands) {
      if (avoid.some((s) => dist(s, c) < minGap)) continue;
      const d = Math.hypot(c.x - tx, c.z - tz);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best ?? cands[0];
  };
  const spot = (c: Candidate): Spot => ({ x: c.x, z: c.z, a: c.a });

  // The three places you can enter, kept well apart.
  const placed: Spot[] = [];
  const church = spot(nearestTo(map.w * 0.0, map.h * -0.05, placed, 0));
  placed.push(church);
  const chop = spot(nearestTo(map.w * 0.14, map.h * 0.12, placed, 70));
  placed.push(chop);
  const home = spot(nearestTo(map.w * -0.22, map.h * 0.26, placed, 110));
  placed.push(home);

  // The building that carries each sign: the biggest footprint close to the matching spot.
  const bigEnough = rects.map((r, i) => ({ r, i, a: map.buildings[i].a })).filter((b) => b.a >= 40);
  const landmarkNear = (x: number, z: number, taken: Set<number>, minArea: number): Landmark => {
    let best: { i: number; score: number; c: Pt } | null = null;
    for (const b of bigEnough) {
      if (taken.has(b.i) || b.a < minArea) continue;
      const c = centroid(b.r);
      const score = Math.hypot(c[0] - x, c[1] - z) - Math.sqrt(b.a) * 0.4;
      if (!best || score < best.score) best = { i: b.i, score, c };
    }
    const pick = best ?? { i: 0, c: centroid(rects[0]), score: 0 };
    taken.add(pick.i);
    return { x: pick.c[0], z: pick.c[1], b: pick.i };
  };
  const taken = new Set<number>();
  const landmarks: Anchors['landmarks'] = {
    church: landmarkNear(church.x, church.z, taken, 80),
    chop: landmarkNear(chop.x, chop.z, taken, 40),
    home: landmarkNear(home.x, home.z, taken, 40),
    market: landmarkNear(map.w * 0.2, map.h * -0.3, taken, 150),
    tech: landmarkNear(map.w * -0.3, map.h * -0.3, taken, 150),
    site: landmarkNear(map.w * 0.3, map.h * 0.3, taken, 100),
  };

  // People: spread across streets that are long enough to pace, away from the places and from each other.
  const roomy = cands.filter((c) => {
    const len = lineLength(toPoints(map.roads[c.road].p));
    return len >= 28 && c.at > 10 && c.at < len - 10;
  });
  const people: PatrolSpot[] = [];
  const chosen: Candidate[] = [];
  const pool = roomy.length >= peopleCount * 3 ? roomy : cands;
  for (let n = 0; n < peopleCount; n++) {
    let best: Candidate | null = null;
    let bestScore = -Infinity;
    for (let k = 0; k < 140; k++) {
      const c = pool[Math.floor(rand() * pool.length)];
      const nearestOther = Math.min(...chosen.map((o) => dist(o, c)), ...placed.map((p) => dist(p, c) * 1.6), Infinity);
      // farthest from everything chosen so far, with a small push toward the middle of the map
      const score = Math.min(nearestOther, 90) - Math.hypot(c.x, c.z) * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    const c = best ?? pool[0];
    chosen.push(c);
    const line = toPoints(map.roads[c.road].p);
    const half = 9;
    const a = pointAlong(line, c.at - half);
    const b = pointAlong(line, c.at + half);
    people.push({ ...spot(c), seg: [a.x, a.z, b.x, b.z] });
  }

  return { home, church, chop, landmarks, people };
}
