---
name: autopilot
description: Drive the Go and Tell Angular game forward on its own - orient, pick the next task, route it through the right skills, verify in a real browser, commit and push, report. Use when the owner says "continue", "keep going", "next", "work on the game", or starts a session with no specific task. Also defines when to ask the owner and when to decide alone.
---

# Autopilot

The owner wants steady, verified progress and few questions. Decide ordinary engineering yourself.

## Loop

1. **Orient** - read `CLAUDE.md`, `git status`, `git log --oneline -10`. Resume unfinished work first.
   Never discard uncommitted changes you did not make.
2. **Pick** - the next item from the backlog in `CLAUDE.md`. Too big (more than ~300 changed lines
   or more than one area)? Split it first.
3. **Route**

| The task is about...                              | Use skill             |
| ------------------------------------------------- | --------------------- |
| code anywhere                                     | `implement`           |
| the 3D scene, lighting, characters, camera, input | `three-engine`        |
| conversations, people, places, scoring, balance   | `game-content`        |
| a diff about to be committed                      | `review-changes`      |
| commit, push, branches                            | `git-workflow`        |
| tests, a bug fix, a failing test                  | `testing`, `bug-hunt` |
| a gate, hook, lint or CI problem                  | `quality-gates`       |
| speed, frame rate, bundle size, memory            | `performance`         |
| UI, keyboard, contrast, screen readers            | `accessibility`       |
| a new dependency or a Dependabot PR               | `dependency-vetting`  |
| a choice between approaches (write an ADR)        | `compare-options`     |
| unsure how a library or API behaves               | `research`            |
| auth, secrets, XSS, headers, audits               | `security-audit`      |
| docs, README, changelog                           | `write-docs`          |
| version, tag, deploy, hosting (ask first)         | `release`             |

4. **Decide or ask**
   - Ask first: anything that costs money, accounts/credentials, publishing or deploying publicly,
     deleting or rewriting pushed history, changing the gospel/theological content or its tone,
     adding or removing features.
   - Decide alone: libraries within the stack, file layout, naming, refactors, performance, UI polish,
     tests, task order.
   - Ask well: batch questions, give your recommendation and the default you will assume.
5. **Execute** per `implement`. Small steps; build after each.
6. **Verify for real** - `npx ng build` is necessary, not sufficient. Run `npm start`, open the page
   with Playwright, click through the changed flow, check the console for errors.
7. **Commit and push** per `git-workflow`.
8. **Report**: Done (with commit shas) / Decisions / Waiting on owner (with default) / Next up / Risks.

## Anti-patterns

- Asking things you can decide ("which CSS naming?").
- Declaring done without running it in the browser.
- Mixing refactor and feature in one commit.
- Weakening the build, strict TypeScript or a check to get green.
- Rewriting the conversation text "while you are there" - that is content, see `game-content`.

## Gotchas

- 2026-10-10: A Bash command with several heredocs and quote characters failed to parse and ran
  nothing ("unexpected EOF"). Create files with the Write tool, not shell heredocs; use the shell only
  for short commands.
- 2026-10-10: Windows here has no `python` and no `jq`. Use Edit/Write, `sed`, or `node -e '...'`
  (single-quoted).
- 2026-10-10: Installed Angular CLI is 19.x; `npx @angular/cli@latest` needs a newer Node than
  v24.11 and refuses to run. Use the local `ng`/`npx ng`.
- 2026-10-10: A dev server started with `ng serve &` keeps running after the task; stop it when done.
- 2026-10-10: **The owner's laptop is modest** (i7-6820HQ 4 cores, Intel HD 530 + Quadro M1000M, ~30 GB
  free disk). Heavy parallel work froze it at 100% CPU. Run one heavy tool at a time (build, typed
  lint, tests, dev server, browser). Never run the Playwright suite locally with several workers or
  projects; the full matrix is for GitHub CI. Stop servers by PID, never `taskkill /IM node.exe`.
  Keep the game itself light: 30 fps cap, no MSAA, 1024 shadow map, pixel ratio <= 1.25.
