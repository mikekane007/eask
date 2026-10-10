import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';

/** Pick where to walk to by yourself. A bar with a Stop button shows while autopilot is running. */
@Component({
  selector: 'app-autopilot',
  standalone: true,
  template: `
    @if (svc.autopilotMenu() && svc.playing()) {
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('autoTitle')">
        <div class="modal-in">
          <h2 class="auto-h">{{ i18n.t('autoTitle') }}</h2>
          <p>{{ i18n.t('autoHint') }}</p>
          <div class="auto-list">
            @for (p of svc.places(); track p.id) {
              @if (!p.deco) {
                <button type="button" class="mbtn ghost" (click)="svc.goTo({ kind: 'place', id: p.id })">
                  {{ i18n.tr(p.name ?? '') }}
                </button>
              }
            }
            @for (n of svc.people(); track n.id) {
              <button type="button" class="mbtn ghost" (click)="svc.goTo({ kind: 'npc', id: n.id })">
                {{ n.name }}
              </button>
            }
          </div>
          <button class="mbtn" (click)="svc.autopilotMenu.set(false)">{{ i18n.t('autoClose') }}</button>
        </div>
      </div>
    }
    @if (svc.autopilot()) {
      <div class="auto-bar" role="status">
        <span>{{ i18n.t('autoWalking') }}</span>
        <button type="button" (click)="svc.stopAutopilot()">{{ i18n.t('autoStop') }}</button>
      </div>
    }
  `,
})
export class AutopilotComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
}
