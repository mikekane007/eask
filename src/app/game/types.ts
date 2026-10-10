import type { Side } from './layout';
import type { Climate } from './weather';

/** Text that may be translated. A plain string is shown as-is in every language; `fr` falls back to `en`. */
export type L10n = string | { en: string; fr?: string };

export type Quality = 'good' | 'ok' | 'bad';

/** [what you say, quality, why that was right or wrong, scripture reference in English (translated on display)] */
export type Answer = [L10n, Quality, L10n, string];

export interface Round {
  q: L10n;
  a: Answer[];
}

export interface Person {
  id: string;
  name: string;
  role: L10n;
  /** Shirt or dress colour. */
  shirt: number;
  /** Word needed before this person can be approached. */
  req: number;
  /** [axis, road index, block, start fraction]: the stretch of street this person paces. */
  spot: ['h' | 'v', number, number, number];
  rounds: Round[];
  female?: boolean;
  /** Skin tone as a hex colour. Defaults to the city's palette. */
  skin?: number;
  hair?: number;
}

export interface PlaceOption {
  label: L10n;
  h?: number;
  word?: number;
  body?: number;
  sleep?: boolean;
  need?: { word: number };
}

export interface Place {
  id: 'church' | 'chop' | 'home' | 'market' | 'tech' | 'site';
  bi: number;
  bj: number;
  side: Side;
  /** Name shown on the panel. */
  name?: L10n;
  /** Short label on the minimap. */
  label: L10n;
  /** Text painted on the building's sign (stays in the city's own language). */
  sign: string;
  deco?: boolean;
  open?: [number, number];
  opts?: PlaceOption[];
}

export interface CityTheme {
  wallColors: number[];
  roof: { kind: 'corrugated' | 'tile'; colors: number[]; pitch: number };
  ground: 'laterite' | 'grass';
  /** Polytanks and satellite dishes on flat roofs. */
  rooftopClutter: boolean;
  palms: boolean;
  /** Utility poles with sagging wires (otherwise plain street lamps). */
  wires: boolean;
  stalls: [string, string][];
  vehicles: { labels: string[]; colors: number[] };
  skins: number[];
  /** Wax-print fabric on clothes. */
  waxPrint: boolean;
}

export interface City {
  id: string;
  /** Country, for grouping on the city picker. */
  country: L10n;
  name: string;
  tagline: L10n;
  /** False while the content is an unreviewed draft. Shown to the player. */
  reviewed: boolean;
  theme: CityTheme;
  /** How often each kind of weather happens here. */
  climate: Climate;
  places: Place[];
  people: Person[];
}
