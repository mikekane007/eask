import { Component, inject } from '@angular/core';
import { HAIR_COLORS, HAIR_STYLES, type HairStyle, OUTFITS, SKIN_TONES, css, type Avatar } from '../game/avatar';
import type { UiKey } from '../game/i18n/ui';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { RoomService } from '../game/net/room.service';
import { AvatarPreviewComponent } from './avatar-preview.component';

/** Choose your name and how your character looks, with the character shown in 3D as it walks the city. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [AvatarPreviewComponent],
  template: `
    @if (svc.avatarOpen()) {
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('lookTitle')">
        <div class="modal-in avatar">
          <h2>{{ i18n.t('lookTitle') }}</h2>
          <app-avatar-preview [look]="a()" [label]="i18n.t('lookTitle')" />
          <p class="look-turn">{{ i18n.t('lookTurn') }}</p>
          <label class="opt-title" for="look-name">{{ i18n.t('lookName') }}</label>
          <input
            #nameBox
            id="look-name"
            type="text"
            class="reply name"
            maxlength="20"
            autocomplete="nickname"
            [placeholder]="i18n.t('lookNameHint')"
            [value]="room.name()"
            (input)="room.setName(nameBox.value)"
          />
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
          <p class="opt-title">{{ i18n.t('lookStyle') }}</p>
          <div class="seg wrap" role="group">
            @for (st of styles; track st; let i = $index) {
              <button
                type="button"
                [class.on]="a().style === i"
                [attr.aria-pressed]="a().style === i"
                (click)="set({ style: i })"
              >
                {{ i18n.t(styleKey[st]) }}
              </button>
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
          <button class="mbtn" [disabled]="!room.hasName()" (click)="done()">{{ i18n.t('lookDone') }}</button>
        </div>
      </div>
    }
  `,
})
export class AvatarComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
  readonly room = inject(RoomService);
  readonly skins = SKIN_TONES;
  readonly hairs = HAIR_COLORS;
  readonly outfits = OUTFITS;
  readonly styles = HAIR_STYLES;
  readonly styleKey: Record<HairStyle, UiKey> = {
    short: 'styleShort',
    afro: 'styleAfro',
    long: 'styleLong',
    bun: 'styleBun',
  };
  readonly hex = css;

  a = this.svc.avatar;

  done(): void {
    if (!this.room.hasName()) return;
    this.room.saveName();
    this.svc.confirmAvatar();
  }

  set(change: Partial<Avatar>): void {
    this.svc.setAvatar({ ...this.svc.avatar(), ...change });
  }
}
