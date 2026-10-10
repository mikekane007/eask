import { Component, computed, inject } from '@angular/core';
import { GameService, type Talk } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { SoundService } from '../game/sound.service';
import { OUTCOMES, VERDICT_KEY } from '../game/state';
import type { Answer, Person, Place, PlaceOption, Quality } from '../game/types';

@Component({
  selector: 'app-sheet',
  standalone: true,
  template: `
    @if (svc.sheetVisible()) {
      <div class="sheet">
        <div class="sheet-in">
          @if (svc.talking(); as t) {
            @switch (t.phase) {
              @case ('question') {
                <div class="who">
                  <div>
                    <h2>{{ t.P.name }}</h2>
                    <div class="round">{{ i18n.tr(t.P.role) }} · {{ roundText(t) }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">{{ i18n.t('openness') }}</div>
                    <div class="bar" style="height:6px">
                      <i [style.width.%]="t.open" [style.background]="openColor(t.open)"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ i18n.tr(t.P.rounds[t.round].q) }}</div>
                <div class="opts">
                  @for (a of t.choices; track $index; let i = $index) {
                    <button class="opt" [id]="'ans-' + t.round + '-' + i" (click)="pick(a)">
                      <span>{{ i18n.tr(a[0]) }}</span>
                    </button>
                  }
                </div>
              }
              @case ('feedback') {
                <div class="who">
                  <div>
                    <h2>{{ t.P.name }}</h2>
                    <div class="round">{{ i18n.tr(t.P.role) }} · {{ roundText(t) }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">{{ i18n.t('openness') }}</div>
                    <div class="bar" style="height:6px">
                      <i [style.width.%]="t.open" [style.background]="openColor(t.open)"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ i18n.tr(t.P.rounds[t.round].q) }}</div>
                @if (t.picked; as p) {
                  <div class="mine">{{ i18n.t('youSaid', { text: i18n.tr(p[0]) }) }}</div>
                  <div [class]="'fb ' + p[1]">
                    <span class="verdict">{{ i18n.t(verdictKey[p[1]]) }}</span
                    >{{ i18n.tr(p[2]) }}<span class="ref">{{ i18n.ref(p[3]) }}</span>
                  </div>
                  @if (p[1] !== 'good') {
                    <div class="fb good">
                      <span class="verdict">{{ i18n.t('wiserReply') }}</span
                      >{{ i18n.tr(best(t)[0]) }}<span class="ref">{{ i18n.ref(best(t)[3]) }}</span>
                    </div>
                  }
                }
                <button class="go" (click)="svc.next()">
                  {{ svc.isLastRound(t) ? i18n.t('seeResult') : i18n.t('continue') }}
                </button>
              }
              @case ('result') {
                @if (t.outcome; as o) {
                  <h2 [class]="outcomes[o].cls" style="color:inherit">{{ i18n.t(outcomes[o].key) }}</h2>
                }
                <p style="line-height:1.5;margin:6px 0 4px">{{ svc.endMessage(t) }}</p>
                <ul class="review">
                  @for (q of t.log; track $index) {
                    <li>
                      <span [class]="'t-' + q" style="font-weight:800;width:14px">{{ icon[q] }}</span
                      >{{ i18n.t('questionNumber', { n: $index + 1, verdict: i18n.t(verdictKey[q]) }) }}
                    </li>
                  }
                </ul>
                <button class="go" (click)="svc.done()">{{ i18n.t('backToStreet') }}</button>
              }
            }
          } @else {
            @if (place(); as L) {
              <h2>{{ L.name ? i18n.tr(L.name) : '' }}</h2>
              <div class="sub">{{ svc.hoursText(L) }}</div>
              <div class="opts">
                @for (o of L.opts ?? []; track $index; let i = $index) {
                  <button
                    class="opt"
                    [id]="'p-' + L.id + '-' + i"
                    [disabled]="!!svc.placeClosedReason(o, L)"
                    (click)="svc.usePlaceOption(o)"
                  >
                    <span
                      >{{ i18n.tr(o.label) }}
                      @if (svc.placeClosedReason(o, L); as why) {
                        <span class="why">{{ why }}</span>
                      }
                    </span>
                    <span class="fx">{{ effects(o) }}</span>
                  </button>
                }
              </div>
            }
            @if (npc(); as P) {
              <div class="who">
                <div>
                  <h2>{{ P.name }}</h2>
                  <div class="sub">
                    {{ i18n.tr(P.role) }}
                    @if (svc.state().best[P.id]) {
                      · {{ i18n.t('lastTime') }} <span [class]="svc.npcStatus(P).cls">{{ svc.npcStatus(P).txt }}</span>
                    }
                  </div>
                </div>
              </div>
              <div class="opts">
                <button
                  class="opt"
                  [id]="'talk-' + P.id"
                  [disabled]="!!svc.approachBlock(P)"
                  (click)="svc.startTalk(P)"
                >
                  <span
                    >{{ svc.state().best[P.id] ? i18n.t('talkAgain') : i18n.t('startConversation') }}
                    @if (svc.approachBlock(P); as why) {
                      <span class="why">{{ why }}</span>
                    }
                  </span>
                  <span class="fx">{{ i18n.t('talkCost') }}</span>
                </button>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class SheetComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
  private readonly sound = inject(SoundService);

  pick(a: Answer): void {
    this.svc.answer(a);
    this.sound.verdict(a[1]);
  }
  readonly verdictKey = VERDICT_KEY;
  readonly outcomes = OUTCOMES;
  readonly icon: Record<Quality, string> = { good: '✓', ok: '~', bad: '✗' };
  readonly place = computed<Place | null>(() => {
    const c = this.svc.current();
    return c?.kind === 'place' ? c.ref : null;
  });
  readonly npc = computed<Person | null>(() => {
    const c = this.svc.current();
    return c?.kind === 'npc' ? c.ref : null;
  });
  openColor = (o: number) => (o >= 70 ? 'var(--green)' : o >= 40 ? 'var(--amber)' : 'var(--red)');
  roundText = (t: Talk) => this.i18n.t('questionOf', { n: t.round + 1, total: t.P.rounds.length });
  best = (t: Talk) => t.P.rounds[t.round].a.find((x) => x[1] === 'good') ?? t.P.rounds[t.round].a[0];
  effects(o: PlaceOption): string {
    const fx: string[] = [];
    if (o.word) fx.push(this.i18n.t('fxWord', { n: o.word }));
    if (o.body) fx.push(this.i18n.t('fxEnergy', { n: (o.body > 0 ? '+' : '') + o.body }));
    if (o.sleep) fx.push(this.i18n.t('fxFull'));
    if (o.h) fx.push(this.i18n.t('fxHours', { n: o.h }));
    return fx.join(' · ');
  }
}
