import { describe, expect, it } from 'vitest';
import {
  SCHEDULES,
  SCHEDULE_WEIGHTS,
  isOutAndAbout,
  pickSchedule,
  ringLength,
  ringPoint,
  staysOut,
} from './crowd-logic';

describe('crowd routines', () => {
  it('puts commuters out at rush hour but not at midday', () => {
    expect(isOutAndAbout(SCHEDULES['commuter'], 8)).toBe(true);
    expect(isOutAndAbout(SCHEDULES['commuter'], 17)).toBe(true);
    expect(isOutAndAbout(SCHEDULES['commuter'], 13)).toBe(false);
  });

  it('keeps night owls out late and early risers out before dawn', () => {
    expect(isOutAndAbout(SCHEDULES['nightowl'], 23)).toBe(true);
    expect(isOutAndAbout(SCHEDULES['nightowl'], 1)).toBe(true);
    expect(isOutAndAbout(SCHEDULES['nightowl'], 15)).toBe(false);
    expect(isOutAndAbout(SCHEDULES['early'], 5)).toBe(true);
  });

  it('treats hours as a 24-hour circle', () => {
    expect(isOutAndAbout(SCHEDULES['nightowl'], 25)).toBe(true); // 01:00
    expect(isOutAndAbout(SCHEDULES['commuter'], -15.5)).toBe(true); // 08:30
  });

  it('has people out at every daytime hour, and fewest in the small hours', () => {
    const weights = SCHEDULE_WEIGHTS;
    const outAt = (hour: number) =>
      Object.entries(SCHEDULES)
        .filter(([, s]) => isOutAndAbout(s, hour))
        .reduce((sum, [name]) => sum + (weights[name] ?? 1), 0);
    for (let h = 7; h < 21; h += 0.5) expect(outAt(h), `hour ${h}`).toBeGreaterThanOrEqual(5);
    expect(outAt(3)).toBeLessThan(outAt(10));
    expect(outAt(3)).toBeLessThanOrEqual(2);
  });

  it('sends most people indoors in heavy rain but not in a drizzle', () => {
    expect(staysOut(0, 0.2)).toBe(true);
    expect(staysOut(0.1, 0.2)).toBe(true);
    expect(staysOut(1, 0.2)).toBe(false);
    expect(staysOut(1, 1.1)).toBe(true);
  });

  it('picks routines in proportion to their weights', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const n = pickSchedule(i / 2000);
      counts[n] = (counts[n] ?? 0) + 1;
    }
    expect(Object.keys(counts).length).toBe(Object.keys(SCHEDULES).length);
    expect(counts['shopper']).toBeGreaterThan(counts['nightowl']);
  });
});

describe('pavement loops', () => {
  const w = 20;
  const h = 10;

  it('has the right perimeter', () => {
    expect(ringLength(w, h)).toBe(60);
  });

  it('walks the four sides in turn and returns to the start', () => {
    expect(ringPoint(0, w, h)).toEqual({ x: 0, z: 0, heading: Math.PI / 2 });
    expect(ringPoint(10, w, h).x).toBe(10);
    expect(ringPoint(25, w, h)).toMatchObject({ x: 20, z: 5 });
    expect(ringPoint(40, w, h)).toMatchObject({ x: 10, z: 10 });
    expect(ringPoint(55, w, h)).toMatchObject({ x: 0, z: 5 });
    expect(ringPoint(60, w, h)).toEqual(ringPoint(0, w, h));
  });

  it('stays on the loop and handles negative distances', () => {
    for (let u = -130; u < 130; u += 1.7) {
      const p = ringPoint(u, w, h);
      expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x).toBeLessThanOrEqual(w + 1e-9);
      expect(p.z).toBeGreaterThanOrEqual(-1e-9);
      expect(p.z).toBeLessThanOrEqual(h + 1e-9);
      const onEdge = p.x < 1e-9 || p.x > w - 1e-9 || p.z < 1e-9 || p.z > h - 1e-9;
      expect(onEdge).toBe(true);
    }
    expect(ringPoint(-5, w, h)).toMatchObject({ x: 0, z: 5 });
  });

  it('moves continuously: consecutive points are never far apart', () => {
    let prev = ringPoint(0, w, h);
    for (let u = 0.25; u < 120; u += 0.25) {
      const p = ringPoint(u, w, h);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan(0.3);
      prev = p;
    }
  });
});
