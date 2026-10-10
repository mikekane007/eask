import { describe, expect, it } from 'vitest';
import { FrameMeter, GRAPHICS, LEVELS, isLevel, lowerLevel } from './graphics';

describe('graphics levels', () => {
  it('get lighter from high to low in every way', () => {
    const [low, med, high] = [GRAPHICS.low, GRAPHICS.medium, GRAPHICS.high];
    for (const key of ['pixelRatio', 'shadowMap', 'rainDrops', 'treeShare', 'vehicles', 'walkers'] as const) {
      expect(low[key], key).toBeLessThan(med[key]);
      expect(med[key], key).toBeLessThanOrEqual(high[key]);
    }
    expect(low.shadows).toBe(false);
    expect(med.shadows).toBe(true);
  });

  it('steps down one level at a time and stops at the bottom', () => {
    expect(lowerLevel('high')).toBe('medium');
    expect(lowerLevel('medium')).toBe('low');
    expect(lowerLevel('low')).toBeNull();
    expect(LEVELS).toEqual(['low', 'medium', 'high']);
  });

  it('recognises valid levels only', () => {
    expect(isLevel('medium')).toBe(true);
    for (const bad of ['ultra', '', null, undefined, 3]) expect(isLevel(bad)).toBe(false);
  });
});

describe('frame meter', () => {
  const opts = { warmup: 2, window: 20, slowMs: 50, slowShare: 0.4 };
  const feed = (m: FrameMeter, ms: number, n: number) => {
    let last: 'ok' | 'slow' = 'ok';
    for (let i = 0; i < n; i++) {
      const r = m.push(ms);
      if (r === 'slow') last = 'slow';
    }
    return last;
  };

  it('stays quiet when frames are on time', () => {
    const m = new FrameMeter(opts);
    expect(feed(m, 33, 400)).toBe('ok');
  });

  it('ignores the warm-up period, however slow', () => {
    const m = new FrameMeter(opts);
    expect(feed(m, 100, 15)).toBe('ok'); // 1.5 s of slow frames, still warming up
  });

  it('says so once the game is struggling after warm-up', () => {
    const m = new FrameMeter(opts);
    feed(m, 33, 70); // 2.3 s fine: warm-up over
    expect(feed(m, 90, 40)).toBe('slow');
  });

  it('is not fooled by a few hiccups', () => {
    const m = new FrameMeter(opts);
    feed(m, 33, 70);
    let slow = 0;
    for (let i = 0; i < 200; i++) if (m.push(i % 10 === 0 ? 120 : 33) === 'slow') slow++;
    expect(slow).toBe(0);
  });

  it('ignores very long frames such as switching tabs', () => {
    const m = new FrameMeter(opts);
    feed(m, 33, 70);
    expect(feed(m, 4000, 50)).toBe('ok');
    expect(m.push(0)).toBe('ok');
    expect(m.push(-5)).toBe('ok');
  });

  it('starts afresh after it has spoken, so it does not repeat itself at once', () => {
    const m = new FrameMeter(opts);
    feed(m, 33, 70);
    expect(feed(m, 90, 40)).toBe('slow');
    expect(feed(m, 90, 5)).toBe('ok'); // warming up again
  });

  it('can be reset when the detail changes', () => {
    const m = new FrameMeter(opts);
    feed(m, 33, 70);
    feed(m, 90, 15);
    m.reset();
    expect(feed(m, 90, 10)).toBe('ok');
  });
});
