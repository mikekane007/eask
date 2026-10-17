import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { CityArtComponent } from './city-art.component';
import { LangSwitchComponent } from './lang-switch.component';

/** First screen: choose a city. Each city keeps its own saved progress. */
@Component({
  selector: 'app-city-picker',
  standalone: true,
  imports: [LangSwitchComponent, CityArtComponent],
  template: `
    @if (!svc.city()) {
      <div class="modal picker">
        <div class="modal-in picker-in" role="dialog" aria-modal="true" aria-labelledby="picker-title">
          <div class="picker-top"><app-lang-switch /></div>
          <h1 id="picker-title">{{ i18n.t('title') }}</h1>
          <h2 class="picker-sub-title">{{ i18n.t('pickTitle') }}</h2>
          <p>{{ i18n.t('pickSub') }}</p>
          <div class="cities">
            @for (c of svc.pickable; track c.id) {
              <button class="city" [id]="'city-' + c.id" (click)="svc.selectCity(c.id)">
                <app-city-art [city]="c.id" />
                <span class="city-country">{{ i18n.tr(c.country) }}</span>
                <span class="city-name">{{ c.name }}</span>
                <span class="city-tag">{{ i18n.tr(c.tagline) }}</span>
                <span class="city-meta">
                  <span>{{ i18n.t('peopleCount', { n: c.people.length }) }}</span>
                  @if (svc.savedProgress(c.id); as p) {
                    <span class="city-prog">{{ i18n.t('reachedCount', { a: p.won, b: c.people.length }) }}</span>
                  }
                  @if (!c.reviewed) {
                    <span class="city-draft" [title]="i18n.t('draftNote')">{{ i18n.t('draftBadge') }}</span>
                  }
                </span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CityPickerComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
}
