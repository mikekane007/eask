import { Component, inject } from '@angular/core';
import { HAIR_COLORS, OUTFITS, SKIN_TONES, css, type Avatar } from '../game/avatar';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';

/** Choose how your character looks. The preview is plain HTML, so no second 3D scene is needed. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (svc.avatarOpen()) {
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('lookTitle')">
        <div class="modal-in avatar">
          <h2>{{ i18n.t('lookTitle') }}</h2>
          <div class="look" aria-hidden="true">
            <i class="l-hair" [class.long]="a().female" [style.background]="hair(a())"></i>
            <i class="l-head" [style.background]="skin(a())"></i>
            <i class="l-body" [class.dress]="a().female" [style.background]="outfit(a())"></i>
            <i class="l-leg" [style.background]="a().female ? skin(a()) : '#22303c'"></i>
          </div>
          <div class="seg" role="group">
            <button
              type="button"
              [class.on]="!a().female"
              [attr.aria-pressed]="!a().female"
              (click)="set({ female: false })"
            >
              {{ i18n.t('lookGuy') }}
            </button>
            <button
              type="button"
              [class.on]="a().female"
              [attr.aria-pressed]="a().female"
              (click)="set({ female: true })"
            >
              {{ i18n.t('lookLady') }}
            </button>
          </div>
          <p class="opt-title">{{ i18n.t('lookSkin') }}</p>
          <div class="swatches">
            @for (c of skins; track $index) {
              <button
                type="button"
                class="sw"
                [class.on]="a().skin === $index"
                [style.background]="hex(c)"
                [attr.aria-label]="i18n.t('lookOption', { n: $index + 1 })"
                [attr.aria-pressed]="a().skin === $index"
                (click)="set({ skin: $index })"
              ></button>
            }
          </div>
          <p class="opt-title">{{ i18n.t('lookHair') }}</p>
          <div class="swatches">
            @for (c of hairs; track $index) {
              <button
                type="button"
                class="sw"
                [class.on]="a().hair === $index"
                [style.background]="hex(c)"
                [attr.aria-label]="i18n.t('lookOption', { n: $index + 1 })"
                [attr.aria-pressed]="a().hair === $index"
                (click)="set({ hair: $index })"
              ></button>
            }
          </div>
          <p class="opt-title">{{ i18n.t('lookOutfit') }}</p>
          <div class="swatches">
            @for (o of outfits; track $index) {
              <button
                type="button"
                class="sw"
                [class.on]="a().outfit === $index"
                [class.kente]="o.print === 'kente'"
                [style.background]="o.print ? null : hex(o.color)"
                [attr.aria-label]="o.print ? i18n.t('lookKente') : i18n.t('lookOption', { n: $index + 1 })"
                [attr.aria-pressed]="a().outfit === $index"
                (click)="set({ outfit: $index })"
              ></button>
            }
          </div>
          <button class="mbtn" (click)="svc.confirmAvatar()">{{ i18n.t('lookDone') }}</button>
        </div>
      </div>
    }
  `,
})
export class AvatarComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
  readonly skins = SKIN_TONES;
  readonly hairs = HAIR_COLORS;
  readonly outfits = OUTFITS;
  readonly hex = css;

  a = this.svc.avatar;

  skin = (a: Avatar) => css(SKIN_TONES[a.skin]);
  hair = (a: Avatar) => css(HAIR_COLORS[a.hair]);
  outfit = (a: Avatar) => css(OUTFITS[a.outfit].color);

  set(change: Partial<Avatar>): void {
    this.svc.setAvatar({ ...this.svc.avatar(), ...change });
  }
}
