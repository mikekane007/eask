import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { CityArtComponent } from './city-art.component';
import { LangSwitchComponent } from './lang-switch.component';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [LangSwitchComponent, CityArtComponent],
  template: `
    @if (svc.city() && !svc.playing()) {
      <div class="modal">
        <div class="modal-in">
          <app-city-art class="intro-art" [city]="svc.cityId() ?? ''" />
          <div class="picker-top"><app-lang-switch /></div>
          <h1>{{ i18n.t('title') }}</h1>
          <p class="verse">{{ i18n.t('verse') }}</p>
          <p class="keys" style="color:var(--gold);font-weight:800">{{ i18n.t('verseRef') }}</p>
          <p class="city-line">{{ svc.city()?.name }} · {{ i18n.tr(svc.city()?.country ?? '') }}</p>
          <p>{{ i18n.t('blurb', { city: svc.city()?.name ?? '', count: svc.people().length }) }}</p>
          <p class="keys">{{ i18n.t('keysHelp') }}</p>
          @if (svc.city()?.reviewed === false) {
            <p class="keys draft">{{ i18n.t('draftNote') }}</p>
          }
          <button class="mbtn" [disabled]="!svc.worldReady()" (click)="svc.begin()">
            @if (svc.worldReady()) {
              {{ svc.hasSave() ? i18n.t('continueGame') : i18n.t('stepOut') }}
            } @else {
              <span class="spinner" aria-hidden="true"></span> {{ i18n.t('loadingStreets') }}
            }
          </button>
          <button class="mbtn ghost" (click)="svc.avatarOpen.set(true)">{{ i18n.t('lookTitle') }}</button>
          @if (svc.hasSave()) {
            <button class="mbtn ghost" (click)="svc.reset()">{{ i18n.t('startOver') }}</button>
          }
          <button class="mbtn ghost" (click)="svc.rulesOpen.set(true)">{{ i18n.t('howToPlay') }}</button>
          <button class="mbtn ghost" (click)="svc.leaveCity()">{{ i18n.t('backToCities') }}</button>
        </div>
      </div>
    }
  `,
})
export class IntroComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
}
