import * as THREE from 'three';

export type Tex = THREE.CanvasTexture;
export type Mat = THREE.Material | THREE.Material[];

/** Shared scene helpers: materials, meshes, canvas-drawn textures, signs and a seeded random. */
export function createKit(scene: THREE.Scene) {
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
  TX['grass'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#5f8f4a';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 3000, ['#4d7a3a', '#74a55c', '#3f6a30'], 0.7);
    },
    [24, 24],
  );
  TX['lawn'] = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#6a9a52';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 2400, ['#557f40', '#80b066', '#9aa36a'], 0.6);
    },
    [5, 5],
  );
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

  const ringMat = () =>
    new THREE.MeshBasicMaterial({
      color: 0xf2b705,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  return { lin, M, mesh, box, canvasTex, speckle, rnd, TX, stripes, waxPrint, signTex, sign, ringMat };
}

export type Kit = ReturnType<typeof createKit>;
