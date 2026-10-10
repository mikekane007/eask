/** Pure traffic rules: signals, density through the day, braking. No rendering code, so it is easy to test. */

export type Light = 'green' | 'amber' | 'red';

/** Seconds for one full signal cycle at an intersection. */
export const SIGNAL_CYCLE = 24;

/**
 * Signal state for an intersection. East-west ('h') gets green first, then north-south ('v'), each followed by an
 * amber and a short all-red gap so that cars still in the junction can clear it.
 * `offset` staggers neighbouring intersections so they are not all identical.
 */
export function signalAt(t: number, offset: number): { h: Light; v: Light } {
  const p = (((t + offset) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  if (p < 9) return { h: 'green', v: 'red' };
  if (p < 11) return { h: 'amber', v: 'red' };
  if (p < 12) return { h: 'red', v: 'red' };
  if (p < 21) return { h: 'red', v: 'green' };
  if (p < 23) return { h: 'red', v: 'amber' };
  return { h: 'red', v: 'red' };
}

/** Each intersection gets its own signal offset from its grid position. */
export const signalOffset = (i: number, j: number): number => (i * 5 + j * 7) % SIGNAL_CYCLE;

const DENSITY: [number, number][] = [
  [0, 0.2],
  [5, 0.25],
  [7, 0.95],
  [9.5, 0.9],
  [12, 0.6],
  [14, 0.55],
  [16.5, 0.95],
  [19, 0.85],
  [21, 0.5],
  [23, 0.3],
  [24, 0.2],
];

/** Share of the vehicle fleet on the road at an hour (fractional hours allowed): rush hours busy, nights quiet. */
export function trafficDensity(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 1; i < DENSITY.length; i++) {
    const [h1, d1] = DENSITY[i];
    const [h0, d0] = DENSITY[i - 1];
    if (h <= h1) return d0 + ((d1 - d0) * (h - h0)) / (h1 - h0);
  }
  return DENSITY[DENSITY.length - 1][1];
}

/** The highest speed from which a vehicle can still stop within `distance` at deceleration `decel`. */
export function stopSpeed(distance: number, decel: number): number {
  return distance <= 0 ? 0 : Math.sqrt(2 * decel * distance);
}

/** Whether a vehicle approaching a signal should stop for it, given how far away it is and how fast it goes. */
export function mustStop(light: Light, distance: number, speed: number, decel: number): boolean {
  if (light === 'green') return false;
  if (light === 'red') return true;
  // Amber: stop only if it can do so comfortably; otherwise carry on through.
  return distance > (speed * speed) / (2 * decel) + 0.5;
}

export interface SpeedLimits {
  vmax: number;
  /** Distance to the stop line, if the vehicle has to stop there. */
  stopDistance: number | null;
  /** Free gap to the vehicle or person in front, if any. */
  obstacleGap: number | null;
  decel: number;
}

/** The speed a vehicle should be going this moment: the road speed, capped by what lets it stop in time. */
export function desiredSpeed({ vmax, stopDistance, obstacleGap, decel }: SpeedLimits): number {
  let v = vmax;
  if (stopDistance !== null) v = Math.min(v, stopSpeed(stopDistance, decel));
  if (obstacleGap !== null) v = Math.min(v, stopSpeed(obstacleGap, decel));
  return v;
}

/** Moves `current` toward `target`, accelerating gently and braking hard. */
export function approach(current: number, target: number, dt: number, accel: number, decel: number): number {
  return target > current ? Math.min(target, current + accel * dt) : Math.max(target, current - decel * dt);
}

/** A vehicle or person on the road, as far as another vehicle is concerned. */
export interface Body {
  x: number;
  z: number;
  /** Length along the road, in metres. */
  len: number;
}

/**
 * The free distance in front of a vehicle before it would reach something in its path, or null if the way is clear.
 * Looks along the direction of travel `(dx, dz)` within `look` metres and a corridor `half` metres to each side, so
 * it works on bends and across junctions as well as along a straight lane.
 */
export function gapAhead(
  self: Body & { dx: number; dz: number },
  others: readonly Body[],
  look = 26,
  half = 2.2,
  margin = 1.2,
): number | null {
  let best: number | null = null;
  for (const o of others) {
    const rx = o.x - self.x;
    const rz = o.z - self.z;
    const along = rx * self.dx + rz * self.dz;
    if (along <= 0 || along > look) continue;
    const lateral = Math.abs(rx * self.dz - rz * self.dx);
    if (lateral > half) continue;
    const free = along - (self.len + o.len) / 2 - margin;
    if (best === null || free < best) best = free;
  }
  return best;
}
