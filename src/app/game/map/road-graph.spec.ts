import { describe, expect, it } from 'vitest';
import { buildGraph, directionFrom, nextEdge, otherEnd, pointOnEdge, speedFor } from './road-graph';
import { rng } from './anchors';
import type { MapRoad } from './types';

const road = (pts: number[], k = 'residential', d: 0 | 1 = 1, w = 6): MapRoad => ({ k, w, d, n: '', p: pts });

describe('road graph', () => {
  it('makes a four-way junction where two streets share a point', () => {
    const g = buildGraph([road([-50, 0, 0, 0, 50, 0]), road([0, -50, 0, 0, 0, 50])]);
    const centre = g.nodes.find((n) => Math.abs(n.x) < 0.1 && Math.abs(n.z) < 0.1);
    expect(centre?.edges).toHaveLength(4);
    expect(g.edges).toHaveLength(4);
  });

  it('joins a street that ends against the side of another, even with no shared point', () => {
    // a long street with no vertex at x = 10, and a side street ending 0.4 m from it
    const g = buildGraph([road([-50, 0, 50, 0]), road([10, 40, 10, 0.4])]);
    const junction = g.nodes.filter((n) => n.edges.length === 3);
    expect(junction).toHaveLength(1);
    expect(junction[0].x).toBeCloseTo(10, 0);
  });

  it('does not join streets that merely cross without a shared point (bridges)', () => {
    const g = buildGraph([road([-50, 0, 50, 0]), road([0, -50, 0, 50])]);
    expect(g.nodes.every((n) => n.edges.length <= 1)).toBe(true);
  });

  it('keeps separate streets separate', () => {
    const g = buildGraph([road([0, 0, 10, 0]), road([0, 100, 10, 100])]);
    expect(g.nodes).toHaveLength(4);
    expect(g.edges).toHaveLength(2);
  });

  it('can include only the streets cars can use', () => {
    const g = buildGraph([road([0, 0, 50, 0]), road([0, 5, 50, 5], 'footway', 0, 2.5)], (r) => r.d === 1);
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].drive).toBe(true);
  });

  it('records length, unit direction and street kind', () => {
    const g = buildGraph([road([0, 0, 30, 40], 'tertiary')]);
    const e = g.edges[0];
    expect(e.len).toBeCloseTo(50);
    expect(e.dx).toBeCloseTo(0.6);
    expect(e.dz).toBeCloseTo(0.8);
    expect(e.kind).toBe('tertiary');
  });

  it('ignores zero-length pieces and duplicates', () => {
    const g = buildGraph([road([0, 0, 0, 0, 20, 0]), road([0, 0, 20, 0])]);
    expect(g.edges).toHaveLength(1);
  });

  it('reads direction from either end', () => {
    const g = buildGraph([road([0, 0, 10, 0])]);
    const e = g.edges[0];
    expect(directionFrom(e, e.a)).toEqual({ dx: e.dx, dz: e.dz });
    expect(directionFrom(e, e.b)).toEqual({ dx: -e.dx, dz: -e.dz });
    expect(otherEnd(e, e.a)).toBe(e.b);
    expect(otherEnd(e, e.b)).toBe(e.a);
  });

  it('places a point at a distance along an edge', () => {
    const g = buildGraph([road([0, 0, 40, 0])]);
    const e = g.edges[0];
    const p = pointOnEdge(g, e, e.a, 15);
    expect(p.x).toBeCloseTo(e.a === 0 ? 15 : 25);
    expect(p.dz).toBe(0);
  });
});

describe('choosing where to go next', () => {
  const cross = buildGraph([road([-50, 0, 0, 0, 50, 0]), road([0, -50, 0, 0, 0, 50])]);

  it('never turns straight back at a junction', () => {
    const rand = rng(3);
    const into = cross.edges.find((e) => cross.nodes[e.b].edges.length === 4);
    if (!into) throw new Error('no edge into the junction');
    for (let i = 0; i < 300; i++) {
      const n = nextEdge(cross, into, into.b, rand);
      expect(n.id).not.toBe(into.id);
    }
  });

  it('mostly goes straight on but sometimes turns', () => {
    const rand = rng(11);
    const into = cross.edges.find((e) => e.dz === 0 && cross.nodes[e.b].edges.length === 4 && e.dx > 0);
    if (!into) throw new Error('no edge');
    let straight = 0;
    const turns = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const n = nextEdge(cross, into, into.b, rand);
      turns.add(n.id);
      if (n.dz === 0) straight++;
    }
    expect(straight).toBeGreaterThan(450);
    expect(turns.size).toBe(3);
  });

  it('turns round at a dead end', () => {
    const g = buildGraph([road([0, 0, 30, 0])]);
    const e = g.edges[0];
    expect(nextEdge(g, e, e.b, rng(1)).id).toBe(e.id);
  });

  it('keeps going along a plain street', () => {
    const g = buildGraph([road([0, 0, 20, 0, 40, 5])]);
    const first = g.edges.find((e) => e.dz === 0);
    if (!first) throw new Error('no edge');
    const n = nextEdge(g, first, first.b, rng(1));
    expect(n.id).not.toBe(first.id);
  });

  it('can wander a whole map without ever getting stuck', () => {
    const g = buildGraph([
      road([-60, 0, 60, 0]),
      road([-30, -60, -30, 60]),
      road([30, -60, 30, 60]),
      road([-60, 40, 60, 40]),
    ]);
    const rand = rng(5);
    let edge = g.edges[0];
    let from = edge.a;
    for (let i = 0; i < 5000; i++) {
      const at = otherEnd(edge, from);
      const next = nextEdge(g, edge, at, rand);
      from = next.a === at ? next.a : next.b;
      edge = next;
      expect(edge).toBeDefined();
    }
  });
});

describe('speeds', () => {
  it('are faster on main streets than in living streets', () => {
    expect(speedFor('primary')).toBeGreaterThan(speedFor('residential'));
    expect(speedFor('residential')).toBeGreaterThan(speedFor('living_street'));
    expect(speedFor('something-new')).toBeGreaterThan(0);
  });
});
