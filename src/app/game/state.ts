export type OutcomeId = 'open' | 'seed' | 'away';

export interface GameState {
  body: number;
  word: number;
  day: number;
  hour: number;
  x: number;
  z: number;
  good: number;
  total: number;
  best: Record<string, OutcomeId>;
}

export const FRESH: GameState = { body: 80, word: 10, day: 1, hour: 7, x: 0, z: 0, good: 0, total: 0, best: {} };

export const OUTCOMES: Record<OutcomeId, { label: string; cls: string; rank: number }> = {
  open: { label: 'Wants to follow Jesus', cls: 't-good', rank: 3 },
  seed: { label: 'Seed sown', cls: 't-ok', rank: 2 },
  away: { label: 'Walked away', cls: 't-bad', rank: 1 },
};

export const VERDICT = { good: 'Wise answer', ok: 'Partly there', bad: 'Missed it' } as const;
export type { Quality } from './people.data';
