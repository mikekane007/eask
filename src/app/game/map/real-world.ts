import * as THREE from 'three';
import type { Kit } from '../kit';
import type { City, CityTheme, Place } from '../types';
import { createFacades } from '../facades';
import { type BlockInput, type Geo, type Rgb, buildBlocks } from './buildings';
import { MapCollision } from './collision';
import { buildGraph } from './road-graph';
import { streetDetails } from './street-details';
import { pointAlong, lineLength, toPoints, pointInPolygon, type Pt } from './geo';
import { ribbon } from './ribbon';
import type { MapData } from './types';

/** Colours for the buildings that carry a place's sign, so the street shows where things are. */
const LANDMARK_COLORS: Partial<Record<string, number>> = {
  church: 0xf7f3ea,
  chop: 0xe07a3f,
  home: 0xf3e2b3,
  market: 0xd9822b,
  tech: 0x6f8fa8,
  site: 0xa8a49c,
};
const SIGN_STYLE: Record<string, [string, string, number]> = {
  church: ['#111C17', '#F2B705', 8],
  home: ['#3DBE6E', '#111C17', 5],
};

/** Uniforms for the see-through cut that keeps buildings from hiding the player. */
interface Cutaway {
  uCam: { value: THREE.Vector3 };
  uTarget: { value: THREE.Vector3 };
  uR: { value: number };
}

/** Lets the fragments of a material that lie between the camera and the player (within a radius) be skipped. */
function addCutaway(mat: THREE.Material, cut: Cutaway): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms['uCam'] = cut.uCam;
    shader.uniforms['uTarget'] = cut.uTarget;
    shader.uniforms['uR'] = cut.uR;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCam;\nuniform vec3 uTarget;\nuniform float uR;',
      )
      .replace(
        'void main() {',
        `void main() {
  if (uR > 0.01) {
    vec3 ab = uTarget - uCam;
    float t = dot(vWorldPos - uCam, ab) / dot(ab, ab);
    if (t > 0.0 && t < 0.97) {
      // fully open in the middle, thinning out towards the rim, so there is no hard circle
      float d = distance(vWorldPos, uCam + ab * t);
      float open = 1.0 - smoothstep(uR * 0.45, uR, d);
      float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      if (open > noise) discard;
    }
  }`,
      );
  };
}

/** Several boxes [w, h, d, x, y, z] joined into one geometry, so they draw as one object. */
function mergeBoxes(boxes: [number, number, number, number, number, number][]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (const [w, h, d, x, y, z] of boxes) {
    const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const base = pos.length / 3;
    pos.push(...(g.attributes['position'].array as Float32Array));
    nor.push(...(g.attributes['normal'].array as Float32Array));
    const index = g.index;
    if (index) for (let k = 0; k < index.count; k++) idx.push(base + index.getX(k));
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}

const hash = (n: number): number => {
  let h = Math.imul(n + 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Triangle indices for a flat polygon, or none if it cannot be split. */
function triangulate(pts: Pt[]): number[] {
  try {
    const faces = THREE.ShapeUtils.triangulateShape(
      pts.map((p) => new THREE.Vector2(p[0], p[1])),
      [],
    );
    return faces.flat();
  } catch {
    return [];
  }
}

/** Builds a mesh from many flat polygons laid at height `y`, with UVs from world position. */
function flatPolygons(polys: number[][], y: number, mat: THREE.Material, uvScale: number): THREE.Mesh | null {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (const flat of polys) {
    const pts = toPoints(flat);
    if (pts.length < 3) continue;
    const tri = triangulate(pts);
    if (!tri.length) continue;
    const base = pos.length / 3;
    for (const [x, z] of pts) {
      pos.push(x, y, z);
      uv.push(x / uvScale, z / uvScale);
    }
    for (const i of tri) idx.push(base + i);
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}

/** Renders a real street map: ground, streets, parks, water, buildings, trees, lamps, markers and signs. */
export function createRealWorld(
  scene: THREE.Scene,
  kit: Kit,
  theme: CityTheme,
  city: City,
  map: MapData,
  facadeMats: THREE.MeshLambertMaterial[],
) {
  const { lin, TX, M, sign, ringMat } = kit;
  const collision = new MapCollision(map.buildings, map.w, map.h, map.water);
  const cut: Cutaway = {
    uCam: { value: new THREE.Vector3() },
    uTarget: { value: new THREE.Vector3() },
    // the engine opens this only while a building actually hides the player
    uR: { value: 0 },
  };

  // ---- ground
  const margin = 80;
  // open ground: paved squares in Europe, packed red earth and dust in Accra
  const dusty = theme.ground === 'laterite';
  const paving = TX[dusty ? 'dust' : 'paving'].clone();
  paving.needsUpdate = true;
  const tile = dusty ? 16 : 5;
  paving.repeat.set((map.w + margin * 2) / tile, (map.h + margin * 2) / tile);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(map.w + margin * 2, map.h + margin * 2),
    new THREE.MeshLambertMaterial({ map: paving, color: lin(dusty ? 0xf0e8de : 0xb8af9a) }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshLambertMaterial({ map: TX[theme.ground] }),
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.03;
  outer.receiveShadow = true;
  scene.add(outer);
  TX[theme.ground].repeat.set(180, 180);

  // ---- streets
  const roadGeo = (drive: boolean, y: number, extra = 0) => {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (const r of map.roads) {
      if ((r.d === 1) !== drive) continue;
      const rb = ribbon(toPoints(r.p), r.w + extra);
      const base = pos.length / 3;
      for (let i = 0; i < rb.xz.length; i += 2) {
        pos.push(rb.xz[i], y, rb.xz[i + 1]);
        uv.push(rb.xz[i] / 8, rb.xz[i + 1] / 8);
      }
      for (const i of rb.indices) idx.push(base + i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const asphalt = TX['asphalt'].clone();
  asphalt.needsUpdate = true;
  asphalt.repeat.set(1, 1);
  const drive = new THREE.Mesh(
    roadGeo(true, 0.035),
    new THREE.MeshLambertMaterial({ map: asphalt, side: THREE.DoubleSide }),
  );
  const walkTex = TX['paving'].clone();
  walkTex.needsUpdate = true;
  walkTex.repeat.set(1, 1);
  const walk = new THREE.Mesh(
    roadGeo(false, 0.025),
    new THREE.MeshLambertMaterial({ map: walkTex, color: lin(0xe3d3b0), side: THREE.DoubleSide }),
  );
  // kerbs: a pale stone edge showing just outside the asphalt
  const kerb = new THREE.Mesh(roadGeo(true, 0.03, 0.7), M(0xc9c4b8));
  for (const m of [drive, walk, kerb]) {
    m.receiveShadow = true;
    scene.add(m);
  }

  // painted centre lines and zebra crossings, benches and bins (one instanced mesh each)
  const details = streetDetails(buildGraph(map.roads), (x, z) => !collision.blocked(x, z, 0.9));
  const marks = [...details.dashes, ...details.crossings];
  if (marks.length) {
    const paint = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: lin(0xeeeeea), polygonOffset: true, polygonOffsetFactor: -2 }),
      marks.length,
    );
    const o = new THREE.Object3D();
    marks.forEach((m, i) => {
      o.position.set(m.x, 0.045, m.z);
      o.rotation.set(0, m.angle, 0);
      o.scale.set(m.width, 1, m.length);
      o.updateMatrix();
      paint.setMatrixAt(i, o.matrix);
    });
    paint.receiveShadow = true;
    scene.add(paint);
  }
  const benches = details.furniture.filter((f) => f.kind === 'bench');
  const bins = details.furniture.filter((f) => f.kind === 'bin');
  const furnish = (geo: THREE.BufferGeometry, mat: THREE.Material, spots: typeof benches) => {
    if (!spots.length) return;
    const im = new THREE.InstancedMesh(geo, mat, spots.length);
    const o = new THREE.Object3D();
    spots.forEach((f, i) => {
      o.position.set(f.x, 0, f.z);
      o.rotation.set(0, f.angle, 0);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.castShadow = true;
    scene.add(im);
  };
  // a bench: seat, back and two legs merged into one shape
  const bench = mergeBoxes([
    [1.8, 0.08, 0.5, 0, 0.48, 0],
    [1.8, 0.45, 0.08, 0, 0.78, -0.24],
    [0.08, 0.48, 0.45, -0.8, 0.24, 0],
    [0.08, 0.48, 0.45, 0.8, 0.24, 0],
  ]);
  furnish(bench, M(0x6b4a2e), benches);
  furnish(new THREE.CylinderGeometry(0.28, 0.24, 0.9, 10).translate(0, 0.45, 0), M(0x2f4a3a), bins);

  // ---- parks and water
  const lawn = TX['lawn'].clone();
  lawn.needsUpdate = true;
  lawn.repeat.set(1, 1);
  const parks = flatPolygons(
    map.parks,
    0.015,
    new THREE.MeshLambertMaterial({ map: lawn, side: THREE.DoubleSide }),
    10,
  );
  if (parks) scene.add(parks);
  const lake = flatPolygons(
    map.water,
    0.012,
    new THREE.MeshLambertMaterial({ color: lin(0x6fa6cf), side: THREE.DoubleSide }),
    10,
  );
  if (lake) scene.add(lake);

  // ---- buildings: walls, shop fronts, roofs and awnings, each merged into one mesh
  const places = new Map<string, Place>(city.places.map((p) => [p.id, p]));
  const landmarkOf = new Map<number, string>();
  for (const [id, lm] of Object.entries(map.anchors.landmarks)) landmarkOf.set(lm.b, id);
  const look = theme.blocks;
  const tex = createFacades(kit, look.facade, look.surface);
  const rgb = (hex: number | string, k = 1): Rgb => {
    const c = new THREE.Color(hex).convertSRGBToLinear();
    return [c.r * k, c.g * k, c.b * k];
  };
  const shopColors = [...theme.stalls.map(([a]) => a), '#1f3b2d', '#22334d', '#5a2a2a', '#2f2f2f'];
  const inputs: BlockInput[] = map.buildings.map((b, bi) => {
    const landmark = landmarkOf.get(bi);
    const wallHex =
      (landmark ? LANDMARK_COLORS[landmark] : undefined) ??
      theme.wallColors[Math.floor(hash(bi) * theme.wallColors.length)];
    const seed = hash(bi + 11);
    const plain = landmark === 'church' || landmark === 'home' || b.h > 30 || b.a < 30;
    const shops = landmark === 'chop' || (!plain && hash(bi + 5) < look.shopShare);
    return {
      pts: toPoints(b.p),
      h: landmark === 'church' ? Math.max(b.h, 13) : b.h,
      wall: rgb(wallHex, 0.86 + hash(bi + 7) * 0.2),
      roof: rgb(theme.roof.colors[Math.floor(hash(bi + 3) * theme.roof.colors.length)]),
      shop: shops ? rgb(shopColors[Math.floor(hash(bi + 9) * shopColors.length)]) : null,
      seed,
    };
  });
  const blocks = buildBlocks(
    inputs,
    {
      roof: look.roof,
      pitch: theme.roof.pitch * 0.3,
      groundFloor: 3.6,
      parapet: look.roof === 'flat' ? 0.8 : 0,
      chimneys: look.roof !== 'flat',
      tanks: theme.rooftopClutter,
    },
    triangulate,
  );

  const cutaway = (g0: Geo, mat: THREE.Material, shadow = true) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(g0.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(g0.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(g0.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(g0.u, 2));
    g.setIndex(g0.i);
    addCutaway(mat, cut);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  // outer faces only: walls face outwards, so a see-through hole shows the street, not the rooms
  const lit = (map: THREE.Texture, emissiveMap: THREE.Texture) => {
    const m = new THREE.MeshLambertMaterial({
      vertexColors: true,
      map,
      emissive: lin(0xffc27a),
      emissiveMap,
      emissiveIntensity: 0,
    });
    m.userData.glass = false;
    facadeMats.push(m);
    return m;
  };
  cutaway(blocks.walls, lit(tex.wall, tex.wallLit));
  if (blocks.shops.i.length) cutaway(blocks.shops, lit(tex.shop, tex.shopLit));
  cutaway(blocks.roofs, new THREE.MeshLambertMaterial({ vertexColors: true, map: tex.roof }));
  if (blocks.awnings.i.length) {
    cutaway(blocks.awnings, new THREE.MeshLambertMaterial({ vertexColors: true, map: tex.awning }), false);
  }

  // chimneys on pitched roofs, water tanks on flat ones (one draw each)
  const placeAll = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    spots: [number, number, number][],
    lift: number,
  ) => {
    if (!spots.length) return;
    const im = new THREE.InstancedMesh(geo, mat, spots.length);
    const o = new THREE.Object3D();
    spots.forEach(([x, y, z], i) => {
      o.position.set(x, y + lift, z);
      o.rotation.y = hash(i) * Math.PI;
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.castShadow = true;
    scene.add(im);
  };
  placeAll(new THREE.BoxGeometry(0.7, 1.8, 0.9), M(0x8a4b37), blocks.chimneys, 0.9);
  placeAll(new THREE.CylinderGeometry(0.75, 0.75, 1.6, 10), M(0x1f2326), blocks.tanks, 0.8);

  // ---- trees: in parks and along some streets, drawn with instancing
  const treeSpots: { x: number; z: number; s: number }[] = [];
  const anchorsXZ = [map.anchors.home, map.anchors.church, map.anchors.chop, ...map.anchors.people];
  const free = (x: number, z: number) =>
    !collision.blocked(x, z, 1.4) && anchorsXZ.every((a) => Math.hypot(a.x - x, a.z - z) > 5);
  for (const flat of map.parks) {
    const pts = toPoints(flat);
    if (pts.length < 3) continue;
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const want = Math.min(60, Math.floor(((maxX - minX) * (maxZ - minZ)) / 140));
    for (let t = 0, got = 0; t < want * 6 && got < want; t++) {
      const x = minX + kit.rnd() * (maxX - minX);
      const z = minZ + kit.rnd() * (maxZ - minZ);
      if (pointInPolygon(x, z, pts) && free(x, z)) {
        treeSpots.push({ x, z, s: 0.8 + kit.rnd() * 0.7 });
        got++;
      }
    }
  }
  for (const r of map.roads) {
    if (r.w < 5.5 || r.k === 'steps') continue;
    const line = toPoints(r.p);
    const len = lineLength(line);
    let side = 1;
    for (let d = 14; d < len - 6; d += 26) {
      const p = pointAlong(line, d);
      const x = p.x + Math.cos(p.angle) * side * (r.w / 2 + 1.1);
      const z = p.z - Math.sin(p.angle) * side * (r.w / 2 + 1.1);
      side = -side;
      if (kit.rnd() < 0.5 && free(x, z)) treeSpots.push({ x, z, s: 0.7 + kit.rnd() * 0.5 });
    }
  }
  const cap = Math.min(treeSpots.length, 420);
  let treeMeshes: THREE.InstancedMesh[] = [];
  if (cap > 0) {
    const crowns = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
      cap,
    );
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.26, 2.4, 6), M(0x5e4632), cap);
    crowns.castShadow = true;
    const o = new THREE.Object3D();
    const tall = theme.palms; // palms: a tall thin trunk with a flat, wide crown
    const greens = [0x2f6b2a, 0x3a7d32, 0x4f8f3a, 0x285d24].map((c) => new THREE.Color(c).convertSRGBToLinear());
    for (let i = 0; i < cap; i++) {
      const t = treeSpots[i];
      o.position.set(t.x, (tall ? 3.6 : 1.2) * t.s, t.z);
      o.scale.set(t.s, (tall ? 3 : 1) * t.s, t.s);
      o.updateMatrix();
      trunks.setMatrixAt(i, o.matrix);
      o.position.set(t.x, (tall ? 7.6 : 3.3) * t.s, t.z);
      if (tall) o.scale.set(t.s * 1.7, t.s * 0.45, t.s * 1.7);
      else o.scale.set(t.s * 1.1, t.s * 0.95, t.s * 1.1);
      o.rotation.y = hash(i) * 6;
      o.updateMatrix();
      crowns.setMatrixAt(i, o.matrix);
      crowns.setColorAt(i, greens[i % greens.length]);
      o.rotation.y = 0;
    }
    scene.add(trunks);
    scene.add(crowns);
    treeMeshes = [trunks, crowns];
  }

  // ---- street lamps: a post and a head, dim by day and warm by night
  const lampSpots: Pt[] = [];
  for (const r of map.roads) {
    if (r.w < 5.5 || r.k === 'steps') continue;
    const line = toPoints(r.p);
    const len = lineLength(line);
    for (let d = 10; d < len - 4; d += 38) {
      const p = pointAlong(line, d);
      const x = p.x - Math.cos(p.angle) * (r.w / 2 + 0.5);
      const z = p.z + Math.sin(p.angle) * (r.w / 2 + 0.5);
      if (!collision.blocked(x, z, 0.5)) lampSpots.push([x, z]);
    }
  }
  const lampCap = Math.min(lampSpots.length, 200);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  if (lampCap > 0) {
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 5.2, 0.14), M(0x2b3330), lampCap);
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.22, 0.55), lampMat, lampCap);
    const o = new THREE.Object3D();
    for (let i = 0; i < lampCap; i++) {
      o.position.set(lampSpots[i][0], 2.6, lampSpots[i][1]);
      o.updateMatrix();
      posts.setMatrixAt(i, o.matrix);
      o.position.set(lampSpots[i][0], 5.3, lampSpots[i][1]);
      o.updateMatrix();
      heads.setMatrixAt(i, o.matrix);
    }
    scene.add(posts);
    scene.add(heads);
  }

  // ---- gold rings and beams for the places you can enter, and a sign on every landmark
  const markers: THREE.Mesh[] = [];
  const beams: THREE.Mesh[] = [];
  for (const id of ['home', 'church', 'chop'] as const) {
    const a = map.anchors[id];
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.9, 40), ringMat());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(a.x, 0.07, a.z);
    scene.add(ring);
    markers.push(ring);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.7, 3.5, 32, 1, true),
      new THREE.MeshBasicMaterial({
        map: TX['beam'],
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.set(a.x, 1.75, a.z);
    scene.add(beam);
    beams.push(beam);
  }
  for (const [id, lm] of Object.entries(map.anchors.landmarks)) {
    const b = map.buildings[lm.b];
    const top = id === 'church' ? Math.max(b.h, 13) : b.h;
    const [bg, fg, sx] = SIGN_STYLE[id] ?? ['#F2B705', '#111C17', 7];
    const text = places.get(id)?.sign;
    if (text) sign(text, lm.x, top + 3.2, lm.z, bg, fg, sx);
  }

  return {
    ground,
    markers,
    beams,
    smoke: [] as THREE.Sprite[],
    clouds: kit.makeClouds(),
    blocked: (x: number, z: number, r: number) => collision.blocked(x, z, r),
    /** Height of the building standing at a spot, 0 in the open. */
    heightAt: (x: number, z: number) => collision.heightAt(x, z),
    cut,
    /** Draws only this share (0 to 1) of the trees, for slower machines. */
    setTreeShare(share: number): void {
      for (const m of treeMeshes) m.count = Math.floor(cap * Math.max(0, Math.min(1, share)));
    },
    /** Lamp heads glow warmly as it gets dark. */
    setNight(n: number) {
      lampMat.color.setRGB(0.35 + 0.65 * n, 0.33 + 0.5 * n, 0.3 + 0.1 * n);
    },
  };
}
