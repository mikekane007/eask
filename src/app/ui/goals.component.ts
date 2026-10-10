import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  template: `
    @if (svc.goalsOpen()) {
      <div class="goals">
        <h3>PEOPLE ON YOUR STREET</h3>
        <ul>
          @for (P of svc.people; track P.id) {
            <li>
              <b>{{ P.name }}</b
              ><span class="tag" [class]="'tag ' + svc.npcStatus(P).cls">{{ svc.npcStatus(P).txt }}</span>
            </li>
          }
        </ul>
        <h3>YOUR WITNESS</h3>
        <ul>
          <li>
            People reached<b>{{ svc.met() }} / {{ svc.people.length }}</b>
          </li>
          <li>
            Want to follow Jesus<b>{{ svc.won() }}</b>
          </li>
          <li>
            Wise answers<b>{{ svc.state().good }} of {{ svc.state().total }}</b>
          </li>
        </ul>
      </div>
    }
  `,
})
export class GoalsComponent {
  readonly svc = inject(GameService);
}
