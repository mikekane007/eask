# Go and Tell

Angular 21 port of a three.js street-evangelism game: pick a city (Accra, Lille, Paris, Douai), walk its 3D
street, talk to its people and get feedback on each answer. English and French. Accra is kept but hidden from the
picker (`hidden: true`). Original was a single-file
Claude artifact.

## Stack and layout

- Angular 21 (LTS), standalone components, signals. three.js **r128** (pinned). Vitest unit tests, Playwright browser tests. Multiplayer rooms over Firebase (ADR 0007).
- `src/app/game/` - `types.ts`, `layout.ts`, `state.ts`, `game.service.ts` (all rules and persistence),
  `engine.ts` plus its modules (3D world and render loop).
- `src/app/game/cities/` - one file per city (`accra.ts`, `lille.ts`, `paris.ts`, `douai.ts`) with its theme and
  places, and a `*.people.ts` with its conversations. `index.ts` is the registry.
- `src/app/game/i18n/` - `i18n.service.ts` (language, `tr`, `t`), `ui.ts` (UI strings, EN+FR), `rules.ts`
  (the rulebook, EN+FR), `bible.ts` (French book names for references).
- `src/app/ui/` - `hud`, `goals`, `sheet` (place/approach/talk), `intro`.
- `src/styles.css` - global styles carried over from the artifact (single dark theme on purpose).

## Commands

- `npm start` - dev server on http://localhost:4200
- `npx ng build` - production build (must stay green)

## Skills (in `.claude/skills/`)

`autopilot` (drive the project and route work), `implement`, `three-engine`, `game-content`,
`review-changes`, `git-workflow`, `testing`, `quality-gates`, `performance`, `accessibility`,
`security-audit`, `dependency-vetting`, `compare-options`, `research`, `bug-hunt`, `write-docs`,
`release`. Add a dated line to a skill's Gotchas whenever you learn something the hard way.
Decisions live in `docs/adr/`.

## Quality gates

`npm run check` = format, lint, typecheck, unit tests, knip. Hooks (lefthook) run it on push and format
and lint on commit; commit messages follow Conventional Commits with the scopes in
`commitlint.config.js`. CI repeats everything and adds `npm audit`, gitleaks and e2e.

## Machine limits

The owner's laptop is modest (2016 i7 quad-core, integrated GPU, nearly full SSD). Run one heavy tool
at a time, never the e2e suite with many workers locally, never `taskkill /IM node.exe`.

## Backlog (pick the first unchecked)

- [x] Split `engine.ts` into modules (kit, lighting, builders, city, characters, input, loop)
- [x] Unit tests for `GameService` (Vitest)
- [~] Playwright smoke tests written (intro, sleep, reload, people panel); still to add: walk to Grace Chapel, study, talk to Kwame. Not yet run locally; run in CI
- [x] In-game rules screen (? button and intro) and live minimap (M button)
- [x] City picker, Lille, Paris, Douai (drafts) and an English/French switch (ADR 0005)
- [x] Real OpenStreetMap maps for all four cities with traffic and a crowd on the real streets (ADR 0006). Phase 2 done
- [x] Phase 1 of the living-world roadmap: ambient clock, weather, traffic, crowd, sound (see docs/ROADMAP.md)
- [ ] OWNER: review the draft conversations for Lille, Paris and Douai, then set `reviewed: true`
- [ ] OWNER: review the new people in `cities/*.more.ts` (people who say no, church hurt, practical care, phone calls;
      "Presiding Elder" is "l’Ancien président" in French) and the 15-Word cost per conversation
- [ ] Translate the Accra conversations into French (currently English only)
- [ ] Landmark buildings per city (belfry, Eiffel-style tower, Braderie stalls) instead of the shared shapes
- [ ] More cities (Roubaix, Strasbourg, Marseille, Kumasi, ...)
- [ ] Keyboard/screen-reader pass on the sheet (focus the first option when it opens)
- [ ] Sound: footsteps, ambient street (needs owner approval for any assets)
- [ ] Deploy (ask the owner first: host, domain, cost)

## Hard rules

- Conversation content, doctrine and scripture references are the owner's: propose, do not rewrite.
  New or changed city content stays `reviewed: false` until the owner approves it.
- No paid services, no publishing, no history rewrites without asking.
- Never weaken strict TypeScript or the build to get green.
