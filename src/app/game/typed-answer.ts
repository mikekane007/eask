import type { Quality, Typed } from './types';

/** Lower case, no accents, no punctuation, single spaces. "L’Évangile !" becomes "l evangile". */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Words that shut a conversation down. Any of them makes the reply a poor one, however many good ideas it also has. */
const HARSH: readonly string[] = [
  'stupid',
  'idiot',
  'fool',
  'shut up',
  'liar',
  'go to hell',
  'you are going to hell',
  'you will burn',
  'damned',
  'garbage',
  'rubbish',
  'stupide',
  'imbecile',
  'ferme la',
  'menteur',
  'va en enfer',
  'tu vas bruler',
  'vous allez bruler',
  'damne',
];

/** True if `keyword` appears in `text` at the start of a word, so "forgiv" matches "forgiven" but not "unforgiving". */
function hasWord(text: string, keyword: string): boolean {
  const k = normalize(keyword);
  return k !== '' && (' ' + text).includes(' ' + k);
}

/** How many words the player wrote. */
export function wordCount(reply: string): number {
  const n = normalize(reply);
  return n === '' ? 0 : n.split(' ').length;
}

/** A reply needs at least this many words to be sent. */
export const MIN_WORDS = 3;

/**
 * Judges a typed reply. Wise when it carries enough of the round's ideas, partly there when it carries one,
 * a miss when it carries none or is harsh. Both languages are always accepted so nobody is marked down for the
 * language they chose to type in.
 */
export function gradeReply(reply: string, typed: Typed): Quality {
  const text = normalize(reply);
  if (HARSH.some((h) => hasWord(' ' + text + ' ', h))) return 'bad';
  const hits = typed.ideas.filter((idea) => [...idea.en, ...idea.fr].some((k) => hasWord(text, k))).length;
  const need = Math.min(typed.need ?? 2, typed.ideas.length);
  if (hits >= need && hits > 0) return 'good';
  return hits > 0 ? 'ok' : 'bad';
}
