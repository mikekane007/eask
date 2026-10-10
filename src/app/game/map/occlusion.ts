/** Whether buildings hide the player from the camera. Pure logic, so it is cheap and tested without WebGL. */

export interface P3 {
  x: number;
  y: number;
  z: number;
}

/**
 * True if any building rises above the line from the player (`eye`) to the camera, checked every `step` metres.
 * `heightAt` gives the height of the building standing at a spot, or 0 in the open.
 * The first couple of metres are skipped so the wall the player is leaning on does not count.
 */
export function sightBlocked(heightAt: (x: number, z: number) => number, eye: P3, cam: P3, step = 1): boolean {
  const dx = cam.x - eye.x;
  const dy = cam.y - eye.y;
  const dz = cam.z - eye.z;
  const flat = Math.hypot(dx, dz);
  if (flat < 1e-6) return false;
  const n = Math.ceil(flat / step);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (t * flat < 1.5) continue;
    const y = eye.y + dy * t;
    if (heightAt(eye.x + dx * t, eye.z + dz * t) > y) return true;
  }
  return false;
}

/** Moves `current` towards `target` at `speed` per second. */
export function easeTo(current: number, target: number, dt: number, speed: number): number {
  const step = speed * dt;
  return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
}

/** Eases the see-through hole towards open (`want` true) or closed, at `speed` per second. Returns the new size 0..1. */
export function easeOpen(current: number, want: boolean, dt: number, speed = 4): number {
  return easeTo(current, want ? 1 : 0, dt, speed);
}

/**
 * The least the camera has to tilt up (0 = its usual angle, 1 = from high above) to see the player past the
 * buildings. `camAt` gives the camera's spot for a tilt. Rising only as far as needed keeps the street in view;
 * if even the highest spot is hidden, the answer is 1 and the see-through hole does the rest.
 */
export function leastTilt(
  heightAt: (x: number, z: number) => number,
  eye: P3,
  camAt: (tilt: number) => P3,
  steps = 5,
): number {
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    if (!sightBlocked(heightAt, eye, camAt(t))) return t;
  }
  return 1;
}

/**
 * A low camera spot for watching a conversation at `mid`: `dist` metres away at height `y`, from the direction
 * nearest the angle `prefer` (radians, 0 = +z) that stands in the open and sees the pair. Looking along the
 * street usually works where looking across it cannot. Null if every direction is shut in.
 */
export function talkShot(
  heightAt: (x: number, z: number) => number,
  mid: { x: number; z: number },
  prefer: number,
  dists: readonly number[] = [11, 9.5],
  y = 3.5,
): P3 | null {
  const eye = { x: mid.x, y: 1.6, z: mid.z };
  for (const step of [0, 1, -1, 2, -2, 3, -3, 4])
    for (const d of dists) {
      const a = prefer + (step * Math.PI) / 4;
      const cam = { x: mid.x + Math.sin(a) * d, y, z: mid.z + Math.cos(a) * d };
      if (heightAt(cam.x, cam.z) + 1 < y && !sightBlocked(heightAt, eye, cam)) return cam;
    }
  return null;
}

/**
 * Where the camera may stand: its usual spot (`ideal`), or, if that is inside a building, the first spot on the way
 * in towards the player that is in the open. If every spot on the way is inside, the camera rises above the roofs.
 */
export function cameraSpot(heightAt: (x: number, z: number) => number, player: P3, ideal: P3, clearance = 1.5): P3 {
  const inside = (q: P3) => heightAt(q.x, q.z) + clearance > q.y;
  const at = (f: number): P3 => ({
    x: player.x + (ideal.x - player.x) * f,
    y: player.y + (ideal.y - player.y) * f,
    z: player.z + (ideal.z - player.z) * f,
  });
  for (let f = 1; f >= 0.3; f -= 0.05) {
    const q = at(f);
    if (!inside(q)) return q;
  }
  return { ...ideal, y: Math.max(ideal.y, heightAt(ideal.x, ideal.z) + clearance + 2) };
}
