import { distToSegment, pointInPolygon, toPoints, type Pt } from './geo';
import type { MapBuilding } from './types';

const CELL = 20; // metres

interface Footprint {
  pts: Pt[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Tells the player where they cannot walk on a real map: inside or touching a building, or off the edge.
 * Buildings are kept in a grid of 20 m cells so each check only looks at the few buildings that are close.
 */
export class MapCollision {
  private readonly cells = new Map<number, Footprint[]>();
  private readonly halfW: number;
  private readonly halfH: number;

  constructor(
    buildings: readonly MapBuilding[],
    width: number,
    height: number,
    /** Extra solid areas such as water, as flat point arrays. */
    solids: readonly (readonly number[])[] = [],
  ) {
    this.halfW = width / 2;
    this.halfH = height / 2;
    for (const flat of [...buildings.map((b) => b.p), ...solids]) {
      const pts = toPoints(flat);
      if (pts.length < 3) continue;
      const fp: Footprint = {
        pts,
        minX: Math.min(...pts.map((p) => p[0])),
        maxX: Math.max(...pts.map((p) => p[0])),
        minZ: Math.min(...pts.map((p) => p[1])),
        maxZ: Math.max(...pts.map((p) => p[1])),
      };
      for (let cx = Math.floor(fp.minX / CELL); cx <= Math.floor(fp.maxX / CELL); cx++) {
        for (let cz = Math.floor(fp.minZ / CELL); cz <= Math.floor(fp.maxZ / CELL); cz++) {
          const key = MapCollision.key(cx, cz);
          const list = this.cells.get(key);
          if (list) list.push(fp);
          else this.cells.set(key, [fp]);
        }
      }
    }
  }

  private static key(cx: number, cz: number): number {
    return (cx + 5000) * 10000 + (cz + 5000);
  }

  /** True if a circle of radius `r` centred on (x, z) overlaps a building or leaves the map. */
  blocked(x: number, z: number, r: number): boolean {
    if (Math.abs(x) > this.halfW - r || Math.abs(z) > this.halfH - r) return true;
    const seen = new Set<Footprint>();
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
        const list = this.cells.get(MapCollision.key(cx, cz));
        if (!list) continue;
        for (const fp of list) {
          if (seen.has(fp)) continue;
          seen.add(fp);
          if (x < fp.minX - r || x > fp.maxX + r || z < fp.minZ - r || z > fp.maxZ + r) continue;
          if (pointInPolygon(x, z, fp.pts)) return true;
          for (let i = 0, j = fp.pts.length - 1; i < fp.pts.length; j = i++) {
            if (distToSegment([x, z], fp.pts[j], fp.pts[i]) < r) return true;
          }
        }
      }
    }
    return false;
  }
}
