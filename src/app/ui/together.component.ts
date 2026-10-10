import { Component, inject, signal } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { RoomService } from '../game/net/room.service';

/** Open a room, share its code, or join a friend's. */
@Component({
  selector: 'app-together',
  standalone: true,
  template: `
    @if (room.menuOpen() && svc.city()) {
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('togetherTitle')">
        <div class="modal-in">
          <h2 class="auto-h">{{ i18n.t('togetherTitle') }}</h2>
          @if (room.status() === 'in') {
            <p>{{ i18n.t('roomShare') }}</p>
            <p class="room-code" aria-live="polite">
              <span class="opt-title">{{ i18n.t('roomYourCode') }}</span>
              <b>{{ room.code() }}</b>
            </p>
            <button type="button" class="mbtn ghost" (click)="copy()">
              {{ copied() ? i18n.t('roomCopied') : i18n.t('roomCopy') }}
            </button>
            <p class="opt-title">{{ i18n.t('roomPlayers') }}</p>
            <ul class="room-list">
              <li>{{ room.name() }}</li>
              @for (p of room.peers(); track p.id) {
                <li>{{ p.name }}</li>
              }
            </ul>
            @if (room.peers().length === 0) {
              <p>{{ i18n.t('roomAlone') }}</p>
            }
            <button class="mbtn" (click)="room.menuOpen.set(false)">{{ i18n.t('roomClose') }}</button>
            <button class="mbtn ghost" (click)="room.leave()">{{ i18n.t('roomLeave') }}</button>
          } @else {
            <p>{{ i18n.t('togetherHint') }}</p>
            <label class="opt-title" for="room-name">{{ i18n.t('yourName') }}</label>
            <input
              id="room-name"
              class="reply wide"
              type="text"
              maxlength="20"
              autocomplete="nickname"
              [value]="room.name()"
              (input)="room.setName(nameBox.value)"
              #nameBox
            />
            <button class="mbtn" [disabled]="room.status() === 'connecting'" (click)="room.create()">
              {{ room.status() === 'connecting' ? i18n.t('roomConnecting') : i18n.t('roomCreate') }}
            </button>
            <label class="opt-title" for="room-code">{{ i18n.t('roomCode') }}</label>
            <div class="typed">
              <input
                id="room-code"
                class="reply code"
                type="text"
                maxlength="8"
                autocomplete="off"
                autocapitalize="characters"
                [placeholder]="i18n.t('roomCodeHint')"
                (input)="room.error.set(null)"
                (keydown.enter)="room.join(codeBox.value)"
                #codeBox
              />
              <button class="go" [disabled]="room.status() === 'connecting'" (click)="room.join(codeBox.value)">
                {{ i18n.t('roomJoin') }}
              </button>
            </div>
            @if (room.error(); as key) {
              <p class="why" role="alert">{{ i18n.t(key) }}</p>
            }
            <button class="mbtn ghost" (click)="room.menuOpen.set(false)">{{ i18n.t('roomClose') }}</button>
          }
        </div>
      </div>
    }
  `,
})
export class TogetherComponent {
  readonly svc = inject(GameService);
  readonly room = inject(RoomService);
  readonly i18n = inject(I18n);
  readonly copied = signal(false);

  copy(): void {
    void navigator.clipboard
      .writeText(this.room.code())
      .then(() => {
        this.copied.set(true);
        setTimeout(() => {
          this.copied.set(false);
        }, 1500);
      })
      .catch(() => undefined);
  }
}
