# 0003. Quality gate tooling

Status: accepted

## Context

The project should follow production standards and be safe for autonomous development.

## Decision

Prettier, type-aware ESLint with angular-eslint, strict TypeScript, Vitest (unit), Playwright (e2e),
knip (dead code), lefthook hooks (pre-commit, commit-msg, pre-push), commitlint, secretlint locally and
gitleaks in CI, `npm audit`, GitHub Actions and Dependabot.

## Options considered

- Husky plus lint-staged: Node-only and slower than lefthook.
- Karma and Jasmine (Angular default): slow, needs a browser; replaced by Vitest for rules tests.
- Biome instead of ESLint: lacks the type-aware async and exhaustiveness rules we want.

## Consequences

Positive: bad commits are stopped locally; CI repeats the same gate; history stays clean.
Negative: first install is heavy and commits take a few seconds longer.
