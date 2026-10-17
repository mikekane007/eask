import * as THREE from 'three';
import type { Avatar } from './avatar';
import { createBodies } from './bodies';
import type { GameService } from './game.service';
import type { Kit } from './kit';
import { B, bMin, roadC } from './layout';
import { npcLook } from './npc-look';
import type { City } from './types';

/** The player and the people on the street. */
export function createCharacters(scene: THREE.Scene, kit: Kit, svc: GameService, city: City) {
  const { theme } = city;
  const { TX, canvasTex, waxPrint, signTex, ringMat } = kit;
  const { makePerson, makeHero } = createBodies(kit);
  // The player is a stable group (the engine moves and animates it); its body is swapped when the look changes.
  const player = new THREE.Group();
  let body: THREE.Group | null = null;
  function setAvatar(a: Avatar): void {
    if (body) {
      player.remove(body);
      body.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const geo = o.geometry as THREE.BufferGeometry;
          if (!geo.userData['shared']) geo.dispose();
        }
      });
    }
    body = makeHero(a);
    player.add(body);
    player.userData['legs'] = body.userData['legs'];
    player.userData['arms'] = body.userData['arms'];
  }
  setAvatar(svc.avatar());
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
  const npcs = city.people
    .filter((P) => !P.phone)
    .map((P, n) => {
      const look = npcLook(P, n, theme);
      const women = look.female;
      const c = new THREE.Color(P.shirt).getStyle();
      const print = waxPrint(
        c,
        ['#F4EEDC', '#111C17', '#F2B705', '#1E8A4C'][n % 4],
        ['#D7263D', '#2E86C1', '#F4EEDC', '#111C17'][(n + 1) % 4],
        n % 3,
      );
      const g = makePerson({
        print: theme.waxPrint && (women || n % 2) ? print : null,
        shirt: look.shirt,
        skin: look.skin,
        hair: look.hair,
        pants: [0x1d2a36, 0x3b2a20, 0x2c3e50, 0x4a4a3a][n % 4],
        dress: women,
        wrap: theme.waxPrint && women && n % 2 ? print : null,
        style: look.style,
        scarf: look.scarf,
      });
      // Each person paces a short straight stretch of street: from the real map if there is one, else the grid.
      const [axis, k, blk, frac] = P.spot;
      const realPeople = svc.realMap()?.anchors.people;
      let seg: [number, number, number, number];
      let start = frac;
      if (realPeople?.length) {
        seg = realPeople[n % realPeople.length].seg;
        start = 0.5;
      } else {
        const lane = roadC(k) + (n % 2 ? 4.2 : -4.2);
        const a = bMin(blk) + B * 0.15;
        const b = bMin(blk) + B * 0.85;
        seg = axis === 'h' ? [a, lane, b, lane] : [lane, a, lane, b];
      }
      g.userData['path'] = {
        x0: seg[0],
        z0: seg[1],
        x1: seg[2],
        z1: seg[3],
        len: Math.hypot(seg[2] - seg[0], seg[3] - seg[1]),
        t: start,
        dir: 1,
      };
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

  return { player, npcs, S0, setAvatar, buildHero: makeHero };
}
