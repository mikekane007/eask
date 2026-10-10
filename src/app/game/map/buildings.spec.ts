import { describe, expect, it } from 'vitest';
import { type BlockInput, type BlockStyle, type Geo, area2, buildBlocks, isConvex } from './buildings';
import type { Pt } from './geo';

/** A fan triangulation, good enough for the convex and simple shapes used here. */
const fan = (p: Pt[]) => {
  const out: number[] = [];
  for (let i = 1; i < p.length - 1; i++) out.push(0, i, i + 1);
  return out;
};

const square = (s: number, ccw: boolean): Pt[] => {
  const pts: Pt[] = [
    [0, 0],
    [s, 0],
    [s, s],
    [0, s],
  ];
  return ccw ? pts : [...pts].reverse();
};
const L: Pt[] = [
  [0, 0],
  [20, 0],
  [20, 8],
  [8, 8],
  [8, 20],
  [0, 20],
];

const block = (pts: Pt[], over: Partial<BlockInput> = {}): BlockInput => ({
  pts,
  h: 12,
  wall: [0.8, 0.5, 0.4],
  roof: [0.4, 0.4, 0.45],
  shop: [0.2, 0.4, 0.6],
  seed: 0.6,
  ...over,
});
const EUROPE: BlockStyle = { roof: 'hip', pitch: 0.6, groundFloor: 3.6, parapet: 0, chimneys: true, tanks: false };
const ACCRA: BlockStyle = { roof: 'flat', pitch: 0, groundFloor: 3.4, parapet: 0.8, chimneys: false, tanks: true };

/** The geometric normal of each triangle, from its winding. */
function triNormals(g: Geo): [number, number, number, number, number, number][] {
  const out: [number, number, number, number, number, number][] = [];
  for (let t = 0; t < g.i.length; t += 3) {
    const v = [g.i[t], g.i[t + 1], g.i[t + 2]].map((k) => [g.p[k * 3], g.p[k * 3 + 1], g.p[k * 3 + 2]]);
    const e1 = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]];
    const e2 = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const cx = (v[0][0] + v[1][0] + v[2][0]) / 3;
    const cy = (v[0][1] + v[1][1] + v[2][1]) / 3;
    const cz = (v[0][2] + v[1][2] + v[2][2]) / 3;
    out.push([n[0], n[1], n[2], cx, cy, cz]);
  }
  return out;
}

const valid = (g: Geo) => {
  const verts = g.p.length / 3;
  expect(g.n.length).toBe(g.p.length);
  expect(g.c.length).toBe(g.p.length);
  expect(g.u.length).toBe(verts * 2);
  for (const i of g.i) expect(i).toBeLessThan(verts);
  for (const x of [...g.p, ...g.n, ...g.u, ...g.c]) expect(Number.isFinite(x)).toBe(true);
};

describe('shape helpers', () => {
  it('know which way a footprint runs', () => {
    expect(area2(square(10, true))).toBeGreaterThan(0);
    expect(area2(square(10, false))).toBeLessThan(0);
  });
  it('tell convex from concave', () => {
    expect(isConvex(square(10, true))).toBe(true);
    expect(isConvex(L)).toBe(false);
  });
});

describe('buildBlocks', () => {
  for (const ccw of [true, false]) {
    describe(ccw ? 'anticlockwise footprint' : 'clockwise footprint', () => {
      const b = buildBlocks([block(square(10, ccw))], EUROPE, fan);

      it('makes well-formed geometry', () => {
        for (const g of [b.walls, b.shops, b.roofs, b.awnings]) valid(g);
      });

      it('turns every wall and shop front to face out of the building', () => {
        for (const g of [b.walls, b.shops]) {
          expect(g.i.length).toBeGreaterThan(0);
          for (const [nx, , nz, x, , z] of triNormals(g)) {
            // centre of the square is (5, 5): the face normal must point away from it
            expect(nx * (x - 5) + nz * (z - 5)).toBeGreaterThan(0);
          }
        }
      });

      it('turns every roof face up', () => {
        for (const [, ny] of triNormals(b.roofs)) expect(ny).toBeGreaterThan(0);
      });

      it('raises a hipped roof above the walls', () => {
        const ys = b.roofs.p.filter((_, i) => i % 3 === 1);
        expect(Math.min(...ys)).toBeCloseTo(12);
        expect(Math.max(...ys)).toBeGreaterThan(13);
      });

      it('puts shop fronts on the ground floor and the facade above', () => {
        const shopYs = b.shops.p.filter((_, i) => i % 3 === 1);
        expect(Math.max(...shopYs)).toBeCloseTo(3.6);
        const wallYs = b.walls.p.filter((_, i) => i % 3 === 1);
        expect(Math.min(...wallYs)).toBeCloseTo(3.6);
      });
    });
  }

  it('gives an awkward footprint a mansard roof instead of a hipped one', () => {
    const b = buildBlocks([block(L)], EUROPE, fan);
    const ys = b.roofs.p.filter((_, i) => i % 3 === 1);
    expect(Math.max(...ys)).toBeCloseTo(12 + 2.6);
  });

  it('builds plain walls from the ground when there are no shops', () => {
    const b = buildBlocks([block(square(10, true), { shop: null })], EUROPE, fan);
    expect(b.shops.i.length).toBe(0);
    expect(b.awnings.i.length).toBe(0);
    const ys = b.walls.p.filter((_, i) => i % 3 === 1);
    expect(Math.min(...ys)).toBe(0);
  });

  it('darkens the foot of the walls', () => {
    const b = buildBlocks([block(square(10, true), { shop: null })], EUROPE, fan);
    // vertices go bottom, bottom, top, top for each wall quad
    expect(b.walls.c[0]).toBeLessThan(b.walls.c[6]);
  });

  it('gives Accra flat roofs with a parapet and water tanks', () => {
    const b = buildBlocks([block(square(10, true), { seed: 0.3 })], ACCRA, fan);
    const ys = b.roofs.p.filter((_, i) => i % 3 === 1);
    expect(Math.max(...ys)).toBeCloseTo(12.8);
    expect(b.tanks).toHaveLength(1);
    expect(b.chimneys).toHaveLength(0);
    for (const [, ny] of triNormals(b.roofs).filter(([, y]) => Math.abs(y) > 1e-6)) expect(ny).toBeGreaterThan(0);
  });

  it('puts chimneys on some pitched roofs, on the roof', () => {
    const b = buildBlocks([block(square(10, true), { seed: 0.9 })], EUROPE, fan);
    expect(b.chimneys).toHaveLength(1);
    expect(b.chimneys[0][1]).toBeGreaterThan(12);
  });

  it('reports the true top of every building, roof included, in order', () => {
    const b = buildBlocks(
      [
        block(square(10, true)),
        block([
          [0, 0],
          [1, 1],
        ]),
        block(square(8, true), { h: 6 }),
      ],
      EUROPE,
      fan,
    );
    expect(b.tops).toHaveLength(3);
    expect(b.tops[0]).toBeGreaterThan(12);
    expect(b.tops[1]).toBe(0);
    expect(b.tops[2]).toBeGreaterThan(6);
    const flat = buildBlocks([block(square(10, true))], ACCRA, fan);
    expect(flat.tops[0]).toBeGreaterThanOrEqual(12.8);
  });

  it('skips broken footprints', () => {
    const b = buildBlocks(
      [
        block([
          [0, 0],
          [1, 1],
        ]),
        block(square(5, true), { h: 0 }),
      ],
      EUROPE,
      fan,
    );
    expect(b.walls.p.length + b.roofs.p.length).toBe(0);
  });

  it('adds awnings only where there are shops', () => {
    const many = Array.from({ length: 20 }, (_, i) => block(square(12, true), { seed: i / 20 }));
    const b = buildBlocks(many, EUROPE, fan);
    expect(b.awnings.i.length).toBeGreaterThan(0);
    valid(b.awnings);
  });
});
