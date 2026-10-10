import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CITIES } from '../cities';
import { buildGraph, networks } from './road-graph';
import type { MapData } from './types';

/** Checks on the real map files themselves, so a bad download or a bad refresh is caught before it ships. */
describe.each(CITIES.filter((c) => c.map).map((c) => [c.id, c.map?.url ?? ''] as const))('real map: %s', (_id, url) => {
  const map = JSON.parse(fs.readFileSync(`public/${url}`, 'utf8')) as MapData;

  it('has a drivable street network that is mostly one connected piece', () => {
    const g = buildGraph(map.roads, (r) => r.d === 1);
    const nets = networks(g);
    expect(g.edges.length).toBeGreaterThan(40);
    expect(nets[0].length / g.edges.length).toBeGreaterThan(0.5);
    expect(nets[0].length).toBeGreaterThan(40);
  });

  it('has walkable streets that connect', () => {
    const g = buildGraph(map.roads);
    expect(networks(g)[0].length / g.edges.length).toBeGreaterThan(0.5);
  });

  it('keeps every anchor inside the map', () => {
    const a = map.anchors;
    for (const p of [a.home, a.church, a.chop, ...a.people]) {
      expect(Math.abs(p.x)).toBeLessThan(map.w / 2);
      expect(Math.abs(p.z)).toBeLessThan(map.h / 2);
    }
  });

  it('builds the graph quickly enough to do when a city loads', () => {
    const t0 = performance.now();
    buildGraph(map.roads);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
