import type { UiKey } from './i18n/ui';
import type { Person, Quality } from './types';

/** `declined` is a no that you met graciously; `cared` and `helped` close a meeting about a practical need. */
export type OutcomeId = 'open' | 'seed' | 'away' | 'declined' | 'cared' | 'helped';

/** Every conversation spends this much Word, so you go back to church to study before the next person. */
export const TALK_WORD = 15;
/** Energy a conversation costs. */
export const TALK_ENERGY = 20;
/** Openness never rises above this with someone who has made up their mind to say no. */
export const REFUSE_CAP = 60;

export interface GameState {
  body: number;
  word: number;
  day: number;
  hour: number;
  /** Minutes past the hour; time passes slowly while you walk about. */
  minute: number;
  x: number;
  z: number;
  /** Which real map the saved position belongs to, so a position from another map is never reused. */
  map?: string;
  good: number;
  total: number;
  best: Partial<Record<string, OutcomeId>>;
}

/** A new player has just enough Word for one conversation; after that, church first. */
export const FRESH: GameState = {
  body: 80,
  word: TALK_WORD,
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
  declined: { key: 'outcomeDeclined', cls: 't-good', rank: 3 },
  cared: { key: 'outcomeCared', cls: 't-good', rank: 3 },
  helped: { key: 'outcomeHelped', cls: 't-ok', rank: 2 },
};

/** The best way a meeting with this person can end. */
export const goalOf = (P: Person): OutcomeId =>
  P.kind === 'refuse' ? 'declined' : P.kind === 'care' ? 'cared' : 'open';

/** How a finished meeting ended, from the openness it reached. */
export function outcomeFor(P: Person, open: number): OutcomeId {
  if (open <= 0) return 'away';
  if (P.kind === 'refuse') return open >= 45 ? 'declined' : 'away';
  if (P.kind === 'care') return open >= 80 ? 'cared' : open >= 45 ? 'helped' : 'away';
  return open >= 80 ? 'open' : open >= 45 ? 'seed' : 'away';
}

export const VERDICT_KEY: Record<Quality, UiKey> = {
  good: 'verdictGood',
  ok: 'verdictOk',
  bad: 'verdictBad',
};
