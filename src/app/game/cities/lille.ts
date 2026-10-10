import type { City } from '../types';
import { CHURCH_OPTS, HOME_OPTS, HOURS_CHURCH, HOURS_EAT, HOURS_HOME, SKIN, mealOpts, t } from './common';
import { LILLE_PEOPLE } from './lille.people';

export const LILLE: City = {
  id: 'lille',
  country: t('France', 'France'),
  name: 'Lille',
  tagline: t(
    'Red brick, a student city, the Braderie and a proud industrial past.',
    'Briques rouges, ville étudiante, Braderie et un fier passé industriel.',
  ),
  reviewed: false,
  theme: {
    wallColors: [0xb5533c, 0xc4694a, 0xa84a35, 0xd9b99b, 0xe8dcc3, 0xb86b4b, 0xcfa88a, 0xf0e6d2],
    roof: { kind: 'tile', colors: [0x5b6670, 0x4a545e, 0x6b7680], pitch: 2.1 },
    ground: 'grass',
    rooftopClutter: false,
    palms: false,
    wires: false,
    stalls: [
      ['#C0392B', '#F4EEDC'],
      ['#2E5E8C', '#F4EEDC'],
      ['#E8B04A', '#7A3E2B'],
    ] as [string, string][],
    vehicles: {
      labels: ['LIGNE 1', 'LIGNE 2', 'LIGNE 14', 'NAVETTE', 'LIGNE 18'],
      colors: [0x2e5e8c, 0xc0392b, 0xeeeeee, 0xe8b04a, 0x2e7d4f],
      busShare: 0.25,
    },
    skins: [SKIN.fair, SKIN.light, SKIN.olive, SKIN.brown, SKIN.fair, SKIN.tan],
    waxPrint: false,
  },
  // Rough share of six-hour blocks with each weather.
  climate: { clear: 0.22, cloudy: 0.36, rain: 0.3, fog: 0.12 },
  places: [
    {
      id: 'church',
      bi: 2,
      bj: 3,
      side: 'N',
      name: t('La Source Church', 'Église La Source'),
      label: t('CHURCH', 'ÉGLISE'),
      sign: 'ÉGLISE LA SOURCE',
      open: HOURS_CHURCH,
      opts: CHURCH_OPTS,
    },
    {
      id: 'chop',
      bi: 3,
      bj: 2,
      side: 'E',
      name: t('Chez Marcel – Café', 'Chez Marcel – Café'),
      label: t('EAT', 'MANGER'),
      sign: 'CHEZ MARCEL',
      open: HOURS_EAT,
      opts: mealOpts(
        t('Waffle and coffee', 'Gaufre et café'),
        t('Carbonnade flamande with fries', 'Carbonade flamande et frites'),
      ),
    },
    {
      id: 'home',
      bi: 1,
      bj: 0,
      side: 'S',
      name: t('Your flat', 'Votre appartement'),
      label: t('HOME', 'MAISON'),
      sign: 'CHEZ MOI',
      open: HOURS_HOME,
      opts: HOME_OPTS,
    },
    { id: 'market', bi: 4, bj: 1, side: 'W', deco: true, label: t('BRADERIE', 'BRADERIE'), sign: 'BRADERIE' },
    { id: 'tech', bi: 1, bj: 3, side: 'N', deco: true, label: t('TOWER', 'TOUR'), sign: 'EURALILLE' },
    { id: 'site', bi: 2, bj: 0, side: 'S', deco: true, label: t('SITE', 'TRAVAUX'), sign: 'CHANTIER' },
  ],
  people: LILLE_PEOPLE,
  map: { url: 'maps/lille.json' },
};
