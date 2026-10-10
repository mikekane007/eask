import type { Kit, Tex } from './kit';

/** How a city's buildings look from the street. */
export type FacadeStyle = 'brick' | 'stone' | 'plaster';
export type RoofSurface = 'tiles' | 'zinc' | 'concrete';

type Rect = [number, number, number, number];

/** Window bays (3 m) and storeys (3.1 m) in one facade tile, 128 px each. Must match WALL_TILE_* in buildings.ts. */
const BAYS = 4;
const STOREYS = 4;

/**
 * Window positions inside one facade tile (512 x 512 px = 12 m wide, four storeys of 3.1 m). The facade and the
 * night-time "lit windows" map are drawn from the same list so the glow always sits in the windows.
 */
function windows(style: FacadeStyle): Rect[] {
  const out: Rect[] = [];
  for (let bx = 0; bx < BAYS; bx++)
    for (let by = 0; by < STOREYS; by++) {
      if (style === 'brick') out.push([bx * 128 + 38, by * 128 + 22, 52, 80]);
      else if (style === 'stone') out.push([bx * 128 + 36, by * 128 + 16, 56, 90]);
      else out.push([bx * 128 + 30, by * 128 + 26, 68, 62]);
    }
  return out;
}

/** Light, neutral colours throughout so each building's own colour (multiplied in) decides the hue. */
function drawFacade(g: CanvasRenderingContext2D, w: number, h: number, style: FacadeStyle, speckle: Kit['speckle']) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  if (style === 'brick') {
    // brick courses with offset joints
    g.fillStyle = 'rgba(0,0,0,.10)';
    for (let y = 0; y < h; y += 8) {
      g.fillRect(0, y, w, 1.5);
      const off = (y / 8) % 2 ? 0 : 12;
      for (let x = off; x < w; x += 24) g.fillRect(x, y, 1.5, 8);
    }
    speckle(g, w, h, 900, ['#c9c2b8', '#f2ede6', '#b8afa4'], 0.35);
  } else if (style === 'stone') {
    // ashlar joints, and a cornice line at each floor
    g.fillStyle = 'rgba(0,0,0,.06)';
    for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1.2);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 0 : 32; x < w; x += 64) g.fillRect(x, y, 1.2, 16);
    speckle(g, w, h, 500, ['#e6dfd2', '#f7f3ea'], 0.4);
    for (let y = 0; y < h; y += 128) {
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(0, y + 112, w, 8);
      g.fillStyle = 'rgba(0,0,0,.12)';
      g.fillRect(0, y + 120, w, 4);
    }
  } else {
    speckle(g, w, h, 700, ['#dcd5c9', '#efeae1'], 0.5);
    // rain streaks from the window sills
    g.fillStyle = 'rgba(90,60,40,.06)';
    for (let y = 0; y < h; y += 128)
      for (let i = 0; i < w / 40; i++) g.fillRect(20 + i * 40, y + 90, 6, 30 + ((i + y / 128) % 3) * 20);
  }

  for (const [x, y, ww, hh] of windows(style)) {
    if (style === 'plaster') {
      // louvred window with burglar bars (Accra)
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
      continue;
    }
    // stone surround, dark glass with a soft sky reflection, white glazing bars
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(x - 3, y + hh + 2, ww + 6, 5);
    g.fillStyle = '#fbf8f2';
    g.fillRect(x - 6, y - 8, ww + 12, hh + 14);
    const gr = g.createLinearGradient(x, y, x + ww, y + hh);
    gr.addColorStop(0, '#53687a');
    gr.addColorStop(0.55, '#2a3946');
    gr.addColorStop(1, '#1d2830');
    g.fillStyle = gr;
    g.fillRect(x, y, ww, hh);
    g.strokeStyle = '#f4f1ea';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + ww / 2, y);
    g.lineTo(x + ww / 2, y + hh);
    g.moveTo(x, y + hh * 0.38);
    g.lineTo(x + ww, y + hh * 0.38);
    g.stroke();
    if (style === 'brick') {
      // stone lintel
      g.fillStyle = '#efe9df';
      g.fillRect(x - 8, y - 14, ww + 16, 8);
    } else {
      // wrought-iron balcony rail
      g.fillStyle = '#1b1f22';
      g.fillRect(x - 8, y + hh - 22, ww + 16, 3);
      g.fillRect(x - 8, y + hh - 2, ww + 16, 2);
      for (let bx = x - 6; bx <= x + ww + 6; bx += 5) g.fillRect(bx, y + hh - 20, 1.5, 18);
    }
  }
}

/** How one window looks at night. */
export type WindowLight = 'dark' | 'warm' | 'pale' | 'dim' | 'tv' | 'curtained';

/**
 * Which windows of a facade tile are lit, and how: under half of them, in a mix of warm lamps, dimmer rooms,
 * the blue of a television and light through drawn curtains. Seeded, so every visit looks the same.
 */
export function windowLights(count: number, seed = 7): WindowLight[] {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, () => {
    const r = rnd();
    if (r < 0.56) return 'dark';
    if (r < 0.72) return 'warm';
    if (r < 0.8) return 'pale';
    if (r < 0.88) return 'dim';
    if (r < 0.93) return 'tv';
    return 'curtained';
  });
}

/** Night map: light in some of the windows, in the same places as the facade's windows. */
function drawLit(g: CanvasRenderingContext2D, w: number, h: number, style: FacadeStyle) {
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  const all = windows(style);
  const lights = windowLights(all.length);
  all.forEach(([x, y, ww, hh], i) => {
    const light = lights[i];
    if (light === 'dark') return;
    if (light === 'tv') {
      g.fillStyle = '#2c3f66';
      g.fillRect(x, y, ww, hh);
      g.fillStyle = '#5f86c4';
      g.fillRect(x + ww * 0.2, y + hh * 0.35, ww * 0.5, hh * 0.4);
      return;
    }
    const col = { warm: '#ffc77a', pale: '#ffe2b8', dim: '#8a6238', curtained: '#e0904a' }[light];
    const gr = g.createLinearGradient(0, y, 0, y + hh);
    gr.addColorStop(0, col);
    gr.addColorStop(1, light === 'dim' ? '#5a3e22' : '#c98a4a');
    g.fillStyle = gr;
    g.fillRect(x, y, ww, hh);
    if (light === 'curtained') {
      // curtains drawn across, with a bright gap in the middle
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(x, y, ww * 0.42, hh);
      g.fillRect(x + ww * 0.58, y, ww * 0.42, hh);
    }
  });
}

/** One shop front per 6 m: a shop window, a glazed door and a fascia board above (256 x 128 px). */
function drawShop(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  // fascia board and its shadow
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, 26);
  g.fillStyle = 'rgba(0,0,0,.25)';
  g.fillRect(0, 26, w, 4);
  // shop window
  const gr = g.createLinearGradient(0, 34, 0, h - 10);
  gr.addColorStop(0, '#4f6577');
  gr.addColorStop(1, '#1f2a33');
  g.fillStyle = '#2b2b2b';
  g.fillRect(10, 32, 150, h - 40);
  g.fillStyle = gr;
  g.fillRect(14, 36, 142, h - 48);
  g.fillStyle = 'rgba(255,255,255,.18)';
  g.beginPath();
  g.moveTo(30, 36);
  g.lineTo(70, 36);
  g.lineTo(40, h - 12);
  g.lineTo(14, h - 12);
  g.fill();
  // goods on display
  for (let i = 0; i < 5; i++) {
    g.fillStyle = ['#d8b26a', '#b8584a', '#e9e2d0', '#6f9c7a', '#c98b4a'][i];
    g.fillRect(24 + i * 26, h - 30, 18, 14);
  }
  // door
  g.fillStyle = '#2b2b2b';
  g.fillRect(180, 32, 62, h - 32);
  g.fillStyle = '#34424d';
  g.fillRect(186, 38, 50, h - 50);
  g.fillStyle = '#d8c48a';
  g.fillRect(228, 74, 4, 14);
  // plinth
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(0, h - 8, w, 8);
}

function drawShopLit(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffd59a';
  g.fillRect(14, 36, 142, h - 48);
  g.fillStyle = '#c99550';
  g.fillRect(186, 38, 50, h - 50);
}

function drawRoof(g: CanvasRenderingContext2D, w: number, h: number, surface: RoofSurface, speckle: Kit['speckle']) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  if (surface === 'tiles') {
    // rows of rounded clay tiles: one texture = 2 m along the eave, 1.6 m up the slope
    for (let y = 0; y < h; y += 16) {
      const off = (y / 16) % 2 ? 0 : 8;
      for (let x = -16 + off; x < w; x += 16) {
        const gr = g.createLinearGradient(x, 0, x + 16, 0);
        gr.addColorStop(0, 'rgba(0,0,0,.22)');
        gr.addColorStop(0.5, 'rgba(255,255,255,.12)');
        gr.addColorStop(1, 'rgba(0,0,0,.22)');
        g.fillStyle = gr;
        g.fillRect(x, y, 16, 16);
      }
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(0, y + 14, w, 2);
    }
    speckle(g, w, h, 400, ['#5a4a3a', '#ffffff'], 0.25);
  } else if (surface === 'zinc') {
    // standing seams and a dormer window in the middle of each texture
    g.fillStyle = 'rgba(0,0,0,.18)';
    for (let x = 0; x < w; x += 21) g.fillRect(x, 0, 2, h);
    speckle(g, w, h, 300, ['#8a96a0', '#ffffff'], 0.25);
    g.fillStyle = '#f2efe8';
    g.fillRect(w / 2 - 34, h * 0.3, 68, h * 0.42);
    g.fillStyle = '#2a3946';
    g.fillRect(w / 2 - 24, h * 0.36, 48, h * 0.32);
    g.fillStyle = '#f2efe8';
    g.fillRect(w / 2 - 2, h * 0.36, 4, h * 0.32);
  } else {
    speckle(g, w, h, 1400, ['#9a958c', '#d6d1c7', '#7a766f'], 0.45);
    g.fillStyle = 'rgba(0,0,0,.08)';
    for (let i = 0; i < 4; i++)
      g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 60, 30 + Math.random() * 40);
  }
}

function drawAwning(g: CanvasRenderingContext2D, w: number, h: number) {
  // white and tinted stripes (the awning's own colour is multiplied in), with a scalloped hem
  for (let x = 0; x < w; x += 32) {
    g.fillStyle = '#ffffff';
    g.fillRect(x, 0, 16, h);
    g.fillStyle = '#9a9a9a';
    g.fillRect(x + 16, 0, 16, h);
  }
  g.fillStyle = 'rgba(0,0,0,.35)';
  for (let x = 0; x < w; x += 16) {
    g.beginPath();
    g.arc(x + 8, 4, 8, 0, Math.PI);
    g.fill();
  }
}

export interface FacadeSet {
  wall: Tex;
  wallLit: Tex;
  shop: Tex;
  shopLit: Tex;
  roof: Tex;
  awning: Tex;
}

/** Draws the textures a city's buildings need, once per city. */
export function createFacades(kit: Kit, style: FacadeStyle, surface: RoofSurface): FacadeSet {
  const { canvasTex, speckle } = kit;
  return {
    wall: canvasTex(
      BAYS * 128,
      STOREYS * 128,
      (g, w, h) => {
        drawFacade(g, w, h, style, speckle);
      },
      [1, 1],
    ),
    wallLit: canvasTex(
      BAYS * 128,
      STOREYS * 128,
      (g, w, h) => {
        drawLit(g, w, h, style);
      },
      [1, 1],
    ),
    shop: canvasTex(256, 128, drawShop, [1, 1]),
    shopLit: canvasTex(256, 128, drawShopLit, [1, 1]),
    roof: canvasTex(
      256,
      256,
      (g, w, h) => {
        drawRoof(g, w, h, surface, speckle);
      },
      [1, 1],
    ),
    awning: canvasTex(128, 64, drawAwning, [1, 1]),
  };
}
