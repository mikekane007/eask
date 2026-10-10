import { Injectable, computed, inject, signal } from '@angular/core';
import { GameService } from './game.service';
import { GRAPHICS, isLevel, lowerLevel, type GraphicsLevel } from './graphics';
import { I18n } from './i18n/i18n.service';

const LEVEL_KEY = 'goandtell:graphics';
const AUTO_KEY = 'goandtell:graphics-auto';

/**
 * How much detail the game draws. It starts on Medium with Auto on: if the game cannot keep a steady frame rate it
 * lowers the detail by itself and says so. Choosing a level yourself turns Auto off.
 */
@Injectable({ providedIn: 'root' })
export class GraphicsService {
  private readonly game = inject(GameService);
  private readonly i18n = inject(I18n);

  readonly level = signal<GraphicsLevel>(this.readLevel());
  readonly auto = signal(this.readAuto());
  readonly spec = computed(() => GRAPHICS[this.level()]);

  private readLevel(): GraphicsLevel {
    try {
      const v = localStorage.getItem(LEVEL_KEY);
      if (isLevel(v)) return v;
    } catch {
      /* storage unavailable */
    }
    return 'medium';
  }

  private readAuto(): boolean {
    try {
      return localStorage.getItem(AUTO_KEY) !== '0';
    } catch {
      return true;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(LEVEL_KEY, this.level());
      localStorage.setItem(AUTO_KEY, this.auto() ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  /** The player picked a level: use it and stop adjusting automatically. */
  choose(level: GraphicsLevel): void {
    this.level.set(level);
    this.auto.set(false);
    this.persist();
  }

  setAuto(on: boolean): void {
    this.auto.set(on);
    this.persist();
  }

  /** Called when the game cannot keep up. Lowers the level one step (if Auto is on) and tells the player. */
  lowerAutomatically(): GraphicsLevel | null {
    if (!this.auto()) return null;
    const next = lowerLevel(this.level());
    if (!next) return null;
    this.level.set(next);
    this.persist();
    this.game.toast(this.i18n.t('gfxLowered', { level: this.i18n.t(next === 'low' ? 'gfxLow' : 'gfxMedium') }));
    return next;
  }
}
