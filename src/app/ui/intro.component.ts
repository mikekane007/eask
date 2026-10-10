import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-intro',
  standalone: true,
  template: `
    @if (!svc.playing()) {
      <div class="modal">
        <div class="modal-in">
          <h1>GO AND TELL</h1>
          <p class="verse">Always be ready to give an answer for the hope you have, with gentleness and respect.</p>
          <p class="keys" style="color:var(--gold);font-weight:800">1 Peter 3:15</p>
          <p>Step out into the neighbourhood. Ten people are waiting with real questions: a physics student, a grieving widow, a taxi driver chasing a breakthrough. Pick how you respond and learn from the feedback.</p>
          <p class="keys">Move with WASD or arrow keys, or drag on a phone. Walk up to anyone with a gold ring. Study at the church to grow your Word and reach harder conversations.</p>
          <button class="mbtn" (click)="svc.start()">{{ svc.hasSave() ? 'Continue' : 'Step out' }}</button>
          @if (svc.hasSave()) {
            <button class="mbtn ghost" (click)="svc.reset()">Start over</button>
          }
        </div>
      </div>
    }
  `,
})
export class IntroComponent {
  readonly svc = inject(GameService);
}
