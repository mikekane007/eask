// Draws a compiled map as an SVG so a human can check it and choose where places and people go.
//   node tools/osm/preview.mjs lille [out.svg]
import fs from 'node:fs';

const name = process.argv[2];
const out = process.argv[3] ?? `.cache/osm/${name}.svg`;
const map = JSON.parse(fs.readFileSync(`public/maps/${name}.json`, 'utf8'));
const hw = map.w / 2;
const hh = map.h / 2;
const poly = (p) => {
  const pts = [];
  for (let i = 0; i < p.length; i += 2) pts.push(`${p[i]},${p[i + 1]}`);
  return pts.join(' ');
};
const parts = [];
parts.push(`<rect x="${-hw}" y="${-hh}" width="${map.w}" height="${map.h}" fill="#e9e4d4"/>`);
for (const g of map.parks) parts.push(`<polygon points="${poly(g)}" fill="#bcd9a5"/>`);
for (const g of map.water) parts.push(`<polygon points="${poly(g)}" fill="#a9cfe8"/>`);
for (const r of map.roads) {
  const col = r.d ? '#ffffff' : '#f0d9b5';
  parts.push(
    `<polyline points="${poly(r.p)}" fill="none" stroke="#9a9a9a" stroke-width="${r.w + 1}" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  parts.push(
    `<polyline points="${poly(r.p)}" fill="none" stroke="${col}" stroke-width="${r.w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
}
for (const b of map.buildings) {
  const g = Math.max(90, 200 - b.h * 5);
  parts.push(`<polygon points="${poly(b.p)}" fill="rgb(${g},${g - 20},${g - 40})" stroke="#555" stroke-width="0.3"/>`);
}
// where the places and the people were put
const a = map.anchors;
if (a) {
  const dot = (x, z, col, label) =>
    parts.push(
      `<circle cx="${x}" cy="${z}" r="4" fill="${col}" stroke="#000" stroke-width="0.6"/><text x="${x + 5}" y="${z + 3}" font-size="9" font-weight="bold" fill="#000">${label}</text>`,
    );
  for (const id of ['church', 'chop', 'home']) dot(a[id].x, a[id].z, '#f2b705', id);
  for (const [id, lm] of Object.entries(a.landmarks))
    parts.push(
      `<polygon points="${poly(map.buildings[lm.b].p)}" fill="#e0483e" opacity="0.85"/><text x="${lm.x}" y="${lm.z}" font-size="8" fill="#fff" font-weight="bold">${id}</text>`,
    );
  a.people.forEach((p, i) => {
    parts.push(
      `<line x1="${p.seg[0]}" y1="${p.seg[1]}" x2="${p.seg[2]}" y2="${p.seg[3]}" stroke="#1e8a4c" stroke-width="2.5"/>`,
    );
    dot(p.x, p.z, '#3dbe6e', 'P' + (i + 1));
  });
}
// metre grid every 50 m with labels, to read coordinates off
for (let x = -Math.floor(hw / 50) * 50; x <= hw; x += 50) {
  parts.push(`<line x1="${x}" y1="${-hh}" x2="${x}" y2="${hh}" stroke="#d33" stroke-width="0.4" opacity="0.6"/>`);
  parts.push(`<text x="${x + 1}" y="${-hh + 8}" font-size="7" fill="#d33">${x}</text>`);
}
for (let z = -Math.floor(hh / 50) * 50; z <= hh; z += 50) {
  parts.push(`<line x1="${-hw}" y1="${z}" x2="${hw}" y2="${z}" stroke="#d33" stroke-width="0.4" opacity="0.6"/>`);
  parts.push(`<text x="${-hw + 1}" y="${z - 1}" font-size="7" fill="#d33">${z}</text>`);
}
fs.mkdirSync('.cache/osm', { recursive: true });
fs.writeFileSync(
  out,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-hw} ${-hh} ${map.w} ${map.h}" width="1400" height="${Math.round((1400 * map.h) / map.w)}">${parts.join('')}</svg>`,
);
console.log('wrote', out);
