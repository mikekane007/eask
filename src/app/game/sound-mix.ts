/** Pure sound decisions: how loud each ambient layer should be, bell counts and distances. No audio code. */

export interface MixInputs {
  /** Fractional clock hour. */
  hour: number;
  /** Eased rain intensity, 0 to 1. */
  rain: number;
  /** Eased fog thickness, 0 to 1. */
  fog: number;
  /** Vehicles within earshot. */
  trafficNear: number;
  /** People within earshot. */
  crowdNear: number;
}

export interface Mix {
  wind: number;
  rain: number;
  traffic: number;
  crowd: number;
  /** Bird calls per minute. */
  birds: number;
  crickets: number;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const isDay = (hour: number): boolean => hour >= 6 && hour < 19;
export const isNight = (hour: number): boolean => hour >= 20 || hour < 5;

/** Loudness (0 to about 0.2) of every ambient layer for the current moment. */
export function mixLevels(i: MixInputs): Mix {
  const day = isDay(i.hour);
  const dawn = i.hour >= 5 && i.hour < 8;
  const dry = 1 - clamp(i.rain * 1.5);
  return {
    wind: 0.03 + 0.08 * i.rain + 0.02 * i.fog,
    rain: 0.16 * i.rain,
    traffic: i.trafficNear > 0 ? 0.02 + 0.09 * clamp(i.trafficNear / 5) : 0.012,
    crowd: (day ? 0.06 : 0.025) * clamp(i.crowdNear / 6),
    birds: day ? (dawn ? 20 : 12) * dry * (1 - 0.5 * i.fog) : 0,
    crickets: isNight(i.hour) && i.rain < 0.3 ? 0.012 : 0,
  };
}

/** How many times a church bell strikes at this hour (12-hour clock; noon and midnight are 12). */
export function bellStrikes(hour: number): number {
  const h = Math.floor(hour) % 12;
  return h === 0 ? 12 : h;
}

/** Whether bells ring at all: daytime and evening only, so nobody is woken up. */
export const bellsRing = (hour: number): boolean => hour >= 7 && hour <= 21;

/** Bell loudness by distance in metres: loud beside the church, a faint echo far away, silent beyond. */
export function bellGain(distance: number): number {
  if (distance >= 160) return 0;
  return 0.04 + 0.2 * (1 - clamp(distance / 160)) ** 2;
}

/** Brightness of a footstep: dull on dry ground, splashier on wet ground (a cutoff frequency in Hz). */
export const footstepCutoff = (wet: number): number => 900 + 2600 * clamp(wet);
