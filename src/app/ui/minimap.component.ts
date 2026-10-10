import { Component, type ElementRef, NgZone, type OnDestroy, type OnInit, ViewChild, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { B, H, N, T, bC, bMin } from '../game/layout';
import { PLACES, markerPos } from '../game/places.data';

const SIZE = 176;
const LABELS: Record<string, string> = {
  church: 'CHAPEL',
  chop: 'EAT',
  home: 'HOME',
  market: 'MARKET',
  tech: 'TECH',
  site: 'SITE',
};

/** A small top-down map: streets, named places, people ready to talk, and you. Redrawn ~6 times a second. */
@Component({
  selector: 'app-minimap',
  standalone: true,
  template: `
    @if (svc.playing() && svc.mapOpen()) {
      <div class="minimap" aria-label="Street map">
        <canvas #c [width]="size" [height]="size"></canvas>
        <div class="legend">
          <span><i style="background:var(--gold)"></i>Ready to talk</span>
          <span><i style="background:var(--green)"></i>Reached</span>
          <span><i style="background:#fff"></i>You</span>
        </div>
      </div>
    }
  `,
})
export class MinimapComponent implements OnInit, OnDestroy {
  readonly svc = inject(GameService);
  private readonly zone = inject(NgZone);
  readonly size = SIZE;
  @ViewChild('c') canvas?: ElementRef<HTMLCanvasElement>;
  private timer?: ReturnType<typeof setInterval>;

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
    const k = SIZE / T;
    const X = (x: number) => (x + H) * k;
    const s = this.svc.state();
    const live = this.svc.live;

    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = '#161d19';
    g.fillRect(0, 0, SIZE, SIZE);

    // blocks, tinted for the named places
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const place = PLACES.find((p) => p.bi === i && p.bj === j);
        g.fillStyle = place ? (place.deco ? '#34423a' : '#4a5a3a') : '#26322b';
        g.fillRect(X(bMin(i)), X(bMin(j)), B * k, B * k);
      }
    }

    // place labels
    g.font = '700 8px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const p of PLACES) {
      const label = LABELS[p.id];
      if (!label) continue;
      const cx = X(bC(p.bi));
      const cy = X(bC(p.bj));
      g.fillStyle = p.deco ? '#8d9a90' : '#f2b705';
      g.fillText(label, cx, cy);
      if (!p.deco) {
        const m = markerPos(p);
        g.beginPath();
        g.arc(X(m.x), X(m.z), 3, 0, Math.PI * 2);
        g.fill();
      }
    }

    // people
    const pulse = 3.4 + Math.sin(performance.now() / 250);
    for (const n of live.npcs) {
      const won = s.best[n.id] === 'open';
      g.beginPath();
      g.arc(X(n.x), X(n.z), n.on ? pulse : 2.4, 0, Math.PI * 2);
      g.fillStyle = won ? '#3dbe6e' : n.on ? '#f2b705' : '#66736b';
      g.fill();
    }

    // you: a white arrow pointing the way you face
    g.save();
    g.translate(X(live.x), X(live.z));
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
}
