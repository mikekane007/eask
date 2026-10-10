import { describe, expect, it } from 'vitest';
import { CITIES } from './cities';
import { WEATHERS, WEATHER_LOOK, blockOf, weatherAt, type Climate, type Weather } from './weather';

const counts = (cityId: string, climate: Climate, days: number): Record<Weather, number> => {
  const out: Record<Weather, number> = { clear: 0, cloudy: 0, rain: 0, fog: 0 };
  for (let d = 1; d <= days; d++) for (const h of [3, 9, 15, 21]) out[weatherAt(cityId, climate, d, h)]++;
  return out;
};

describe('weather', () => {
  const even: Climate = { clear: 1, cloudy: 1, rain: 1, fog: 1 };

  it('is deterministic: the same city, day and hour always give the same weather', () => {
    for (let d = 1; d < 30; d++) {
      expect(weatherAt('lille', even, d, 14)).toBe(weatherAt('lille', even, d, 14));
    }
  });

  it('stays the same within a six-hour block and can change between blocks', () => {
    expect(blockOf(0)).toBe(0);
    expect(blockOf(5.9)).toBe(0);
    expect(blockOf(6)).toBe(1);
    expect(blockOf(23)).toBe(3);
    expect(weatherAt('paris', even, 5, 12)).toBe(weatherAt('paris', even, 5, 17));
    const seen = new Set<Weather>();
    for (let d = 1; d < 40; d++) seen.add(weatherAt('paris', even, d, 9));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('only returns known weather', () => {
    for (let d = 1; d < 50; d++) for (let h = 0; h < 24; h++) expect(WEATHERS).toContain(weatherAt('x', even, d, h));
  });

  it('gives different cities different weather on the same day', () => {
    const a = Array.from({ length: 40 }, (_, d) => weatherAt('lille', even, d + 1, 9)).join();
    const b = Array.from({ length: 40 }, (_, d) => weatherAt('douai', even, d + 1, 9)).join();
    expect(a).not.toBe(b);
  });

  it('respects the climate: a city that never rains never gets rain', () => {
    const dry: Climate = { clear: 1, cloudy: 1, rain: 0, fog: 0 };
    const c = counts('sahel', dry, 200);
    expect(c.rain).toBe(0);
    expect(c.fog).toBe(0);
    expect(c.clear + c.cloudy).toBe(800);
  });

  it('follows the climate weights over a long run', () => {
    const wet: Climate = { clear: 0.1, cloudy: 0.1, rain: 0.8, fog: 0 };
    const c = counts('wet', wet, 400);
    const total = c.clear + c.cloudy + c.rain + c.fog;
    expect(c.rain / total).toBeGreaterThan(0.6);
    expect(c.rain).toBeGreaterThan(c.clear + c.cloudy);
  });

  it('makes fog more likely before dawn than in the afternoon', () => {
    const foggy: Climate = { clear: 1, cloudy: 1, rain: 1, fog: 1 };
    let night = 0;
    let afternoon = 0;
    for (let d = 1; d <= 600; d++) {
      if (weatherAt('f', foggy, d, 3) === 'fog') night++;
      if (weatherAt('f', foggy, d, 15) === 'fog') afternoon++;
    }
    expect(night).toBeGreaterThan(afternoon);
  });

  it('defines a sensible climate for every city', () => {
    for (const city of CITIES) {
      const total = WEATHERS.reduce((a, w) => a + city.climate[w], 0);
      expect(total, city.id).toBeGreaterThan(0.9);
      expect(total, city.id).toBeLessThan(1.1);
      expect(WEATHERS.every((w) => city.climate[w] >= 0)).toBe(true);
    }
  });

  it('has a visual look for every weather, with clear being the lightest', () => {
    for (const w of WEATHERS) {
      const look = WEATHER_LOOK[w];
      for (const v of Object.values(look)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    expect(WEATHER_LOOK.clear.dark).toBe(0);
    expect(WEATHER_LOOK.rain.rain).toBe(1);
    expect(WEATHER_LOOK.fog.fog).toBe(1);
  });
});
