import type { Side } from './layout';
import type { Climate } from './weather';

/** Text that may be translated. A plain string is shown as-is in every language; `fr` falls back to `en`. */
export type L10n = string | { en: string; fr?: string };

export type Quality = 'good' | 'ok' | 'bad';

/** [what you say, quality, why that was right or wrong, scripture reference in English (translated on display)] */
export type Answer = [L10n, Quality, L10n, string];

/** One thing a good reply says. Any one of the words (or the start of a word) in either language counts. */
export interface Idea {
  en: string[];
  fr: string[];
}

/** How a typed reply is judged: by the ideas it contains, not by exact wording. */
export interface Typed {
  ideas: Idea[];
  /** How many ideas make a wise reply. Defaults to two (or all of them when there are fewer). */
  need?: number;
}

export interface Round {
  q: L10n;
  a: Answer[];
  /** When set, this round must be answered by typing; the three answers then give the feedback and the wiser reply. */
  typed?: Typed;
}

/**
 * What kind of meeting this is. `talk` (the default) shares the gospel. `refuse` is someone who will say no
 * whatever you answer: the point is to stay gracious and leave the door open. `care` is about a practical need
 * rather than the gospel: checking up on someone, food, money, or passing it on to the church.
 */
type PersonKind = 'talk' | 'refuse' | 'care';

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
  kind?: PersonKind;
  /** Reached by phone from home instead of on the street. Phone people come last in a city's list. */
  phone?: boolean;
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
  /** Phones this person (by id) instead of using the place. */
  call?: string;
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
  /** How buildings on the real street map look. */
  blocks: {
    facade: 'brick' | 'stone' | 'plaster';
    roof: 'hip' | 'mansard' | 'flat';
    surface: 'tiles' | 'zinc' | 'concrete';
    /** Share of buildings with shops on the ground floor, 0..1. */
    shopShare: number;
  };
  ground: 'laterite' | 'grass';
  /** Polytanks and satellite dishes on flat roofs. */
  rooftopClutter: boolean;
  palms: boolean;
  /** Utility poles with sagging wires (otherwise plain street lamps). */
  wires: boolean;
  stalls: [string, string][];
  vehicles: { labels: string[]; colors: number[]; busShare: number };
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
  /** Kept in the game (and its saves) but not offered on the city picker. */
  hidden?: boolean;
  theme: CityTheme;
  /** How often each kind of weather happens here. */
  climate: Climate;
  places: Place[];
  people: Person[];
  /** A real street map (OpenStreetMap) for this city. Without one, the city uses the built-in street grid. */
  map?: { url: string };
  /** Famous buildings drawn at their real position on the street map (left out if outside the mapped area). */
  landmarks?: Landmark3d[];
}

export interface Landmark3d {
  kind: 'belfry' | 'column' | 'dome';
  lat: number;
  lon: number;
  /** Height in metres. */
  h: number;
  /** Main colour of the stone or brick. */
  color: number;
}
