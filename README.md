# Go and Tell

An Angular port of the "Go and Tell" three.js street-evangelism game: choose a city (Accra, Lille, Paris or Douai), walk its 3D street, talk to its people and learn from the feedback on each answer. Playable in English and French.

- `src/app/game/` — rules (`GameService`), the 3D engine and its modules, `cities/` (one file per city: theme, places, people) and `i18n/` (languages)
- `src/app/ui/` — HUD, goals panel, talk/place sheet, intro modal

```
npm install
npm start      # http://localhost:4200
npm run build
```
