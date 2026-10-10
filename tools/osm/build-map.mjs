// Downloads a small area of OpenStreetMap and turns it into a compact local-metre map for the game.
//
//   node tools/osm/build-map.mjs <name> <south> <west> <north> <east>
//   node tools/osm/build-map.mjs lille 50.6355 3.0600 50.6400 3.0680
//
// Output: public/maps/<name>.json. Raw downloads are cached in .cache/osm so reruns are free and kind to the server.
// Map data: (c) OpenStreetMap contributors, ODbL. The game shows this credit wherever a real map is used.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// The geometry and placement code is shared with the game, so bundle it from the TypeScript source first.
await build({
  entryPoints: ['src/app/game/map/pipeline.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.cache/osm/pipeline.mjs',
  logLevel: 'silent',
});
const { flatten, lineLength, makeProjector, pickAnchors, polygonArea, r1, simplify } = await import(
  pathToFileURL(path.resolve('.cache/osm/pipeline.mjs')).href
);

const [name, south, west, north, east] = process.argv.slice(2);
if (!name || [south, west, north, east].some((v) => Number.isNaN(Number(v)))) {
  console.error('usage: node tools/osm/build-map.mjs <name> <south> <west> <north> <east>');
  process.exit(1);
}
const bbox = [south, west, north, east].map(Number);

const SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const UA = 'go-and-tell-dev/0.1 (learning project; contact kaniobed28@gmail.com)';

const cacheFile = path.join('.cache', 'osm', `${name}.json`);
async function download() {
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const b = bbox.join(',');
  const q =
    `[out:json][timeout:60];(` +
    `way["highway"](${b});way["building"](${b});` +
    `way["leisure"~"park|garden|pitch|playground"](${b});way["natural"~"water|wood"](${b});` +
    `way["landuse"~"grass|forest|village_green|recreation_ground"](${b});way["waterway"="riverbank"](${b});` +
    `);out geom;`;
  for (const url of SERVERS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q),
        signal: AbortSignal.timeout(90_000),
      });
      const text = await res.text();
      if (res.ok && text.startsWith('{')) {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        fs.writeFileSync(cacheFile, text);
        console.log(`downloaded ${(text.length / 1e6).toFixed(2)} MB from ${url}`);
        return JSON.parse(text);
      }
      console.warn(`${url}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`${url}: ${e.message}`);
    }
  }
  throw new Error('no Overpass server answered');
}

// road kind -> [width in metres, drivable]
const ROADS = {
  motorway: [12, 1],
  trunk: [11, 1],
  primary: [10, 1],
  secondary: [9, 1],
  tertiary: [8, 1],
  unclassified: [6.5, 1],
  residential: [6.5, 1],
  living_street: [5.5, 1],
  service: [4, 0],
  pedestrian: [6, 0],
  footway: [2.5, 0],
  path: [2.5, 0],
  cycleway: [2.5, 0],
  steps: [2, 0],
  track: [3, 0],
};

const data = await download();
const [lat0, lon0] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
const project = makeProjector(lat0, lon0);
const probe = makeProjector(lat0, lon0);
const [maxX, maxZ] = [probe(lat0, bbox[3])[0], probe(bbox[0], lon0)[1]];
const W = Math.round(maxX * 2);
const Hh = Math.round(maxZ * 2);

const toPts = (el) => (el.geometry ?? []).map((g) => project(g.lat, g.lon));
const roads = [];
const buildings = [];
const parks = [];
const water = [];
const flat = flatten;

for (const el of data.elements) {
  if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
  const t = el.tags ?? {};
  const pts = toPts(el);
  if (t.highway && ROADS[t.highway] && t.area !== 'yes' && t.tunnel !== 'yes' && t.covered !== 'yes') {
    const [w, drive] = ROADS[t.highway];
    const s = simplify(pts, 0.8);
    if (s.length >= 2 && lineLength(s) >= 3) {
      roads.push({ k: t.highway, w, d: drive, n: t.name ?? '', p: flat(s) });
    }
  } else if (t.building && pts.length >= 4) {
    const s = simplify(pts, 0.4);
    const area = Math.abs(polygonArea(s));
    if (s.length < 4 || area < 20) continue;
    const levels = Number(t['building:levels']);
    const given = parseFloat(t.height);
    const h = Number.isFinite(given) ? given : Number.isFinite(levels) && levels > 0 ? levels * 3 : 9;
    buildings.push({ h: r1(Math.max(4, Math.min(24, h))), a: Math.round(area), p: flat(s.slice(0, -1)) });
  } else if (pts.length >= 4 && (t.natural === 'water' || t.waterway === 'riverbank')) {
    water.push(flat(simplify(pts, 0.8).slice(0, -1)));
  } else if (pts.length >= 4 && (t.leisure || t.landuse || t.natural === 'wood')) {
    parks.push(flat(simplify(pts, 0.8).slice(0, -1)));
  }
}

const PEOPLE = Number(process.env.PEOPLE ?? 6);
const anchors = pickAnchors({ w: W, h: Hh, roads, buildings }, PEOPLE);
const map = {
  name,
  credit: '© OpenStreetMap contributors (ODbL)',
  origin: { lat: r1(lat0 * 1e4) / 1e4, lon: r1(lon0 * 1e4) / 1e4 },
  w: W,
  h: Hh,
  roads,
  buildings,
  parks,
  water,
  anchors,
};
fs.mkdirSync('public/maps', { recursive: true });
const out = path.join('public', 'maps', `${name}.json`);
fs.writeFileSync(out, JSON.stringify(map));
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(
  `${name}: ${W}x${Hh} m, ${roads.length} roads (${roads.filter((r) => r.d).length} drivable), ` +
    `${buildings.length} buildings, ${parks.length} green areas, ${water.length} water, ${kb} KB -> ${out}`,
);
