---
name: dependency-vetting
description: Decide whether to add or upgrade a dependency in Go and Tell - need, license, maintenance, size, security, Angular and Node compatibility, and the pinned three.js r128 rule. Use before `npm install` of anything new and when reviewing Dependabot PRs.
---

# Dependency vetting

Prefer no new dependency. Ask in order:

1. **Need** - can 30 lines of our own code do it? Then write them.
2. **License** - MIT, ISC, BSD or Apache-2.0 only. Anything else: ask the owner.
3. **Health** - maintained in the last year, more than a handful of users, no open critical advisories.
4. **Size** - check bundle impact (`ng build`); runtime dependencies must be justified, dev tools are cheaper.
5. **Compatibility** - supports Angular 19 and Node 24; peer dependencies satisfied without `--force`.
6. **Disk** - the owner's SSD is nearly full; avoid heavy downloads (browsers, Docker images).

## Dependabot PRs

Read the changelog; let CI run; merge patch/minor when green; majors get their own PR and a manual run
of the app. **`three` and `@types/three` stay on r128** (ignored in `dependabot.yml`) - newer releases
change colour management and light intensity, which changes the game's look.

## Record

A new runtime dependency gets a one-paragraph ADR in `docs/adr/`.

## Gotchas

- 2026-10-10: `angular-eslint` and `@angular/*` majors must move together.
- 2026-10-10: Removing Karma left `@angular/forms` and `platform-browser-dynamic` unused; `knip` found
  them. Run `npm run knip` after dependency changes.
