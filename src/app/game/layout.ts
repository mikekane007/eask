export const N = 5;
export const B = 22;
const R = 10;
export const T = N * B + (N + 1) * R;
export const H = T / 2;
export const bMin = (i: number) => -H + R + i * (B + R);
export const bC = (i: number) => bMin(i) + B / 2;
export const roadC = (k: number) => -H + R / 2 + k * (B + R);

export type Side = 'N' | 'S' | 'E' | 'W';
export const OFF: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

/** Where the gold ring for an interactive place sits on the pavement outside it. */
export function markerPos(L: { bi: number; bj: number; side: Side }): { x: number; z: number } {
  const off = OFF[L.side];
  return { x: bC(L.bi) + off[0] * (B / 2 + 2.8), z: bC(L.bj) + off[1] * (B / 2 + 2.8) };
}
