---
name: testing
description: What kind of test goes where in Go and Tell - Vitest unit tests for GameService rules, Playwright smoke tests for the real app, how to write deterministic tests, and what to run locally versus in CI on a modest laptop. Use when adding behaviour, fixing a bug, or deciding how to test something.
---

# Testing

| Change                                  | Test                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| rules, scoring, time, energy, save/load | Vitest unit test in `src/app/game/*.spec.ts` (`new GameService()`, no DOM needed)    |
| a screen flow (intro, sheet, panel)     | Playwright test in `e2e/` (user-visible roles and text)                              |
| 3D scene look                           | manual screenshot; do not assert pixels                                              |
| data (people, places)                   | a spec that checks invariants (3 answers per round, one of each quality, unique ids) |

## Rules

- Bug fix = a test that fails before and passes after. Verify both.
- Test behaviour through the public surface (`svc.answer`, `svc.usePlaceOption`), not private fields.
- Deterministic: no `setTimeout` waits, no real randomness (answers are shuffled - find them by quality).
- `localStorage.clear()` in `beforeEach`; each test owns its own `GameService`.
- A test that cannot fail is worse than none. Check each assertion would break if the code did.
- Selectors in e2e: `getByRole` / `getByText`, never CSS classes.

## Commands (run one at a time on the owner's laptop)

- `npm test` - unit tests, ~3 s.
- `npm run e2e` - one worker, desktop only, real GPU. Needs the dev server (starts itself). Run it only
  for flow changes, not after every edit.
- The full desktop+phone matrix with software rendering runs in GitHub CI.

## Gotchas

- 2026-10-10: Vitest runs in jsdom; WebGL does not exist there, so `engine.ts` is excluded from
  coverage and tested only through e2e.
- 2026-10-10: Playwright tests share nothing, but `localStorage` persists across reloads inside one
  test; the `beforeEach` seeds a sessionStorage flag so only the first load is cleared.
