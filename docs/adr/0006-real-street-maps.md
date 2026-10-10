# 0006. Real street maps from OpenStreetMap

Status: accepted

## Context

The built-in street grid is the same shape in every city. To feel like a real place, a city should use its own
streets and buildings. The world must still run smoothly on a 2016 laptop with integrated graphics.

## Decision

- A city may have a real map: `City.map = { url }`. Cities without one keep using the built-in grid, so the two
  worlds live side by side and a city can be upgraded when its map is ready.
- Maps are built **offline**: `node tools/osm/build-map.mjs <name> <south> <west> <north> <east>` downloads a small
  area from the public Overpass API (mirrors tried in turn, raw data cached in `.cache/osm`), converts it to local
  metres, simplifies it and writes `public/maps/<name>.json` (about 115 KB for a 565 x 497 m area). The game never
  calls the public service at play time.
- The same TypeScript used by the game (`src/app/game/map/geo.ts`, `anchors.ts`) is bundled with esbuild for the
  script, so placement logic is tested once.
- Where the church, the café, home and each person go is decided automatically and repeatably (`pickAnchors`):
  clear street points, spread apart, each person pacing a short stretch of a real street.
- Rendering (`map/real-world.ts`): all buildings in two merged meshes, streets as ribbons, parks and water as flat
  polygons, trees and lamps instanced. A fragment-shader cut-away hides the part of any building that lies between
  the camera and the player, so narrow streets never hide you.
- Collision uses a 20 m grid of building footprints (`map/collision.ts`).
- Credit: the data is (c) OpenStreetMap contributors under the ODbL. The credit is shown on the minimap and the
  intro of a real-map city, and stored in each map file.

## Options considered

- Hand-modelled streets: authentic but far too slow for several cities.
- Streaming map tiles at run time: needs a server and a network connection, and depends on third parties.
- Offline conversion to one small file per city (chosen): small, fast, reproducible, works offline.

## Consequences

Positive: real streets and buildings for little cost; the file is small; placement is tested; cities can be added
with one command.
Negative: buildings are extruded footprints with flat roofs; map data needs a credit and a refresh now and then.

## Update: road network

Traffic and the crowd run on real maps too. `map/road-graph.ts` builds a graph of junctions and straight street pieces
from the centre lines (joining street ends to the sides of other streets that lost their shared point when the map was
simplified). Vehicles (`map/road-traffic.ts`) keep to the right, choose turns that favour going straight, take turns
through junctions (one vehicle in a junction zone at a time, with a time limit so nothing locks up), keep their distance
from whatever is ahead and stop for the player. Pedestrians walk the same streets, keeping to one side. Both follow the
same routines, density and weather rules as on the grid. Real-map checks live in `map/real-maps.spec.ts`.
