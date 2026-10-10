import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { SoundService } from '../game/sound.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  template: `
    @if (svc.city()) {
      <div class="hud">
        <div class="stats">
          <div class="chip">
            <div class="lbl">{{ i18n.t('energy') }}</div>
            <div class="val">{{ round(svc.state().body) }}</div>
            <div class="bar"><i [style.width.%]="svc.state().body" style="background:var(--red)"></i></div>
          </div>
          <div class="chip">
            <div class="lbl">{{ i18n.t('word') }}</div>
            <div class="val">{{ round(svc.state().word) }}</div>
            <div class="bar"><i [style.width.%]="svc.state().word" style="background:var(--green)"></i></div>
          </div>
          <div class="chip">
            <div class="lbl">{{ i18n.t('wiseAnswers') }}</div>
            <div class="val" style="color:var(--gold)">{{ svc.accuracy() }}</div>
          </div>
        </div>
        <div class="clock">
          <b>{{ pad(svc.state().hour) }}:{{ pad(svc.state().minute) }}</b
          ><span>{{ i18n.t('day', { n: svc.state().day }) }} · {{ weatherLabel() }}</span>
        </div>
      </div>
      <div class="side">
        <button class="btn-r" [attr.aria-label]="i18n.t('showPeople')" (click)="svc.goalsOpen.set(!svc.goalsOpen())">
          {{ svc.goalsOpen() ? '‹' : '›' }}
        </button>
        <button class="btn-r" [attr.aria-label]="i18n.t('gameRules')" (click)="svc.rulesOpen.set(true)">?</button>
        <button class="btn-r" [attr.aria-label]="i18n.t('toggleMap')" (click)="svc.mapOpen.set(!svc.mapOpen())">
          M
        </button>
        <button
          class="btn-r"
          [class.off]="sound.muted()"
          [attr.aria-label]="sound.muted() ? i18n.t('soundOff') : i18n.t('soundOn')"
          [attr.aria-pressed]="!sound.muted()"
          (click)="sound.toggleMute()"
        >
          ♪
        </button>
        <button
          class="btn-r small"
          [attr.aria-label]="i18n.t('language')"
          (click)="i18n.setLang(i18n.lang() === 'en' ? 'fr' : 'en')"
        >
          {{ i18n.lang() === 'en' ? 'FR' : 'EN' }}
        </button>
        <button
          class="btn-r"
          [attr.aria-label]="i18n.t('zoomIn')"
          (click)="svc.zoom.set(Math.max(0.5, svc.zoom() - 0.15))"
        >
          +
        </button>
        <button
          class="btn-r"
          [attr.aria-label]="i18n.t('zoomOut')"
          (click)="svc.zoom.set(Math.min(1.8, svc.zoom() + 0.15))"
        >
          −
        </button>
      </div>
    }
  `,
})
export class HudComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
  readonly sound = inject(SoundService);
  readonly Math = Math;
  weatherLabel = () => {
    const keys = {
      clear: 'weatherClear',
      cloudy: 'weatherCloudy',
      rain: 'weatherRain',
      fog: 'weatherFog',
    } as const;
    return this.i18n.t(keys[this.svc.weather()]);
  };
  round = (n: number) => Math.round(n);
  pad = (n: number) => String(n).padStart(2, '0');
}
