import { Injectable, signal } from '@angular/core';
import type { Quality } from './types';
import { bellGain, bellStrikes, bellsRing, footstepCutoff, mixLevels, type MixInputs } from './sound-mix';

const MUTE_KEY = 'goandtell:muted';
const MASTER = 0.8;

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  white: AudioBuffer;
  wind: GainNode;
  rain: GainNode;
  traffic: GainNode;
  crowd: GainNode;
  crickets: GainNode;
}

/**
 * All the game's sound, generated in the browser with the Web Audio API (no audio files): wind, rain, traffic and
 * crowd beds, birds and crickets, footsteps, church bells and small interface sounds. Nothing plays until the player
 * has interacted with the page (browsers require it), and everything respects the mute button.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = signal(SoundService.readMuted());
  private graph?: Graph;
  private birdsPerMinute = 0;

  constructor() {
    if (typeof document === 'undefined') return;
    const unlock = () => {
      this.unlock();
    };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      const g = this.graph;
      if (!g) return;
      if (document.hidden) void g.ctx.suspend();
      else if (!this.muted()) void g.ctx.resume();
    });
    // A soft click on every button.
    document.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('button')) this.click();
    });
  }

  private static readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  toggleMute(): void {
    const m = !this.muted();
    this.muted.set(m);
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
    const g = this.graph;
    if (g) g.master.gain.setTargetAtTime(m ? 0 : MASTER, g.ctx.currentTime, 0.05);
    else if (!m) this.unlock();
  }

  /** Creates the audio graph on first use (must happen inside a user gesture) and wakes it if it was asleep. */
  unlock(): void {
    if (this.graph) {
      if (this.graph.ctx.state === 'suspended' && !document.hidden && !this.muted()) void this.graph.ctx.resume();
      return;
    }
    if (typeof AudioContext === 'undefined') return;
    try {
      this.graph = this.build(new AudioContext());
    } catch {
      /* audio unavailable: the game stays silent */
    }
  }

  private noise(ctx: AudioContext, brown: boolean): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        b = (b + 0.02 * w) / 1.02;
        d[i] = b * 3.5;
      } else d[i] = w;
    }
    return buf;
  }

  private build(ctx: AudioContext): Graph {
    const master = ctx.createGain();
    master.gain.value = this.muted() ? 0 : MASTER;
    master.connect(ctx.destination);
    const white = this.noise(ctx, false);
    const brown = this.noise(ctx, true);

    const loop = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start();
      return s;
    };
    const filter = (type: BiquadFilterType, f: number, q = 1) => {
      const n = ctx.createBiquadFilter();
      n.type = type;
      n.frequency.value = f;
      n.Q.value = q;
      return n;
    };
    const bed = (src: AudioNode, ...nodes: AudioNode[]) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      [src, ...nodes, g].reduce((a, b) => {
        a.connect(b);
        return b;
      });
      g.connect(master);
      return g;
    };
    /** A slow wobble added to a gain, so a steady noise breathes a little. */
    const wobble = (target: GainNode, hz: number, depth: number, type: OscillatorType = 'sine') => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz;
      const d = ctx.createGain();
      d.gain.value = depth;
      o.connect(d);
      d.connect(target.gain);
      o.start();
    };

    const wind = bed(loop(brown), filter('lowpass', 520));
    wobble(wind, 0.13, 0.012);
    const rain = bed(loop(white), filter('highpass', 1400), filter('lowpass', 8500));
    const traffic = bed(loop(brown), filter('lowpass', 210));
    const crowd = bed(loop(white), filter('bandpass', 650, 0.7));
    wobble(crowd, 0.6, 0.008);
    const osc = ctx.createOscillator();
    osc.frequency.value = 4300;
    osc.start();
    const crickets = bed(osc);
    wobble(crickets, 9, 0.005, 'square');

    return { ctx, master, white, wind, rain, traffic, crowd, crickets };
  }

  private get ready(): Graph | null {
    const g = this.graph;
    return g && !this.muted() && g.ctx.state === 'running' ? g : null;
  }

  /** Sets the ambient layers for the current moment. Call a few times a second. */
  update(inputs: MixInputs, dt: number): void {
    const g = this.graph;
    if (!g) return;
    const m = mixLevels(inputs);
    const t = g.ctx.currentTime;
    g.wind.gain.setTargetAtTime(m.wind, t, 0.7);
    g.rain.gain.setTargetAtTime(m.rain, t, 0.7);
    g.traffic.gain.setTargetAtTime(m.traffic, t, 0.7);
    g.crowd.gain.setTargetAtTime(m.crowd, t, 0.7);
    g.crickets.gain.setTargetAtTime(m.crickets, t, 1.5);
    this.birdsPerMinute = m.birds;
    if (this.birdsPerMinute > 0 && Math.random() < (this.birdsPerMinute / 60) * dt) this.chirp();
  }

  /** Fades every ambient layer out (for the intro and city picker). */
  silence(): void {
    const g = this.graph;
    if (!g) return;
    const t = g.ctx.currentTime;
    for (const n of [g.wind, g.rain, g.traffic, g.crowd, g.crickets]) n.gain.setTargetAtTime(0, t, 0.3);
    this.birdsPerMinute = 0;
  }

  private tone(
    freq: number,
    to: number,
    start: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
  ): void {
    const g = this.ready;
    if (!g) return;
    const o = g.ctx.createOscillator();
    const e = g.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, start + dur * 0.8);
    e.gain.setValueAtTime(0.0001, start);
    e.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    e.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(e);
    e.connect(g.master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  private chirp(): void {
    const g = this.ready;
    if (!g) return;
    const t0 = g.ctx.currentTime;
    const base = 2200 + Math.random() * 1800;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let n = 0; n < notes; n++) this.tone(base, base * (1.15 + Math.random() * 0.3), t0 + n * 0.11, 0.09, 0.03);
  }

  /** One footstep. `wet` (0 to 1) makes it splashier. */
  step(wet: number): void {
    const g = this.ready;
    if (!g) return;
    const t = g.ctx.currentTime;
    const src = g.ctx.createBufferSource();
    src.buffer = g.white;
    const lp = g.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = footstepCutoff(wet);
    const e = g.ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(0.08, t + 0.005);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(lp);
    lp.connect(e);
    e.connect(g.master);
    src.start(t, Math.random() * 2, 0.08);
  }

  /** Church bell for this hour, as heard from `distance` metres away. */
  bell(hour: number, distance: number): void {
    const g = this.ready;
    if (!g || !bellsRing(hour)) return;
    const gain = bellGain(distance);
    if (gain <= 0) return;
    const t0 = g.ctx.currentTime + 0.1;
    for (let n = 0; n < bellStrikes(hour); n++) {
      const t = t0 + n * 1.05;
      // A bell is a few partials that die away at different speeds.
      this.tone(392, 392, t, 3.0, gain * 0.5);
      this.tone(392 * 2.76, 392 * 2.76, t, 1.6, gain * 0.28);
      this.tone(392 * 5.4, 392 * 5.4, t, 0.8, gain * 0.14);
    }
  }

  click(): void {
    const g = this.ready;
    if (g) this.tone(760, 520, g.ctx.currentTime, 0.06, 0.04, 'triangle');
  }

  /** A short musical cue for how an answer went. */
  verdict(q: Quality): void {
    const g = this.ready;
    if (!g) return;
    const t = g.ctx.currentTime + 0.02;
    if (q === 'good') {
      this.tone(523, 523, t, 0.16, 0.07);
      this.tone(659, 659, t + 0.12, 0.26, 0.07);
    } else if (q === 'ok') {
      this.tone(440, 440, t, 0.22, 0.05);
    } else {
      this.tone(196, 165, t, 0.3, 0.05, 'triangle');
    }
  }
}
