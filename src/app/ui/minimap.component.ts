import { Component, type ElementRef, NgZone, type OnDestroy, type OnInit, ViewChild, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { B, H, N, T, bC, bMin } from '../game/layout';
import { toPoints } from '../game/map/geo';
import type { MapData } from '../game/map/types';

const SIZE = 176;
/** On a real map the minimap shows this many metres across, centred on you. */
const VIEW = 230;
/** A small top-down map: streets, named places, people ready to talk, and you. Redrawn ~6 times a second. */
@Component({
  selector: 'app-minimap',
  standalone: true,
  template: `
    @if (svc.playing() && svc.mapOpen()) {
      <div class="minimap" [attr.aria-label]="i18n.t('mapAria')">
        <canvas #c [width]="size" [height]="size"></canvas>
        <div class="legend">
          <span><i style="background:var(--gold)"></i>{{ i18n.t('legendReady') }}</span>
          <span><i style="background:var(--green)"></i>{{ i18n.t('legendReached') }}</span>
          <span><i style="background:#fff"></i>{{ i18n.t('legendYou') }}</span>
        </div>
        @if (svc.realMap(); as map) {
          <div class="credit">{{ map.credit }}</div>
        }
      </div>
    }
  `,
})
export class MinimapComponent implements OnInit, OnDestroy {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
  private readonly zone = inject(NgZone);
  readonly size = SIZE;
  @ViewChild('c') canvas?: ElementRef<HTMLCanvasElement>;
  private timer?: ReturnType<typeof setInterval>;
  /** The real map drawn once, one pixel per metre, so each frame only copies the part around you. */
  private bg?: { map: MapData; canvas: HTMLCanvasElement };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.draw();
      }, 160);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private draw(): void {
    const el = this.canvas?.nativeElement;
    if (!el || document.hidden) return;
    const g = el.getContext('2d');
    if (!g) return;
    const s = this.svc.state();
    const live = this.svc.live;
    const real = this.svc.realMap();
    const k = real ? SIZE / VIEW : SIZE / T;
    // map metres to canvas pixels: centred on the player on a real map, the whole grid otherwise
    const X = (x: number) => (real ? (x - live.x) * k + SIZE / 2 : (x + H) * k);
    const Z = (z: number) => (real ? (z - live.z) * k + SIZE / 2 : (z + H) * k);

    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = '#161d19';
    g.fillRect(0, 0, SIZE, SIZE);

    const places = this.svc.places();
    if (real) {
      const bg = this.backdrop(real);
      g.drawImage(bg, live.x + real.w / 2 - VIEW / 2, live.z + real.h / 2 - VIEW / 2, VIEW, VIEW, 0, 0, SIZE, SIZE);
    } else {
      // blocks, tinted for the named places
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const place = places.find((p) => p.bi === i && p.bj === j);
          g.fillStyle = place ? (place.deco ? '#34423a' : '#4a5a3a') : '#26322b';
          g.fillRect(X(bMin(i)), Z(bMin(j)), B * k, B * k);
        }
      }
    }

    // place labels
    g.font = '700 7px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const p of places) {
      const label = this.i18n.tr(p.label);
      const lm = real?.anchors.landmarks[p.id];
      const cx = lm ? X(lm.x) : X(bC(p.bi));
      const cy = lm ? Z(lm.z) : Z(bC(p.bj));
      g.fillStyle = p.deco ? '#8d9a90' : '#f2b705';
      if (!real || p.deco) g.fillText(label, cx, cy);
      if (!p.deco) {
        const m = this.svc.markerOf(p);
        g.beginPath();
        g.arc(X(m.x), Z(m.z), 3, 0, Math.PI * 2);
        g.fill();
        if (real) g.fillText(label, X(m.x), Z(m.z) - 7);
      }
    }

    // people
    const pulse = 3.4 + Math.sin(performance.now() / 250);
    for (const n of live.npcs) {
      const won = s.best[n.id] === 'open';
      g.beginPath();
      g.arc(X(n.x), Z(n.z), n.on ? pulse : 2.4, 0, Math.PI * 2);
      g.fillStyle = won ? '#3dbe6e' : n.on ? '#f2b705' : '#66736b';
      g.fill();
    }

    // friends in the room: blue dots with their names
    g.textAlign = 'center';
    for (const f of live.peers) {
      g.beginPath();
      g.arc(X(f.x), Z(f.z), 3.6, 0, Math.PI * 2);
      g.fillStyle = '#4aa3ff';
      g.fill();
      g.fillStyle = '#cfe6ff';
      g.fillText(f.name, X(f.x), Z(f.z) - 7);
    }

    // you: a white arrow pointing the way you face
    g.save();
    g.translate(X(live.x), Z(live.z));
    g.rotate(-live.rot + Math.PI);
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(4.5, 5);
    g.lineTo(0, 2.5);
    g.lineTo(-4.5, 5);
    g.closePath();
    g.fillStyle = '#fff';
    g.strokeStyle = '#111c17';
    g.lineWidth = 1.5;
    g.stroke();
    g.fill();
    g.restore();
  }

  /** Draws the whole real map once, one pixel per metre, and keeps it. */
  private backdrop(map: MapData): HTMLCanvasElement {
    if (this.bg?.map === map) return this.bg.canvas;
    const c = document.createElement('canvas');
    c.width = Math.ceil(map.w);
    c.height = Math.ceil(map.h);
    const g = c.getContext('2d');
    if (!g) return c;
    g.fillStyle = '#1b221e';
    g.fillRect(0, 0, c.width, c.height);
    g.translate(map.w / 2, map.h / 2);
    const fill = (polys: number[][], color: string) => {
      g.fillStyle = color;
      for (const flat of polys) {
        const pts = toPoints(flat);
        if (pts.length < 3) continue;
        g.beginPath();
        pts.forEach(([x, z], i) => {
          i ? g.lineTo(x, z) : g.moveTo(x, z);
        });
        g.closePath();
        g.fill();
      }
    };
    fill(map.parks, '#2b4a30');
    fill(map.water, '#27506a');
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const r of map.roads) {
      const pts = toPoints(r.p);
      g.strokeStyle = r.d ? '#46514b' : '#58625b';
      g.lineWidth = r.w;
      g.beginPath();
      pts.forEach(([x, z], i) => {
        i ? g.lineTo(x, z) : g.moveTo(x, z);
      });
      g.stroke();
    }
    fill(
      map.buildings.map((b) => b.p),
      '#2d3631',
    );
    this.bg = { map, canvas: c };
    return c;
  }
}
