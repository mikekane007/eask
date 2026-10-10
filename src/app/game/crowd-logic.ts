/** Pure rules for the background crowd: who is out at what hour, and where on a pavement loop they are. */

/** Hours of the day (0 to 24) during which a person is out and about. */
export type Schedule = readonly (readonly [number, number])[];

export const SCHEDULES: Record<string, Schedule> = {
  commuter: [
    [6.5, 9.5],
    [16.5, 20],
  ],
  shopper: [
    [9, 12.5],
    [14, 17.5],
  ],
  lunch: [[11.5, 14.5]],
  evening: [[17.5, 22.5]],
  student: [
    [7, 9],
    [12, 14],
    [16, 18],
  ],
  nightowl: [
    [20, 24],
    [0, 2],
  ],
  early: [[4.5, 7.5]],
};

/** How common each routine is among the crowd (higher means more people). Keeps the street lively by day. */
export const SCHEDULE_WEIGHTS: Record<string, number> = {
  commuter: 5,
  shopper: 7,
  lunch: 4,
  evening: 4,
  student: 5,
  nightowl: 2,
  early: 1,
};

/** True if `hour` (fractional, 0 to 24) falls inside any of the windows. */
export function isOutAndAbout(schedule: Schedule, hour: number): boolean {
  const h = ((hour % 24) + 24) % 24;
  return schedule.some(([a, b]) => h >= a && h < b);
}

/**
 * A person goes in out of the rain. `tolerance` differs per person, so a few stay out in a downpour
 * and most do not. `rain` is the eased rain intensity from 0 to 1.
 */
export function staysOut(rain: number, tolerance: number): boolean {
  return rain <= tolerance;
}

/** Length of a rectangular pavement loop. */
export const ringLength = (w: number, h: number): number => 2 * (w + h);

/**
 * A point on a rectangular loop, `u` metres from the start corner, travelling in the "+x first" direction.
 * `heading` is the angle (about the up axis, 0 facing +z) that a walker should face.
 */
export function ringPoint(u: number, w: number, h: number): { x: number; z: number; heading: number } {
  const len = ringLength(w, h);
  const d = ((u % len) + len) % len;
  if (d < w) return { x: d, z: 0, heading: Math.PI / 2 };
  if (d < w + h) return { x: w, z: d - w, heading: 0 };
  if (d < 2 * w + h) return { x: w - (d - w - h), z: h, heading: -Math.PI / 2 };
  return { x: 0, z: h - (d - 2 * w - h), heading: Math.PI };
}

/** Picks a schedule name at random, weighted, from a random number in [0, 1). */
export function pickSchedule(r: number): string {
  const names = Object.keys(SCHEDULES);
  const total = names.reduce((a, n) => a + (SCHEDULE_WEIGHTS[n] ?? 1), 0);
  let x = r * total;
  for (const n of names) {
    x -= SCHEDULE_WEIGHTS[n] ?? 1;
    if (x < 0) return n;
  }
  return names[0];
}
