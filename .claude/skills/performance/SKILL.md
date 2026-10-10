---
name: performance
description: Keep Go and Tell fast and light, especially on modest hardware - render loop budget, GPU and CPU cost of the three.js scene, bundle size, memory leaks, and how to measure. Use when adding anything to the scene, when the game feels slow, or when the owner's machine struggles.
---

# Performance

Target machine: a 2016 quad-core laptop with integrated Intel HD 530 graphics. If it runs well there,
it runs well everywhere.

## Budgets

- Render: 30 fps while playing, 10 fps behind the intro, 0 when the tab is hidden (in `engine.ts`).
- Draw calls: keep the scene under ~600. Instance repeated meshes (`InstancedMesh`), reuse materials
  (`M(color)` caches) and geometries, merge static decoration where possible.
- Rendering: no MSAA, pixel ratio <= 1.25, shadow map 1024. Raise only behind a setting, never by default.
- JS bundle: under ~900 kB raw for `main` (three.js is most of it). Check `ng build` output.
- Per frame: no allocations (reuse `Vector3`/`Color`), no DOM reads, no signal writes unless the value changed.

## Measure before changing

1. `ng build` - bundle sizes.
2. Chrome DevTools Performance panel: record 10 s of walking; look for long frames and GC.
3. `renderer.info.render` (calls, triangles) in the console for scene cost.
4. Compare before/after numbers in the commit message.

## Gotchas

- 2026-10-10: Shadows, antialiasing and high pixel ratio were the biggest GPU costs on the owner's
  laptop; the original artifact had them all on.
- 2026-10-10: Every canvas texture (`canvasTex`) is uploaded to the GPU; creating one per object
  (umbrella stripes, wax prints) multiplies memory. Cache by key when adding more.
- 2026-10-10: A hidden or backgrounded tab still gets `requestAnimationFrame` callbacks in some
  browsers; the loop checks `document.hidden` itself.
- 2026-10-10: Detail is now data: `GRAPHICS[level]` in `graphics.ts`. Anything that scales with load (trees, vehicles, walkers,
  raindrops, shadows, resolution) must read its limit from there and expose a `setLimit`/`setDrops`/`setTreeShare`, so Low can really
  be lighter. New heavy features need an entry in all three levels and a test that Low < Medium <= High. Auto lowers by itself.
- 2026-10-10: The 3D engine is a lazy chunk (`await import('./game/engine')` in `app.component.ts`). Anything that imports
  three.js must stay inside the engine tree, or three.js lands back in the first download. The 1 MB initial budget had
  been broken for several commits because CI results were not checked after pushing: always run `gh run list` after a push.
- 2026-10-10: Firebase is loaded only on Open a room / Join (dynamic imports in `net/firebase-room.ts`). Keep it that way.
- 2026-10-10: `svc.live.stats.drawCalls` reports `renderer.info.render.calls` four times a second; read it from the browser
  console (`ng.getComponent(document.querySelector('app-root')).svc.live.stats`) after visual changes. A busy Lille street
  measured about 70 with the new buildings, people and street details. Street furniture, chimneys, tanks, crowd parts and
  lamp pools are instanced; each landmark and each person's face, brows and hair are merged shapes.
- 2026-10-10: Pitched roofs rise above the OpenStreetMap wall height. The camera checks use `blocks.tops` (roof included)
  and the landmarks' footprints, not the raw wall heights, or the camera ends up inside roofs.
