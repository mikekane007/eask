import * as THREE from 'three';
import type { GameService } from './game.service';
import type { Kit, Tex } from './kit';
import { B, N, T, bMin, roadC } from './layout';
import { PEOPLE } from './people.data';

/** The player, the ten people on the street and the tro-tros. */
export function createCharacters(scene: THREE.Scene, kit: Kit, svc: GameService) {
  const { M, mesh, box, rnd, TX, canvasTex, waxPrint, signTex, ringMat } = kit;
  interface PersonOpts {
    shirt?: number;
    skin?: number;
    pants?: number;
    dress?: boolean;
    print?: Tex | null;
    wrap?: Tex | null;
    hair?: number;
  }
  function makePerson({
    shirt = 0xd7263d,
    skin = 0x5b3a24,
    pants = 0x1d2a36,
    dress = false,
    print = null,
    wrap = null,
    hair = 0x15100c,
  }: PersonOpts = {}) {
    const g = new THREE.Group();
    const skinM = M(skin);
    const clothM = print ? new THREE.MeshLambertMaterial({ map: print }) : M(shirt);
    const legs: THREE.Group[] = [],
      arms: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set(0.19 * s, 1.02, 0);
      g.add(pv);
      mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.95, 8), dress ? skinM : M(pants), 0, -0.48, 0, pv);
      mesh(new THREE.BoxGeometry(0.24, 0.16, 0.44), M(0x2a1f1a), 0, -0.98, 0.07, pv);
      legs.push(pv);
    }
    if (dress) mesh(new THREE.CylinderGeometry(0.38, 0.66, 1, 14), clothM, 0, 0.78, 0, g);
    else mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.28, 12), M(pants), 0, 1.02, 0, g);
    mesh(new THREE.CylinderGeometry(0.47, 0.37, 1, 12), clothM, 0, 1.62, 0, g);
    mesh(new THREE.SphereGeometry(0.47, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), clothM, 0, 2.1, 0, g).scale.set(
      1,
      0.35,
      1,
    );
    for (const s of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set(0.56 * s, 2.05, 0);
      g.add(pv);
      mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.42, 8), clothM, 0, -0.18, 0, pv);
      mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8), skinM, 0, -0.68, 0, pv);
      mesh(new THREE.SphereGeometry(0.12, 8, 6), skinM, 0, -1, 0, pv);
      pv.rotation.z = 0.08 * s;
      arms.push(pv);
    }
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.25, 8), skinM, 0, 2.22, 0, g);
    const head = mesh(new THREE.SphereGeometry(0.36, 16, 12), skinM, 0, 2.58, 0, g);
    head.scale.set(1, 1.08, 1);
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.045, 6, 4), M(0x111111), 0.13 * s, 2.62, 0.32, g, false);
    if (wrap) {
      const w = mesh(
        new THREE.CylinderGeometry(0.4, 0.36, 0.42, 14),
        new THREE.MeshLambertMaterial({ map: wrap }),
        0,
        2.92,
        -0.03,
        g,
      );
      w.rotation.x = -0.2;
      mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshLambertMaterial({ map: wrap }), 0.15, 3.12, -0.1, g);
    } else mesh(new THREE.SphereGeometry(0.375, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), M(hair), 0, 2.62, -0.02, g);
    g.userData['legs'] = legs;
    g.userData['arms'] = arms;
    return g;
  }
  const player = makePerson({ print: TX['kente'], pants: 0x22303c });
  {
    const arms = player.userData['arms'] as THREE.Group[];
    const bk = box(0.42, 0.55, 0.14, 0x1a1a1a, 0, 0, 0, arms[1]);
    bk.position.set(0, -0.95, 0.18);
    box(0.06, 0.3, 0.15, 0xf2b705, 0, -0.95, 0.19, arms[1]);
    arms[1].rotation.x = -0.5;
  }
  scene.add(player);
  const S0 = svc.state();
  player.position.set(S0.x, 0, S0.z);
  // player halo so you can always find yourself
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ map: TX['glow'], transparent: true, depthWrite: false, opacity: 0.5 }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  player.add(halo);

  const BUBBLE = canvasTex(128, 128, (g) => {
    g.fillStyle = 'rgba(0,0,0,.3)';
    g.beginPath();
    g.arc(66, 58, 46, 0, 7);
    g.fill();
    g.fillStyle = '#F4EEDC';
    g.beginPath();
    g.arc(62, 54, 46, 0, 7);
    g.fill();
    g.beginPath();
    g.moveTo(40, 90);
    g.lineTo(34, 120);
    g.lineTo(66, 96);
    g.fill();
    g.fillStyle = '#F2B705';
    g.font = '64px Bungee, Impact, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('?', 62, 58);
  });
  const SKINS = [0x5b3a24, 0x4a2f1d, 0x6b4630, 0x3e2716];
  const npcs = PEOPLE.map((P, n) => {
    const women = ['abena', 'efua', 'ama', 'esi', 'akos'].includes(P.id);
    const c = new THREE.Color(P.shirt).getStyle();
    const print = waxPrint(
      c,
      ['#F4EEDC', '#111C17', '#F2B705', '#1E8A4C'][n % 4],
      ['#D7263D', '#2E86C1', '#F4EEDC', '#111C17'][(n + 1) % 4],
      n % 3,
    );
    const g = makePerson({
      print: women || n % 2 ? print : null,
      shirt: P.shirt,
      skin: SKINS[n % 4],
      pants: [0x1d2a36, 0x3b2a20, 0x2c3e50, 0x4a4a3a][n % 4],
      dress: women,
      wrap: women && n % 2 ? print : null,
    });
    const [axis, k, blk, frac] = P.spot;
    const lane = roadC(k) + (n % 2 ? 2.5 : -2.5);
    const a = bMin(blk) + B * 0.15,
      b = bMin(blk) + B * 0.85;
    g.userData['path'] = { axis, lane, a, b, t: frac, dir: 1 };
    const tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: signTex(P.name.toUpperCase(), '#111C17', '#F4EEDC', 512, 140, 56),
        depthWrite: false,
        transparent: true,
      }),
    );
    tag.scale.set(3.4, 0.93, 1);
    tag.position.y = 3.65;
    g.add(tag);
    const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: BUBBLE, depthWrite: false, transparent: true }));
    bub.scale.set(1.3, 1.3, 1);
    bub.position.y = 4.7;
    g.add(bub);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.55, 32), ringMat());
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);
    g.userData['ring'] = ring;
    g.userData['bub'] = bub;
    g.userData['P'] = P;
    scene.add(g);
    return g;
  });

  // tro-tros with painted slogans on the back
  const SLOGANS = ['GOD IS GOOD', 'NO KING AS GOD', 'PSALM 23', 'BY HIS GRACE', 'JESUS NEVER FAILS'];
  function makeTro(col: number, slogan: string) {
    const g = new THREE.Group();
    box(2.3, 1.1, 5, col, 0, 1.05, 0, g);
    const winT = canvasTex(256, 64, (c, w, h) => {
      c.fillStyle = '#f4f1ea';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        c.fillStyle = '#22313c';
        c.fillRect(8 + i * 41, 10, 34, 42);
      }
    });
    const wm = new THREE.MeshLambertMaterial({ map: winT });
    box(2.3, 1.05, 4.7, [wm, wm, M(0xf4f1ea), M(0xf4f1ea), M(0x22313c), M(0xf4f1ea)], 0, 2.12, -0.1, g);
    box(2.1, 0.1, 3.6, 0x333333, 0, 2.72, -0.3, g);
    for (let i = 0; i < 3; i++)
      box(
        0.7 + rnd() * 0.4,
        0.45,
        0.8,
        [0x8e44ad, 0x2e86c1, 0xc0392b, 0xf4d03f][i % 4],
        -0.6 + i * 0.6,
        3,
        -1.2 + i * 0.9,
        g,
      );
    [
      [-1.15, 1.6],
      [1.15, 1.6],
      [-1.15, -1.6],
      [1.15, -1.6],
    ].forEach(([x, z]) => {
      const w = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 14), M(0x161616), x, 0.5, z, g);
      w.rotation.z = Math.PI / 2;
      const hc = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.37, 10), M(0xbbbbbb), x, 0.5, z, g);
      hc.rotation.z = Math.PI / 2;
    });
    for (const s of [-1, 1])
      mesh(
        new THREE.BoxGeometry(0.4, 0.25, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xfff6d0 }),
        0.8 * s,
        1.25,
        2.53,
        g,
        false,
      );
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.8),
      new THREE.MeshBasicMaterial({ map: signTex(slogan, '#111C17', '#F2B705', 512, 180, 58) }),
    );
    back.position.set(0, 2.1, -2.47);
    back.rotation.y = Math.PI;
    g.add(back);
    return g;
  }
  const tros: THREE.Group[] = [];
  const troCols = [0xf2b705, 0x2e86c1, 0xe9e9e9, 0xd7263d, 0x1e8a4c];
  for (let n = 0; n < 5; n++) {
    const g = makeTro(troCols[n % 5], SLOGANS[n]);
    const horiz = n % 2 === 0,
      k = n < 2 ? 0 : N,
      dir = n % 3 ? 1 : -1;
    g.userData = { horiz, k, dir, t: rnd() * T, speed: 7 + rnd() * 5 };
    g.rotation.y = horiz ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : dir > 0 ? 0 : Math.PI;
    scene.add(g);
    tros.push(g);
  }
  return { player, npcs, tros, S0 };
}
