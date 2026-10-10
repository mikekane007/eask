import { Injectable, signal } from '@angular/core';
import type { L10n } from '../types';
import { translateRef } from './bible';
import { UI, type UiKey } from './ui';

export type Lang = 'en' | 'fr';

const LANG_KEY = 'goandtell:lang';

export interface RichSegment {
  text: string;
  bold: boolean;
}

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(this.initial());

  private initial(): Lang {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'fr') return saved;
    } catch {
      /* storage unavailable */
    }
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  setLang(l: Lang): void {
    this.lang.set(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }

  /** Translates content text. Falls back to English when no French text exists. */
  tr(v: L10n): string {
    if (typeof v === 'string') return v;
    return this.lang() === 'fr' ? (v.fr ?? v.en) : v.en;
  }

  /** UI string with `{name}` placeholders filled in. */
  t(key: UiKey, params: Record<string, string | number> = {}): string {
    return this.fill(UI[this.lang()][key], params);
  }

  /** Scripture reference in the current language. */
  ref(r: string): string {
    return translateRef(r, this.lang());
  }

  fill(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  }

  /** Splits `**bold**` markup into segments so templates never need innerHTML. */
  rich(text: string): RichSegment[] {
    return text
      .split('**')
      .map((t, i) => ({ text: t, bold: i % 2 === 1 }))
      .filter((s) => s.text !== '');
  }
}
