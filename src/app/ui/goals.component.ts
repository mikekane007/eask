import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';
import { I18n } from '../game/i18n/i18n.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  template: `
    @if (svc.goalsOpen() && svc.city()) {
      <div class="goals">
        <h3>{{ i18n.t('peopleOnStreet') }}</h3>
        <ul>
          @for (P of svc.people(); track P.id) {
            <li>
              <b>{{ P.name }}</b
              ><span class="tag" [class]="'tag ' + svc.npcStatus(P).cls">{{ svc.npcStatus(P).txt }}</span>
            </li>
          }
        </ul>
        <h3>{{ i18n.t('yourWitness') }}</h3>
        <ul>
          <li>
            {{ i18n.t('peopleReached') }}<b>{{ svc.met() }} / {{ svc.people().length }}</b>
          </li>
          <li>
            {{ i18n.t('wantFollow') }}<b>{{ svc.won() }}</b>
          </li>
          <li>
            {{ i18n.t('wiseAnswers') }}<b>{{ i18n.t('wiseOf', { a: svc.state().good, b: svc.state().total }) }}</b>
          </li>
        </ul>
      </div>
    }
  `,
})
export class GoalsComponent {
  readonly svc = inject(GameService);
  readonly i18n = inject(I18n);
}
