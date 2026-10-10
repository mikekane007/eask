import { describe, expect, it } from 'vitest';
import { CITIES } from './cities';
import { npcLook } from './npc-look';

describe('npcLook', () => {
  it('is the same every time for the same person', () => {
    for (const city of CITIES)
      city.people.forEach((p, n) => {
        expect(npcLook(p, n, city.theme)).toEqual(npcLook(p, n, city.theme));
      });
  });

  it('gives men short hair or an afro, and women long hair, a bun or an afro', () => {
    for (const city of CITIES)
      city.people.forEach((p, n) => {
        const l = npcLook(p, n, city.theme);
        expect(l.female ? ['long', 'bun', 'afro'] : ['short', 'afro']).toContain(l.style);
      });
  });

  it('puts scarves on some people in France and none in Accra', () => {
    const scarves = (id: string) => {
      const city = CITIES.find((c) => c.id === id);
      return city ? city.people.filter((p, n) => npcLook(p, n, city.theme).scarf !== null).length : -1;
    };
    expect(scarves('accra')).toBe(0);
    expect(scarves('lille')).toBeGreaterThan(0);
  });

  it("uses the person's own skin when the content gives one, else the city's", () => {
    const lille = CITIES.find((c) => c.id === 'lille');
    if (!lille) throw new Error('no Lille');
    lille.people.forEach((p, n) => {
      const l = npcLook(p, n, lille.theme);
      expect(l.skin).toBe(p.skin ?? lille.theme.skins[n % lille.theme.skins.length]);
    });
  });
});
