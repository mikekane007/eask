import { type NgZone } from '@angular/core';
import * as THREE from 'three';
import { createBuilders } from './builders';
import { createCharacters } from './characters';
import { createCity } from './city';
import { type GameService, type Near } from './game.service';
import { createInput } from './input';
import { createKit } from './kit';
import { H } from './layout';
import { createLighting } from './lighting';
import { createPedestrians } from './pedestrians';
import { buildGraph, networks } from './map/road-graph';
import { createRoadTraffic } from './map/road-traffic';
import { createRealWorld } from './map/real-world';
import { createTraffic } from './traffic';
import { FrameMeter, GRAPHICS, type GraphicsLevel } from './graphics';
import type { GraphicsService } from './graphics.service';
import type { SoundService } from './sound.service';
import { createWeatherFx } from './weather-fx';
import type { City } from './types';
export interface Engine {
  start(): void;
  dispose(): void;
  resize(): void;
}

/**
 * Builds the whole 3D street (city blocks, landmarks, people, traffic, weather, day/night light)
 * and runs the render loop. Everything UI-facing goes through GameService.
 */
export async function createEngine(
  canvas: HTMLCanvasElement,
  svc: GameService,
  zone: NgZone,
  city: City,
  sound: SoundService,
  graphics: GraphicsService,
): Promise<Engine> {
  try {
    await Promise.race([document.fonts.load('40px Bungee'), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    /* font load is best-effort */
  }

  // Tuned for modest hardware (integrated GPUs): no MSAA, capped pixel ratio, small shadow map.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xcfe3ea, 70, 200);
  scene.fog = fog;
  const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 900);
  const amb = new THREE.HemisphereLight(0xdfefff, 0x8a5236, 0.75);
  scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
  sun.castShadow = true;
  {
    const SM = 1024;
    sun.shadow.mapSize.set(SM, SM);
    const sc = sun.shadow.camera;
    sc.left = -48;
    sc.right = 48;
    sc.top = 48;
    sc.bottom = -48;
    sc.near = 1;
    sc.far = 260;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.04;
  }
  scene.add(sun);
  scene.add(sun.target);

  const kit = createKit(scene);
  const lighting = createLighting(scene);
  const { skyU, sky, LT, CUR, setTimeTarget, snapLight } = lighting;
  const fx = createWeatherFx(scene);
  const builders = createBuilders(scene, kit, city.theme);
  // A city with a real street map is built from that map; otherwise from the built-in grid.
  const mapData = svc.realMap();
  const real = mapData ? createRealWorld(scene, kit, city.theme, city, mapData, builders.facadeMats) : null;
  const grid = real ? null : createCity(scene, kit, builders, city);
  const world = real ?? grid;
  if (!world) throw new Error('no world');
  const { markers, beams, smoke, clouds, ground } = world;
  const { facadeMats, lampGlows } = builders;
  // Traffic and the crowd follow the grid's straight streets; for real maps they come with the road network.
  const traffic = grid ? createTraffic(scene, kit, city.theme) : null;
  const roadTraffic = mapData ? createRoadTraffic(scene, kit, city.theme, mapData.roads) : null;
  const walkGraph = mapData ? buildGraph(mapData.roads, (r) => r.k !== 'steps' && r.w >= 2) : null;
  const crowd = grid
    ? createPedestrians(scene, kit, city.theme)
    : walkGraph && real
      ? createPedestrians(scene, kit, city.theme, {
          graph: walkGraph,
          edges: networks(walkGraph)[0] ?? [],
          blocked: real.blocked,
        })
      : null;
  const { player, npcs, S0, setAvatar: setLook } = createCharacters(scene, kit, svc, city);
  let lookShown = svc.avatar();
  const input = createInput(canvas, svc, zone);

  // Detail level: applied when it changes, and lowered automatically if the frame rate cannot be held.
  const meter = new FrameMeter();
  let appliedLevel: GraphicsLevel | null = null;
  const applyGraphics = () => {
    const level = graphics.level();
    if (level === appliedLevel) return;
    const g = GRAPHICS[level];
    const shadowsChanged = appliedLevel === null || GRAPHICS[appliedLevel].shadows !== g.shadows;
    appliedLevel = level;
    renderer.setPixelRatio(Math.min(devicePixelRatio, g.pixelRatio));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.shadowMap.enabled = g.shadows;
    sun.castShadow = g.shadows;
    if (sun.shadow.mapSize.x !== g.shadowMap) {
      sun.shadow.mapSize.set(g.shadowMap, g.shadowMap);
      // the shadow map is rebuilt at the new size on the next frame
      const sh = sun.shadow as unknown as { map: { dispose(): void } | null };
      sh.map?.dispose();
      sh.map = null;
    }
    if (shadowsChanged) {
      // materials must be rebuilt when shadows are switched on or off
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        for (const mat of Array.isArray(m) ? m : m ? [m] : []) mat.needsUpdate = true;
      });
    }
    fx.setDrops(g.rainDrops);
    real?.setTreeShare(g.treeShare);
    traffic?.setLimit(g.vehicles);
    roadTraffic?.setLimit(g.vehicles);
    crowd?.setLimit(g.walkers);
    meter.reset();
  };
  applyGraphics();
  const { keys } = input;

  svc.teleport = (x, z) => {
    player.position.set(x, 0, z);
    svc.setPosition(x, z);
  };

  /* ---------- loop ---------- */
  const resize = () => {
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();
  const solids = grid?.solids ?? [];
  const blocked = (x: number, z: number, r: number) =>
    real
      ? real.blocked(x, z, r)
      : x < -H + r ||
        x > H - r ||
        z < -H + r ||
        z > H - r ||
        solids.some((s) => x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r);

  let hourShown = -1;
  let lastStep = 0;
  let lastHour = svc.state().hour;
  let audioClock = 0;
  const churchPlace = city.places.find((pl) => pl.id === 'church');
  const churchAt = churchPlace ? svc.markerOf(churchPlace) : null;
  let running = false,
    raf = 0,
    last = performance.now(),
    walkT = 0,
    saveT = 0,
    camInit = false;
  const camT = new THREE.Vector3(),
    camL = new THREE.Vector3(S0.x, 1, S0.z - 2);
  const tmpV = new THREE.Vector3(),
    white = new THREE.Color(1, 1, 1);
  const grey = new THREE.Color(),
    skyT = new THREE.Color(),
    skyB = new THREE.Color();
  /** A copy of `src` pulled toward grey by `amt` and darkened by `dim` (used for overcast skies). */
  const dull = (src: THREE.Color, out: THREE.Color, amt: number, dim: number) => {
    const l = src.r * 0.299 + src.g * 0.587 + src.b * 0.114;
    grey.setRGB(l, l, l);
    return out
      .copy(src)
      .lerp(grey, amt)
      .multiplyScalar(1 - dim);
  };

  // Frame budget: 30 fps while playing, 10 fps behind the intro, nothing while the tab is hidden.
  // This keeps CPU/GPU use low on laptops with integrated graphics.
  const PLAY_FRAME_MS = 1000 / 30;
  const IDLE_FRAME_MS = 100;

  function frame(now: number) {
    if (!running) return;
    const budget = svc.playing() ? PLAY_FRAME_MS : IDLE_FRAME_MS;
    if (document.hidden || now - last < budget - 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const realDt = Math.min(1, (now - last) / 1000);
    const dt = Math.min(0.05, realDt);
    last = now;
    applyGraphics();
    if (svc.avatar() !== lookShown) {
      lookShown = svc.avatar();
      setLook(lookShown);
    }
    if (svc.playing() && meter.push(realDt * 1000) === 'slow') zone.run(() => graphics.lowerAutomatically());
    const p = player.position;
    const st = svc.state();
    // Light follows the clock in quarter-hour steps; the render loop eases between them.
    const clockHour = Math.floor((st.hour + st.minute / 60) * 4) / 4;
    if (clockHour !== hourShown) {
      hourShown = clockHour;
      setTimeTarget(clockHour);
    }
    const talking = svc.talking();

    if (svc.playing() && !talking && !svc.rulesOpen()) {
      svc.tick(realDt);
      let mx = 0,
        mz = 0;
      if (keys['w'] || keys['arrowup']) mz -= 1;
      if (keys['s'] || keys['arrowdown']) mz += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;
      const joy = input.joy();
      if (joy) {
        mx += joy.dx;
        mz += joy.dy;
      }

      const l = Math.hypot(mx, mz);
      if (l > 0.1) {
        const sp = 8 * Math.min(1, l) * dt;
        mx /= l;
        mz /= l;
        if (!blocked(p.x + mx * sp, p.z, 0.7)) p.x += mx * sp;
        if (!blocked(p.x, p.z + mz * sp, 0.7)) p.z += mz * sp;
        player.rotation.y = Math.atan2(mx, mz);
        walkT += dt * 10;
        const sw = Math.sin(walkT);
        const stepNo = Math.floor(walkT / Math.PI);
        if (stepNo !== lastStep) {
          lastStep = stepNo;
          sound.step(fx.wx.rain);
        }
        const legs = player.userData['legs'] as THREE.Group[],
          arms = player.userData['arms'] as THREE.Group[];
        legs[0].rotation.x = sw * 0.6;
        legs[1].rotation.x = -sw * 0.6;
        arms[0].rotation.x = -sw * 0.5;
        p.y = Math.abs(Math.cos(walkT)) * 0.06;
        saveT += dt;
        if (saveT > 3) {
          saveT = 0;
          svc.setPosition(p.x, p.z);
          svc.save();
        }
      }
      let nextNear: Near | null = null;
      for (const L of city.places) {
        if (!L.deco) {
          const m = svc.markerOf(L);
          if (Math.hypot(p.x - m.x, p.z - m.z) < 2.6) {
            nextNear = { kind: 'place', ref: L };
            break;
          }
        }
      }
      if (!nextNear)
        for (const g of npcs) {
          if (Math.hypot(p.x - g.position.x, p.z - g.position.z) < 2.8) {
            nextNear = { kind: 'npc', ref: g.userData['P'] };
            break;
          }
        }
      const cur = svc.current();
      if (nextNear?.ref !== cur?.ref) {
        zone.run(() => {
          svc.current.set(nextNear);
        });
      }
    }

    // walkers pace their stretch; they stop and face you when you're close
    npcs.forEach((g, i) => {
      const u = g.userData['path'],
        P = g.userData['P'];
      const legs = g.userData['legs'] as THREE.Group[],
        arms = g.userData['arms'] as THREE.Group[];
      const close = Math.hypot(p.x - g.position.x, p.z - g.position.z) < 5;
      if (!close && !(talking && talking.P === P)) {
        u.t += (u.dir * dt * 1.6) / u.len;
        if (u.t > 1) {
          u.t = 1;
          u.dir = -1;
        }
        if (u.t < 0) {
          u.t = 0;
          u.dir = 1;
        }
        g.position.set(u.x0 + (u.x1 - u.x0) * u.t, 0, u.z0 + (u.z1 - u.z0) * u.t);
        g.rotation.y = Math.atan2((u.x1 - u.x0) * u.dir, (u.z1 - u.z0) * u.dir);
        const sw = Math.sin(now / 120 + i) * 0.5;
        legs[0].rotation.x = sw;
        legs[1].rotation.x = -sw;
        arms[0].rotation.x = -sw * 0.8;
        arms[1].rotation.x = sw * 0.8;
      } else {
        const ty = Math.atan2(p.x - g.position.x, p.z - g.position.z);
        let d = ty - g.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        g.rotation.y += d * Math.min(1, dt * 8);
        legs.forEach((l) => (l.rotation.x *= 0.85));
        arms[0].rotation.x = Math.sin(now / 300 + i) * 0.25 - 0.15;
        arms[1].rotation.x *= 0.85;
      }
      const on = st.word >= P.req && st.best[P.id] !== 'open';
      const ln = svc.live.npcs[i];
      ln.x = g.position.x;
      ln.z = g.position.z;
      ln.on = on;
      const ring = g.userData['ring'] as THREE.Mesh,
        bub = g.userData['bub'] as THREE.Sprite;
      ring.visible = on;
      bub.visible = on;
      (ring.material as THREE.Material).opacity = 0.5 + 0.4 * Math.sin(now / 280 + i);
      bub.position.y = 4.7 + Math.sin(now / 350 + i) * 0.15;
    });
    svc.live.x = p.x;
    svc.live.z = p.z;
    svc.live.rot = player.rotation.y;
    markers.forEach((m, i) => {
      (m.material as THREE.Material).opacity = 0.55 + 0.35 * Math.sin(now / 300 + i);
    });
    beams.forEach((b, i) => {
      (b.material as THREE.Material).opacity = 0.6 + 0.3 * Math.sin(now / 400 + i);
      b.rotation.y += dt * 0.3;
    });
    smoke.forEach((sp) => {
      const u = sp.userData;
      u['t'] = (u['t'] + dt * 0.25) % 1;
      sp.position.set(u['base'].x + Math.sin(u['t'] * 6 + u['base'].z) * 0.4, 1.5 + u['t'] * 4, u['base'].z);
      const s = 0.8 + u['t'] * 2.2;
      sp.scale.set(s, s, 1);
      sp.material.opacity = 0.45 * (1 - u['t']);
    });
    clouds.forEach((c) => {
      c.position.x += dt * 1.5;
      if (c.position.x > 220) c.position.x = -220;
    });
    // ease lighting toward the clock
    const k = 1 - Math.exp(-dt * 1.5);
    CUR.top.lerp(LT.top, k);
    CUR.bot.lerp(LT.bot, k);
    CUR.sunC.lerp(LT.sunC, k);
    CUR.sunP.lerp(LT.sunP, k);
    CUR.amb += (LT.amb - CUR.amb) * k;
    CUR.sunI += (LT.sunI - CUR.sunI) * k;
    CUR.night += (LT.night - CUR.night) * k;
    // Weather greys and dims the sky, thickens the fog and covers the sun.
    fx.ease(svc.weather(), Math.min(0.25, realDt));
    const wx = fx.wx;
    const greyAmt = Math.min(1, wx.dark * 1.7);
    skyU.top.value.copy(dull(CUR.top, skyT, greyAmt, wx.dark * 0.25));
    skyU.bot.value.copy(dull(CUR.bot, skyB, greyAmt, wx.dark * 0.25));
    fog.color.copy(skyB).convertSRGBToLinear();
    fog.near = 70 - 62 * Math.min(1, wx.fog);
    fog.far = 200 - 140 * Math.min(1, wx.fog);
    amb.intensity = CUR.amb * (1 + 0.12 * wx.dark);
    amb.color.copy(CUR.top).lerp(white, 0.6).convertSRGBToLinear();
    sun.intensity = CUR.sunI * (1 - 0.6 * wx.dark);
    sun.color.copy(CUR.sunC).convertSRGBToLinear();
    sun.position.set(p.x + CUR.sunP.x, CUR.sunP.y, p.z + CUR.sunP.z);
    sun.target.position.set(p.x, 0, p.z);
    const nf = CUR.night;
    real?.setNight(nf);
    facadeMats.forEach((m) => {
      m.emissiveIntensity = nf * (m.userData.glass ? 0.35 : 1.1);
    });
    lampGlows.forEach((gl) => {
      (gl.material as THREE.Material).opacity = nf * ((gl as THREE.Sprite).isSprite ? 0.95 : 0.55);
    });
    clouds.forEach((c) => {
      c.material.opacity = 0.85 * (1 - nf * 0.8) * wx.cloud;
      c.material.color.setScalar(1 - 0.5 * wx.dark);
    });
    ground.material.color.setScalar(1 - 0.28 * wx.rain);
    fx.update(dt, p, nf);
    // Traffic: lights run on play time; vehicles slow down in bad weather and stop for the player.
    traffic?.update(
      dt,
      now / 1000,
      st.hour + st.minute / 60,
      svc.playing() ? p : null,
      Math.max(0.5, 1 - 0.2 * wx.rain - 0.25 * wx.fog),
    );
    roadTraffic?.update(
      dt,
      st.hour + st.minute / 60,
      svc.playing() ? p : null,
      Math.max(0.5, 1 - 0.2 * wx.rain - 0.25 * wx.fog),
    );
    crowd?.update(dt, st.hour + st.minute / 60, wx.rain);

    // Sound: the ambient mix a few times a second, and the church bell on the hour.
    audioClock += realDt;
    if (audioClock > 0.25) {
      svc.live.stats.vehicles = (traffic?.visibleCount ?? 0) + (roadTraffic?.visibleCount ?? 0);
      svc.live.stats.walkers = crowd?.visibleCount ?? 0;
      if (svc.playing()) {
        sound.update(
          {
            hour: st.hour + st.minute / 60,
            rain: wx.rain,
            fog: wx.fog,
            trafficNear: (traffic?.nearCount(p, 55) ?? 0) + (roadTraffic?.nearCount(p, 55) ?? 0),
            crowdNear: crowd?.nearCount(p, 40) ?? 0,
          },
          audioClock,
        );
      } else sound.silence();
      audioClock = 0;
    }
    if (st.hour !== lastHour) {
      if (svc.playing() && churchAt) sound.bell(st.hour, Math.hypot(p.x - churchAt.x, p.z - churchAt.z));
      lastHour = st.hour;
    }
    camT.set(p.x, 19 * svc.zoom(), p.z + 21 * svc.zoom());
    if (!camInit) {
      cam.position.copy(camT);
      camInit = true;
    } else cam.position.lerp(camT, 1 - Math.exp(-dt * 5));
    camL.lerp(tmpV.set(p.x, 1, p.z - 2), 1 - Math.exp(-dt * 6));
    cam.lookAt(camL);
    sky.position.copy(cam.position);
    if (real) {
      // keep buildings from hiding the player: cut a see-through tunnel from the camera to them
      real.cut.uCam.value.copy(cam.position);
      real.cut.uTarget.value.set(p.x, 1.3, p.z);
    }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }

  setTimeTarget(S0.hour + S0.minute / 60);
  hourShown = Math.floor((S0.hour + S0.minute / 60) * 4) / 4;
  snapLight();

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      input.dispose();
      svc.teleport = () => undefined;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          x.dispose();
        });
      });
      Object.values(kit.TX).forEach((t) => {
        t.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
