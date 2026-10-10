import type { UiKey } from './i18n/ui';
import type { Quality } from './types';

export type OutcomeId = 'open' | 'seed' | 'away';

export interface GameState {
  body: number;
  word: number;
  day: number;
  hour: number;
  /** Minutes past the hour; time passes slowly while you walk about. */
  minute: number;
  x: number;
  z: number;
  good: number;
  total: number;
  best: Partial<Record<string, OutcomeId>>;
}

export const FRESH: GameState = {
  body: 80,
  word: 10,
  day: 1,
  hour: 7,
  minute: 0,
  x: 0,
  z: 0,
  good: 0,
  total: 0,
  best: {},
};

export const OUTCOMES: Record<OutcomeId, { key: UiKey; cls: string; rank: number }> = {
  open: { key: 'outcomeOpen', cls: 't-good', rank: 3 },
  seed: { key: 'outcomeSeed', cls: 't-ok', rank: 2 },
  away: { key: 'outcomeAway', cls: 't-bad', rank: 1 },
};

export const VERDICT_KEY: Record<Quality, UiKey> = {
  good: 'verdictGood',
  ok: 'verdictOk',
  bad: 'verdictBad',
};
