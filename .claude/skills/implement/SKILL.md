---
name: implement
description: Implement a feature, fix or refactor in the Go and Tell Angular app end-to-end - understand, plan acceptance criteria, mirror existing code, write it in small building steps, cover unhappy paths, verify in a real browser, self-review, commit. Use for any code-writing task.
---

# Implement

## 0. Understand first

- Read `CLAUDE.md` and the nearest existing code that does something similar. Mirror its structure,
  naming and style. Consistency beats cleverness.
- Unsure how an Angular or three.js API behaves? Check the docs (context7) for the **installed**
  version before coding: Angular 19, three **r128** (pinned on purpose - newer three changes colour
  and light units and the game would look different).

## 1. Plan (write it down if it touches more than 2 files)

- Acceptance criteria as Given/When/Then, with at least one failure case.
- Which layer: data (`game/*.data.ts`), rules (`GameService`), 3D (`engine.ts`), or UI (`ui/*`).
- Rules live in `GameService` only. Components render signals and call service methods.

## 2. Build in small steps

`npx ng build` after each step. It must stay green.

## 3. Conventions

- Standalone components, signals for state, `@if/@for/@switch` control flow, `inject()`.
- Strict TypeScript. No `any` unless a library type is wrong - then one cast with a comment saying why.
- Never mutate state in place: `state.update(s => ({ ...s, ... }))`.
- The engine runs outside the Angular zone. Anything that changes UI from an engine event goes through
  `zone.run(...)`. Per-frame work must not allocate (reuse vectors/colours) and must not touch signals
  that nothing reads.
- Persist only through `GameService.save()`. Changing the saved shape? Keep old saves loading
  (defaults for missing fields) - players have progress in localStorage under `goandtell`.

## 4. Unhappy-path checklist

- [ ] Fresh start, saved game, and "Start over" all work
- [ ] Low energy, closed place, too-late hour and locked person each show their reason
- [ ] Fainting teleports home and does not leave a conversation half open
- [ ] Listeners, rAF, geometries, textures released in `dispose()`
- [ ] Phone: drag joystick works, sheet scrolls, nothing wider than the screen
- [ ] No console errors on load or during play

## 5. Verify for real

`npm start`, then Playwright: open the page, press **Step out**, walk or use the buttons, exercise the
changed flow, read console messages. Say what you could not check (for example real phone touch).

## 6. Finish

`review-changes` on the diff, update `CLAUDE.md` backlog and any Gotchas, commit and push per
`git-workflow`.

## Gotchas

- 2026-10-10: Angular `@else if (x; as y)` is an error - `as` is only allowed on the first `@if`.
  Nest `@if` inside `@else { }` instead.
- 2026-10-10: three r128's `MeshLambertMaterialParameters` type has no `flatShading`; it works at
  runtime, so cast that one options object.
- 2026-10-10: Do not name a template helper `icon[q]` on a plain object literal; type it as
  `Record<Quality, string>` or strict templates reject the index.
- 2026-10-10: Signals set from outside the zone (rAF, raw DOM listeners) may not trigger change
  detection reliably; wrap those writes in `zone.run`.
- 2026-10-10: Every player-visible string goes through `I18n` (`t()` for UI keys, `tr()` for content). Add the
  key to **both** languages in `i18n/ui.ts`; a unit test fails if one is missing or the placeholders differ.
  Do not return pre-translated strings from long-lived state; store a key or enum and translate at render time
  (see `Talk.ending`).
- 2026-10-10: Vitest needs `import '@angular/compiler'` (in `src/test-setup.ts`) to construct `@Injectable`
  classes. Build services with `runInInjectionContext(Injector.create(...), () => new GameService())`.
- 2026-10-10: In Angular templates, text next to bold markup picks up stray spaces from line breaks. Use
  `<app-rich [text]="...">` for `**bold**` text.
- 2026-10-10: Editing a file the dev server watches reloads the open page and resets in-memory state; when
  checking the UI in a browser, make all edits first, then reload and test.
