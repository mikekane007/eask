import * as THREE from 'three';
import type { Kit } from '../kit';
import type { City, CityTheme, Place } from '../types';
import { MapCollision } from './collision';
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
  {
    vec3 ab = uTarget - uCam;
    float t = dot(vWorldPos - uCam, ab) / dot(ab, ab);
    if (t > 0.0 && t < 0.97 && distance(vWorldPos, uCam + ab * t) < uR) discard;
  }`,
      );
  };
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
    uR: { value: 3.6 },
  };

  // ---- ground
  const margin = 80;
  const paving = TX['paving'].clone();
  paving.needsUpdate = true;
  paving.repeat.set((map.w + margin * 2) / 5, (map.h + margin * 2) / 5);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(map.w + margin * 2, map.h + margin * 2),
    new THREE.MeshLambertMaterial({ map: paving, color: lin(theme.ground === 'laterite' ? 0xb99a74 : 0xb8af9a) }),
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
  const roadGeo = (drive: boolean, y: number) => {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (const r of map.roads) {
      if ((r.d === 1) !== drive) continue;
      const rb = ribbon(toPoints(r.p), r.w);
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
  for (const m of [drive, walk]) {
    m.receiveShadow = true;
    scene.add(m);
  }

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

  // ---- buildings: every footprint in one walls mesh and one roofs mesh
  const places = new Map<string, Place>(city.places.map((p) => [p.id, p]));
  const landmarkOf = new Map<number, string>();
  for (const [id, lm] of Object.entries(map.anchors.landmarks)) landmarkOf.set(lm.b, id);

  const wp: number[] = [];
  const wn: number[] = [];
  const wu: number[] = [];
  const wc: number[] = [];
  const wi: number[] = [];
  const rp: number[] = [];
  const rn: number[] = [];
  const rc: number[] = [];
  const ri: number[] = [];
  const col = new THREE.Color();
  map.buildings.forEach((b, bi) => {
    const pts = toPoints(b.p);
    const n = pts.length;
    const landmark = landmarkOf.get(bi);
    const h = landmark === 'church' ? Math.max(b.h, 13) : b.h;
    const wallHex =
      (landmark ? LANDMARK_COLORS[landmark] : undefined) ??
      theme.wallColors[Math.floor(hash(bi) * theme.wallColors.length)];
    col.setHex(wallHex).convertSRGBToLinear();
    const shade = 0.86 + hash(bi + 7) * 0.2;
    const wr = col.r * shade;
    const wg = col.g * shade;
    const wb = col.b * shade;
    const cx = pts.reduce((s, p) => s + p[0], 0) / n;
    const cz = pts.reduce((s, p) => s + p[1], 0) / n;

    let run = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % n];
      const dx = c[0] - a[0];
      const dz = c[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      let nx = dz / len;
      let nz = -dx / len;
      if (nx * ((a[0] + c[0]) / 2 - cx) + nz * ((a[1] + c[1]) / 2 - cz) < 0) {
        nx = -nx;
        nz = -nz;
      }
      const base = wp.length / 3;
      wp.push(a[0], 0, a[1], c[0], 0, c[1], c[0], h, c[1], a[0], h, a[1]);
      for (let k = 0; k < 4; k++) wn.push(nx, 0, nz);
      const u0 = run / 6;
      const u1 = (run + len) / 6;
      wu.push(u0, 0, u1, 0, u1, h / 6.2, u0, h / 6.2);
      for (let k = 0; k < 4; k++) wc.push(wr, wg, wb);
      wi.push(base, base + 1, base + 2, base, base + 2, base + 3);
      run += len;
    }

    const tri = triangulate(pts);
    if (tri.length) {
      const base = rp.length / 3;
      const roofHex = theme.roof.colors[Math.floor(hash(bi + 3) * theme.roof.colors.length)];
      col.setHex(roofHex).convertSRGBToLinear();
      for (const [x, z] of pts) {
        rp.push(x, h + 0.02, z);
        rn.push(0, 1, 0);
        rc.push(col.r, col.g, col.b);
      }
      for (const i of tri) ri.push(base + i);
    }
  });

  const cutaway = (
    geoms: { p: number[]; n: number[]; c: number[]; i: number[]; u?: number[] },
    mat: THREE.Material,
  ) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(geoms.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(geoms.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(geoms.c, 3));
    if (geoms.u) g.setAttribute('uv', new THREE.Float32BufferAttribute(geoms.u, 2));
    g.setIndex(geoms.i);
    addCutaway(mat, cut);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const wallMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: TX['facade'],
    emissive: lin(0xffc27a),
    emissiveMap: TX['lit'],
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
  });
  wallMat.userData.glass = false;
  facadeMats.push(wallMat);
  cutaway({ p: wp, n: wn, c: wc, i: wi, u: wu }, wallMat);
  cutaway(
    { p: rp, n: rn, c: rc, i: ri },
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  );

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
    cut,
    /** Lamp heads glow warmly as it gets dark. */
    setNight(n: number) {
      lampMat.color.setRGB(0.35 + 0.65 * n, 0.33 + 0.5 * n, 0.3 + 0.1 * n);
    },
  };
}
