import { Component, type ElementRef, NgZone, type OnDestroy, type OnInit, ViewChild, inject } from '@angular/core';
import { type Engine, createEngine } from './game/engine';
import { GameService } from './game/game.service';
import { GoalsComponent } from './ui/goals.component';
import { HudComponent } from './ui/hud.component';
import { IntroComponent } from './ui/intro.component';
import { MinimapComponent } from './ui/minimap.component';
import { RulesComponent } from './ui/rules.component';
import { SheetComponent } from './ui/sheet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HudComponent, GoalsComponent, SheetComponent, IntroComponent, MinimapComponent, RulesComponent],
  template: `
    <canvas #c id="c"></canvas>
    <app-hud />
    <app-goals />
    <app-minimap />
    <app-sheet />
    @if (svc.toastMsg(); as msg) {
      <div class="toast" [style.opacity]="svc.toastFading() ? 0 : 1">{{ msg }}</div>
    }
    @if (svc.joy(); as j) {
      <div class="joy" [style.left.px]="j.x" [style.top.px]="j.y">
        <i [style.transform]="'translate(' + j.dx * 45 + 'px,' + j.dy * 45 + 'px)'"></i>
      </div>
    }
    <app-intro />
    <app-rules />
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  readonly svc = inject(GameService);
  private zone = inject(NgZone);
  @ViewChild('c', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private engine?: Engine;
  private destroyed = false;

  ngOnInit(): void {
    void this.zone.runOutsideAngular(async () => {
      const engine = await createEngine(this.canvas.nativeElement, this.svc, this.zone);
      if (this.destroyed) {
        engine.dispose();
        return;
      }
      this.engine = engine;
      engine.start();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.engine?.dispose();
  }
}
