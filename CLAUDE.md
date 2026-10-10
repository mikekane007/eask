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

`autopilot` (drive the project), `implement`, `three-engine`, `game-content`, `review-changes`,
`git-workflow`. Add a dated line to a skill's Gotchas whenever you learn something the hard way.

## Backlog (pick the first unchecked)

- [ ] Split `engine.ts` into modules (textures, builders, city, characters, loop)
- [ ] Unit tests for `GameService` (talk flow, faint, opening hours, save/load) with Vitest or Karma
- [ ] Playwright smoke test: intro, walk to Grace Chapel, study, talk to Kwame
- [ ] Keyboard/screen-reader pass on the sheet (focus the first option when it opens)
- [ ] Sound: footsteps, ambient street (needs owner approval for any assets)
- [ ] Deploy (ask the owner first: host, domain, cost)

## Hard rules

- Conversation content, doctrine and scripture references are the owner's: propose, do not rewrite.
- No paid services, no publishing, no history rewrites without asking.
- Never weaken strict TypeScript or the build to get green.
