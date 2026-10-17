import * as THREE from 'three';
import type { Avatar } from './avatar';
import { createBodies } from './bodies';
import { createKit } from './kit';

/**
 * A small 3D scene with just the player's character, for the character screen. Loaded on demand, like the
 * engine, so three.js stays out of the first download. Throws if 3D is not available.
 */
export function createAvatarScene(canvas: HTMLCanvasElement, w: number, h: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(w, h, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3226, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(3, 6, 5);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 50);
  camera.position.set(0, 2.1, 8.6);
  camera.lookAt(0, 1.65, 0);
  const { makeHero } = createBodies(createKit(scene));

  let hero: THREE.Group | null = null;
  let turn = 0.5;

  return {
    /** Shows the character as this look describes it, keeping the way it faces. */
    dress(look: Avatar): void {
      if (hero) {
        scene.remove(hero);
        hero.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            const geo = o.geometry as THREE.BufferGeometry;
            if (!geo.userData['shared']) geo.dispose();
          }
        });
      }
      hero = makeHero(look);
      hero.rotation.y = turn;
      scene.add(hero);
    },
    /** Turns the character by this many radians and draws it. */
    draw(by: number): void {
      turn += by;
      if (hero) hero.rotation.y = turn;
      renderer.render(scene, camera);
    },
    dispose(): void {
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) (o.geometry as THREE.BufferGeometry).dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export type AvatarScene = ReturnType<typeof createAvatarScene>;
