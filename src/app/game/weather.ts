export type Weather = 'clear' | 'cloudy' | 'rain' | 'fog';

export const WEATHERS: Weather[] = ['clear', 'cloudy', 'rain', 'fog'];

/** How likely each kind of weather is in a city. Weights need not add up to 1. */
export type Climate = Record<Weather, number>;

/** FNV-1a hash of a string, as an unsigned 32-bit integer. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A deterministic number in [0, 1) for a seed string, so the same day always has the same weather. */
function rand01(seed: string): number {
  let a = hash(seed) + 0x6d2b79f5;
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

/** The day is split into four six-hour blocks; each has one kind of weather. */
export const blockOf = (hour: number): number => Math.min(3, Math.floor(hour / 6));

function pick(cityId: string, climate: Climate, day: number, block: number, depth: number): Weather {
  // Weather tends to last: often a block just repeats the one before it.
  if (depth < 3 && rand01(`${cityId}:${day}:${block}:keep`) < 0.45) {
    return block === 0
      ? pick(cityId, climate, day - 1, 3, depth + 1)
      : pick(cityId, climate, day, block - 1, depth + 1);
  }
  // Fog is likelier before dawn and in the early morning.
  const fogBoost = block <= 1 ? 2 : 1;
  const weights = WEATHERS.map((w) => climate[w] * (w === 'fog' ? fogBoost : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand01(`${cityId}:${day}:${block}:kind`) * total;
  for (let i = 0; i < WEATHERS.length; i++) {
    r -= weights[i];
    if (r < 0) return WEATHERS[i];
  }
  return 'clear';
}

/** The weather in a city at a given game day and hour. Deterministic: no randomness at run time. */
export function weatherAt(cityId: string, climate: Climate, day: number, hour: number): Weather {
  return pick(cityId, climate, day, blockOf(hour), 0);
}

/** What the world looks like for each kind of weather. Values are targets that the renderer eases toward. */
export interface WeatherLook {
  /** 0 to 1: how much of the sky is covered. */
  cloud: number;
  /** 0 to 1: rain intensity. */
  rain: number;
  /** 0 to 1: how thick the fog is. */
  fog: number;
  /** 0 to 1: how much the light dims and the sky greys. */
  dark: number;
}

export const WEATHER_LOOK: Record<Weather, WeatherLook> = {
  clear: { cloud: 0.55, rain: 0, fog: 0, dark: 0 },
  cloudy: { cloud: 1, rain: 0, fog: 0.15, dark: 0.28 },
  rain: { cloud: 1, rain: 1, fog: 0.55, dark: 0.62 },
  fog: { cloud: 0.85, rain: 0, fog: 1, dark: 0.3 },
};
