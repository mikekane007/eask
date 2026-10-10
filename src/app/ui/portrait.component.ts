import { Component, computed, inject, input } from '@angular/core';
import { css } from '../game/avatar';
import { GameService } from '../game/game.service';
import { npcLook } from '../game/npc-look';
import type { Person } from '../game/types';

/** A small head-and-shoulders picture of a person, drawn with plain HTML in the colours of their 3D character. */
@Component({
  selector: 'app-portrait',
  standalone: true,
  host: { class: 'portrait', 'aria-hidden': 'true' },
  template: `
    @if (look(); as l) {
      <div class="look">
        <i [class]="'l-hair ' + l.style" [style.background]="hex(l.hair)"></i>
        <i class="l-head" [style.background]="hex(l.skin)"></i>
        <i class="l-body" [class.dress]="l.female" [style.background]="hex(l.shirt)"></i>
        @if (l.scarf !== null) {
          <i class="l-scarf" [style.background]="hex(l.scarf)"></i>
        }
      </div>
    }
  `,
})
export class PortraitComponent {
  private readonly svc = inject(GameService);
  readonly person = input.required<Person>();
  readonly hex = css;
  readonly look = computed(() => {
    const city = this.svc.city();
    if (!city) return null;
    const p = this.person();
    return npcLook(p, Math.max(0, city.people.indexOf(p)), city.theme);
  });
}
