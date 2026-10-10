---
name: review-changes
description: Structured self-review of the current diff in Go and Tell before every commit - correctness, state handling, zone/signals, engine cleanup and performance, mobile, accessibility, content integrity - with blocker/should/nit severities. Use before committing or when asked to review changes.
---

# Review changes

Review like a skeptical senior engineer who will maintain this.

## Process

1. `git status` and `git diff --stat`: is the scope what was asked? Unrelated changes get split out.
2. Read the diff file by file, then the surrounding code.
3. Walk the checklist; record **blocker / should / nit**.
4. Fix blockers and shoulds now. Re-run `npx ng build`, then check the page in the browser.

## Checklist

**Correctness** - meets the acceptance criteria; edge cases (fresh game, old save, Start over,
fainting mid-talk, closed hours, locked person).

**State** - all rules in `GameService`; state updated immutably; saved shape stays backward
compatible; `save()` called after meaningful changes.

**Angular** - no logic in templates beyond trivial reads; `track` keys unique; `inject()` not
constructor soup; `zone.run` around engine-to-UI writes.

**Engine** - no per-frame allocation; everything disposed; no listener left behind; new geometry is
light; looks right at day and night.

**Mobile & a11y** - touch drag works; buttons are real `<button>` with labels; focus visible;
text readable; no horizontal scroll.

**Content** - conversation text unchanged unless the owner approved (see `game-content`).

**Hygiene** - no dead code, no commented-out code, no secrets, no stray files (dist, logs, screenshots).

## Output

```
## Review: <scope>
Blockers: ... Should: ... Nits: ...
Verdict: ready | needs changes
```

## Gotchas

- 2026-10-10: Playwright drops `.playwright-mcp/` into the project; it must stay out of git.
- 2026-10-10: A passing build does not prove the engine works. A missing import or typo in a texture
  draw call only shows up as a blank or broken scene at runtime.
