import { Component, HostListener, inject } from '@angular/core';
import { GameService } from '../game/game.service';

/** The full rulebook, always one tap away. People and Word needs come from the game data so they never go stale. */
@Component({
  selector: 'app-rules',
  standalone: true,
  template: `
    @if (svc.rulesOpen()) {
      <div class="modal rules-modal">
        <button class="backdrop" tabindex="-1" aria-label="Close rules" (click)="close()"></button>
        <div class="modal-in rules" role="dialog" aria-modal="true" aria-labelledby="rules-title" tabindex="-1">
          <h1 id="rules-title">HOW TO PLAY</h1>

          <h2>Goal</h2>
          <p>
            Talk with all {{ svc.people.length }} people on the street and help each one reach
            <b>"Wants to follow Jesus"</b>. Manage your energy, your Word and the clock while you do it.
          </p>

          <h2>Controls</h2>
          <ul>
            <li>Move: <b>W A S D</b> or the <b>arrow keys</b>. On a phone, drag anywhere on the street.</li>
            <li>Walk into a <b>gold ring</b> to open a place or start a conversation.</li>
            <li><b>M</b> button: show or hide the map. <b>+ / −</b>: zoom. <b>›</b>: people and progress.</li>
          </ul>

          <h2>Your stats</h2>
          <ul>
            <li><b>Energy</b> (starts at 80, max 100): talking costs 8 energy.</li>
            <li>
              <b>Word</b> (starts at 10, max 100): your Bible knowledge. It unlocks harder conversations. A wise answer
              gives +2.
            </li>
            <li><b>Time</b>: every hour that passes costs 1.5 energy and 0.2 Word.</li>
            <li><b>Wise answers</b>: the share of your answers that were the best choice.</li>
            <li>If energy reaches 0 you collapse and wake at home 10 hours later with 45 energy.</li>
          </ul>

          <h2>Places</h2>
          <ul>
            <li>
              <b>Grace Chapel</b> (06:00–21:00): Bible study (+12 Word, 2h, −5 energy). Evangelism training (needs Word
              20; +20 Word, 3h, −8 energy). Prayer meeting (+10 energy, 1h).
            </li>
            <li><b>Chop Bar</b> (06:00–23:00): Waakye +25 energy, Fufu &amp; light soup +40 energy, 1 hour each.</li>
            <li>
              <b>Home</b>: sleep to refill energy and start again at 07:00. Sleeping after 07:00 moves to the next day.
            </li>
            <li>Market, Tech Hub and Site are scenery.</li>
          </ul>

          <h2>Conversations</h2>
          <ul>
            <li>You can talk between <b>07:00 and 21:00</b> with at least <b>15 energy</b>. It costs 1 hour.</li>
            <li>Each person asks 3 questions. Pick one of 3 answers: wise, partly there, or missed it.</li>
            <li>
              <b>Openness</b> starts at 50. Wise <b>+18</b>, partly there <b>+3</b>, missed it <b>−25</b>. At 0 the
              person walks away.
            </li>
            <li>
              Result: <b>80+</b> wants to follow Jesus · <b>45–79</b> seed sown · <b>below 45</b> walked away. You can
              try again; a better result replaces a worse one, never the other way round.
            </li>
            <li>After every answer you see why it was right or wrong, with a Bible reference.</li>
          </ul>

          <h2>People and the Word they need</h2>
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Who</th>
                <th>Word</th>
              </tr>
            </thead>
            <tbody>
              @for (P of svc.people; track P.id) {
                <tr>
                  <td>{{ P.name }}</td>
                  <td>{{ P.role }}</td>
                  <td>{{ P.req }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="note">
            On the map a <span style="color:var(--gold)">gold dot</span> is someone you can talk to now, a
            <span style="color:var(--green)">green dot</span> is someone you've reached, and a grey dot needs more Word.
          </p>

          <h2>Tips for wise answers</h2>
          <ul>
            <li>Listen first. Ask a gentle question before giving an answer.</li>
            <li>Respect their mind, their grief and their family. Never insult or threaten.</li>
            <li>Point to Jesus Himself, to grace and to the resurrection, not to rules, money or a person.</li>
            <li>Be honest: Jesus offers forgiveness and Himself, not an easy life.</li>
          </ul>

          <h2>A good first day</h2>
          <ol>
            <li>Talk to the first three people (they need no Word).</li>
            <li>Eat if your energy is low, then do Bible study at the chapel.</li>
            <li>Do evangelism training once your Word reaches 20.</li>
            <li>Sleep at home, then talk to the people you've unlocked.</li>
          </ol>

          <h2>Saving</h2>
          <p>Your progress saves automatically in this browser. Use <b>Start over</b> on the first screen to reset.</p>

          <button class="mbtn" (click)="close()">Got it</button>
        </div>
      </div>
    }
  `,
})
export class RulesComponent {
  readonly svc = inject(GameService);

  close(): void {
    this.svc.rulesOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.rulesOpen()) this.close();
  }
}
