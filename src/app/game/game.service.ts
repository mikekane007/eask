import { Injectable, computed, signal } from '@angular/core';
import { type Answer, PEOPLE, type Person } from './people.data';
import { HOME, PLACES, type Place, type PlaceOption, markerPos } from './places.data';
import { FRESH, type GameState, OUTCOMES, type OutcomeId, type Quality } from './state';

const STORAGE_KEY = 'goandtell';

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
  message?: string;
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const shuffle = <T>(a: T[]): T[] => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

@Injectable({ providedIn: 'root' })
export class GameService {
  readonly people = PEOPLE;
  readonly state = signal<GameState>(this.load());
  readonly hasSave = signal(false);
  readonly playing = signal(false);
  readonly goalsOpen = signal(false);
  readonly current = signal<Near | null>(null);
  readonly talking = signal<Talk | null>(null);
  readonly toastMsg = signal<string | null>(null);
  readonly toastFading = signal(false);
  readonly zoom = signal(1);
  readonly mapOpen = signal(true);
  /** Live positions for the minimap. Plain object on purpose: it changes every frame and must not trigger change detection. */
  readonly live = {
    x: 0,
    z: 0,
    rot: 0,
    npcs: PEOPLE.map((P) => ({ id: P.id, x: 0, z: 0, on: false })),
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

  private load(): GameState {
    let s: GameState = { ...FRESH, best: {} };
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<GameState> | null;
      if (raw && typeof raw.word === 'number') {
        s = { ...s, ...raw };
        queueMicrotask(() => {
          this.hasSave.set(true);
        });
      }
    } catch {
      /* storage unavailable */
    }
    if (!s.x && !s.z) {
      const m = markerPos(HOME);
      s.x = m.x + 1.5;
      s.z = m.z;
    }
    return s;
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
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
    const m = markerPos(HOME);
    this.state.set({ ...FRESH, best: {}, x: m.x + 1.5, z: m.z });
    this.teleport(m.x + 1.5, m.z);
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

  private faint(): void {
    this.state.update((s) => this.passHours({ ...s, body: 45 }, 10));
    const m = markerPos(HOME);
    this.teleport(m.x, m.z);
    this.toast('You collapsed from exhaustion and woke up at home. Rest and eat!');
  }

  // ---------- places ----------
  placeClosedReason(o: PlaceOption, L: Place): string {
    const s = this.state();
    const open = L.open;
    if (!open) return '';
    if (open[1] - open[0] < 24 && !(s.hour >= open[0] && s.hour < open[1])) {
      return 'Closed now, opens ' + String(open[0]).padStart(2, '0') + ':00';
    }
    if (o.need && s.word < o.need.word) return 'Needs Word ' + o.need.word;
    return '';
  }

  usePlaceOption(o: PlaceOption): void {
    if (o.sleep) {
      this.state.update((s) => ({ ...s, body: 100, day: s.hour >= 7 ? s.day + 1 : s.day, hour: 7 }));
      this.toast('Rested. Day ' + this.state().day + '. Go and tell!');
    } else {
      this.state.update((s) => {
        s = this.passHours(s, o.h ?? 0);
        return { ...s, body: clamp(s.body + (o.body ?? 0)), word: clamp(s.word + (o.word ?? 0)) };
      });
      this.toast(o.word ? 'Your Word grew by ' + o.word : 'Energy restored');
    }
    if (this.state().body <= 0) this.faint();
    this.save();
  }

  // ---------- conversations ----------
  approachBlock(P: Person): string {
    const s = this.state();
    if (s.word < P.req)
      return `You don't feel ready for this conversation yet. Study at Grace Chapel until your Word reaches ${P.req}.`;
    if (s.hour < 7 || s.hour >= 21) return 'It is too late to stop people on the street. Come back after 07:00.';
    if (s.body < 15) return 'You are too tired. Eat or rest first.';
    return '';
  }

  npcStatus(P: Person): { txt: string; cls: string } {
    const s = this.state();
    if (s.word < P.req) return { txt: 'Needs Word ' + P.req, cls: 't-lock' };
    const b = s.best[P.id];
    if (!b) return { txt: 'Not met', cls: 't-lock' };
    return { txt: OUTCOMES[b].label, cls: OUTCOMES[b].cls };
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

  private finish(t: Talk): void {
    const { P, open } = t;
    const out: OutcomeId = open <= 0 ? 'away' : open >= 80 ? 'open' : open >= 45 ? 'seed' : 'away';
    const prev = this.state().best[P.id];
    if (!prev || OUTCOMES[out].rank > OUTCOMES[prev].rank) {
      this.state.update((s) => ({ ...s, best: { ...s.best, [P.id]: out } }));
    }
    const message = {
      open: `${P.name} wants to know Jesus. You prayed together and swapped numbers so you can read the Bible with them this week.`,
      seed: `${P.name} is thinking it over. They took your number and said they might visit Grace Chapel. Keep praying for them.`,
      away: `${P.name} ${open <= 0 ? 'cut the conversation short' : 'thanked you politely and walked on'}. Review the feedback and try again another time.`,
    }[out];
    this.talking.set({ ...t, phase: 'result', outcome: out, message });
    if (this.state().body <= 0) this.faint();
    this.save();
    if (PEOPLE.every((p) => this.state().best[p.id] === 'open')) {
      setTimeout(() => {
        this.toast('Everyone on your street has heard the gospel. Well done, good and faithful servant!');
      }, 600);
    }
  }

  done(): void {
    this.talking.set(null);
    this.current.set(null);
  }

  readonly places = PLACES;
}
