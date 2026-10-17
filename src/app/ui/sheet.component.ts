import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { GameService, type Talk } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { SoundService } from '../game/sound.service';
import { OUTCOMES, VERDICT_KEY } from '../game/state';
import { MIN_WORDS, wordCount } from '../game/typed-answer';
import { PortraitComponent } from './portrait.component';
import type { Answer, Person, Place, PlaceOption, Quality } from '../game/types';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [PortraitComponent],
  template: `
    @if (svc.sheetVisible()) {
      <div class="sheet" role="region" [attr.aria-label]="regionLabel()">
        <div class="sheet-in">
          @if (svc.talking(); as t) {
            @switch (t.phase) {
              @case ('question') {
                <div class="who">
                  <app-portrait [person]="t.P" />
                  <div class="who-name">
                    <h2>{{ t.P.name }}</h2>
                    <div class="round">{{ i18n.tr(t.P.role) }} · {{ roundText(t) }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">{{ i18n.t('openness') }}</div>
                    <div
                      class="gauge"
                      role="meter"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      [attr.aria-valuenow]="t.open"
                      [attr.aria-label]="i18n.t('openness')"
                    >
                      <i [style.left.%]="t.open"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ i18n.tr(t.P.rounds[t.round].q) }}</div>
                @if (isTyped(t)) {
                  <p class="sub">{{ i18n.t('typeOnly') }}</p>
                  <div class="typed">
                    <input
                      #reply
                      type="text"
                      class="reply"
                      autocomplete="off"
                      [attr.aria-label]="i18n.t('typeHint')"
                      [placeholder]="i18n.t('typeHint')"
                      [value]="draft()"
                      (input)="draft.set(reply.value)"
                      (keydown.enter)="send()"
                    />
                    <button class="go" [disabled]="!canSend()" (click)="send()">{{ i18n.t('typeSend') }}</button>
                  </div>
                  @if (draft() && !canSend()) {
                    <p class="why">{{ i18n.t('typeShort') }}</p>
                  }
                } @else {
                  <div class="opts">
                    @for (a of t.choices; track $index; let i = $index) {
                      <button class="opt" [id]="'ans-' + t.round + '-' + i" (click)="pick(a)">
                        <span>{{ i18n.tr(a[0]) }}</span>
                      </button>
                    }
                  </div>
                }
              }
              @case ('feedback') {
                <div class="who">
                  <app-portrait [person]="t.P" />
                  <div class="who-name">
                    <h2>{{ t.P.name }}</h2>
                    <div class="round">{{ i18n.tr(t.P.role) }} · {{ roundText(t) }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">{{ i18n.t('openness') }}</div>
                    <div
                      class="gauge"
                      role="meter"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      [attr.aria-valuenow]="t.open"
                      [attr.aria-label]="i18n.t('openness')"
                    >
                      <i [style.left.%]="t.open"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ i18n.tr(t.P.rounds[t.round].q) }}</div>
                @if (t.picked; as p) {
                  <div class="mine">{{ i18n.t('youSaid', { text: i18n.tr(p[0]) }) }}</div>
                  @if (t.close !== undefined) {
                    <div class="close-meter">
                      <span>{{ i18n.t('closeness', { n: t.close }) }}</span>
                      <div
                        class="bar"
                        role="meter"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        [attr.aria-valuenow]="t.close"
                        [attr.aria-label]="i18n.t('closeness', { n: t.close })"
                      >
                        <i [style.width.%]="t.close" [class]="p[1]"></i>
                      </div>
                    </div>
                  }
                  <div [class]="'fb ' + p[1]" role="status">
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
                <p style="line-height:1.5;margin:6px 0 4px" role="status">{{ svc.endMessage(t) }}</p>
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
                <app-portrait [person]="P" />
                <div class="who-name">
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // In a conversation, keyboard and screen-reader users start where the next step is: the reply box or the
    // first answer, then Continue, then Back to the street. Place panels open while walking, so they keep the keys.
    effect(() => {
      const t = this.svc.talking();
      if (!t) return;
      const target = t.phase === 'question' ? (this.isTyped(t) ? 'input.reply' : 'button.opt') : 'button.go';
      afterNextRender(
        () => {
          this.host.nativeElement.querySelector<HTMLElement>(target)?.focus();
        },
        { injector: this.injector },
      );
    });
  }

  /** Name of the panel for screen readers: the person being spoken to, or the place. */
  readonly regionLabel = computed(() => {
    const t = this.svc.talking();
    if (t) return t.P.name;
    const c = this.svc.current();
    if (c?.kind === 'npc') return c.ref.name;
    return c?.ref.name ? this.i18n.tr(c.ref.name) : '';
  });

  pick(a: Answer): void {
    this.svc.answer(a);
    this.sound.verdict(a[1]);
  }
  /** What is being typed for a question that must be answered in your own words. */
  readonly draft = signal('');
  isTyped = (t: Talk) => !!t.P.rounds[t.round].typed;
  canSend = () => wordCount(this.draft()) >= MIN_WORDS;
  send(): void {
    const t = this.svc.talking();
    if (!t || !this.canSend()) return;
    const text = this.draft();
    this.draft.set('');
    this.svc.answerTyped(text);
    const q = this.svc.talking()?.log.at(-1);
    if (q) this.sound.verdict(q);
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
  roundText = (t: Talk) => this.i18n.t('questionOf', { n: t.round + 1, total: t.P.rounds.length });
  best = (t: Talk) => t.P.rounds[t.round].a.find((x) => x[1] === 'good') ?? t.P.rounds[t.round].a[0];
  effects(o: PlaceOption): string {
    if (o.call) return this.i18n.t('talkCost');
    const fx: string[] = [];
    if (o.word) fx.push(this.i18n.t('fxWord', { n: o.word }));
    if (o.body) fx.push(this.i18n.t('fxEnergy', { n: (o.body > 0 ? '+' : '') + o.body }));
    if (o.sleep) fx.push(this.i18n.t('fxFull'));
    if (o.h) fx.push(this.i18n.t('fxHours', { n: o.h }));
    return fx.join(' · ');
  }
}
