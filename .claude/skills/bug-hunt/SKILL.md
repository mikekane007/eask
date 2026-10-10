---
name: bug-hunt
description: Find and fix bugs in Go and Tell systematically - reproduce, minimise, find the root cause, add a regression test, sweep for siblings; or proactively hunt using the game-specific bug catalogue. Use for bug reports, failing tests, "it feels wrong", crashes, leaks, or "find bugs in X".
---

# Bug hunt

## Fixing a known bug

1. **Reproduce** as a failing test (unit for rules, e2e for flow). Cannot reproduce? Gather evidence first.
2. **Minimise** until every step is needed.
3. **Hypothesise**, test one cause at a time with a temporary log or a breakpoint.
4. **Root cause**, not symptom. A null check or retry that hides the problem is suspicious.
5. **Fix** minimally; the regression test must fail before and pass after.
6. **Sweep** for the same pattern elsewhere.
7. **Learn**: add the class to the catalogue below and, if a lint rule could have caught it, add the rule.

## Bug catalogue for this game

- **State**: mutation instead of `update`; forgetting `save()`; a field added without a default for
  old saves; renamed person `id` dropping progress.
- **Time/energy**: off-by-one across midnight (`hour >= 24`); sleep before/after 07:00 day increment;
  fainting while a conversation is open.
- **Conversation**: answers shuffled but index used as identity; openness hitting 0 mid-round; leaving
  the sheet mid-talk with "Back to the street" semantics.
- **Engine**: listeners or textures not disposed; per-frame allocation; zone leaks (`zone.run` missing
  or overused); async init racing component destroy; NaN positions from `dt`.
- **UI**: `track` collisions; disabled button with no reason shown; focus lost when the sheet changes.
- **Mobile**: joystick pointer capture lost; sheet taller than the screen; hidden address-bar resize.

## Report format for findings not fixed now

```
### Title - severity: critical | high | medium | low
Where: file:line or flow - Found by: technique
Repro: steps or test name
Expected / Actual:
Root cause (or hypothesis):
Suggested fix:
```

## Gotchas

- 2026-10-10: A passing build does not prove the 3D scene works; always look at it.
