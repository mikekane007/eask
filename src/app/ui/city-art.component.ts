import { Component, input } from '@angular/core';

/** A small drawn skyline for each city, used on the city picker and the loading screen. Decorative only. */
@Component({
  selector: 'app-city-art',
  standalone: true,
  host: { class: 'city-art', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient [attr.id]="'sky-' + city()" x1="0" y1="0" x2="0" y2="1">
          @switch (city()) {
            @case ('accra') {
              <stop offset="0" stop-color="#f6a54a" />
              <stop offset="1" stop-color="#ffe2a8" />
            }
            @case ('paris') {
              <stop offset="0" stop-color="#7fa9d8" />
              <stop offset="1" stop-color="#f3d9c6" />
            }
            @case ('douai') {
              <stop offset="0" stop-color="#8fb4cf" />
              <stop offset="1" stop-color="#e8e4d6" />
            }
            @default {
              <stop offset="0" stop-color="#6d8fb5" />
              <stop offset="1" stop-color="#d8dfe4" />
            }
          }
        </linearGradient>
      </defs>
      <rect width="320" height="110" [attr.fill]="'url(#sky-' + city() + ')'" />
      @switch (city()) {
        @case ('accra') {
          <circle cx="250" cy="38" r="16" fill="#fff3c4" opacity=".9" />
          <!-- palms -->
          <path d="M40 110V58" stroke="#5e4632" stroke-width="3" />
          <path
            d="M40 58c-14-4-22 2-26 8M40 58c12-6 22-2 28 4M40 58c-6-10-16-12-22-10M40 58c4-10 14-12 22-8"
            stroke="#2f6b2a"
            stroke-width="5"
            fill="none"
            stroke-linecap="round"
          />
          <path d="M282 110V64" stroke="#5e4632" stroke-width="3" />
          <path
            d="M282 64c-12-4-20 2-24 8M282 64c11-6 20-2 26 4M282 64c-5-9-14-11-20-9"
            stroke="#2f6b2a"
            stroke-width="5"
            fill="none"
            stroke-linecap="round"
          />
          <!-- low painted houses with water tanks -->
          <rect x="62" y="74" width="46" height="36" fill="#f4b183" />
          <rect x="70" y="66" width="8" height="8" fill="#1f2326" />
          <rect x="108" y="64" width="40" height="46" fill="#9fd3e6" />
          <rect x="148" y="78" width="52" height="32" fill="#f7d774" />
          <rect x="200" y="70" width="38" height="40" fill="#e98c73" />
          <rect x="226" y="62" width="9" height="8" fill="#1f2326" />
          <rect x="238" y="80" width="40" height="30" fill="#c6e2a3" />
          <!-- windows -->
          @for (x of [70, 86, 116, 132, 158, 176, 208, 222, 246, 262]; track x) {
            <rect [attr.x]="x" y="86" width="8" height="8" fill="#2f3f4a" />
          }
          <!-- tro-tro -->
          <rect x="128" y="96" width="44" height="12" rx="3" fill="#f2b705" />
          <circle cx="138" cy="109" r="3" fill="#1d1d1d" />
          <circle cx="162" cy="109" r="3" fill="#1d1d1d" />
        }
        @case ('lille') {
          <!-- the belfry -->
          <rect x="226" y="20" width="20" height="90" fill="#b5533c" />
          <path d="M224 20l12-14 12 14z" fill="#5b6670" />
          <rect x="232" y="30" width="8" height="10" fill="#f2b705" />
          <!-- Flemish gabled houses -->
          @for (h of lilleHouses; track h.x) {
            <path
              [attr.d]="'M' + h.x + ' 110V' + h.y + 'l' + h.w / 2 + ' -14l' + h.w / 2 + ' 14V110z'"
              [attr.fill]="h.c"
            />
            <rect [attr.x]="h.x + 6" [attr.y]="h.y + 8" width="8" height="12" fill="#2a3946" />
            <rect [attr.x]="h.x + h.w - 14" [attr.y]="h.y + 8" width="8" height="12" fill="#2a3946" />
          }
        }
        @case ('paris') {
          <!-- a dome in the distance and mansard blocks -->
          <path d="M150 52a26 26 0 0 1 52 0z" fill="#c9c4b4" />
          <rect x="160" y="52" width="32" height="24" fill="#d8d2c2" />
          <rect x="173" y="30" width="6" height="10" fill="#c9c4b4" />
          @for (b of parisBlocks; track b.x) {
            <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="110 - b.y" fill="#efe6d2" />
            <path [attr.d]="'M' + b.x + ' ' + b.y + 'l6 -10h' + (b.w - 12) + 'l6 10z'" fill="#6c7378" />
            @for (k of [0, 1, 2]; track k) {
              <rect [attr.x]="b.x + 6 + k * ((b.w - 12) / 3)" [attr.y]="b.y + 8" width="6" height="12" fill="#2a3946" />
              <rect
                [attr.x]="b.x + 6 + k * ((b.w - 12) / 3)"
                [attr.y]="b.y + 26"
                width="6"
                height="12"
                fill="#2a3946"
              />
            }
            <rect [attr.x]="b.x" [attr.y]="b.y + 22" [attr.width]="b.w" height="2" fill="#1b1f22" />
          }
        }
        @default {
          <!-- Douai: the belfry rising over brick and stone -->
          <rect x="140" y="26" width="26" height="84" fill="#cfc6b2" />
          <path d="M136 26l17-20 17 20z" fill="#4a545e" />
          <rect x="132" y="22" width="42" height="6" fill="#bdb39c" />
          <rect x="149" y="40" width="8" height="12" fill="#2a3946" />
          <rect x="60" y="76" width="70" height="34" fill="#b5532f" />
          <rect x="176" y="72" width="80" height="38" fill="#c2623b" />
          @for (x of [70, 90, 110, 186, 206, 226, 246]; track x) {
            <rect [attr.x]="x" y="84" width="8" height="12" fill="#2a3946" />
          }
        }
      }
    </svg>
  `,
})
export class CityArtComponent {
  readonly city = input.required<string>();
  readonly lilleHouses = [
    { x: 20, y: 66, w: 36, c: '#b5533c' },
    { x: 56, y: 58, w: 34, c: '#d9b99b' },
    { x: 90, y: 64, w: 38, c: '#a84a35' },
    { x: 128, y: 56, w: 34, c: '#c4694a' },
    { x: 162, y: 62, w: 36, c: '#e8dcc3' },
    { x: 254, y: 64, w: 40, c: '#b86b4b' },
  ];
  readonly parisBlocks = [
    { x: 10, y: 60, w: 60 },
    { x: 74, y: 56, w: 64 },
    { x: 210, y: 58, w: 60 },
    { x: 274, y: 62, w: 46 },
  ];
}
