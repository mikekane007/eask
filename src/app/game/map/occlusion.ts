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

/** Eases the see-through hole towards open (`want` true) or closed, at `speed` per second. Returns the new size 0..1. */
export function easeOpen(current: number, want: boolean, dt: number, speed = 4): number {
  const target = want ? 1 : 0;
  const step = speed * dt;
  return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
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
