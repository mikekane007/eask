/** Graphics levels and the frame-rate watcher that lowers them automatically. Pure logic, no rendering code. */

export type GraphicsLevel = 'low' | 'medium' | 'high';

export const LEVELS: readonly GraphicsLevel[] = ['low', 'medium', 'high'];

export interface GraphicsSpec {
  /** Rendering resolution relative to the screen (1 = one pixel per CSS pixel). */
  pixelRatio: number;
  shadows: boolean;
  /** Shadow map size in pixels. */
  shadowMap: number;
  rainDrops: number;
  /** Share of the trees that are drawn, 0 to 1. */
  treeShare: number;
  /** Most vehicles on the road at once. */
  vehicles: number;
  /** Most background people out at once. */
  walkers: number;
}

export const GRAPHICS: Record<GraphicsLevel, GraphicsSpec> = {
  low: { pixelRatio: 0.85, shadows: false, shadowMap: 512, rainDrops: 500, treeShare: 0.35, vehicles: 6, walkers: 14 },
  medium: {
    pixelRatio: 1.25,
    shadows: true,
    shadowMap: 1024,
    rainDrops: 1200,
    treeShare: 0.8,
    vehicles: 12,
    walkers: 30,
  },
  high: { pixelRatio: 1.5, shadows: true, shadowMap: 2048, rainDrops: 1800, treeShare: 1, vehicles: 14, walkers: 36 },
};

/** The next level down, or null if already at the lowest. */
export function lowerLevel(level: GraphicsLevel): GraphicsLevel | null {
  const i = LEVELS.indexOf(level);
  return i > 0 ? LEVELS[i - 1] : null;
}

export function isLevel(v: unknown): v is GraphicsLevel {
  return v === 'low' || v === 'medium' || v === 'high';
}

export interface MeterOptions {
  /** Seconds to ignore at the start, while textures and shaders are being prepared. */
  warmup: number;
  /** How many recent frames to judge. */
  window: number;
  /** A frame taking longer than this many milliseconds counts as slow. */
  slowMs: number;
  /** The share of slow frames in the window that means the game is struggling. */
  slowShare: number;
}

const DEFAULT_METER: MeterOptions = { warmup: 4, window: 90, slowMs: 52, slowShare: 0.4 };

/**
 * Watches frame times. When too many recent frames are slow it says so (once), so the game can lower its detail.
 * Very long frames (switching tabs, loading) are ignored because they say nothing about how fast the game runs.
 */
export class FrameMeter {
  private elapsed = 0;
  private recent: boolean[] = [];

  constructor(private readonly opts: MeterOptions = DEFAULT_METER) {}

  /** Adds one frame that took `ms` milliseconds. Returns 'slow' when it is time to lower the detail. */
  push(ms: number): 'ok' | 'slow' {
    if (ms > 500 || ms <= 0) return 'ok';
    this.elapsed += ms / 1000;
    if (this.elapsed < this.opts.warmup) return 'ok';
    this.recent.push(ms > this.opts.slowMs);
    if (this.recent.length > this.opts.window) this.recent.shift();
    if (this.recent.length < this.opts.window) return 'ok';
    const share = this.recent.filter(Boolean).length / this.recent.length;
    if (share >= this.opts.slowShare) {
      this.reset();
      return 'slow';
    }
    return 'ok';
  }

  /** Starts judging afresh (after the detail has changed, or a new city has loaded). */
  reset(): void {
    this.elapsed = 0;
    this.recent = [];
  }
}
