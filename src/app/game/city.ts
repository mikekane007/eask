import * as THREE from 'three';
import type { Builders } from './builders';
import type { Kit } from './kit';
import { B, H, N, OFF, T, bC, bMin, markerPos, roadC } from './layout';
import type { City } from './types';

/** Ground, city blocks, landmark buildings and clouds. Returns what the render loop animates. */
export function createCity(scene: THREE.Scene, kit: Kit, builders: Builders, city: City) {
  const { theme, places } = city;
  const { lin, M, mesh, box, rnd, TX, sign, ringMat } = kit;
  const { building, gable, palm, shadeTree, umbrella, pole, wire, roofMat } = builders;
  /* ---------- ground ---------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(T + 16, T + 16),
    new THREE.MeshLambertMaterial({ map: TX['asphalt'] }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  TX['asphalt'].repeat.set((T + 16) / 8, (T + 16) / 8);
  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(T + 400, T + 400),
    new THREE.MeshLambertMaterial({ map: TX[theme.ground] }),
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.02;
  outer.receiveShadow = true;
  scene.add(outer);
  TX[theme.ground].repeat.set(60, 60);
  {
    // lane dashes (instanced)
    const geo = new THREE.PlaneGeometry(2.4, 0.22);
    geo.rotateX(-Math.PI / 2);
    const pts: number[][] = [];
    for (let k = 0; k <= N; k++)
      for (let s = -H + 3; s < H; s += 6) {
        pts.push([s, roadC(k), 0]);
        pts.push([roadC(k), s, 1]);
      }
    const im = new THREE.InstancedMesh(geo, M(0xe6cf6a), pts.length);
    const o = new THREE.Object3D();
    pts.forEach((p, i) => {
      o.position.set(p[0], 0.02, p[1]);
      o.rotation.set(0, p[2] ? Math.PI / 2 : 0, 0);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.receiveShadow = true;
    scene.add(im);
  }
  /* ---------- city blocks ---------- */
  const solids: { x0: number; x1: number; z0: number; z1: number }[] = [];
  const wallColors = theme.wallColors;
  const placeAt: Record<string, (typeof places)[number]> = {};
  places.forEach((l) => (placeAt[l.bi + ',' + l.bj] = l));
  const kerbMat = new THREE.MeshLambertMaterial({ map: TX['kerb'] });
  const paveMat = new THREE.MeshLambertMaterial({ map: TX['paving'] });
  const gutterMat = M(0x202020);

  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const x0 = bMin(i),
        z0 = bMin(j),
        cx = bC(i),
        cz = bC(j);
      solids.push({ x0, x1: x0 + B, z0, z1: z0 + B });
      const g = new THREE.PlaneGeometry(B + 1.8, B + 1.8);
      g.rotateX(-Math.PI / 2);
      mesh(g, gutterMat, cx, 0.012, cz, null, false).receiveShadow = true;
      box(B, 0.35, B, [kerbMat, kerbMat, paveMat, paveMat, kerbMat, kerbMat], cx, 0.175, cz);
      const L = placeAt[i + ',' + j];
      if (L) {
        const off = OFF[L.side];
        for (let n = -1; n <= 1; n += 2) {
          const w = 5.5,
            h = rnd() > 0.5 ? 3.1 : 6.2;
          const px = cx - off[0] * 5.5 + (off[1] ? n * 5.5 : 0),
            pz = cz - off[1] * 5.5 + (off[0] ? n * 5.5 : 0);
          building(w, h, w, wallColors[Math.floor(rnd() * wallColors.length)], px, pz, { door: false });
        }
      } else {
        // walled compound with a gate on the south side
        const yg = new THREE.PlaneGeometry(B - 2.4, B - 2.4);
        yg.rotateX(-Math.PI / 2);
        mesh(
          yg,
          new THREE.MeshLambertMaterial({ map: TX[theme.ground === 'grass' ? 'lawn' : 'yard'] }),
          cx,
          0.36,
          cz,
          null,
          false,
        ).receiveShadow = true;
        const wc = wallColors[Math.floor(rnd() * wallColors.length)];
        const wm = new THREE.MeshLambertMaterial({ color: lin(wc), map: TX['plaster'] });
        const inset = 1.2,
          len = B - inset * 2,
          wh = 1.7;
        box(len, wh, 0.3, wm, cx, 0.35 + wh / 2, z0 + inset);
        box(0.3, wh, len, wm, x0 + inset, 0.35 + wh / 2, cz);
        box(0.3, wh, len, wm, x0 + B - inset, 0.35 + wh / 2, cz);
        const half = (len - 3.4) / 2;
        box(half, wh, 0.3, wm, x0 + inset + half / 2, 0.35 + wh / 2, z0 + B - inset);
        box(half, wh, 0.3, wm, x0 + B - inset - half / 2, 0.35 + wh / 2, z0 + B - inset);
        box(
          3.4,
          1.9,
          0.15,
          [0x1f5d8c, 0x2e7d32, 0x8a1c1c, 0x333333][Math.floor(rnd() * 4)],
          cx,
          0.35 + 0.95,
          z0 + B - inset,
        );
        const n = rnd() > 0.4 ? 4 : 3;
        for (let k = 0; k < n; k++) {
          const w = 5 + rnd() * 2.4,
            d = 5 + rnd() * 2.4,
            f = rnd();
          const h = f < 0.45 ? 3.1 : f < 0.85 ? 6.2 : 9.3;
          const px = cx + (k % 2 ? 1 : -1) * 5,
            pz = cz + (k < 2 ? -1 : 1) * 5;
          if (n === 3 && k === 3) continue;
          building(w, h, d, wallColors[Math.floor(rnd() * wallColors.length)], px, pz);
        }
        if (n === 3) shadeTree(cx + 5, cz + 5, 1.1);
      }
      if (rnd() > 0.35) {
        if (theme.palms) palm(x0 + B - 0.9, z0 + 0.9, 6 + rnd() * 3);
        else shadeTree(x0 + B - 1.6, z0 + 1.6, 0.9);
      }
      if (rnd() > 0.6) {
        if (theme.palms) palm(x0 + 0.9, z0 + B - 0.9, 6 + rnd() * 3);
        else shadeTree(x0 + 1.6, z0 + B - 1.6, 0.8);
      }
      if (!L && rnd() > 0.55) umbrella(cx + (rnd() - 0.5) * 10, z0 + B - 0.6, theme.stalls[rnd() > 0.5 ? 0 : 1]);
    }
  // poles, lamps and sagging wires along every east-west street
  for (let j = 0; j < N; j++) {
    const z = bMin(j) + 0.5;
    let prev: { x: number; z: number } | null = null;
    for (let i = 0; i < N; i++) {
      const x = bMin(i) + 0.5;
      pole(x, z, (i + j) % 2 === 0);
      const p = { x, z };
      if (prev && theme.wires) wire(prev, p);
      prev = p;
    }
  }

  /* ---------- landmark buildings ---------- */
  const markers: THREE.Mesh[] = [];
  const beams: THREE.Mesh[] = [];
  const smoke: THREE.Sprite[] = [];
  places.forEach((L) => {
    const cx = bC(L.bi),
      cz = bC(L.bj);
    const off = OFF[L.side];
    const bx = cx + off[0] * (B / 2 - 6),
      bz = cz + off[1] * (B / 2 - 6);
    const w = off[0] ? 8 : 11,
      d = off[0] ? 11 : 8;
    const fx = bx + off[0] * (d / 2 + 0.4),
      fz = bz + off[1] * (d / 2 + 0.4);
    if (L.id === 'church') {
      const wm = new THREE.MeshLambertMaterial({ color: lin(0xf7f3ea), map: TX['plaster'] });
      box(11, 7, 10, wm, bx, 0.35 + 3.5, bz - 1);
      gable(11, 10, 3.2, roofMat(0xa0412d), bx, 7.35, bz - 1, false);
      [-3.5, 0, 3.5].forEach((o) => {
        box(0.12, 3.6, 1.2, 0x2e86c1, bx - 5.56, 4, bz - 1 + o);
        box(0.12, 3.6, 1.2, 0x2e86c1, bx + 5.56, 4, bz - 1 + o);
      });
      box(3.4, 12, 3.4, wm, bx, 0.35 + 6, bz + 3.6);
      const spire = mesh(new THREE.ConeGeometry(2.6, 3.4, 4), M(0xa0412d), bx, 12.35 + 1.7, bz + 3.6);
      spire.rotation.y = Math.PI / 4;
      box(0.35, 2.6, 0.35, 0xf2b705, bx, 16.6, bz + 3.6);
      box(1.6, 0.35, 0.35, 0xf2b705, bx, 17.1, bz + 3.6);
      box(1.8, 3, 0.15, 0x5a3a22, bx, 1.85, bz + 5.33);
      mesh(
        new THREE.CircleGeometry(0.8, 20),
        new THREE.MeshBasicMaterial({ color: 0xf2b705 }),
        bx,
        9,
        bz + 5.32,
      ).rotation.y = 0;
      box(5, 0.25, 1.6, 0xcfc8b8, bx, 0.47, bz + 6.2);
      box(4, 0.25, 1, 0xcfc8b8, bx, 0.72, bz + 6);
      shadeTree(bx - 7, bz + 3, 1);
      shadeTree(bx + 7, bz - 5, 0.9);
      sign(L.sign, fx, 10.5, fz + 1, '#111C17', '#F2B705', 8);
    } else if (L.id === 'chop') {
      building(w, 3.1, d, 0xe07a3f, bx, bz - 1, { flat: false });
      const aw = box(w + 1, 0.12, 3.4, roofMat(0xc06040), bx, 3.1, bz + off[1] * 4.2);
      aw.rotation.x = 0.12 * off[1];
      for (const s of [-1, 1]) box(0.15, 2.8, 0.15, 0x5e4632, bx + s * (w / 2), 1.75, bz + off[1] * 5.6);
      for (const s of [-3, 0, 3]) {
        box(2, 0.1, 0.9, 0x8a6a48, bx + s, 1.15, bz + off[1] * 4.4);
        box(2, 0.08, 0.35, 0x6a4a30, bx + s, 0.75, bz + off[1] * 4.4 - 0.7);
        box(2, 0.08, 0.35, 0x6a4a30, bx + s, 0.75, bz + off[1] * 4.4 + 0.7);
      }
      const pot = mesh(
        new THREE.CylinderGeometry(0.7, 0.55, 0.9, 14),
        M(0x2a2a2a),
        bx + w / 2 - 1,
        1,
        bz + off[1] * 4.6,
      );
      for (let s = 0; s < 6; s++) {
        const sp = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: TX['soft'],
            transparent: true,
            depthWrite: false,
            opacity: 0.5,
            color: 0xdddddd,
          }),
        );
        sp.position.set(pot.position.x, 1.6, pot.position.z);
        sp.userData['base'] = pot.position.clone();
        sp.userData['t'] = s / 6;
        scene.add(sp);
        smoke.push(sp);
      }
      umbrella(bx - w / 2 + 1, bz + off[1] * 6.4, theme.stalls[0]);
      sign(L.sign, fx, 5.6 + (theme.roof.pitch - 1.5) * 1.6, fz + off[1] * 1.5);
    } else if (L.id === 'home') {
      building(d, 3.1, w, 0xf3e2b3, bx - 0.6, bz, { flat: false, door: false });
      box(0.2, 2.8, w, 0x5e4632, bx + off[0] * (d / 2 + 1.4) - 0.6, 1.75, bz);
      const v = box(2.4, 0.12, w + 0.6, roofMat(0xb08070), bx + off[0] * (d / 2 + 0.4) - 0.6, 3.2, bz);
      v.rotation.z = -0.15 * off[0];
      box(0.12, 2.1, 1.2, 0x1f5d8c, bx + off[0] * (d / 2) - 0.55, 1.4, bz);
      for (let s = 0; s < 3; s++)
        mesh(
          new THREE.CylinderGeometry(0.35, 0.3, 0.7, 10),
          M([0x2e86c1, 0xd7263d, 0x27ae60][s]),
          bx + off[0] * (d / 2 + 0.9),
          0.7,
          bz - 2 + s * 0.9,
        );
      sign(L.sign, fx + off[0] * 1.2, 4.8 + (theme.roof.pitch - 1.5) * 1.6, fz, '#3DBE6E', '#111C17', 5);
    } else if (L.id === 'market') {
      const rm = roofMat(0xc9c9c9);
      for (let s = 0; s < 2; s++) {
        const zz = bz - 3 + s * 6;
        for (let p = 0; p < 4; p++) box(0.2, 3.4, 0.2, 0x555555, bx - 3 + (p % 2) * 6, 2, zz + (p < 2 ? -2 : 2));
        gable(7, 5, 1.2, rm, bx, 3.7, zz, true);
      }
      const cols = theme.stalls;
      for (let s = 0; s < 5; s++) umbrella(bx + off[0] * 5.2, bz - 6 + s * 3, cols[s % 3]);
      for (let s = 0; s < 6; s++)
        box(0.9, 0.9, 0.9, [0xe67e22, 0xf4d03f, 0x27ae60][s % 3], bx - 2 + (s % 3) * 2, 0.8, bz - 3 + (s > 2 ? 6 : 0));
      sign(L.sign, fx + off[0] * 2, 5.6, fz);
    } else if (L.id === 'tech') {
      building(w, 14, d, 0xffffff, bx, bz, { glass: true, flat: true, door: false });
      box(3, 2.4, 0.2, 0x1a1a1a, bx, 1.55, bz + off[1] * (d / 2 + 0.05));
      box(w + 2, 0.3, 2.2, 0xeeeeee, bx, 3, bz + off[1] * (d / 2 + 1));
      sign(L.sign, fx, 16.6, fz);
    } else if (L.id === 'site') {
      const cm = M(0x9a9690);
      for (let fl = 0; fl < 3; fl++) {
        box(w, 0.35, d, cm, bx, 0.35 + fl * 3.2 + 3, bz);
        for (let c = 0; c < 6; c++)
          box(
            0.4,
            3,
            0.4,
            cm,
            bx - w / 2 + 0.3 + ((c % 3) * (w - 0.6)) / 2,
            0.35 + fl * 3.2 + 1.5,
            bz - d / 2 + 0.3 + (c > 2 ? d - 0.6 : 0),
          );
      }
      for (let c = 0; c < 6; c++)
        box(
          0.06,
          1.2,
          0.06,
          0x6b4a2a,
          bx - w / 2 + 0.3 + ((c % 3) * (w - 0.6)) / 2,
          0.35 + 9.6 + 0.6,
          bz - d / 2 + 0.3 + (c > 2 ? d - 0.6 : 0),
        );
      box(w - 0.8, 1.8, 0.3, 0xbdb6aa, bx, 1.25, bz - d / 2 + 0.3);
      for (let s = 0; s < 7; s++)
        box(0.1, 9, 0.1, 0x8b6b3d, bx - w / 2 + s * (w / 6), 4.6, bz + off[1] * (d / 2 + 0.7));
      for (let s = 0; s < 3; s++) box(w, 0.1, 0.1, 0x8b6b3d, bx, 2 + s * 3, bz + off[1] * (d / 2 + 0.7));
      mesh(new THREE.ConeGeometry(1.6, 1.4, 10), M(0xd8b47a), bx + w / 2 + 1.2, 1.05, bz + off[1] * 3);
      for (let s = 0; s < 3; s++) box(1.2, 0.5, 0.9, 0xb9b3a8, bx - w / 2 - 0.4, 0.6 + s * 0.5, bz + off[1] * 2.5);
      sign(L.sign, fx, 12.6, fz);
    }
    if (!L.deco) {
      const mk = markerPos(L);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.9, 40), ringMat());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(mk.x, 0.05, mk.z);
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
      beam.position.set(mk.x, 1.75, mk.z);
      scene.add(beam);
      beams.push(beam);
    }
  });

  // clouds
  const clouds: THREE.Sprite[] = [];
  for (let c = 0; c < 10; c++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: TX['cloud'], transparent: true, depthWrite: false, opacity: 0.85, fog: false }),
    );
    s.scale.set(70 + rnd() * 40, 30 + rnd() * 12, 1);
    s.position.set((rnd() - 0.5) * 400, 90 + rnd() * 30, -120 - rnd() * 160);
    scene.add(s);
    clouds.push(s);
  }
  return { solids, markers, beams, smoke, clouds };
}
