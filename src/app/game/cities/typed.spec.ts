import { describe, expect, it } from 'vitest';
import { gradeReply } from '../typed-answer';
import { CITIES } from './index';

const tr = (x: string | { en: string; fr?: string }, lang: 'en' | 'fr') =>
  typeof x === 'string' ? x : (x[lang] ?? x.en);

describe('typed replies in every city', () => {
  for (const city of CITIES) {
    for (const person of city.people) {
      describe(`${city.id}/${person.id}`, () => {
        const round = person.rounds[1];

        it('can be typed, with ideas written in both languages', () => {
          expect(round.typed, 'typed').toBeDefined();
          expect(round.typed?.ideas.length).toBeGreaterThanOrEqual(2);
          for (const idea of round.typed?.ideas ?? []) {
            expect(idea.en.length).toBeGreaterThanOrEqual(3);
            expect(idea.fr.length).toBeGreaterThanOrEqual(3);
          }
        });

        it('counts the model answer as wise, in each language the city has', () => {
          const good = round.a.find((a) => a[1] === 'good');
          for (const lang of ['en', 'fr'] as const) {
            expect(gradeReply(tr(good?.[0] ?? '', lang), round.typed ?? { ideas: [] }), lang).toBe('good');
          }
        });

        it('does not count the written wrong answer as wise', () => {
          const bad = round.a.find((a) => a[1] === 'bad');
          for (const lang of ['en', 'fr'] as const) {
            expect(gradeReply(tr(bad?.[0] ?? '', lang), round.typed ?? { ideas: [] }), lang).not.toBe('good');
          }
        });
      });
    }
  }
});
