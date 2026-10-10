import {
  Component,
  type ElementRef,
  NgZone,
  type OnDestroy,
  ViewChild,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { AutopilotComponent } from './ui/autopilot.component';
import { AvatarComponent } from './ui/avatar.component';
import { CityPickerComponent } from './ui/city-picker.component';
import type { Engine } from './game/engine';
import { GameService } from './game/game.service';
import { I18n } from './game/i18n/i18n.service';
import { GraphicsService } from './game/graphics.service';
import { RoomService } from './game/net/room.service';
import { SoundService } from './game/sound.service';
import type { City } from './game/types';
import { GoalsComponent } from './ui/goals.component';
import { HudComponent } from './ui/hud.component';
import { IntroComponent } from './ui/intro.component';
import { MinimapComponent } from './ui/minimap.component';
import { RulesComponent } from './ui/rules.component';
import { SheetComponent } from './ui/sheet.component';
import { TogetherComponent } from './ui/together.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HudComponent,
    GoalsComponent,
    SheetComponent,
    IntroComponent,
    MinimapComponent,
    RulesComponent,
    CityPickerComponent,
    AvatarComponent,
    AutopilotComponent,
    TogetherComponent,
  ],
  template: `
    <div #stage></div>
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
    <app-avatar />
    <app-autopilot />
    <app-together />
    <app-rules />
    <app-city-picker />
  `,
})
export class AppComponent implements OnDestroy {
  readonly svc = inject(GameService);
  private readonly i18n = inject(I18n);
  private readonly zone = inject(NgZone);
  private readonly sound = inject(SoundService);
  private readonly graphics = inject(GraphicsService);
  private readonly room = inject(RoomService);
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLElement>;
  private engine?: Engine;
  private canvas?: HTMLCanvasElement;
  /** Bumped on every city change so a slow engine start can tell it has been superseded. */
  private generation = 0;
  private destroyed = false;

  constructor() {
    effect(() => {
      const city = this.svc.city();
      untracked(() => {
        this.mount(city);
      });
    });
    // Keep the document language in step with the game.
    effect(() => {
      document.documentElement.lang = this.i18n.lang();
    });
  }

  /** Tears down the current 3D world and, if a city is chosen, builds that city's world on a fresh canvas. */
  private mount(city: City | null): void {
    const gen = ++this.generation;
    this.engine?.dispose();
    this.engine = undefined;
    this.canvas?.remove();
    this.canvas = undefined;
    if (!city) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'c';
    this.stage.nativeElement.appendChild(canvas);
    this.canvas = canvas;

    void this.zone.runOutsideAngular(async () => {
      // a city with a real street map needs it downloaded before its world can be built
      try {
        await this.zone.run(() => this.svc.loadRealMap());
      } catch {
        this.zone.run(() => {
          this.svc.toast(this.i18n.t('mapFailed'));
        });
      }
      if (this.stale(gen)) return;
      // The 3D engine (and three.js, most of the code) loads only once a city is chosen, so the first screen is quick.
      const { createEngine } = await import('./game/engine');
      if (this.stale(gen)) return;
      const engine = await createEngine(canvas, this.svc, this.zone, city, this.sound, this.graphics, this.room);
      if (this.stale(gen)) {
        engine.dispose();
        return;
      }
      this.engine = engine;
      engine.start();
    });
  }

  /** True once this component is gone or another city has been chosen since `gen` started. */
  private stale(gen: number): boolean {
    return this.destroyed || gen !== this.generation;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.engine?.dispose();
  }
}
