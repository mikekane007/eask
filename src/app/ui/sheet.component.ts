import { Component, computed, inject } from '@angular/core';
import { GameService, type Talk } from '../game/game.service';
import { OUTCOMES, VERDICT } from '../game/state';
import { type Place } from '../game/places.data';
import { type Person, type Quality } from '../game/people.data';

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
                    <div class="round">{{ t.P.role }} · Question {{ t.round + 1 }} of {{ t.P.rounds.length }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">Openness</div>
                    <div class="bar" style="height:6px">
                      <i [style.width.%]="t.open" [style.background]="openColor(t.open)"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ t.P.rounds[t.round].q }}</div>
                <div class="opts">
                  @for (a of t.choices; track a[0]; let i = $index) {
                    <button class="opt" [id]="'ans-' + t.round + '-' + i" (click)="svc.answer(a)">
                      <span>{{ a[0] }}</span>
                    </button>
                  }
                </div>
              }
              @case ('feedback') {
                <div class="who">
                  <div>
                    <h2>{{ t.P.name }}</h2>
                    <div class="round">{{ t.P.role }} · Question {{ t.round + 1 }} of {{ t.P.rounds.length }}</div>
                  </div>
                  <div class="open">
                    <div class="lbl">Openness</div>
                    <div class="bar" style="height:6px">
                      <i [style.width.%]="t.open" [style.background]="openColor(t.open)"></i>
                    </div>
                  </div>
                </div>
                <div class="bubble">{{ t.P.rounds[t.round].q }}</div>
                <div class="mine">You said: “{{ t.picked![0] }}”</div>
                <div [class]="'fb ' + t.picked![1]">
                  <span class="verdict">{{ verdict[t.picked![1]] }}</span
                  >{{ t.picked![2] }}<span class="ref">{{ t.picked![3] }}</span>
                </div>
                @if (t.picked![1] !== 'good') {
                  <div class="fb good">
                    <span class="verdict">A wiser reply</span>{{ best(t)[0] }}<span class="ref">{{ best(t)[3] }}</span>
                  </div>
                }
                <button class="go" (click)="svc.next()">
                  {{ svc.isLastRound(t) ? 'See how it went' : 'Continue' }}
                </button>
              }
              @case ('result') {
                <h2 [class]="outcomes[t.outcome!].cls" style="color:inherit">{{ outcomes[t.outcome!].label }}</h2>
                <p style="line-height:1.5;margin:6px 0 4px">{{ t.message }}</p>
                <ul class="review">
                  @for (q of t.log; track $index) {
                    <li>
                      <span [class]="'t-' + q" style="font-weight:800;width:14px">{{ icon[q] }}</span
                      >Question {{ $index + 1 }}: {{ verdict[q] }}
                    </li>
                  }
                </ul>
                <button class="go" (click)="svc.done()">Back to the street</button>
              }
            }
          } @else {
            @if (place(); as L) {
              <h2>{{ L.name }}</h2>
              <div class="sub">
                {{
                  L.open![1] - L.open![0] >= 24
                    ? 'Open all day'
                    : 'Open ' + pad(L.open![0]) + ':00–' + pad(L.open![1]) + ':00'
                }}
              </div>
              <div class="opts">
                @for (o of L.opts; track o.label; let i = $index) {
                  <button
                    class="opt"
                    [id]="'p-' + L.id + '-' + i"
                    [disabled]="!!svc.placeClosedReason(o, L)"
                    (click)="svc.usePlaceOption(o)"
                  >
                    <span
                      >{{ o.label }}
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
                    {{ P.role }}
                    @if (svc.state().best[P.id]) {
                      · last time: <span [class]="svc.npcStatus(P).cls">{{ svc.npcStatus(P).txt }}</span>
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
                    >{{ svc.state().best[P.id] ? 'Talk again' : 'Start a conversation' }}
                    @if (svc.approachBlock(P); as why) {
                      <span class="why">{{ why }}</span>
                    }
                  </span>
                  <span class="fx">1h · −8 energy</span>
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
  readonly verdict: Record<Quality, string> = VERDICT;
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
  pad = (n: number) => String(n).padStart(2, '0');
  openColor = (o: number) => (o >= 70 ? 'var(--green)' : o >= 40 ? 'var(--amber)' : 'var(--red)');
  best = (t: Talk) => t.P.rounds[t.round].a.find((x) => x[1] === 'good') ?? t.P.rounds[t.round].a[0];
  effects(o: { word?: number; body?: number; sleep?: boolean; h?: number }): string {
    const fx: string[] = [];
    if (o.word) fx.push('+' + o.word + ' word');
    if (o.body) fx.push((o.body > 0 ? '+' : '') + o.body + ' energy');
    if (o.sleep) fx.push('energy full');
    if (o.h) fx.push(o.h + 'h');
    return fx.join(' · ');
  }
}
