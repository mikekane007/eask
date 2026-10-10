import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { type Avatar, HAIR_COLORS, HAIR_STYLES, type HairStyle, OUTFITS, SKIN_TONES } from './avatar';
import type { GameService } from './game.service';
import type { Kit, Tex } from './kit';
import { B, bMin, roadC } from './layout';
import { npcLook } from './npc-look';
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
    style?: HairStyle;
    /** Colour of a scarf round the neck, if any. */
    scarf?: number | null;
  }
  const mergeAll = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => {
    const merged = BufferGeometryUtils.mergeBufferGeometries(parts.map((p) => p.toNonIndexed()));
    for (const p of parts) p.dispose();
    // shared by everyone in the city: never disposed when one character is rebuilt
    merged.userData['shared'] = true;
    return merged;
  };
  /** A smooth round body part from a side profile of [radius, height] pairs, flattened front to back. */
  const turned = (profile: [number, number][], depth: number) =>
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      18,
    ).scale(1, 1, depth);
  // Every body part is built once and shared by everyone in the city.
  const LEG = mergeAll([new THREE.CylinderGeometry(0.14, 0.105, 0.95, 12).translate(0, -0.48, 0)]);
  const SHOE = mergeAll([new THREE.SphereGeometry(0.15, 12, 8).scale(0.9, 0.55, 1.55).translate(0, -0.96, 0.08)]);
  const HIPS = mergeAll([new THREE.CylinderGeometry(0.37, 0.35, 0.3, 16).scale(1, 1, 0.85).translate(0, 1.02, 0)]);
  // chest, waist and sloping shoulders in one curve, rising into the neck
  const TORSO = mergeAll([
    turned(
      [
        [0.34, 1.1],
        [0.37, 1.3],
        [0.44, 1.62],
        [0.47, 1.86],
        [0.43, 2.03],
        [0.28, 2.15],
        [0.14, 2.2],
      ],
      0.8,
    ),
  ]);
  const TORSO_F = mergeAll([
    turned(
      [
        [0.33, 1.1],
        [0.31, 1.32],
        [0.4, 1.66],
        [0.42, 1.86],
        [0.38, 2.03],
        [0.25, 2.15],
        [0.13, 2.2],
      ],
      0.8,
    ),
  ]);
  // a skirt that flares from the waist
  const DRESS = mergeAll([
    turned(
      [
        [0.64, 0.28],
        [0.6, 0.45],
        [0.45, 0.95],
        [0.34, 1.3],
      ],
      0.9,
    ),
  ]);
  const SLEEVE = mergeAll([
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.CylinderGeometry(0.14, 0.125, 0.45, 10).translate(0, -0.2, 0),
  ]);
  const FOREARM = mergeAll([
    new THREE.CylinderGeometry(0.11, 0.09, 0.56, 10).translate(0, -0.68, 0),
    new THREE.SphereGeometry(0.11, 10, 8).scale(0.85, 1.15, 0.7).translate(0, -1.0, 0),
  ]);
  // neck, head, ears and nose: one shape in the skin colour
  const HEAD = mergeAll([
    new THREE.CylinderGeometry(0.13, 0.15, 0.25, 10).translate(0, 2.22, 0),
    new THREE.SphereGeometry(0.36, 20, 16).scale(0.95, 1.1, 1).translate(0, 2.58, 0),
    new THREE.SphereGeometry(0.07, 8, 6).scale(0.5, 1, 0.8).translate(-0.34, 2.58, 0),
    new THREE.SphereGeometry(0.07, 8, 6).scale(0.5, 1, 0.8).translate(0.34, 2.58, 0),
    new THREE.SphereGeometry(0.055, 8, 6).scale(0.8, 1, 1).translate(0, 2.53, 0.36),
  ]);
  const EYE_WHITES = mergeAll([
    // flattened so they sit on the face rather than bulge out of it
    new THREE.SphereGeometry(0.07, 10, 8).scale(1, 1, 0.45).translate(-0.13, 2.63, 0.315),
    new THREE.SphereGeometry(0.07, 10, 8).scale(1, 1, 0.45).translate(0.13, 2.63, 0.315),
  ]);
  // pupils and a smile (the lower half of a ring)
  const FACE = mergeAll([
    new THREE.SphereGeometry(0.038, 8, 6).scale(1, 1, 0.5).translate(-0.13, 2.63, 0.345),
    new THREE.SphereGeometry(0.038, 8, 6).scale(1, 1, 0.5).translate(0.13, 2.63, 0.345),
    new THREE.TorusGeometry(0.07, 0.015, 4, 10, Math.PI).rotateZ(Math.PI).translate(0, 2.5, 0.34),
  ]);
  const WRAP = mergeAll([
    new THREE.CylinderGeometry(0.4, 0.36, 0.42, 14).rotateX(-0.2).translate(0, 2.92, -0.03),
    new THREE.SphereGeometry(0.28, 10, 8).translate(0.15, 3.12, -0.1),
  ]);
  const BROWS = mergeAll([
    new THREE.BoxGeometry(0.13, 0.035, 0.03).translate(-0.13, 2.72, 0.33),
    new THREE.BoxGeometry(0.13, 0.035, 0.03).translate(0.13, 2.72, 0.33),
  ]);
  const cap = () => new THREE.SphereGeometry(0.375, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.1).translate(0, 2.62, -0.02);
  const HAIR: Record<HairStyle, THREE.BufferGeometry> = {
    short: mergeAll([cap()]),
    afro: mergeAll([new THREE.SphereGeometry(0.5, 14, 10).scale(1, 0.85, 1).translate(0, 2.75, -0.06)]),
    long: mergeAll([cap(), new THREE.CylinderGeometry(0.31, 0.22, 0.75, 10).translate(0, 2.3, -0.2)]),
    bun: mergeAll([cap(), new THREE.SphereGeometry(0.17, 10, 8).translate(0, 3.0, -0.2)]),
  };
  const SCARF = mergeAll([
    new THREE.TorusGeometry(0.27, 0.085, 6, 14).rotateX(Math.PI / 2).translate(0, 2.17, 0),
    new THREE.BoxGeometry(0.14, 0.42, 0.06).translate(0.12, 1.92, 0.3),
  ]);
  function makePerson({
    shirt = 0xd7263d,
    skin = 0x5b3a24,
    pants = 0x1d2a36,
    dress = false,
    print = null,
    wrap = null,
    hair = 0x15100c,
    style = 'short',
    scarf = null,
  }: PersonOpts = {}) {
    const g = new THREE.Group();
    const skinM = M(skin);
    const clothM = print ? new THREE.MeshLambertMaterial({ map: print }) : M(shirt);
    const legs: THREE.Group[] = [],
      arms: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set(0.18 * s, 1.02, 0);
      g.add(pv);
      mesh(LEG, dress ? skinM : M(pants), 0, 0, 0, pv);
      mesh(SHOE, M(0x2a1f1a), 0, 0, 0, pv);
      legs.push(pv);
    }
    mesh(dress ? DRESS : HIPS, dress ? clothM : M(pants), 0, 0, 0, g);
    const chest = mesh(dress ? TORSO_F : TORSO, clothM, 0, 0, 0, g);
    for (const s of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set((dress ? 0.5 : 0.55) * s, 2.02, 0);
      g.add(pv);
      mesh(SLEEVE, clothM, 0, 0, 0, pv);
      mesh(FOREARM, skinM, 0, 0, 0, pv);
      pv.rotation.z = 0.08 * s;
      arms.push(pv);
    }
    mesh(HEAD, skinM, 0, 0, 0, g);
    mesh(EYE_WHITES, M(0xf4f1ea), 0, 0, 0, g, false);
    mesh(FACE, M(0x1a1210), 0, 0, 0, g, false);
    mesh(BROWS, M(hair), 0, 0, 0, g, false);
    if (wrap) mesh(WRAP, new THREE.MeshLambertMaterial({ map: wrap }), 0, 0, 0, g);
    else mesh(HAIR[style], M(hair), 0, 0, 0, g);
    if (scarf !== null) mesh(SCARF, M(scarf), 0, 0, 0, g);
    g.userData['chest'] = chest;
    g.userData['legs'] = legs;
    g.userData['arms'] = arms;
    return g;
  }
  /** The player's body as the chosen look describes it, with the Bible bag on one arm. */
  function makeHero(a: Avatar): THREE.Group {
    const outfit = OUTFITS[a.outfit];
    const hero = makePerson({
      shirt: outfit.color,
      print: outfit.print === 'kente' ? TX['kente'] : null,
      skin: SKIN_TONES[a.skin],
      hair: HAIR_COLORS[a.hair],
      pants: 0x22303c,
      dress: a.female,
      style: HAIR_STYLES[a.style],
    });
    const arms = hero.userData['arms'] as THREE.Group[];
    const bk = box(0.42, 0.55, 0.14, 0x1a1a1a, 0, 0, 0, arms[1]);
    bk.position.set(0, -0.95, 0.18);
    box(0.06, 0.3, 0.15, 0xf2b705, 0, -0.95, 0.19, arms[1]);
    arms[1].rotation.x = -0.5;
    return hero;
  }
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
  const npcs = city.people.map((P, n) => {
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
