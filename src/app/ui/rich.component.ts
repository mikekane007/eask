import { Component, computed, inject, input } from '@angular/core';
import { I18n } from '../game/i18n/i18n.service';

/** Renders text with **bold** markup as inline elements, with no stray whitespace around the bold parts. */
@Component({
  selector: 'app-rich',
  standalone: true,
  template: `@for (seg of segments(); track $index) {
    @if (seg.bold) {
      <b>{{ seg.text }}</b>
    } @else {
      <span>{{ seg.text }}</span>
    }
  }`,
})
export class RichComponent {
  private readonly i18n = inject(I18n);
  readonly text = input.required<string>();
  readonly segments = computed(() => this.i18n.rich(this.text()));
}
