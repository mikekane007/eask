import type { Answer, Idea, L10n, PlaceOption, Quality, Round } from '../types';

/** Shorthand for an English/French pair. */
export const t = (en: string, fr: string): L10n => ({ en, fr });

export const CHURCH_OPTS: PlaceOption[] = [
  { label: t('Bible study', 'Étude biblique'), h: 2, word: 12, body: -5 },
  {
    label: t('Evangelism training', 'Formation à l’évangélisation'),
    h: 3,
    word: 20,
    body: -8,
    need: { word: 20 },
  },
  { label: t('Prayer meeting', 'Réunion de prière'), h: 1, body: 10 },
];

export const HOME_OPTS: PlaceOption[] = [{ label: t('Sleep till morning', 'Dormir jusqu’au matin'), sleep: true }];

/** Two meals: a light one (+25 energy) and a full one (+40 energy). */
export const mealOpts = (light: L10n, full: L10n): PlaceOption[] => [
  { label: light, h: 1, body: 25 },
  { label: full, h: 1, body: 40 },
];

export const HOURS_CHURCH: [number, number] = [6, 21];
export const HOURS_EAT: [number, number] = [6, 23];
export const HOURS_HOME: [number, number] = [0, 24];

/** Skin tones from lighter to deeper, shared so every city can draw a mixed crowd. */
export const SKIN = {
  fair: 0xe8c3a0,
  light: 0xd9a87c,
  olive: 0xc68b5e,
  tan: 0xa66b43,
  brown: 0x8a5a3b,
  deep: 0x6b4630,
  darker: 0x4a2f1d,
  darkest: 0x3e2716,
};

/** One answer: what you say (en, fr), its quality, why (en, fr), and the English scripture reference. */
export const ans = (q: Quality, en: string, fr: string, fbEn: string, fbFr: string, ref: string): Answer => [
  t(en, fr),
  q,
  t(fbEn, fbFr),
  ref,
];

/** One question with its three answers (any order; they are shuffled when shown). */
export const rnd3 = (qEn: string, qFr: string, a: Answer, b: Answer, c: Answer): Round => ({
  q: t(qEn, qFr),
  a: [a, b, c],
});

/** A question that must be answered by typing: judged by the ideas it carries, explained by its three answers. */
export const typed3 = (qEn: string, qFr: string, ideas: Idea[], a: Answer, b: Answer, c: Answer): Round => ({
  ...rnd3(qEn, qFr, a, b, c),
  typed: { ideas },
});

/** An option at home that phones someone instead of meeting them on the street. */
export const callOpt = (id: string, en: string, fr: string): PlaceOption => ({ label: t(en, fr), call: id });
