import * as THREE from 'three';
import { WEATHER_LOOK, type Weather, type WeatherLook } from './weather';

const DROPS = 1500;
const BOX = 46; // rain falls in a box this wide around the player
const TOP = 30;

/** Rain particles and the eased weather values that the render loop applies to the light, sky and fog. */
export function createWeatherFx(scene: THREE.Scene) {
  /** Current (eased) look. Starts clear. */
  const wx: WeatherLook = { ...WEATHER_LOOK.clear };

  const positions = new Float32Array(DROPS * 6);
  const speeds = new Float32Array(DROPS);
  const offsets = new Float32Array(DROPS * 3);
  for (let i = 0; i < DROPS; i++) {
    offsets[i * 3] = (Math.random() - 0.5) * BOX * 2;
    offsets[i * 3 + 1] = Math.random() * TOP;
    offsets[i * 3 + 2] = (Math.random() - 0.5) * BOX * 2;
    speeds[i] = 26 + Math.random() * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xd4e2ee, transparent: true, opacity: 0, fog: false });
  const rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);

  return {
    wx,
    /** Moves the current look toward the target for this weather. */
    ease(target: Weather, dt: number): void {
      const t = WEATHER_LOOK[target];
      const k = 1 - Math.exp(-dt * 0.45);
      wx.cloud += (t.cloud - wx.cloud) * k;
      wx.rain += (t.rain - wx.rain) * k;
      wx.fog += (t.fog - wx.fog) * k;
      wx.dark += (t.dark - wx.dark) * k;
    },
    /** Drops fall around `center`. Costs nothing while it is not raining. */
    update(dt: number, center: THREE.Vector3, night: number): void {
      const on = wx.rain > 0.03;
      rain.visible = on;
      if (!on) return;
      mat.opacity = 0.85 * wx.rain * (1 - night * 0.45);
      rain.position.set(Math.round(center.x), 0, Math.round(center.z));
      for (let i = 0; i < DROPS; i++) {
        let y = offsets[i * 3 + 1] - speeds[i] * dt;
        if (y < 0) y += TOP;
        offsets[i * 3 + 1] = y;
        const x = offsets[i * 3];
        const z = offsets[i * 3 + 2];
        const o = i * 6;
        positions[o] = x;
        positions[o + 1] = y;
        positions[o + 2] = z;
        positions[o + 3] = x + 0.22;
        positions[o + 4] = y + 1.5;
        positions[o + 5] = z;
      }
      geo.attributes['position'].needsUpdate = true;
    },
  };
}
