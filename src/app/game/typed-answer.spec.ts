import { describe, expect, it } from 'vitest';
import type { Typed } from './types';
import { MIN_WORDS, closeness, gradeReply, normalize, wordCount } from './typed-answer';

const typed: Typed = {
  ideas: [
    { en: ['forgiv', 'grace'], fr: ['pardon', 'grâce'] },
    { en: ['cross', 'died for'], fr: ['croix'] },
  ],
};

describe('normalize', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalize('  L’Évangile, c’est LA grâce !  ')).toBe('l evangile c est la grace');
  });
});

describe('wordCount', () => {
  it('counts words and nothing else', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount(' ... ')).toBe(0);
    expect(wordCount('Jesus loves you')).toBe(3);
    expect(MIN_WORDS).toBeGreaterThan(1);
  });
});

describe('gradeReply', () => {
  it('is wise when it carries two ideas, in any wording', () => {
    expect(gradeReply('God forgives us because Jesus died on the cross.', typed)).toBe('good');
    expect(gradeReply('His grace is a gift, shown at the cross', typed)).toBe('good');
  });

  it('matches the start of a word, so endings do not matter', () => {
    expect(gradeReply('You can be forgiven, and Jesus died for you', typed)).toBe('good');
  });

  it('does not match the middle of a word', () => {
    expect(gradeReply('It is unforgiving out there tonight friend', typed)).toBe('bad');
  });

  it('is partly there with one idea', () => {
    expect(gradeReply('God offers you his grace today', typed)).toBe('ok');
  });

  it('is a miss with none', () => {
    expect(gradeReply('The weather is lovely in the city today', typed)).toBe('bad');
  });

  it('accepts French, with or without accents', () => {
    expect(gradeReply('Dieu pardonne, sa grâce vient de la croix', typed)).toBe('good');
    expect(gradeReply('Dieu pardonne par la croix', typed)).toBe('good');
    expect(gradeReply('Sa grace est un cadeau', typed)).toBe('ok');
  });

  it('accepts either language whichever one is on screen', () => {
    expect(gradeReply('Il pardonne through the cross', typed)).toBe('good');
  });

  it('is a miss when harsh, even with good ideas in it', () => {
    expect(gradeReply('Only an idiot ignores grace and the cross', typed)).toBe('bad');
    expect(gradeReply('Tu vas brûler sans la grâce et la croix', typed)).toBe('bad');
    expect(gradeReply('You are going to hell without grace or the cross', typed)).toBe('bad');
  });

  it('needs every idea when there are fewer than the usual two', () => {
    const one: Typed = { ideas: [{ en: ['rest'], fr: ['repos'] }] };
    expect(gradeReply('Jesus offers you rest', one)).toBe('good');
    expect(gradeReply('Jesus offers you hope', one)).toBe('bad');
  });

  it('respects a stricter or looser requirement', () => {
    const three: Typed = {
      need: 3,
      ideas: [
        { en: ['aaa'], fr: [] },
        { en: ['bbb'], fr: [] },
        { en: ['ccc'], fr: [] },
      ],
    };
    expect(gradeReply('aaa bbb', three)).toBe('ok');
    expect(gradeReply('aaa bbb ccc', three)).toBe('good');
  });
});

describe('closeness', () => {
  it('is the share of the needed ideas a reply carries', () => {
    expect(closeness('God forgives us because Jesus died on the cross.', typed)).toBe(100);
    expect(closeness('His grace is enough for you', typed)).toBe(50);
    expect(closeness('Have a nice day', typed)).toBe(0);
  });

  it('is zero for a harsh reply, whatever else it says', () => {
    expect(closeness('You fool, grace and the cross are for you', typed)).toBe(0);
  });
});
