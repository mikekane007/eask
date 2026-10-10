# Go and Tell

Angular 19 port of a three.js street-evangelism game: walk a 3D Accra-style street, talk to ten people,
get feedback on each answer. Original was a single-file Claude artifact.

## Stack and layout

- Angular 19, standalone components, signals. three.js **r128** (pinned). No test runner yet.
- `src/app/game/` - `people.data.ts`, `places.data.ts`, `layout.ts`, `state.ts`, `game.service.ts`
  (all rules and persistence), `engine.ts` (3D world and render loop).
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
- [ ] Keyboard/screen-reader pass on the sheet (focus the first option when it opens)
- [ ] Sound: footsteps, ambient street (needs owner approval for any assets)
- [ ] Deploy (ask the owner first: host, domain, cost)

## Hard rules

- Conversation content, doctrine and scripture references are the owner's: propose, do not rewrite.
- No paid services, no publishing, no history rewrites without asking.
- Never weaken strict TypeScript or the build to get green.
