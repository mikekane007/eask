import { Component, inject } from '@angular/core';
import { I18n, type Lang } from '../game/i18n/i18n.service';

/** English / French toggle. */
@Component({
  selector: 'app-lang-switch',
  standalone: true,
  template: `
    <div class="lang" role="group" [attr.aria-label]="i18n.t('language')">
      @for (l of langs; track l.code) {
        <button
          type="button"
          class="lang-btn"
          [class.on]="i18n.lang() === l.code"
          [attr.aria-pressed]="i18n.lang() === l.code"
          [attr.lang]="l.code"
          (click)="i18n.setLang(l.code)"
        >
          {{ l.label }}
        </button>
      }
    </div>
  `,
})
export class LangSwitchComponent {
  readonly i18n = inject(I18n);
  readonly langs: { code: Lang; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];
}
