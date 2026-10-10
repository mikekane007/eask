import * as THREE from 'three';
import type { Kit } from './kit';

export const CAR_COLORS = [0xd7263d, 0x2e86c1, 0xeeeeee, 0x22262b, 0xf2b705, 0x1e8a4c, 0x8e44ad, 0x7f8c8d];

/** The bus and car models shared by the grid traffic and the real-map traffic. Each is a few simple boxes. */
export function createVehicleModels(kit: Kit) {
  const { M, mesh, box, canvasTex, signTex } = kit;

  function makeBus(col: number, label: string) {
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
    for (const [x, z] of [
      [-1.15, 1.6],
      [1.15, 1.6],
      [-1.15, -1.6],
      [1.15, -1.6],
    ]) {
      const w = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 14), M(0x161616), x, 0.5, z, g);
      w.rotation.z = Math.PI / 2;
    }
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
      new THREE.MeshBasicMaterial({ map: signTex(label, '#111C17', '#F2B705', 512, 180, 58) }),
    );
    back.position.set(0, 2.1, -2.47);
    back.rotation.y = Math.PI;
    g.add(back);
    return g;
  }

  function makeCar(col: number) {
    const g = new THREE.Group();
    box(1.9, 0.75, 4.1, col, 0, 0.75, 0, g);
    box(1.6, 0.62, 2.1, col, 0, 1.4, -0.2, g);
    box(1.62, 0.4, 1.9, 0x1d2a33, 0, 1.42, -0.2, g, false);
    for (const [x, z] of [
      [-0.95, 1.3],
      [0.95, 1.3],
      [-0.95, -1.3],
      [0.95, -1.3],
    ]) {
      const w = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), M(0x161616), x, 0.4, z, g);
      w.rotation.z = Math.PI / 2;
    }
    for (const s of [-1, 1])
      mesh(
        new THREE.BoxGeometry(0.35, 0.2, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xfff6d0 }),
        0.65 * s,
        0.85,
        2.07,
        g,
        false,
      );
    return g;
  }

  return { makeBus, makeCar };
}
