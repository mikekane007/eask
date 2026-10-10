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
