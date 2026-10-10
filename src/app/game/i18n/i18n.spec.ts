import { beforeEach, describe, expect, it } from 'vitest';
import { translateRef } from './bible';
import { I18n } from './i18n.service';
import { RULES } from './rules';
import { UI, type UiKey } from './ui';

describe('translateRef', () => {
  it('leaves English references alone', () => {
    expect(translateRef('Romans 3:23; 1 John 1:9', 'en')).toBe('Romans 3:23; 1 John 1:9');
  });

  it('translates every book in a list of references', () => {
    expect(translateRef('Romans 3:23; 1 John 1:9', 'fr')).toBe('Romains 3:23; 1 Jean 1:9');
    expect(translateRef('John 14:6; Psalm 34:18', 'fr')).toBe('Jean 14:6; Psaume 34:18');
  });

  it('does not mistake 1 John for John', () => {
    expect(translateRef('1 John 2:1', 'fr')).toBe('1 Jean 2:1');
    expect(translateRef('1 Corinthians 15:3-8', 'fr')).toBe('1 Corinthiens 15:3-8');
  });
});

describe('I18n', () => {
  let i18n: I18n;
  beforeEach(() => {
    localStorage.clear();
    i18n = new I18n();
  });

  it('starts in English for an English browser and remembers a change', () => {
    expect(i18n.lang()).toBe('en');
    i18n.setLang('fr');
    expect(new I18n().lang()).toBe('fr');
  });

  it('shows English for plain strings and falls back when French is missing', () => {
    i18n.setLang('fr');
    expect(i18n.tr('Kwame')).toBe('Kwame');
    expect(i18n.tr({ en: 'Hello', fr: 'Bonjour' })).toBe('Bonjour');
    expect(i18n.tr({ en: 'Only English' })).toBe('Only English');
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(i18n.t('day', { n: 3 })).toBe('Day 3');
    expect(i18n.fill('Hi {name} {missing}', { name: 'Ama' })).toBe('Hi Ama {missing}');
  });

  it('splits **bold** markup without needing innerHTML', () => {
    expect(i18n.rich('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });
});

describe('UI dictionary', () => {
  it('has a French string for every English key, with the same placeholders', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(UI.en) as UiKey[]) {
      expect(UI.fr[key], `fr.${key}`).toBeTruthy();
      expect(placeholders(UI.fr[key]), `placeholders of ${key}`).toBe(placeholders(UI.en[key]));
    }
  });

  it('has matching rules sections in both languages', () => {
    expect(RULES.fr.sections.length).toBe(RULES.en.sections.length);
    expect(RULES.fr.after.length).toBe(RULES.en.after.length);
    RULES.en.sections.forEach((s, i) => {
      expect(RULES.fr.sections[i].items?.length).toBe(s.items?.length);
    });
  });
});
