export const N = 5, B = 22, R = 10;
export const T = N * B + (N + 1) * R;
export const H = T / 2;
export const bMin = (i: number) => -H + R + i * (B + R);
export const bC = (i: number) => bMin(i) + B / 2;
export const roadC = (k: number) => -H + R / 2 + k * (B + R);

export type Side = 'N' | 'S' | 'E' | 'W';
export const OFF: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
