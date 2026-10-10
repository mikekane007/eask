import * as THREE from 'three';
import { type Avatar, encodeLook } from './avatar';
import type { Kit } from './kit';
import type { Peer } from './net/room-logic';

interface Remote {
  group: THREE.Group;
  body: THREE.Group;
  look: string;
  tag: THREE.Sprite;
  name: string;
  walkT: number;
}

const disposeBody = (o: THREE.Object3D): void => {
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) (c.geometry as THREE.BufferGeometry).dispose();
  });
};

/** The other players in the room: drawn as characters with a name above, gliding smoothly between updates. */
export function createRemotePlayers(scene: THREE.Scene, kit: Kit, build: (look: Avatar) => THREE.Group) {
  const remotes = new Map<string, Remote>();

  function add(p: Peer): Remote {
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);
    group.rotation.y = p.rot;
    const body = build(p.look);
    group.add(body);
    const tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: kit.signTex(p.name.toUpperCase(), '#1E8A4C', '#F4EEDC', 512, 140, 56),
        depthWrite: false,
        transparent: true,
      }),
    );
    tag.scale.set(3.4, 0.93, 1);
    tag.position.y = 3.65;
    group.add(tag);
    scene.add(group);
    const r: Remote = { group, body, look: encodeLook(p.look), tag, name: p.name, walkT: 0 };
    remotes.set(p.id, r);
    return r;
  }

  function remove(id: string, r: Remote): void {
    scene.remove(r.group);
    disposeBody(r.group);
    r.tag.material.map?.dispose();
    r.tag.material.dispose();
    remotes.delete(id);
  }

  return {
    update(dt: number, peers: readonly Peer[]) {
      const live = new Set<string>();
      for (const p of peers) {
        live.add(p.id);
        let r = remotes.get(p.id);
        if (r && (r.look !== encodeLook(p.look) || r.name !== p.name)) {
          remove(p.id, r);
          r = undefined;
        }
        r ??= add(p);
        const g = r.group;
        const dx = p.x - g.position.x;
        const dz = p.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 30) g.position.set(p.x, 0, p.z);
        else {
          const k = 1 - Math.exp(-dt * 8);
          g.position.x += dx * k;
          g.position.z += dz * k;
        }
        // face the way they walk, or the way they said they face when standing
        const want = dist > 0.15 ? Math.atan2(dx, dz) : p.rot;
        const turn = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y));
        g.rotation.y += turn * Math.min(1, dt * 10);
        const legs = r.body.userData['legs'] as THREE.Group[];
        const arms = r.body.userData['arms'] as THREE.Group[];
        if (dist > 0.15) {
          r.walkT += dt * 10;
          const sw = Math.sin(r.walkT);
          legs[0].rotation.x = sw * 0.6;
          legs[1].rotation.x = -sw * 0.6;
          arms[0].rotation.x = -sw * 0.5;
        } else {
          legs[0].rotation.x *= 0.8;
          legs[1].rotation.x *= 0.8;
          arms[0].rotation.x *= 0.8;
        }
      }
      for (const [id, r] of remotes) if (!live.has(id)) remove(id, r);
    },
    dispose() {
      for (const [id, r] of remotes) remove(id, r);
    },
  };
}
