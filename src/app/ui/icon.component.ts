import { Component, input } from '@angular/core';

export type IconName =
  'people' | 'people-close' | 'help' | 'together' | 'walk' | 'map' | 'sound' | 'mute' | 'plus' | 'minus';

/** Simple line icons drawn inline (no font or image to download). Decorative: the button carries the label. */
@Component({
  selector: 'app-icon',
  standalone: true,
  host: { class: 'icon', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (name()) {
        @case ('people') {
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
          <path d="M16 4.6a3 3 0 0 1 0 6.2M18.5 14.5c1.6.8 2.5 2.7 2.5 5.5" />
        }
        @case ('people-close') {
          <path d="M15 6l-6 6 6 6" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.3-2.6 4" />
          <circle cx="12" cy="17.4" r=".6" fill="currentColor" />
        }
        @case ('together') {
          <circle cx="7.5" cy="8" r="2.6" />
          <circle cx="16.5" cy="8" r="2.6" />
          <path d="M2.5 19c0-3 2.2-5 5-5s5 2 5 5M11.5 19c0-3 2.2-5 5-5s5 2 5 5" />
        }
        @case ('walk') {
          <circle cx="13" cy="4.5" r="2" />
          <path d="M9 21l2.6-6.4L14 17v4M11.6 14.6l1-5.1-3.2 1.6-1.4 3.2M12.6 9.5l2.6 2.3 2.8.7" />
        }
        @case ('map') {
          <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" />
          <path d="M9 4v13.5M15 6.5V20" />
        }
        @case ('sound') {
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        }
        @case ('mute') {
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
