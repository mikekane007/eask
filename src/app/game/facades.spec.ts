import { describe, expect, it } from 'vitest';
import { windowLights } from './facades';

describe('windowLights', () => {
  const lights = windowLights(16);

  it('is the same every time', () => {
    expect(windowLights(16)).toEqual(lights);
  });

  it('lights some windows but leaves most of them dark', () => {
    const lit = lights.filter((l) => l !== 'dark').length;
    expect(lit).toBeGreaterThanOrEqual(4);
    expect(lit).toBeLessThanOrEqual(10);
  });

  it('mixes kinds of light, not one colour everywhere', () => {
    const kinds = new Set(lights.filter((l) => l !== 'dark'));
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});
