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
