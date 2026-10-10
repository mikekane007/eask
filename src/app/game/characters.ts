import * as THREE from 'three';
import type { GameService } from './game.service';
import type { Kit, Tex } from './kit';
import { B, bMin, roadC } from './layout';
import type { City } from './types';

/** The player and the people on the street. */
export function createCharacters(scene: THREE.Scene, kit: Kit, svc: GameService, city: City) {
  const { theme } = city;
  const { M, mesh, box, TX, canvasTex, waxPrint, signTex, ringMat } = kit;
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
  const npcs = city.people.map((P, n) => {
    const women = P.female === true;
    const c = new THREE.Color(P.shirt).getStyle();
    const print = waxPrint(
      c,
      ['#F4EEDC', '#111C17', '#F2B705', '#1E8A4C'][n % 4],
      ['#D7263D', '#2E86C1', '#F4EEDC', '#111C17'][(n + 1) % 4],
      n % 3,
    );
    const g = makePerson({
      print: theme.waxPrint && (women || n % 2) ? print : null,
      shirt: P.shirt,
      skin: P.skin ?? theme.skins[n % theme.skins.length],
      hair: P.hair,
      pants: [0x1d2a36, 0x3b2a20, 0x2c3e50, 0x4a4a3a][n % 4],
      dress: women,
      wrap: theme.waxPrint && women && n % 2 ? print : null,
    });
    const [axis, k, blk, frac] = P.spot;
    const lane = roadC(k) + (n % 2 ? 4.2 : -4.2);
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

  return { player, npcs, S0 };
}
