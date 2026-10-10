import { type NgZone } from '@angular/core';
import * as THREE from 'three';
import { type GameService, type Near } from './game.service';
import { B, H, N, OFF, T, bC, bMin, roadC } from './layout';
import { PEOPLE } from './people.data';
import { PLACES, markerPos } from './places.data';

export interface Engine {
  start(): void;
  dispose(): void;
  resize(): void;
}

type Tex = THREE.CanvasTexture;
type Mat = THREE.Material | THREE.Material[];

/**
 * Builds the whole 3D street (city blocks, landmarks, people, tro-tros, day/night light)
 * and runs the render loop. Everything UI-facing goes through GameService.
 */
export async function createEngine(canvas: HTMLCanvasElement, svc: GameService, zone: NgZone): Promise<Engine> {
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
  scene.fog = new THREE.Fog(0xcfe3ea, 70, 200);
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

  const lin = (c: number | string) => new THREE.Color(c).convertSRGBToLinear();
  const matCache: Record<number, THREE.MeshLambertMaterial> = {};
  function M(c: number): THREE.MeshLambertMaterial {
    if (!matCache[c]) matCache[c] = new THREE.MeshLambertMaterial({ color: lin(c) });
    return matCache[c];
  }
  function mesh(
    geo: THREE.BufferGeometry,
    mat: Mat,
    x = 0,
    y = 0,
    z = 0,
    parent?: THREE.Object3D | null,
    shadow = true,
  ) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (shadow) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    (parent ?? scene).add(m);
    return m;
  }
  const box = (
    w: number,
    h: number,
    d: number,
    c: number | Mat,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D | null,
    shadow = true,
  ) => mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? M(c) : c, x, y, z, parent, shadow);

  type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
  function canvasTex(w: number, h: number, draw: Draw, rep?: [number, number], srgb = true): Tex {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    if (rep) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rep[0], rep[1]);
    }
    return t;
  }
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, cols: string[], a: number) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[i % cols.length];
      g.globalAlpha = a * Math.random();
      const s = 1 + Math.random() * 3;
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    g.globalAlpha = 1;
  }

  // sky dome: vertical gradient, colours driven by the clock
  const skyU = { top: { value: new THREE.Color('#3f8bd8') }, bot: { value: new THREE.Color('#d9ecf2') } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: skyU,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader:
        'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(vP.y*1.8+0.12,0.0,1.0);gl_FragColor=vec4(mix(bot,top,pow(h,0.7)),1.0);}',
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);
  // hour, sky top, horizon, ambient, sun intensity, sun colour
  const SKY: [number, string, string, number, number, string][] = [
    [0, '#070d1f', '#18243f', 0.22, 0.15, '#9fb4ff'],
    [5, '#141d40', '#3b3a5c', 0.3, 0.2, '#9fb4ff'],
    [6, '#5d7fc0', '#f5b27c', 0.55, 0.7, '#ffb070'],
    [8, '#4a90d9', '#d6ecf3', 0.75, 1.35, '#fff1d6'],
    [16, '#3f8bd8', '#d9ecf2', 0.75, 1.4, '#fff1d6'],
    [18, '#4b5c9c', '#f39255', 0.55, 0.8, '#ff9a55'],
    [19, '#26305e', '#9a5a62', 0.38, 0.35, '#ff8a60'],
    [20, '#0f1834', '#1d2846', 0.25, 0.15, '#9fb4ff'],
    [24, '#070d1f', '#18243f', 0.22, 0.15, '#9fb4ff'],
  ];
  const mkLight = () => ({
    top: new THREE.Color(),
    bot: new THREE.Color(),
    amb: 0.75,
    sunI: 1.4,
    sunC: new THREE.Color(),
    sunP: new THREE.Vector3(40, 80, 30),
    night: 0,
  });
  const LT = mkLight();
  const CUR = mkLight();
  CUR.top.set('#3f8bd8');
  CUR.bot.set('#d9ecf2');
  CUR.sunC.set('#fff1d6');
  function setTimeTarget(h: number) {
    let i = 0;
    while (i < SKY.length - 1 && SKY[i + 1][0] <= h) i++;
    const a = SKY[i],
      b = SKY[Math.min(i + 1, SKY.length - 1)];
    const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
    LT.top.set(a[1]).lerp(new THREE.Color(b[1]), t);
    LT.bot.set(a[2]).lerp(new THREE.Color(b[2]), t);
    LT.amb = a[3] + (b[3] - a[3]) * t;
    LT.sunI = a[4] + (b[4] - a[4]) * t;
    LT.sunC.set(a[5]).lerp(new THREE.Color(b[5]), t);
    const day = h >= 6 && h <= 18;
    if (day) {
      const ang = ((h - 6) / 12) * Math.PI;
      LT.sunP.set(-Math.cos(ang) * 75, Math.max(18, Math.sin(ang) * 95), 38);
    } else LT.sunP.set(-30, 85, 25);
    LT.night = Math.max(0, Math.min(1, (1.0 - LT.sunI) / 0.8));
  }
  function snapLight() {
    CUR.top.copy(LT.top);
    CUR.bot.copy(LT.bot);
    CUR.amb = LT.amb;
    CUR.sunI = LT.sunI;
    CUR.sunC.copy(LT.sunC);
    CUR.sunP.copy(LT.sunP);
    CUR.night = LT.night;
  }

  /* ---------- textures ---------- */
  const TX: Record<string, Tex> = {};
  TX['asphalt'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#3d3d40';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 2600, ['#2a2a2c', '#58585c', '#4a4846'], 0.8);
      g.strokeStyle = 'rgba(20,20,20,.35)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(30, 200);
      g.bezierCurveTo(80, 170, 120, 230, 180, 190);
      g.stroke();
    },
    [30, 30],
  );
  TX['laterite'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#a8603a';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 3000, ['#8c4a2a', '#c07a50', '#7a3f22'], 0.7);
    },
    [24, 24],
  );
  TX['paving'] = canvasTex(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#bdb5a4';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 600, ['#a59d8c', '#cfc8b8'], 0.6);
      g.strokeStyle = '#9d9483';
      g.lineWidth = 2;
      for (let i = 0; i <= w; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(w, i);
        g.stroke();
      }
    },
    [11, 11],
  );
  TX['yard'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#b4704a';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 2400, ['#9a5c3a', '#c98a62', '#6f8f3a'], 0.6);
    },
    [5, 5],
  );
  TX['kerb'] = canvasTex(
    64,
    16,
    (g, w, h) => {
      g.fillStyle = '#f2f0ea';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c1c1c';
      g.fillRect(0, 0, w / 2, h);
    },
    [11, 1],
  );
  TX['corr'] = canvasTex(
    128,
    128,
    (g, w, h) => {
      for (let x = 0; x < w; x += 8) {
        const gr = g.createLinearGradient(x, 0, x + 8, 0);
        gr.addColorStop(0, '#8e9499');
        gr.addColorStop(0.5, '#c9ced1');
        gr.addColorStop(1, '#7b8186');
        g.fillStyle = gr;
        g.fillRect(x, 0, 8, h);
      }
      g.globalAlpha = 0.35;
      g.fillStyle = '#8a4a22';
      for (let i = 0; i < 14; i++)
        g.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 20, 3 + Math.random() * 30);
      g.globalAlpha = 1;
    },
    [3, 3],
  );
  TX['plaster'] = canvasTex(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 500, ['#d9d2c6', '#ebe6dc'], 0.6);
      const gr = g.createLinearGradient(0, h * 0.7, 0, h);
      gr.addColorStop(0, 'rgba(140,70,40,0)');
      gr.addColorStop(1, 'rgba(140,70,40,.35)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    [1, 1],
  );
  // facade tile = 2 bays x 2 floors (6m x 6.2m) with louvre windows and burglar bars
  TX['facade'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 700, ['#dcd5c9', '#efeae1'], 0.5);
      for (let bx = 0; bx < 2; bx++)
        for (let by = 0; by < 2; by++) {
          const x = bx * 128 + 30,
            y = by * 128 + 26,
            ww = 68,
            hh = 62;
          g.fillStyle = 'rgba(0,0,0,.12)';
          g.fillRect(x - 4, y + hh, ww + 8, 6);
          g.fillStyle = '#d4d4d0';
          g.fillRect(x - 5, y - 5, ww + 10, hh + 10);
          g.fillStyle = '#2f3f4a';
          g.fillRect(x, y, ww, hh);
          g.strokeStyle = 'rgba(210,225,235,.35)';
          g.lineWidth = 2;
          for (let l = y + 5; l < y + hh; l += 7) {
            g.beginPath();
            g.moveTo(x, l);
            g.lineTo(x + ww, l);
            g.stroke();
          }
          g.strokeStyle = '#1c1c1c';
          g.lineWidth = 2.5;
          for (let l = x + 8; l < x + ww; l += 12) {
            g.beginPath();
            g.moveTo(l, y);
            g.lineTo(l, y + hh);
            g.stroke();
          }
          g.beginPath();
          g.moveTo(x, y + hh / 2);
          g.lineTo(x + ww, y + hh / 2);
          g.stroke();
        }
      g.fillStyle = 'rgba(0,0,0,.08)';
      g.fillRect(0, 0, w, 4);
      g.fillRect(0, 128, w, 4);
    },
    [1, 1],
  );
  TX['lit'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      [
        [0, 0],
        [1, 1],
        [0, 1],
      ].forEach(([bx, by]) => {
        g.fillStyle = '#ffcf85';
        g.fillRect(bx * 128 + 30, by * 128 + 26, 68, 62);
      });
    },
    [1, 1],
  );
  TX['glass'] = canvasTex(
    128,
    128,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#5d8fb3');
      gr.addColorStop(1, '#1d3d58');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8e2ea';
      g.lineWidth = 3;
      for (let i = 0; i <= w; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, h);
        g.stroke();
      }
      for (let i = 0; i <= h; i += 42) {
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(w, i);
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.15)';
      g.beginPath();
      g.moveTo(0, h);
      g.lineTo(w * 0.6, 0);
      g.lineTo(w * 0.8, 0);
      g.lineTo(w * 0.2, h);
      g.fill();
    },
    [1, 1],
  );
  TX['glow'] = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,220,150,1)');
    gr.addColorStop(0.25, 'rgba(255,190,110,.55)');
    gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  TX['soft'] = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.9)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.4)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  TX['cloud'] = canvasTex(256, 128, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      const x = 40 + Math.random() * 176,
        y = 50 + Math.random() * 40,
        r = 20 + Math.random() * 30;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.9)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }
  });
  TX['beam'] = canvasTex(16, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(242,183,5,.55)');
    gr.addColorStop(1, 'rgba(242,183,5,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  function stripes(cols: string[], n = 8) {
    return canvasTex(128, 32, (g, w, h) => {
      for (let i = 0; i < n; i++) {
        g.fillStyle = cols[i % cols.length];
        g.fillRect((i * w) / n, 0, w / n + 1, h);
      }
    });
  }
  // wax print for clothes
  function waxPrint(base: string, a: string, b: string, kind: number) {
    return canvasTex(
      128,
      128,
      (g, w, h) => {
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32)
          for (let x = 0; x < w; x += 32) {
            const cx = x + 16 + ((y / 32) % 2 ? 16 : 0),
              cy = y + 16;
            if (kind === 0) {
              g.fillStyle = a;
              g.beginPath();
              g.arc(cx, cy, 10, 0, 7);
              g.fill();
              g.fillStyle = b;
              g.beginPath();
              g.arc(cx, cy, 4, 0, 7);
              g.fill();
            } else if (kind === 1) {
              g.fillStyle = a;
              g.beginPath();
              g.moveTo(cx, cy - 12);
              g.lineTo(cx + 12, cy);
              g.lineTo(cx, cy + 12);
              g.lineTo(cx - 12, cy);
              g.fill();
              g.strokeStyle = b;
              g.lineWidth = 3;
              g.stroke();
            } else {
              g.strokeStyle = a;
              g.lineWidth = 4;
              g.beginPath();
              g.arc(cx, cy, 11, 0, 4.5);
              g.stroke();
              g.fillStyle = b;
              g.fillRect(cx - 3, cy - 3, 6, 6);
            }
          }
      },
      [2, 1],
    );
  }
  TX['kente'] = canvasTex(
    128,
    128,
    (g, w, h) => {
      const c = ['#F2B705', '#1E8A4C', '#D7263D', '#111', '#F2B705', '#2E86C1'];
      for (let i = 0; i < 8; i++) {
        g.fillStyle = c[i % c.length];
        g.fillRect(i * 16, 0, 16, h);
      }
      for (let y = 0; y < h; y += 16) {
        g.fillStyle = 'rgba(0,0,0,.25)';
        g.fillRect(0, y, w, 3);
        g.fillStyle = y % 32 ? '#F2B705' : '#1E8A4C';
        for (let x = 0; x < w; x += 32) g.fillRect(x + 4, y + 5, 8, 6);
      }
    },
    [2, 1],
  );

  function signTex(text: string, bg: string, fg: string, w = 512, h = 160, size0 = 64) {
    return canvasTex(w, h, (g) => {
      const r = 18;
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.beginPath();
      g.roundRect ? g.roundRect(10, 14, w - 14, h - 18, r) : g.rect(10, 14, w - 14, h - 18);
      g.fill();
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect ? g.roundRect(4, 4, w - 14, h - 18, r) : g.rect(4, 4, w - 14, h - 18);
      g.fill();
      g.strokeStyle = fg;
      g.lineWidth = 6;
      g.beginPath();
      g.roundRect ? g.roundRect(14, 14, w - 34, h - 38, r - 6) : g.rect(14, 14, w - 34, h - 38);
      g.stroke();
      g.fillStyle = fg;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let size = size0;
      g.font = size + 'px Bungee, Impact, sans-serif';
      while (g.measureText(text).width > w - 70 && size > 20) {
        size -= 4;
        g.font = size + 'px Bungee, Impact, sans-serif';
      }
      g.fillText(text, (w - 10) / 2, (h - 14) / 2 + 3);
    });
  }
  function sign(text: string, x: number, y: number, z: number, bg = '#F2B705', fg = '#111C17', sx = 7) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: signTex(text, bg, fg), depthWrite: false, transparent: true }),
    );
    s.scale.set(sx, sx * 0.31, 1);
    s.position.set(x, y, z);
    scene.add(s);
    return s;
  }

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
    new THREE.MeshLambertMaterial({ map: TX['laterite'] }),
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.02;
  outer.receiveShadow = true;
  scene.add(outer);
  TX['laterite'].repeat.set(60, 60);
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

  /* ---------- builders ---------- */
  const facadeMats: THREE.MeshLambertMaterial[] = [];
  function scaleBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, su: number, sv: number) {
    const uv = geo.attributes['uv'];
    const dims = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
    for (let f = 0; f < 6; f++)
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, (uv.getX(i) * dims[f][0]) / su, (uv.getY(i) * dims[f][1]) / sv);
      }
    uv.needsUpdate = true;
    return geo;
  }
  function facadeMat(c: number, glass: boolean) {
    const m = new THREE.MeshLambertMaterial({
      color: lin(c),
      map: glass ? TX['glass'] : TX['facade'],
      emissive: lin(0xffc27a),
      emissiveMap: glass ? null : TX['lit'],
      emissiveIntensity: 0,
    });
    m.userData.glass = glass;
    facadeMats.push(m);
    return m;
  }
  function gable(
    w: number,
    d: number,
    hh: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    alongZ = true,
  ) {
    const sh = new THREE.Shape();
    const W = (alongZ ? w : d) + 0.9;
    sh.moveTo(-W / 2, 0);
    sh.lineTo(0, hh);
    sh.lineTo(W / 2, 0);
    sh.lineTo(-W / 2, 0);
    const L = (alongZ ? d : w) + 0.9;
    const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false });
    g.translate(0, 0, -L / 2);
    if (!alongZ) g.rotateY(Math.PI / 2);
    return mesh(g, mat, x, y, z);
  }
  function polytank(x: number, y: number, z: number, s = 1) {
    const t = mesh(new THREE.CylinderGeometry(0.7 * s, 0.75 * s, 1.5 * s, 14), M(0x1b1b1b), x, y + 0.75 * s, z);
    mesh(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, 0.2 * s, 10), M(0x1b1b1b), x, y + 1.55 * s, z);
    return t;
  }
  function building(
    w: number,
    h: number,
    d: number,
    color: number,
    x: number,
    z: number,
    { flat = null as boolean | null, glass = false, base = 0.35, door = true } = {},
  ) {
    const floors = Math.max(1, Math.round(h / 3.1));
    const geo = scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 6, 6.2);
    const fm = facadeMat(color, glass);
    const roofM = M(0xa7a49c);
    const b = mesh(geo, [fm, fm, roofM, roofM, fm, fm], x, base + h / 2, z);
    box(w + 0.12, 0.55, d + 0.12, 0x7d4a32, x, base + 0.27, z); // red-dust plinth
    const isFlat = flat ?? floors > 1;
    const top = base + h;
    if (isFlat) {
      const pm = new THREE.MeshLambertMaterial({ color: lin(color) });
      box(w + 0.2, 0.5, 0.2, pm, x, top + 0.25, z - d / 2);
      box(w + 0.2, 0.5, 0.2, pm, x, top + 0.25, z + d / 2);
      box(0.2, 0.5, d, pm, x - w / 2, top + 0.25, z);
      box(0.2, 0.5, d, pm, x + w / 2, top + 0.25, z);
      if (rnd() > 0.35) polytank(x + w / 4, top, z - d / 5);
      if (rnd() > 0.6) {
        const dish = mesh(new THREE.CylinderGeometry(0.55, 0.1, 0.2, 14), M(0xeeeeee), x - w / 4, top + 0.9, z + d / 5);
        dish.rotation.x = -0.9;
        box(0.08, 0.8, 0.08, 0x777777, x - w / 4, top + 0.4, z + d / 5);
      }
    } else {
      const rm = new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(rnd() > 0.5 ? 0xd0d0d0 : 0xb08070) });
      gable(w, d, 1.5, rm, x, top, z, w < d);
    }
    if (door)
      box(
        1.2,
        2.1,
        0.12,
        [0x2e7d32, 0x1f5d8c, 0x7a4a2a, 0x8a1c1c][Math.floor(rnd() * 4)],
        x + (rnd() - 0.5) * (w - 2.4),
        base + 1.05,
        z + d / 2 + 0.05,
      );
    return b;
  }
  function palm(x: number, z: number, hgt = 7) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    const lean = (rnd() - 0.5) * 0.25;
    let px = 0,
      py = 0;
    for (let s = 0; s < 5; s++) {
      const seg = hgt / 5;
      const m = mesh(
        new THREE.CylinderGeometry(0.17 + 0.02 * (4 - s), 0.2 + 0.02 * (4 - s), seg + 0.05, 7),
        M(0x7d6143),
        px,
        py + seg / 2,
        0,
        g,
      );
      m.rotation.z = -lean;
      px += Math.sin(lean) * seg;
      py += seg;
    }
    const fg = new THREE.ConeGeometry(0.5, 3.8, 4);
    fg.translate(0, 1.9, 0);
    fg.scale(1, 1, 0.14);
    const fg2 = new THREE.ConeGeometry(0.32, 2.2, 4);
    fg2.translate(0, 1.1, 0);
    fg2.scale(1, 1, 0.14);
    for (let f = 0; f < 9; f++) {
      const fr = mesh(fg, M(f % 2 ? 0x3f8f3a : 0x2f7a33), px, py, 0, g);
      fr.rotation.order = 'YXZ';
      fr.rotation.y = (f * Math.PI * 2) / 9 + rnd() * 0.3;
      fr.rotation.x = 1.5 + rnd() * 0.35;
    }
    for (let f = 0; f < 5; f++) {
      const fr = mesh(fg2, M(0x4a9a3e), px, py + 0.1, 0, g);
      fr.rotation.order = 'YXZ';
      fr.rotation.y = (f * Math.PI * 2) / 5 + 0.4;
      fr.rotation.x = 0.7;
    }
    for (let c = 0; c < 3; c++)
      mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        M(0x5a7a2a),
        px + Math.cos(c * 2.1) * 0.3,
        py - 0.25,
        Math.sin(c * 2.1) * 0.3,
        g,
      );
  }
  function shadeTree(x: number, z: number, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.28 * s, 0.4 * s, 3 * s, 8), M(0x5e4632), 0, 1.5 * s, 0, g);
    const cols = [0x2f6b2a, 0x3a7d32, 0x285d24];
    for (let i = 0; i < 4; i++) {
      const r = (1.4 + rnd() * 0.8) * s;
      mesh(
        new THREE.IcosahedronGeometry(r, 1),
        new THREE.MeshLambertMaterial({
          color: lin(cols[i % 3]),
          flatShading: true,
        } as THREE.MeshLambertMaterialParameters),
        (rnd() - 0.5) * 2 * s,
        3.4 * s + rnd() * 1.2 * s,
        (rnd() - 0.5) * 2 * s,
        g,
      );
    }
  }
  function umbrella(x: number, z: number, cols: string[], parent?: THREE.Object3D) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    (parent ?? scene).add(g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), M(0xdddddd), 0, 1.6, 0, g);
    mesh(
      new THREE.ConeGeometry(1.5, 0.6, 8, 1, true),
      new THREE.MeshLambertMaterial({ map: stripes(cols, 8), side: THREE.DoubleSide }),
      0,
      2.9,
      0,
      g,
    );
    box(1.6, 0.08, 1, 0x8a6a48, 0, 1.05, 0, g);
    box(0.08, 1, 0.08, 0x6a4a30, -0.7, 0.55, -0.4, g);
    box(0.08, 1, 0.08, 0x6a4a30, 0.7, 0.55, 0.4, g);
    const goods = [0xe74c3c, 0xf39c12, 0x27ae60, 0xf4d03f, 0x8e44ad];
    for (let i = 0; i < 5; i++)
      mesh(new THREE.SphereGeometry(0.15, 8, 6), M(goods[i]), -0.55 + i * 0.27, 1.2, (rnd() - 0.5) * 0.4, g);
    return g;
  }
  const lampGlows: (THREE.Sprite | THREE.Mesh)[] = [];
  function pole(x: number, z: number, lamp: boolean) {
    mesh(new THREE.CylinderGeometry(0.1, 0.13, 7.4, 6), M(0x6b4f35), x, 3.7, z);
    box(1.4, 0.08, 0.08, 0x6b4f35, x, 6.8, z);
    if (lamp) {
      box(0.9, 0.08, 0.08, 0x444444, x + 0.5, 6.2, z + 0.3);
      mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xfff2c0 }),
        x + 0.9,
        6.1,
        z + 0.3,
        null,
        false,
      );
      const gl = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: TX['glow'],
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      gl.scale.set(5, 5, 1);
      gl.position.set(x + 0.9, 6.05, z + 0.3);
      scene.add(gl);
      lampGlows.push(gl);
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 20),
        new THREE.MeshBasicMaterial({
          map: TX['glow'],
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x + 1.5, 0.06, z + 1.2);
      scene.add(pool);
      lampGlows.push(pool);
    }
  }
  function wire(a: { x: number; z: number }, b: { x: number; z: number }) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, 6.8 - Math.sin(t * Math.PI) * 0.7, a.z + (b.z - a.z) * t));
    }
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x151515 })),
    );
  }

  /* ---------- city blocks ---------- */
  const solids: { x0: number; x1: number; z0: number; z1: number }[] = [];
  const wallColors = [
    0xf3e2b3, 0xf4b183, 0x9fd3e6, 0xe98c73, 0xf6f1e7, 0xc6e2a3, 0xe7b97f, 0xd9c3e6, 0xffffff, 0xf7d774,
  ];
  const placeAt: Record<string, (typeof PLACES)[number]> = {};
  PLACES.forEach((l) => (placeAt[l.bi + ',' + l.bj] = l));
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
        mesh(yg, new THREE.MeshLambertMaterial({ map: TX['yard'] }), cx, 0.36, cz, null, false).receiveShadow = true;
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
      if (rnd() > 0.35) palm(x0 + B - 0.9, z0 + 0.9, 6 + rnd() * 3);
      if (rnd() > 0.6) palm(x0 + 0.9, z0 + B - 0.9, 6 + rnd() * 3);
      if (!L && rnd() > 0.55)
        umbrella(cx + (rnd() - 0.5) * 10, z0 + B - 0.6, rnd() > 0.5 ? ['#E53935', '#FFFFFF'] : ['#F2B705', '#1E8A4C']);
    }
  // poles, lamps and sagging wires along every east-west street
  for (let j = 0; j < N; j++) {
    const z = bMin(j) + 0.5;
    let prev: { x: number; z: number } | null = null;
    for (let i = 0; i < N; i++) {
      const x = bMin(i) + 0.5;
      pole(x, z, (i + j) % 2 === 0);
      const p = { x, z };
      if (prev) wire(prev, p);
      prev = p;
    }
  }

  /* ---------- landmark buildings ---------- */
  const markers: THREE.Mesh[] = [];
  const beams: THREE.Mesh[] = [];
  const smoke: THREE.Sprite[] = [];
  const ringMat = () =>
    new THREE.MeshBasicMaterial({
      color: 0xf2b705,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  PLACES.forEach((L) => {
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
      gable(
        11,
        10,
        3.2,
        new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(0xa0412d) }),
        bx,
        7.35,
        bz - 1,
        false,
      );
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
      sign('GRACE CHAPEL', fx, 10.5, fz + 1, '#111C17', '#F2B705', 8);
    } else if (L.id === 'chop') {
      building(w, 3.1, d, 0xe07a3f, bx, bz - 1, { flat: false });
      const aw = box(
        w + 1,
        0.12,
        3.4,
        new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(0xc06040) }),
        bx,
        3.1,
        bz + off[1] * 4.2,
      );
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
      umbrella(bx - w / 2 + 1, bz + off[1] * 6.4, ['#D7263D', '#F2B705']);
      sign('CHOP BAR', fx, 5.6, fz + off[1] * 1.5);
    } else if (L.id === 'home') {
      building(d, 3.1, w, 0xf3e2b3, bx - 0.6, bz, { flat: false, door: false });
      box(0.2, 2.8, w, 0x5e4632, bx + off[0] * (d / 2 + 1.4) - 0.6, 1.75, bz);
      const v = box(
        2.4,
        0.12,
        w + 0.6,
        new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(0xb08070) }),
        bx + off[0] * (d / 2 + 0.4) - 0.6,
        3.2,
        bz,
      );
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
      sign('HOME', fx + off[0] * 1.2, 4.8, fz, '#3DBE6E', '#111C17', 5);
    } else if (L.id === 'market') {
      const rm = new THREE.MeshLambertMaterial({ map: TX['corr'], color: lin(0xc9c9c9) });
      for (let s = 0; s < 2; s++) {
        const zz = bz - 3 + s * 6;
        for (let p = 0; p < 4; p++) box(0.2, 3.4, 0.2, 0x555555, bx - 3 + (p % 2) * 6, 2, zz + (p < 2 ? -2 : 2));
        gable(7, 5, 1.2, rm, bx, 3.7, zz, true);
      }
      const cols = [
        ['#E53935', '#FFFFFF'],
        ['#F2B705', '#1E8A4C'],
        ['#1F5D8C', '#F4EEDC'],
      ];
      for (let s = 0; s < 5; s++) umbrella(bx + off[0] * 5.2, bz - 6 + s * 3, cols[s % 3]);
      for (let s = 0; s < 6; s++)
        box(0.9, 0.9, 0.9, [0xe67e22, 0xf4d03f, 0x27ae60][s % 3], bx - 2 + (s % 3) * 2, 0.8, bz - 3 + (s > 2 ? 6 : 0));
      sign('MARKET', fx + off[0] * 2, 5.6, fz);
    } else if (L.id === 'tech') {
      building(w, 14, d, 0xffffff, bx, bz, { glass: true, flat: true, door: false });
      box(3, 2.4, 0.2, 0x1a1a1a, bx, 1.55, bz + off[1] * (d / 2 + 0.05));
      box(w + 2, 0.3, 2.2, 0xeeeeee, bx, 3, bz + off[1] * (d / 2 + 1));
      sign('TECH HUB', fx, 16.6, fz);
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
      sign('SITE', fx, 12.6, fz);
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

  /* ---------- characters ---------- */
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

  /* ---------- input ---------- */
  const keys: Record<string, boolean> = {};
  const onKeyDown = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  let joy: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
  const onPointerDown = (e: PointerEvent) => {
    if (svc.talking()) return;
    joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
    zone.run(() => {
      svc.joy.set({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (joy?.id !== e.pointerId) return;
    let dx = e.clientX - joy.x,
      dy = e.clientY - joy.y;
    const l = Math.hypot(dx, dy),
      m = 45;
    if (l > m) {
      dx *= m / l;
      dy *= m / l;
    }
    joy.dx = dx / m;
    joy.dy = dy / m;
    zone.run(() => {
      svc.joy.set({ x: joy!.x, y: joy!.y, dx: joy!.dx, dy: joy!.dy });
    });
  };
  const endJoy = (e: PointerEvent) => {
    if (joy?.id === e.pointerId) {
      joy = null;
      zone.run(() => {
        svc.joy.set(null);
      });
    }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endJoy);
  canvas.addEventListener('pointercancel', endJoy);

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
  const blocked = (x: number, z: number, r: number) =>
    x < -H + r ||
    x > H - r ||
    z < -H + r ||
    z > H - r ||
    solids.some((s) => x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r);

  let hourShown = -1;
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
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const p = player.position;
    const st = svc.state();
    if (st.hour !== hourShown) {
      hourShown = st.hour;
      setTimeTarget(st.hour);
    }
    const talking = svc.talking();

    if (svc.playing() && !talking) {
      let mx = 0,
        mz = 0;
      if (keys['w'] || keys['arrowup']) mz -= 1;
      if (keys['s'] || keys['arrowdown']) mz += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;
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
      for (const L of PLACES) {
        if (!L.deco) {
          const m = markerPos(L);
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
        u.t += (u.dir * dt * 1.6) / (u.b - u.a);
        if (u.t > 1) {
          u.t = 1;
          u.dir = -1;
        }
        if (u.t < 0) {
          u.t = 0;
          u.dir = 1;
        }
        const s = u.a + (u.b - u.a) * u.t;
        if (u.axis === 'h') {
          g.position.set(s, 0, u.lane);
          g.rotation.y = u.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          g.position.set(u.lane, 0, s);
          g.rotation.y = u.dir > 0 ? 0 : Math.PI;
        }
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
      const ring = g.userData['ring'] as THREE.Mesh,
        bub = g.userData['bub'] as THREE.Sprite;
      ring.visible = on;
      bub.visible = on;
      (ring.material as THREE.Material).opacity = 0.5 + 0.4 * Math.sin(now / 280 + i);
      bub.position.y = 4.7 + Math.sin(now / 350 + i) * 0.15;
    });
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
    skyU.top.value.copy(CUR.top);
    skyU.bot.value.copy(CUR.bot);
    scene.fog!.color.copy(CUR.bot).convertSRGBToLinear();
    amb.intensity = CUR.amb;
    amb.color.copy(CUR.top).lerp(white, 0.6).convertSRGBToLinear();
    sun.intensity = CUR.sunI;
    sun.color.copy(CUR.sunC).convertSRGBToLinear();
    sun.position.set(p.x + CUR.sunP.x, CUR.sunP.y, p.z + CUR.sunP.z);
    sun.target.position.set(p.x, 0, p.z);
    const nf = CUR.night;
    facadeMats.forEach((m) => {
      m.emissiveIntensity = nf * (m.userData.glass ? 0.35 : 1.1);
    });
    lampGlows.forEach((gl) => {
      (gl.material as THREE.Material).opacity = nf * ((gl as THREE.Sprite).isSprite ? 0.95 : 0.55);
    });
    clouds.forEach((c) => {
      c.material.opacity = 0.85 * (1 - nf * 0.8);
    });
    tros.forEach((g) => {
      const u = g.userData;
      u['t'] = (u['t'] + u['speed'] * dt) % T;
      const pos = -H + (u['dir'] > 0 ? u['t'] : T - u['t']);
      const lane = roadC(u['k']) + (u['dir'] > 0 ? 2 : -2) * (u['horiz'] ? 1 : -1);
      if (u['horiz']) g.position.set(pos, 0, lane);
      else g.position.set(lane, 0, pos);
    });
    camT.set(p.x, 19 * svc.zoom(), p.z + 21 * svc.zoom());
    if (!camInit) {
      cam.position.copy(camT);
      camInit = true;
    } else cam.position.lerp(camT, 1 - Math.exp(-dt * 5));
    camL.lerp(tmpV.set(p.x, 1, p.z - 2), 1 - Math.exp(-dt * 6));
    cam.lookAt(camL);
    sky.position.copy(cam.position);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }

  setTimeTarget(S0.hour);
  hourShown = S0.hour;
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
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endJoy);
      canvas.removeEventListener('pointercancel', endJoy);
      svc.teleport = () => undefined;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          x.dispose();
        });
      });
      Object.values(TX).forEach((t) => {
        t.dispose();
      });
      renderer.dispose();
    },
  };
}
