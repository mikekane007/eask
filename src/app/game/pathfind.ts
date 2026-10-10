/** Finds a walkable route for autopilot. Pure logic: it only asks "is this spot blocked?", so it works on any map. */

export interface Pt {
  x: number;
  z: number;
}

export type BlockedFn = (x: number, z: number) => boolean;

export interface PathOptions {
  /** Size of a search square in metres. */
  cell?: number;
  /** The route may end this close to the goal (the goal itself is often inside a doorway ring or a wall). */
  reach?: number;
  /** How far beyond the start and goal the search may wander. */
  margin?: number;
  /** Gives up after looking at this many squares, so a hopeless search cannot freeze the game. */
  maxNodes?: number;
}

const DEFAULTS: Required<PathOptions> = { cell: 2, reach: 3, margin: 60, maxNodes: 30000 };

/** True if a straight walk from a to b touches nothing blocked. */
export function clearLine(blocked: BlockedFn, a: Pt, b: Pt, step = 1): boolean {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(d / step));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

/** Binary min-heap on a numeric priority. */
class Heap {
  private readonly items: { k: number; p: number }[] = [];
  get size(): number {
    return this.items.length;
  }
  push(k: number, p: number): void {
    const a = this.items;
    a.push({ k, p });
    let i = a.length - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (a[up].p <= a[i].p) break;
      [a[up], a[i]] = [a[i], a[up]];
      i = up;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0].k;
    const last = a.pop();
    if (a.length && last) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].p < a[m].p) m = l;
        if (r < a.length && a[r].p < a[m].p) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

const STEPS: readonly [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/**
 * A route from `from` to within `reach` of `goal`, as waypoints to walk through in order (the start is not included).
 * Returns null if there is no way, or the search was too large. An empty list means you are already there.
 */
export function findPath(blocked: BlockedFn, from: Pt, goal: Pt, options: PathOptions = {}): Pt[] | null {
  const o = { ...DEFAULTS, ...options };
  if (Math.hypot(goal.x - from.x, goal.z - from.z) <= o.reach) return [];

  const minX = Math.min(from.x, goal.x) - o.margin;
  const minZ = Math.min(from.z, goal.z) - o.margin;
  const cols = Math.ceil((Math.max(from.x, goal.x) + o.margin - minX) / o.cell) + 1;
  const rows = Math.ceil((Math.max(from.z, goal.z) + o.margin - minZ) / o.cell) + 1;
  const toX = (c: number) => minX + c * o.cell;
  const toZ = (r: number) => minZ + r * o.cell;
  const colOf = (x: number) => Math.round((x - minX) / o.cell);
  const rowOf = (z: number) => Math.round((z - minZ) / o.cell);
  const id = (c: number, r: number) => r * cols + c;
  const dist = (c: number, r: number) => Math.hypot(toX(c) - goal.x, toZ(r) - goal.z);

  const g = new Map<number, number>();
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const open = new Heap();
  const start = id(colOf(from.x), rowOf(from.z));
  g.set(start, 0);
  open.push(start, dist(colOf(from.x), rowOf(from.z)));

  let found = -1;
  let looked = 0;
  while (open.size) {
    const cur = open.pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    if (++looked > o.maxNodes) return null;
    const c = cur % cols;
    const r = (cur - c) / cols;
    if (dist(c, r) <= o.reach) {
      found = cur;
      break;
    }
    const base = g.get(cur) ?? 0;
    for (const [dc, dr, w] of STEPS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const n = id(nc, nr);
      if (closed.has(n) || blocked(toX(nc), toZ(nr))) continue;
      // Do not cut a corner between two blocked squares.
      if (dc && dr && (blocked(toX(c + dc), toZ(r)) || blocked(toX(c), toZ(r + dr)))) continue;
      const cost = base + w * o.cell;
      if (cost < (g.get(n) ?? Infinity)) {
        g.set(n, cost);
        parent.set(n, cur);
        open.push(n, cost + dist(nc, nr));
      }
    }
  }
  if (found < 0) return null;

  const raw: Pt[] = [];
  for (let n: number | undefined = found; n !== undefined && n !== start; n = parent.get(n)) {
    const c = n % cols;
    raw.push({ x: toX(c), z: toZ((n - c) / cols) });
  }
  raw.reverse();
  return smooth(blocked, from, raw);
}

/** Drops waypoints that a straight, clear walk can skip, so the character does not zig-zag along grid squares. */
function smooth(blocked: BlockedFn, from: Pt, route: Pt[]): Pt[] {
  const out: Pt[] = [];
  let at = from;
  let i = 0;
  while (i < route.length) {
    let far = i;
    for (let j = route.length - 1; j > i; j--) {
      if (clearLine(blocked, at, route[j])) {
        far = j;
        break;
      }
    }
    out.push(route[far]);
    at = route[far];
    i = far + 1;
  }
  return out;
}
