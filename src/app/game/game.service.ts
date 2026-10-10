import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { CITIES, getCity } from './cities';
import { I18n } from './i18n/i18n.service';
import { markerPos } from './layout';
import { FRESH, type GameState, OUTCOMES, type OutcomeId } from './state';
import type { Answer, Person, Place, PlaceOption, Quality } from './types';

const storageKey = (cityId: string) => `goandtell:${cityId}`;
/** Saves made before cities existed were stored under this key and belong to Accra. */
const LEGACY_KEY = 'goandtell';

export type Near = { kind: 'place'; ref: Place } | { kind: 'npc'; ref: Person };

export interface Talk {
  P: Person;
  round: number;
  open: number;
  log: Quality[];
  phase: 'question' | 'feedback' | 'result';
  choices: Answer[];
  picked?: Answer;
  outcome?: OutcomeId;
  /** How the conversation ended, used to pick the closing message. */
  ending?: 'open' | 'seed' | 'awayCut' | 'awayPolite';
}

/** Real seconds that make one game hour while you walk about. */
export const SECONDS_PER_GAME_HOUR = 180;

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const shuffle = <T>(a: T[]): T[] => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const freshState = (): GameState => ({ ...FRESH, best: {} });

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly i18n = inject(I18n);
  private readonly zone = inject(NgZone);
  private clockCarry = 0;

  readonly cities = CITIES;
  /** The city being played, or null while the city picker is showing. */
  readonly cityId = signal<string | null>(null);
  readonly city = computed(() => {
    const id = this.cityId();
    return id ? (getCity(id) ?? null) : null;
  });
  readonly people = computed(() => this.city()?.people ?? []);
  readonly places = computed(() => this.city()?.places ?? []);

  readonly state = signal<GameState>(freshState());
  readonly hasSave = signal(false);
  readonly playing = signal(false);
  readonly goalsOpen = signal(false);
  readonly current = signal<Near | null>(null);
  readonly talking = signal<Talk | null>(null);
  readonly toastMsg = signal<string | null>(null);
  readonly toastFading = signal(false);
  readonly zoom = signal(1);
  readonly mapOpen = signal(true);
  readonly rulesOpen = signal(false);
  /** Live positions for the minimap. Plain object on purpose: it changes every frame and must not trigger change detection. */
  readonly live: { x: number; z: number; rot: number; npcs: { id: string; x: number; z: number; on: boolean }[] } = {
    x: 0,
    z: 0,
    rot: 0,
    npcs: [],
  };
  readonly joy = signal<{ x: number; y: number; dx: number; dy: number } | null>(null);

  /** Set by the 3D engine so the service can move the player. */
  teleport: (x: number, z: number) => void = () => undefined;

  readonly sheetVisible = computed(() => this.talking() !== null || this.current() !== null);
  readonly accuracy = computed(() => {
    const s = this.state();
    return s.total ? Math.round((s.good / s.total) * 100) + '%' : '–';
  });
  readonly met = computed(() => Object.keys(this.state().best).length);
  readonly won = computed(() => Object.values(this.state().best).filter((v) => v === 'open').length);

  private toastTimer?: ReturnType<typeof setTimeout>;
  private toastTimer2?: ReturnType<typeof setTimeout>;

  // ---------- cities and saving ----------
  private homePlace(): Place | undefined {
    return this.places().find((p) => p.id === 'home');
  }

  private spawn(): { x: number; z: number } {
    const h = this.homePlace();
    const m = h ? markerPos(h) : { x: 0, z: 0 };
    return { x: m.x + 1.5, z: m.z };
  }

  private readSave(cityId: string): Partial<GameState> | null {
    try {
      const read = (k: string) => JSON.parse(localStorage.getItem(k) ?? 'null') as Partial<GameState> | null;
      const raw = read(storageKey(cityId)) ?? (cityId === 'accra' ? read(LEGACY_KEY) : null);
      return raw && typeof raw.word === 'number' ? raw : null;
    } catch {
      return null; // storage unavailable or corrupt: start fresh
    }
  }

  /** Progress shown on the city picker without loading the city. */
  savedProgress(cityId: string): { reached: number; won: number } | null {
    const raw = this.readSave(cityId);
    if (!raw?.best) return null;
    const vals = Object.values(raw.best);
    return { reached: vals.length, won: vals.filter((v) => v === 'open').length };
  }

  selectCity(id: string): void {
    const city = getCity(id);
    if (!city) return;
    this.cityId.set(id);
    const raw = this.readSave(id);
    const s: GameState = { ...freshState(), ...raw };
    if (!raw || (!s.x && !s.z)) {
      const sp = this.spawn();
      s.x = sp.x;
      s.z = sp.z;
    }
    this.state.set(s);
    this.hasSave.set(raw !== null);
    this.live.npcs = city.people.map((P) => ({ id: P.id, x: 0, z: 0, on: false }));
    this.current.set(null);
    this.talking.set(null);
    this.playing.set(false);
  }

  /** Back to the city picker. Progress is already saved after every meaningful change. */
  leaveCity(): void {
    if (this.cityId()) this.save();
    this.playing.set(false);
    this.current.set(null);
    this.talking.set(null);
    this.rulesOpen.set(false);
    this.goalsOpen.set(false);
    this.joy.set(null);
    this.cityId.set(null);
  }

  save(): void {
    const id = this.cityId();
    if (!id) return;
    try {
      localStorage.setItem(storageKey(id), JSON.stringify(this.state()));
    } catch {
      /* ignore */
    }
  }

  patch(p: Partial<GameState>): void {
    this.state.update((s) => ({ ...s, ...p }));
  }

  /** Called every few seconds by the engine while walking. */
  setPosition(x: number, z: number): void {
    this.state.update((s) => ({ ...s, x, z }));
  }

  start(): void {
    this.playing.set(true);
  }

  reset(): void {
    const sp = this.spawn();
    this.state.set({ ...freshState(), x: sp.x, z: sp.z });
    this.hasSave.set(false);
    this.teleport(sp.x, sp.z);
    this.save();
    this.current.set(null);
    this.talking.set(null);
    this.playing.set(true);
  }

  toast(msg: string): void {
    clearTimeout(this.toastTimer);
    clearTimeout(this.toastTimer2);
    this.toastMsg.set(msg);
    this.toastFading.set(false);
    this.toastTimer = setTimeout(() => {
      this.toastFading.set(true);
      this.toastTimer2 = setTimeout(() => {
        this.toastMsg.set(null);
      }, 300);
    }, 2600);
  }

  // ---------- time and stats ----------
  private passHours(s: GameState, h: number): GameState {
    s = { ...s };
    for (let i = 0; i < h; i++) {
      s.hour++;
      if (s.hour >= 24) {
        s.hour = 0;
        s.day++;
      }
      s.body = clamp(s.body - 1.5);
      s.word = clamp(s.word - 0.2);
    }
    return s;
  }

  /**
   * Lets time pass while the player walks about. Called every frame with the real seconds elapsed; the state
   * only changes (and the UI only updates) once per game minute.
   */
  tick(realSeconds: number): void {
    this.clockCarry += (realSeconds * 60) / SECONDS_PER_GAME_HOUR;
    const whole = Math.floor(this.clockCarry);
    if (whole < 1) return;
    this.clockCarry -= whole;
    this.zone.run(() => {
      this.state.update((s) => {
        let next: GameState = { ...s, minute: s.minute + whole };
        while (next.minute >= 60) next = this.passHours({ ...next, minute: next.minute - 60 }, 1);
        return next;
      });
      if (this.state().body <= 0) this.faint();
      this.save();
    });
  }

  private faint(): void {
    this.state.update((s) => this.passHours({ ...s, body: 45 }, 10));
    const h = this.homePlace();
    if (h) {
      const m = markerPos(h);
      this.teleport(m.x, m.z);
    }
    this.toast(this.i18n.t('fainted'));
  }

  /** Display name of the city's church, used in messages. */
  churchName(): string {
    const c = this.places().find((p) => p.id === 'church');
    return c?.name ? this.i18n.tr(c.name) : '';
  }

  // ---------- places ----------
  private pad = (n: number) => String(n).padStart(2, '0') + ':00';

  /** Opening hours text for a place, or '' if it has none. */
  hoursText(L: Place): string {
    const open = L.open;
    if (!open) return '';
    if (open[1] - open[0] >= 24) return this.i18n.t('openAllDay');
    return this.i18n.t('openRange', { a: this.pad(open[0]), b: this.pad(open[1]) });
  }

  placeClosedReason(o: PlaceOption, L: Place): string {
    const s = this.state();
    const open = L.open;
    if (!open) return '';
    if (open[1] - open[0] < 24 && !(s.hour >= open[0] && s.hour < open[1])) {
      return this.i18n.t('closedOpens', { t: this.pad(open[0]) });
    }
    if (o.need && s.word < o.need.word) return this.i18n.t('needsWord', { n: o.need.word });
    return '';
  }

  usePlaceOption(o: PlaceOption): void {
    if (o.sleep) {
      this.state.update((s) => ({ ...s, body: 100, day: s.hour >= 7 ? s.day + 1 : s.day, hour: 7, minute: 0 }));
      this.toast(this.i18n.t('rested', { n: this.state().day }));
    } else {
      this.state.update((s) => {
        s = this.passHours(s, o.h ?? 0);
        return { ...s, body: clamp(s.body + (o.body ?? 0)), word: clamp(s.word + (o.word ?? 0)) };
      });
      this.toast(o.word ? this.i18n.t('wordGrew', { n: o.word }) : this.i18n.t('energyRestored'));
    }
    if (this.state().body <= 0) this.faint();
    this.save();
  }

  // ---------- conversations ----------
  approachBlock(P: Person): string {
    const s = this.state();
    if (s.word < P.req) return this.i18n.t('notReady', { church: this.churchName(), n: P.req });
    if (s.hour < 7 || s.hour >= 21) return this.i18n.t('tooLate');
    if (s.body < 15) return this.i18n.t('tooTired');
    return '';
  }

  npcStatus(P: Person): { txt: string; cls: string } {
    const s = this.state();
    if (s.word < P.req) return { txt: this.i18n.t('needsWord', { n: P.req }), cls: 't-lock' };
    const b = s.best[P.id];
    if (!b) return { txt: this.i18n.t('notMet'), cls: 't-lock' };
    return { txt: this.i18n.t(OUTCOMES[b].key), cls: OUTCOMES[b].cls };
  }

  startTalk(P: Person): void {
    this.state.update((s) => {
      s = this.passHours(s, 1);
      return { ...s, body: clamp(s.body - 8) };
    });
    this.talking.set({ P, round: 0, open: 50, log: [], phase: 'question', choices: shuffle(P.rounds[0].a) });
  }

  answer(a: Answer): void {
    const t = this.talking();
    if (!t) return;
    const q = a[1];
    const open = Math.max(0, Math.min(100, t.open + { good: 18, ok: 3, bad: -25 }[q]));
    this.state.update((s) => ({
      ...s,
      total: s.total + 1,
      good: s.good + (q === 'good' ? 1 : 0),
      word: q === 'good' ? clamp(s.word + 2) : s.word,
    }));
    this.talking.set({ ...t, open, log: [...t.log, q], phase: 'feedback', picked: a });
    this.save();
  }

  isLastRound(t: Talk): boolean {
    return t.round === t.P.rounds.length - 1 || t.open <= 0;
  }

  next(): void {
    const t = this.talking();
    if (!t) return;
    if (this.isLastRound(t)) {
      this.finish(t);
      return;
    }
    const round = t.round + 1;
    this.talking.set({ ...t, round, phase: 'question', picked: undefined, choices: shuffle(t.P.rounds[round].a) });
  }

  /** The closing message for a finished conversation, in the current language. */
  endMessage(t: Talk): string {
    const params = { name: t.P.name, church: this.churchName() };
    switch (t.ending) {
      case 'open':
        return this.i18n.t('endOpen', params);
      case 'seed':
        return this.i18n.t('endSeed', params);
      case 'awayCut':
        return this.i18n.t('endAwayCut', params);
      case 'awayPolite':
      case undefined:
        return this.i18n.t('endAwayPolite', params);
    }
  }

  private finish(t: Talk): void {
    const { P, open } = t;
    const out: OutcomeId = open <= 0 ? 'away' : open >= 80 ? 'open' : open >= 45 ? 'seed' : 'away';
    const prev = this.state().best[P.id];
    if (!prev || OUTCOMES[out].rank > OUTCOMES[prev].rank) {
      this.state.update((s) => ({ ...s, best: { ...s.best, [P.id]: out } }));
    }
    const ending = out === 'away' ? (open <= 0 ? 'awayCut' : 'awayPolite') : out;
    this.talking.set({ ...t, phase: 'result', outcome: out, ending });
    if (this.state().body <= 0) this.faint();
    this.save();
    if (this.people().every((p) => this.state().best[p.id] === 'open')) {
      setTimeout(() => {
        this.toast(this.i18n.t('allWon'));
      }, 600);
    }
  }

  done(): void {
    this.talking.set(null);
    this.current.set(null);
  }
}
