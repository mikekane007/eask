---
name: quality-gates
description: The Go and Tell quality gate system - Prettier, type-aware ESLint with angular-eslint, strict TypeScript, Vitest, knip, lefthook hooks, commitlint, secretlint, GitHub Actions CI, Dependabot. Use when a gate fails, when changing lint/format/hook/CI config, or when adding a tool.
---

# Quality gates

| Layer      | When         | What                                                                         |
| ---------- | ------------ | ---------------------------------------------------------------------------- |
| pre-commit | `git commit` | Prettier (write) + ESLint `--fix` on staged files, secretlint                |
| commit-msg | `git commit` | commitlint (Conventional Commits, scope list in `commitlint.config.js`)      |
| pre-push   | `git push`   | `npm run check`                                                              |
| CI         | push / PR    | check + build, commit messages, `npm audit`, gitleaks, e2e (desktop + phone) |

`npm run check` = `format:check -> lint -> typecheck -> test -> knip`.

## Rules of engagement

- Never `--no-verify`. Never lower a rule or add a blanket `eslint-disable`. An inline disable needs
  `-- <reason>`. Fix the cause; if a rule is wrong for us, change config in its own commit with why.
- Gates never get weakened to pass. A failing gate is information.
- `engine.ts` has a documented override (three.js `userData` is `any`). Do not copy that override to
  other files.

## Adding a scope

New top-level area (for example `audio`)? Add it to the scope list in `commitlint.config.js` in the same
commit.

## Gotchas

- 2026-10-10: `angular-eslint` must match the Angular major (19.x here). The newest release targets a
  newer Angular and fails to install cleanly.
- 2026-10-10: ESLint is v9 (flat config). `@eslint/js` must also be v9; v10 mismatches.
- 2026-10-10: `lefthook` runs hooks with `sh`; Git for Windows provides it. Hooks are installed by
  `npm install` (the `prepare` script) - run `npx lefthook install` if they are missing.
- 2026-10-10: Prettier reflows long one-liners (the engine grew from ~800 to ~1650 lines). Expected;
  do not fight it.
- 2026-10-10: Angular templates: `@else if (x; as y)` is invalid; `as` only works on the first `@if`.
- 2026-10-10: `Record<string, T>` indexing is typed non-optional; use `Partial<Record<string, T>>` so
  `no-unnecessary-condition` does not call real checks "always falsy".
