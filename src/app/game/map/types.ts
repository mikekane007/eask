/** The compact real-map format written by tools/osm/build-map.mjs and read by the game. Distances are metres. */

export interface MapRoad {
  /** OpenStreetMap highway kind, e.g. "residential" or "pedestrian". */
  k: string;
  /** Width in metres. */
  w: number;
  /** 1 if cars can use it. */
  d: 0 | 1;
  /** Street name, if known. */
  n: string;
  /** Flat [x0, z0, x1, z1, ...]. x is east, z is south. */
  p: number[];
}

export interface MapBuilding {
  /** Height in metres. */
  h: number;
  /** Footprint area in square metres. */
  a: number;
  /** Footprint, flat [x0, z0, x1, z1, ...], not closed. */
  p: number[];
}

/** A place on the street where the player or a person can stand. */
export interface Spot {
  x: number;
  z: number;
  /** Direction of the street here, as atan2(dx, dz). */
  a: number;
}

/** Where a named person paces: a short straight stretch of street. */
export interface PatrolSpot extends Spot {
  /** Segment end points [x0, z0, x1, z1]. */
  seg: [number, number, number, number];
}

/** A landmark building: its middle, and the index of the footprint that is drawn as the landmark (if any). */
export interface Landmark {
  x: number;
  z: number;
  /** Index into `buildings`. */
  b: number;
}

export interface Anchors {
  /** Gold-ring positions for the places you can enter. */
  home: Spot;
  church: Spot;
  chop: Spot;
  /** Buildings that carry each place's sign, so the street shows where things are. */
  landmarks: Record<'home' | 'church' | 'chop' | 'market' | 'tech' | 'site', Landmark>;
  people: PatrolSpot[];
}

export interface MapData {
  name: string;
  credit: string;
  origin: { lat: number; lon: number };
  /** Width and height of the area in metres; the map is centred on (0, 0). */
  w: number;
  h: number;
  roads: MapRoad[];
  buildings: MapBuilding[];
  parks: number[][];
  water: number[][];
  anchors: Anchors;
}
