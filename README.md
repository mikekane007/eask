# Go and Tell

An Angular port of the "Go and Tell" three.js street-evangelism game: walk a 3D Accra-style street, talk to ten people, and learn from feedback on each answer.

- `src/app/game/` — data (`people.data.ts`, `places.data.ts`), `GameService` (signals state, saves to localStorage) and `engine.ts` (three.js r128 world and render loop, runs outside the Angular zone)
- `src/app/ui/` — HUD, goals panel, talk/place sheet, intro modal

```
npm install
npm start      # http://localhost:4200
npm run build
```
