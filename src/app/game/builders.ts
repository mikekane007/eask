import * as THREE from 'three';
import type { Kit } from './kit';
import type { CityTheme } from './types';

/** Reusable world pieces: buildings, palms, trees, market umbrellas, poles and wires. */
export function createBuilders(scene: THREE.Scene, kit: Kit, theme: CityTheme) {
  const { lin, M, mesh, box, rnd, TX, stripes } = kit;
  const facadeMats: THREE.MeshLambertMaterial[] = [];
  /** Roof material for the city: corrugated iron, or plain tile/slate. `fallback` is used for corrugated roofs. */
  function roofMat(fallback?: number) {
    if (theme.roof.kind === 'corrugated') {
      const c = fallback ?? theme.roof.colors[rnd() > 0.5 ? 0 : 1];
      return new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(c) });
    }
    return new THREE.MeshLambertMaterial({
      color: lin(theme.roof.colors[Math.floor(rnd() * theme.roof.colors.length)]),
    });
  }
  function scaleBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, su: number, sv: number) {
    const uv = geo.attributes['uv'];
    const dims = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
    for (let f = 0; f < 6; f++)
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, (uv.getX(i) * dims[f][0]) / su, (uv.getY(i) * dims[f][1]) / sv);
      }
    uv.needsUpdate = true;
    return geo;
  }
  function facadeMat(c: number, glass: boolean) {
    const m = new THREE.MeshLambertMaterial({
      color: lin(c),
      map: glass ? TX['glass'] : TX['facade'],
      emissive: lin(0xffc27a),
      emissiveMap: glass ? null : TX['lit'],
      emissiveIntensity: 0,
    });
    m.userData.glass = glass;
    facadeMats.push(m);
    return m;
  }
  function gable(
    w: number,
    d: number,
    hh: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    alongZ = true,
  ) {
    const sh = new THREE.Shape();
    const W = (alongZ ? w : d) + 0.9;
    sh.moveTo(-W / 2, 0);
    sh.lineTo(0, hh);
    sh.lineTo(W / 2, 0);
    sh.lineTo(-W / 2, 0);
    const L = (alongZ ? d : w) + 0.9;
    const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false });
    g.translate(0, 0, -L / 2);
    if (!alongZ) g.rotateY(Math.PI / 2);
    return mesh(g, mat, x, y, z);
  }
  function polytank(x: number, y: number, z: number, s = 1) {
    const t = mesh(new THREE.CylinderGeometry(0.7 * s, 0.75 * s, 1.5 * s, 14), M(0x1b1b1b), x, y + 0.75 * s, z);
    mesh(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, 0.2 * s, 10), M(0x1b1b1b), x, y + 1.55 * s, z);
    return t;
  }
  function building(
    w: number,
    h: number,
    d: number,
    color: number,
    x: number,
    z: number,
    { flat = null as boolean | null, glass = false, base = 0.35, door = true } = {},
  ) {
    const floors = Math.max(1, Math.round(h / 3.1));
    const geo = scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 6, 6.2);
    const fm = facadeMat(color, glass);
    const roofM = M(0xa7a49c);
    const b = mesh(geo, [fm, fm, roofM, roofM, fm, fm], x, base + h / 2, z);
    box(w + 0.12, 0.55, d + 0.12, theme.ground === 'laterite' ? 0x7d4a32 : 0x8b877e, x, base + 0.27, z); // plinth
    const isFlat = flat ?? floors > 1;
    const top = base + h;
    if (isFlat) {
      const pm = new THREE.MeshLambertMaterial({ color: lin(color) });
      box(w + 0.2, 0.5, 0.2, pm, x, top + 0.25, z - d / 2);
      box(w + 0.2, 0.5, 0.2, pm, x, top + 0.25, z + d / 2);
      box(0.2, 0.5, d, pm, x - w / 2, top + 0.25, z);
      box(0.2, 0.5, d, pm, x + w / 2, top + 0.25, z);
      if (theme.rooftopClutter && rnd() > 0.35) polytank(x + w / 4, top, z - d / 5);
      if (theme.rooftopClutter && rnd() > 0.6) {
        const dish = mesh(new THREE.CylinderGeometry(0.55, 0.1, 0.2, 14), M(0xeeeeee), x - w / 4, top + 0.9, z + d / 5);
        dish.rotation.x = -0.9;
        box(0.08, 0.8, 0.08, 0x777777, x - w / 4, top + 0.4, z + d / 5);
      }
    } else {
      gable(w, d, theme.roof.pitch, roofMat(), x, top, z, w < d);
    }
    if (door)
      box(
        1.2,
        2.1,
        0.12,
        [0x2e7d32, 0x1f5d8c, 0x7a4a2a, 0x8a1c1c][Math.floor(rnd() * 4)],
        x + (rnd() - 0.5) * (w - 2.4),
        base + 1.05,
        z + d / 2 + 0.05,
      );
    return b;
  }
  function palm(x: number, z: number, hgt = 7) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    const lean = (rnd() - 0.5) * 0.25;
    let px = 0,
      py = 0;
    for (let s = 0; s < 5; s++) {
      const seg = hgt / 5;
      const m = mesh(
        new THREE.CylinderGeometry(0.17 + 0.02 * (4 - s), 0.2 + 0.02 * (4 - s), seg + 0.05, 7),
        M(0x7d6143),
        px,
        py + seg / 2,
        0,
        g,
      );
      m.rotation.z = -lean;
      px += Math.sin(lean) * seg;
      py += seg;
    }
    const fg = new THREE.ConeGeometry(0.5, 3.8, 4);
    fg.translate(0, 1.9, 0);
    fg.scale(1, 1, 0.14);
    const fg2 = new THREE.ConeGeometry(0.32, 2.2, 4);
    fg2.translate(0, 1.1, 0);
    fg2.scale(1, 1, 0.14);
    for (let f = 0; f < 9; f++) {
      const fr = mesh(fg, M(f % 2 ? 0x3f8f3a : 0x2f7a33), px, py, 0, g);
      fr.rotation.order = 'YXZ';
      fr.rotation.y = (f * Math.PI * 2) / 9 + rnd() * 0.3;
      fr.rotation.x = 1.5 + rnd() * 0.35;
    }
    for (let f = 0; f < 5; f++) {
      const fr = mesh(fg2, M(0x4a9a3e), px, py + 0.1, 0, g);
      fr.rotation.order = 'YXZ';
      fr.rotation.y = (f * Math.PI * 2) / 5 + 0.4;
      fr.rotation.x = 0.7;
    }
    for (let c = 0; c < 3; c++)
      mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        M(0x5a7a2a),
        px + Math.cos(c * 2.1) * 0.3,
        py - 0.25,
        Math.sin(c * 2.1) * 0.3,
        g,
      );
  }
  function shadeTree(x: number, z: number, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.28 * s, 0.4 * s, 3 * s, 8), M(0x5e4632), 0, 1.5 * s, 0, g);
    const cols = [0x2f6b2a, 0x3a7d32, 0x285d24];
    for (let i = 0; i < 4; i++) {
      const r = (1.4 + rnd() * 0.8) * s;
      mesh(
        new THREE.IcosahedronGeometry(r, 1),
        new THREE.MeshLambertMaterial({
          color: lin(cols[i % 3]),
          flatShading: true,
        } as THREE.MeshLambertMaterialParameters),
        (rnd() - 0.5) * 2 * s,
        3.4 * s + rnd() * 1.2 * s,
        (rnd() - 0.5) * 2 * s,
        g,
      );
    }
  }
  function umbrella(x: number, z: number, cols: string[], parent?: THREE.Object3D) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    (parent ?? scene).add(g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), M(0xdddddd), 0, 1.6, 0, g);
    mesh(
      new THREE.ConeGeometry(1.5, 0.6, 8, 1, true),
      new THREE.MeshLambertMaterial({ map: stripes(cols, 8), side: THREE.DoubleSide }),
      0,
      2.9,
      0,
      g,
    );
    box(1.6, 0.08, 1, 0x8a6a48, 0, 1.05, 0, g);
    box(0.08, 1, 0.08, 0x6a4a30, -0.7, 0.55, -0.4, g);
    box(0.08, 1, 0.08, 0x6a4a30, 0.7, 0.55, 0.4, g);
    const goods = [0xe74c3c, 0xf39c12, 0x27ae60, 0xf4d03f, 0x8e44ad];
    for (let i = 0; i < 5; i++)
      mesh(new THREE.SphereGeometry(0.15, 8, 6), M(goods[i]), -0.55 + i * 0.27, 1.2, (rnd() - 0.5) * 0.4, g);
    return g;
  }
  const lampGlows: (THREE.Sprite | THREE.Mesh)[] = [];
  function pole(x: number, z: number, lamp: boolean) {
    mesh(new THREE.CylinderGeometry(0.1, 0.13, 7.4, 6), M(theme.wires ? 0x6b4f35 : 0x33403b), x, 3.7, z);
    box(1.4, 0.08, 0.08, theme.wires ? 0x6b4f35 : 0x33403b, x, 6.8, z);
    if (lamp) {
      box(0.9, 0.08, 0.08, 0x444444, x + 0.5, 6.2, z + 0.3);
      mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xfff2c0 }),
        x + 0.9,
        6.1,
        z + 0.3,
        null,
        false,
      );
      const gl = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: TX['glow'],
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      gl.scale.set(5, 5, 1);
      gl.position.set(x + 0.9, 6.05, z + 0.3);
      scene.add(gl);
      lampGlows.push(gl);
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 20),
        new THREE.MeshBasicMaterial({
          map: TX['glow'],
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x + 1.5, 0.06, z + 1.2);
      scene.add(pool);
      lampGlows.push(pool);
    }
  }
  function wire(a: { x: number; z: number }, b: { x: number; z: number }) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, 6.8 - Math.sin(t * Math.PI) * 0.7, a.z + (b.z - a.z) * t));
    }
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x151515 })),
    );
  }
  return { facadeMats, lampGlows, gable, polytank, building, palm, shadeTree, umbrella, pole, wire, roofMat };
}

export type Builders = ReturnType<typeof createBuilders>;
