import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  template: `
    <div class="hud">
      <div class="stats">
        <div class="chip">
          <div class="lbl">Energy</div>
          <div class="val">{{ round(svc.state().body) }}</div>
          <div class="bar"><i [style.width.%]="svc.state().body" style="background:var(--red)"></i></div>
        </div>
        <div class="chip">
          <div class="lbl">Word</div>
          <div class="val">{{ round(svc.state().word) }}</div>
          <div class="bar"><i [style.width.%]="svc.state().word" style="background:var(--green)"></i></div>
        </div>
        <div class="chip">
          <div class="lbl">Wise answers</div>
          <div class="val" style="color:var(--gold)">{{ svc.accuracy() }}</div>
        </div>
      </div>
      <div class="clock">
        <b>{{ pad(svc.state().hour) }}:00</b><span>Day {{ svc.state().day }}</span>
      </div>
    </div>
    <div class="side">
      <button class="btn-r" aria-label="Show people and progress" (click)="svc.goalsOpen.set(!svc.goalsOpen())">
        {{ svc.goalsOpen() ? '‹' : '›' }}
      </button>
      <button class="btn-r" aria-label="Game rules" (click)="svc.rulesOpen.set(true)">?</button>
      <button class="btn-r" aria-label="Toggle map" (click)="svc.mapOpen.set(!svc.mapOpen())">M</button>
      <button class="btn-r" aria-label="Zoom in" (click)="svc.zoom.set(Math.max(0.5, svc.zoom() - 0.15))">+</button>
      <button class="btn-r" aria-label="Zoom out" (click)="svc.zoom.set(Math.min(1.8, svc.zoom() + 0.15))">−</button>
    </div>
  `,
})
export class HudComponent {
  readonly svc = inject(GameService);
  readonly Math = Math;
  round = (n: number) => Math.round(n);
  pad = (n: number) => String(n).padStart(2, '0');
}
