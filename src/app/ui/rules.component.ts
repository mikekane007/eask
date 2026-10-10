import { NgTemplateOutlet } from '@angular/common';
import { Component, HostListener, computed, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';
import { RULES, type RulesSection } from '../game/i18n/rules';
import { LangSwitchComponent } from './lang-switch.component';
import { RichComponent } from './rich.component';

/** The full rulebook, always one tap away. People and Word needs come from the city data so they never go stale. */
@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [LangSwitchComponent, NgTemplateOutlet, RichComponent],
  template: `
    @if (svc.rulesOpen()) {
      <div class="modal rules-modal">
        <button class="backdrop" tabindex="-1" [attr.aria-label]="i18n.t('closeRules')" (click)="close()"></button>
        <div class="modal-in rules" role="dialog" aria-modal="true" aria-labelledby="rules-title" tabindex="-1">
          <div class="picker-top"><app-lang-switch /></div>
          <h1 id="rules-title">{{ doc().title }}</h1>

          @for (s of sections(); track s.h) {
            <h2>{{ s.h }}</h2>
            <ng-container *ngTemplateOutlet="body; context: { $implicit: s }" />
          }

          @if (svc.city()) {
            <h2>{{ doc().peopleHeading }}</h2>
            <table>
              <thead>
                <tr>
                  <th>{{ doc().colPerson }}</th>
                  <th>{{ doc().colWho }}</th>
                  <th>{{ doc().colWord }}</th>
                </tr>
              </thead>
              <tbody>
                @for (P of svc.people(); track P.id) {
                  <tr>
                    <td>{{ P.name }}</td>
                    <td>{{ i18n.tr(P.role) }}</td>
                    <td>{{ P.req }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <p class="note">
              <app-rich [text]="doc().mapNote" />
            </p>
          }

          @for (s of after(); track s.h) {
            <h2>{{ s.h }}</h2>
            <ng-container *ngTemplateOutlet="body; context: { $implicit: s }" />
          }

          <button class="mbtn" (click)="close()">{{ i18n.t('gotIt') }}</button>
          @if (svc.city()) {
            <button class="mbtn ghost" (click)="leave()">{{ i18n.t('changeCity') }}</button>
          }
        </div>
      </div>
    }

    <ng-template #body let-s>
      @if (s.p) {
        <p>
          <app-rich [text]="s.p" />
        </p>
      }
      @if (s.items) {
        @if (s.ordered) {
          <ol>
            @for (it of s.items; track $index) {
              <li>
                <app-rich [text]="it" />
              </li>
            }
          </ol>
        } @else {
          <ul>
            @for (it of s.items; track $index) {
              <li>
                <app-rich [text]="it" />
              </li>
            }
          </ul>
        }
      }
    </ng-template>
  `,
})
export class RulesComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);

  readonly doc = computed(() => RULES[this.i18n.lang()]);
  readonly sections = computed(() => this.fill(this.doc().sections));
  readonly after = computed(() => this.fill(this.doc().after));

  /** Fills {church}, {eat} and {home} with the current city's own place names. */
  private fill(sections: RulesSection[]): RulesSection[] {
    const name = (id: string) => {
      const n = this.svc.places().find((p) => p.id === id)?.name;
      return n ? this.i18n.tr(n) : '';
    };
    const params = { church: name('church'), eat: name('chop'), home: name('home') };
    return sections.map((s) => ({
      ...s,
      p: s.p ? this.i18n.fill(s.p, params) : undefined,
      items: s.items?.map((it) => this.i18n.fill(it, params)),
    }));
  }

  close(): void {
    this.svc.rulesOpen.set(false);
  }

  leave(): void {
    this.svc.leaveCity();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.rulesOpen()) this.close();
  }
}
