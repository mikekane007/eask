import { B, OFF, type Side, bC } from './layout';

export interface PlaceOption {
  label: string;
  h?: number;
  word?: number;
  body?: number;
  sleep?: boolean;
  need?: { word: number };
}

export interface Place {
  id: string;
  bi: number;
  bj: number;
  side: Side;
  name?: string;
  color: number;
  h: number;
  open?: [number, number];
  sign: string;
  deco?: boolean;
  opts?: PlaceOption[];
}

export const PLACES: Place[] = [
  {
    id: 'church',
    bi: 2,
    bj: 2,
    side: 'S',
    name: 'Grace Chapel',
    color: 0xf7f3ea,
    h: 8,
    open: [6, 21],
    sign: 'GRACE CHAPEL',
    opts: [
      { label: 'Bible study', h: 2, word: 12, body: -5 },
      { label: 'Evangelism training', h: 3, word: 20, body: -8, need: { word: 20 } },
      { label: 'Prayer meeting', h: 1, body: 10 },
    ],
  },
  {
    id: 'chop',
    bi: 1,
    bj: 1,
    side: 'S',
    name: "Auntie Esi's Chop Bar",
    color: 0xc0392b,
    h: 5,
    open: [6, 23],
    sign: 'CHOP BAR',
    opts: [
      { label: 'Waakye plate', h: 1, body: 25 },
      { label: 'Fufu & light soup', h: 1, body: 40 },
    ],
  },
  {
    id: 'home',
    bi: 0,
    bj: 3,
    side: 'E',
    name: 'Your room',
    color: 0xb9a27a,
    h: 5,
    open: [0, 24],
    sign: 'HOME',
    opts: [{ label: 'Sleep till morning', sleep: true }],
  },
  { id: 'market', bi: 0, bj: 1, side: 'E', deco: true, color: 0xd9822b, h: 6, sign: 'MARKET' },
  { id: 'tech', bi: 3, bj: 3, side: 'N', deco: true, color: 0x1b4f72, h: 14, sign: 'TECH HUB' },
  { id: 'site', bi: 3, bj: 1, side: 'S', deco: true, color: 0x8a8f94, h: 4, sign: 'SITE' },
];

/** Where the gold ring for an interactive place sits on the pavement. */
export function markerPos(L: Place): { x: number; z: number } {
  const off = OFF[L.side];
  return { x: bC(L.bi) + off[0] * (B / 2 + 2.8), z: bC(L.bj) + off[1] * (B / 2 + 2.8) };
}

const home = PLACES.find((p) => p.id === 'home');
if (!home) throw new Error('places.data: the home place is required');
export const HOME: Place = home;
