import { describe, expect, it } from 'vitest';
import {
  bellGain,
  bellStrikes,
  bellsRing,
  footstepCutoff,
  isDay,
  isNight,
  mixLevels,
  type MixInputs,
} from './sound-mix';

const calm: MixInputs = { hour: 12, rain: 0, fog: 0, trafficNear: 0, crowdNear: 0 };

describe('ambient mix', () => {
  it('is quiet on a calm day with nobody about, but never completely silent', () => {
    const m = mixLevels(calm);
    expect(m.rain).toBe(0);
    expect(m.wind).toBeGreaterThan(0);
    expect(m.traffic).toBeGreaterThan(0);
    expect(m.traffic).toBeLessThan(0.02);
  });

  it('gets louder with more traffic and more people nearby', () => {
    const quiet = mixLevels(calm);
    const busy = mixLevels({ ...calm, trafficNear: 6, crowdNear: 8 });
    expect(busy.traffic).toBeGreaterThan(quiet.traffic * 5);
    expect(busy.crowd).toBeGreaterThan(quiet.crowd);
    expect(mixLevels({ ...calm, trafficNear: 100 }).traffic).toBeLessThan(0.12);
  });

  it('adds rain and wind in a storm, and silences the birds', () => {
    const storm = mixLevels({ ...calm, rain: 1 });
    expect(storm.rain).toBeGreaterThan(0.12);
    expect(storm.wind).toBeGreaterThan(mixLevels(calm).wind);
    expect(storm.birds).toBe(0);
  });

  it('has birds by day (most at dawn) and crickets by night', () => {
    expect(mixLevels({ ...calm, hour: 12 }).birds).toBeGreaterThan(0);
    expect(mixLevels({ ...calm, hour: 6 }).birds).toBeGreaterThan(mixLevels({ ...calm, hour: 12 }).birds);
    expect(mixLevels({ ...calm, hour: 23 }).birds).toBe(0);
    expect(mixLevels({ ...calm, hour: 23 }).crickets).toBeGreaterThan(0);
    expect(mixLevels({ ...calm, hour: 12 }).crickets).toBe(0);
    expect(mixLevels({ ...calm, hour: 23, rain: 1 }).crickets).toBe(0);
  });

  it('keeps every level in a sane range for any input', () => {
    for (let h = 0; h < 24; h += 0.5)
      for (const rain of [0, 0.5, 1])
        for (const near of [0, 3, 50]) {
          const m = mixLevels({ hour: h, rain, fog: rain, trafficNear: near, crowdNear: near });
          for (const v of Object.values(m)) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(25);
          }
          expect(m.wind + m.rain + m.traffic + m.crowd).toBeLessThan(0.5);
        }
  });

  it('knows day from night', () => {
    expect(isDay(8)).toBe(true);
    expect(isDay(21)).toBe(false);
    expect(isNight(22)).toBe(true);
    expect(isNight(3)).toBe(true);
    expect(isNight(12)).toBe(false);
  });
});

describe('church bells', () => {
  it('strike once per hour on a 12-hour clock', () => {
    expect(bellStrikes(1)).toBe(1);
    expect(bellStrikes(9)).toBe(9);
    expect(bellStrikes(12)).toBe(12);
    expect(bellStrikes(0)).toBe(12);
    expect(bellStrikes(15)).toBe(3);
    expect(bellStrikes(15.9)).toBe(3);
  });

  it('stay silent at night', () => {
    expect(bellsRing(3)).toBe(false);
    expect(bellsRing(23)).toBe(false);
    expect(bellsRing(7)).toBe(true);
    expect(bellsRing(12)).toBe(true);
  });

  it('fade with distance and vanish when far away', () => {
    expect(bellGain(0)).toBeGreaterThan(bellGain(40));
    expect(bellGain(40)).toBeGreaterThan(bellGain(120));
    expect(bellGain(120)).toBeGreaterThan(0);
    expect(bellGain(160)).toBe(0);
    expect(bellGain(1000)).toBe(0);
    expect(bellGain(0)).toBeLessThan(0.3);
  });
});

describe('footsteps', () => {
  it('sound brighter on wet ground', () => {
    expect(footstepCutoff(1)).toBeGreaterThan(footstepCutoff(0));
    expect(footstepCutoff(-1)).toBe(footstepCutoff(0));
    expect(footstepCutoff(5)).toBe(footstepCutoff(1));
  });
});
