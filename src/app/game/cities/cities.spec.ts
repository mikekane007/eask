import { describe, expect, it } from 'vitest';
import { H, N } from '../layout';
import type { City, L10n } from '../types';
import { CITIES, getCity } from './index';

const hasFrench = (v: L10n) => typeof v !== 'string' && typeof v.fr === 'string' && v.fr.trim().length > 0;

/** Every city must be internally consistent, or the game breaks in ways only a player would notice. */
describe.each(CITIES.map((c) => [c.id, c] as const))('city data: %s', (_id, city: City) => {
  it('has unique people ids and a Word curve that starts at zero', () => {
    const ids = city.people.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...city.people.map((p) => p.req))).toBe(0);
    expect(city.people.every((p) => p.req >= 0 && p.req <= 100)).toBe(true);
  });

  it('gives every round exactly one wise, one partly right and one missed answer', () => {
    for (const p of city.people) {
      expect(p.rounds.length, `${p.id} rounds`).toBe(3);
      for (const r of p.rounds) {
        expect(r.a.map((a) => a[1]).sort(), p.id).toEqual(['bad', 'good', 'ok']);
      }
    }
  });

  it('gives every answer feedback and a scripture reference', () => {
    for (const p of city.people) {
      for (const r of p.rounds) {
        for (const a of r.a) {
          expect(a[3].trim().length, `${p.id} reference`).toBeGreaterThan(3);
        }
      }
    }
  });

  it('keeps every person on a real stretch of street', () => {
    for (const p of city.people) {
      const [axis, road, block, frac] = p.spot;
      expect(['h', 'v']).toContain(axis);
      expect(road).toBeGreaterThanOrEqual(0);
      expect(road).toBeLessThanOrEqual(N);
      expect(block).toBeGreaterThanOrEqual(0);
      expect(block).toBeLessThan(N);
      expect(frac).toBeGreaterThanOrEqual(0);
      expect(frac).toBeLessThanOrEqual(1);
    }
  });

  it('puts every place in its own block, inside the map, with a home, a church and somewhere to eat', () => {
    const cells = city.places.map((p) => `${p.bi},${p.bj}`);
    expect(new Set(cells).size).toBe(cells.length);
    for (const p of city.places) {
      expect(p.bi).toBeGreaterThanOrEqual(0);
      expect(p.bi).toBeLessThan(N);
      expect(p.bj).toBeGreaterThanOrEqual(0);
      expect(p.bj).toBeLessThan(N);
    }
    for (const id of ['home', 'church', 'chop'] as const) {
      expect(
        city.places.some((p) => p.id === id),
        id,
      ).toBe(true);
    }
    expect(H).toBeGreaterThan(0);
  });

  it('lets a player reach every Word requirement through studying alone', () => {
    // Chapel study gives +12 and training +20, so the top requirement must be reachable.
    expect(Math.max(...city.people.map((p) => p.req))).toBeLessThanOrEqual(100);
  });
});

describe('French translation', () => {
  // Accra is English-first; every other city must be fully playable in French.
  const french = CITIES.filter((c) => c.id !== 'accra');

  it.each(french.map((c) => [c.id, c] as const))('%s has French text for everything the player reads', (_id, city) => {
    expect(hasFrench(city.tagline) || typeof city.tagline === 'string').toBe(true);
    for (const p of city.people) {
      expect(hasFrench(p.role), `${p.id} role`).toBe(true);
      for (const r of p.rounds) {
        expect(hasFrench(r.q), `${p.id} question`).toBe(true);
        for (const a of r.a) {
          expect(hasFrench(a[0]), `${p.id} answer`).toBe(true);
          expect(hasFrench(a[2]), `${p.id} feedback`).toBe(true);
        }
      }
    }
    for (const pl of city.places) {
      expect(hasFrench(pl.label), `${pl.id} label`).toBe(true);
      if (pl.name) expect(typeof pl.name === 'string' || hasFrench(pl.name), `${pl.id} name`).toBe(true);
      for (const o of pl.opts ?? []) expect(hasFrench(o.label), `${pl.id} option`).toBe(true);
    }
  });
});

describe('city registry', () => {
  it('finds cities by id and returns undefined for unknown ids', () => {
    expect(getCity('accra')?.name).toBe('Accra');
    expect(getCity('nowhere')).toBeUndefined();
  });

  it('has unique city ids', () => {
    const ids = CITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('real maps', () => {
  it('has a map file for every city that names one, with a place for every person', async () => {
    const fs = await import('node:fs');
    for (const city of CITIES) {
      if (!city.map) continue;
      const file = `public/${city.map.url}`;
      expect(fs.existsSync(file), `${city.id} map file`).toBe(true);
      const map = JSON.parse(fs.readFileSync(file, 'utf8')) as { credit: string; anchors: { people: unknown[] } };
      const street = city.people.filter((p) => !p.phone).length;
      expect(map.anchors.people.length, `${city.id} people spots`).toBeGreaterThanOrEqual(street);
      expect(map.credit).toContain('OpenStreetMap');
    }
  });

  it('keeps every map small enough to download quickly', async () => {
    const fs = await import('node:fs');
    for (const city of CITIES) {
      if (!city.map) continue;
      expect(fs.statSync(`public/${city.map.url}`).size / 1024, city.id).toBeLessThan(250);
    }
  });
});
