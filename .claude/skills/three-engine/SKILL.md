---
name: three-engine
description: Work on the Go and Tell 3D street in src/app/game/engine.ts - scene, buildings, characters, tro-tros, day/night lighting, camera, joystick and keyboard input, performance and cleanup. Use for any change to what is drawn or how the player moves.
---

# three.js engine

`createEngine(canvas, svc, zone)` in `src/app/game/engine.ts` owns the renderer, camera, sun and the
render loop, and returns `{ start, resize, dispose }`. It reads `GameService` signals each frame and
writes back only `svc.current`, `svc.joy` and the saved position. The world is built by modules that
each export one `create*` function taking the scene (and the shared kit):

| Module          | Holds                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| `kit.ts`        | materials `M`, `mesh`, `box`, canvas textures `TX`, signs, seeded `rnd`, `ringMat` |
| `lighting.ts`   | sky dome, day/night tables, `setTimeTarget`, `snapLight`                           |
| `builders.ts`   | buildings, palms, trees, umbrellas, poles, wires                                   |
| `city.ts`       | ground, blocks, landmarks, clouds; returns `solids` and animated parts             |
| `characters.ts` | player, the ten people, tro-tros                                                   |
| `input.ts`      | keyboard state and the drag joystick; has its own `dispose()`                      |

## Layout facts

- Grid constants live in `layout.ts` (`N` blocks, `B` block size, `R` road width). `bMin/bC/roadC`
  convert block/road indices to world coordinates. Always use them; never hard-code positions.
- Places come from `places.data.ts`; `markerPos(place)` is the gold ring where the sheet opens.
- People are placed by `spot: [axis, roadIndex, block, fraction]` in `people.data.ts` and pace one
  block of street.
- Collision is axis-separated against block rectangles (`solids`), radius 0.7.

## Rules

- **Pinned to three r128.** Colour handling uses `.convertSRGBToLinear()` and `outputEncoding`. Do not
  upgrade without a deliberate look-and-feel pass.
- Reuse materials (`M(color)` caches) and vectors. No `new` objects inside `frame()` unless rare.
- Textures are canvas-drawn. Fonts (Bungee) are awaited before drawing sign text.
- Day/night: `setTimeTarget(hour)` when the hour changes, then lighting eases toward it each frame.
- Anything added to the scene that holds GPU resources must be reachable by `dispose()`'s traversal.
- Mobile: pixel ratio capped, smaller shadow map. Keep new geometry light (instance repeated things).

## Verifying

Take a Playwright screenshot after the change. Check morning and night (set `hour` via the Sleep
button or by editing the saved state) when touching lights or emissive materials.

## Gotchas

- 2026-10-10: The engine is async (waits for fonts). Component destruction can happen before it
  resolves; `AppComponent` checks a `destroyed` flag and disposes immediately.
- 2026-10-10: `svc.teleport` is assigned by the engine; calling it before the engine exists is a no-op
  by design (the saved `x,z` is used for the first spawn).
- 2026-10-10: The "Back to the street" button sets `current` to null; the next frame re-detects
  proximity and reopens the sheet if the player is still standing there. This matches the original
  game - do not "fix" it without asking.
- 2026-10-10: The engine was split mechanically (code copied by line range into `create*` functions),
  so module bodies still use the original closure style. Verified identical in the browser. New
  world pieces go in the module that owns that concern, and shared helpers go through `kit`.
- 2026-10-10: The engine is now city-aware. `createEngine(canvas, svc, zone, city)` passes `city.theme` to the
  builders and `city` to `city.ts` and `characters.ts`. Never read module-level place or people constants;
  use `city.places` and `city.people`. `AppComponent` creates a fresh `<canvas>` per city and `dispose()` calls
  `forceContextLoss()` so the GPU memory is freed when you switch cities.
- 2026-10-10: Traffic is split into `traffic-logic.ts` (pure rules: signals, density, braking; fully unit tested) and
  `traffic.ts` (vehicles, lanes, instanced signal lamps). Vehicles follow `desiredSpeed` each frame. Keep rules in
  the pure file. Conversation people stand at 4.2 m from a road centre (outside the lanes) so cars never drive
  through them. Instance colours (`setColorAt`) are NOT converted for the renderer: call `.convertSRGBToLinear()`.
- 2026-10-10: The background crowd (`pedestrians.ts`, rules in `crowd-logic.ts`) is four `InstancedMesh`es: torso, head and
  two legs, so about 36 people cost four draw calls. They walk rectangular pavement loops inside each block, follow
  daily routines and go indoors in rain. They are scenery only: named people (conversations) are separate objects.
  Hidden people are scaled to zero, not removed. Never create per-person meshes for the crowd.
- 2026-10-10: Sound is generated with the Web Audio API in `SoundService` (no audio files). The loudness decisions are in
  the pure `sound-mix.ts` (tested, with a total-level budget so a storm plus a crowd cannot clip). The audio context is only
  created inside a user gesture; until then every call is a quiet no-op. Update the mix a few times a second, never per frame.
  Check it headlessly by reading the gain values from `window.ng.getComponent(root).sound.graph`.
- 2026-10-10: Cities may have a real OpenStreetMap map (ADR 0006). `engine.ts` builds `createRealWorld` when `svc.realMap()` is set,
  else `createCity` (the grid). Traffic and the crowd are grid-only for now (they are `null` on real maps). To add a city map run
  `node tools/osm/build-map.mjs <name> <south> <west> <north> <east>` then `node tools/osm/preview.mjs <name>` to check where the
  anchors landed. Keep the area to roughly 600 m across and under 200 KB. Positions saved on one map are ignored on another
  (`GameState.map`).
- 2026-10-10: Merged building meshes cannot be faded per building, so `real-world.ts` injects a world-space cut-away into the wall
  and roof materials (`onBeforeCompile`). New materials for tall things on a real map should call `addCutaway` too.
