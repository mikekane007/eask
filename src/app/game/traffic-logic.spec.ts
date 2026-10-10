import { describe, expect, it } from 'vitest';
import {
  SIGNAL_CYCLE,
  approach,
  desiredSpeed,
  gapAhead,
  mustStop,
  signalAt,
  signalOffset,
  stopSpeed,
  trafficDensity,
} from './traffic-logic';

describe('traffic signals', () => {
  it('never shows green to both directions at once', () => {
    for (let t = 0; t < SIGNAL_CYCLE * 3; t += 0.25) {
      const s = signalAt(t, 0);
      expect(s.h === 'green' && s.v === 'green').toBe(false);
      expect(s.h === 'amber' && s.v !== 'red').toBe(false);
    }
  });

  it('gives each direction a turn, with an all-red gap between them', () => {
    expect(signalAt(1, 0)).toEqual({ h: 'green', v: 'red' });
    expect(signalAt(11.5, 0)).toEqual({ h: 'red', v: 'red' });
    expect(signalAt(15, 0)).toEqual({ h: 'red', v: 'green' });
    expect(signalAt(23.5, 0)).toEqual({ h: 'red', v: 'red' });
  });

  it('repeats every cycle and handles negative times', () => {
    expect(signalAt(5, 0)).toEqual(signalAt(5 + SIGNAL_CYCLE, 0));
    expect(signalAt(-1, 0)).toEqual(signalAt(SIGNAL_CYCLE - 1, 0));
  });

  it('staggers neighbouring intersections', () => {
    const offsets = new Set<number>();
    for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) offsets.add(signalOffset(i, j));
    expect(offsets.size).toBeGreaterThan(5);
    expect(signalOffset(0, 0)).toBe(0);
  });
});

describe('traffic density', () => {
  it('is busy at rush hour, quiet at night and in between at midday', () => {
    expect(trafficDensity(8)).toBeGreaterThan(0.85);
    expect(trafficDensity(17.5)).toBeGreaterThan(0.85);
    expect(trafficDensity(3)).toBeLessThan(0.3);
    expect(trafficDensity(13)).toBeGreaterThan(trafficDensity(3));
    expect(trafficDensity(13)).toBeLessThan(trafficDensity(8));
  });

  it('stays between 0 and 1 for every hour, including wrapped ones', () => {
    for (let h = -5; h < 50; h += 0.5) {
      const d = trafficDensity(h);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(1);
    }
    expect(trafficDensity(25)).toBeCloseTo(trafficDensity(1));
  });
});

describe('braking', () => {
  it('computes the speed from which a vehicle can still stop', () => {
    expect(stopSpeed(0, 7)).toBe(0);
    expect(stopSpeed(-2, 7)).toBe(0);
    // v^2 = 2 a d  ->  v = sqrt(2 * 8 * 4) = 8
    expect(stopSpeed(4, 8)).toBeCloseTo(8);
    expect(stopSpeed(100, 8)).toBeGreaterThan(stopSpeed(10, 8));
  });

  it('stops for red, goes through green, and decides on amber by braking distance', () => {
    expect(mustStop('green', 1, 10, 7)).toBe(false);
    expect(mustStop('red', 100, 10, 7)).toBe(true);
    // At 10 m/s with 7 m/s^2 braking the car needs about 7.1 m.
    expect(mustStop('amber', 20, 10, 7)).toBe(true);
    expect(mustStop('amber', 3, 10, 7)).toBe(false);
  });

  it('caps speed by the nearest thing that must be stopped for', () => {
    const base = { vmax: 12, decel: 7 };
    expect(desiredSpeed({ ...base, stopDistance: null, obstacleGap: null })).toBe(12);
    expect(desiredSpeed({ ...base, stopDistance: 0, obstacleGap: null })).toBe(0);
    expect(desiredSpeed({ ...base, stopDistance: 200, obstacleGap: 2 })).toBeLessThan(6);
    expect(desiredSpeed({ ...base, stopDistance: 1, obstacleGap: 50 })).toBeLessThan(5);
  });

  it('accelerates gently and brakes hard without overshooting', () => {
    expect(approach(0, 10, 1, 4, 7)).toBe(4);
    expect(approach(10, 0, 1, 4, 7)).toBe(3);
    expect(approach(9.5, 10, 1, 4, 7)).toBe(10);
    expect(approach(2, 0, 1, 4, 7)).toBe(0);
  });

  it('can bring a moving vehicle to rest before a stop line by following the cap each frame', () => {
    let pos = 0;
    let v = 12;
    const line = 40;
    const STOP_MARGIN = 1; // aim a little short, as the real traffic does
    for (let i = 0; i < 2000; i++) {
      const target = desiredSpeed({ vmax: 12, stopDistance: line - STOP_MARGIN - pos, obstacleGap: null, decel: 7 });
      v = approach(v, target, 1 / 30, 4, 7);
      pos += v / 30;
    }
    expect(pos).toBeLessThanOrEqual(line);
    expect(pos).toBeGreaterThan(line - 3);
    expect(v).toBeLessThan(0.2);
  });
});

describe('looking ahead', () => {
  const me = { x: 0, z: 0, dx: 1, dz: 0, len: 4 };

  it('sees nothing on a clear road', () => {
    expect(gapAhead(me, [])).toBeNull();
    expect(gapAhead(me, [{ x: -10, z: 0, len: 4 }])).toBeNull(); // behind
    expect(gapAhead(me, [{ x: 10, z: 8, len: 4 }])).toBeNull(); // in another lane well to the side
    expect(gapAhead(me, [{ x: 60, z: 0, len: 4 }])).toBeNull(); // too far away to matter
  });

  it('measures the free space to the vehicle in front, bumper to bumper', () => {
    // centres 12 m apart, each 4 m long: 12 - 4 - 1.2 margin
    expect(gapAhead(me, [{ x: 12, z: 0, len: 4 }])).toBeCloseTo(6.8);
  });

  it('picks the nearest of several', () => {
    const g = gapAhead(me, [
      { x: 20, z: 0, len: 4 },
      { x: 9, z: 0.5, len: 4 },
    ]);
    expect(g).toBeCloseTo(3.8);
  });

  it('works in any direction of travel, not just along an axis', () => {
    const diag = { x: 0, z: 0, dx: Math.SQRT1_2, dz: Math.SQRT1_2, len: 4 };
    expect(gapAhead(diag, [{ x: 10, z: 10, len: 4 }])).toBeCloseTo(Math.hypot(10, 10) - 4 - 1.2);
    expect(gapAhead(diag, [{ x: 10, z: -10, len: 4 }])).toBeNull();
  });

  it('notices someone stepping across the road ahead, but not someone on the pavement', () => {
    expect(gapAhead(me, [{ x: 8, z: 1.5, len: 1 }])).not.toBeNull();
    expect(gapAhead(me, [{ x: 8, z: 4, len: 1 }])).toBeNull();
  });

  it('can report a negative gap when something is already too close', () => {
    expect(gapAhead(me, [{ x: 3, z: 0, len: 4 }])).toBeLessThan(0);
  });
});
