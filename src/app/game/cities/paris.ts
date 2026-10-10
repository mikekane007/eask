import type { City } from '../types';
import { CHURCH_OPTS, HOME_OPTS, HOURS_CHURCH, HOURS_EAT, HOURS_HOME, SKIN, mealOpts, t } from './common';
import { PARIS_PEOPLE } from './paris.people';

export const PARIS: City = {
  id: 'paris',
  country: t('France', 'France'),
  name: 'Paris',
  tagline: t(
    'Cream stone, grey zinc roofs, cafés and a city of ideas and ambition.',
    'Pierre claire, toits de zinc, cafés et une ville d’idées et d’ambition.',
  ),
  reviewed: false,
  theme: {
    wallColors: [0xe8dfc8, 0xd9cdb0, 0xf0e8d6, 0xe3d6b8, 0xd4c8aa, 0xeee4cc, 0xcfc4a6, 0xf3ecdc],
    roof: { kind: 'tile', colors: [0x6c7378, 0x5c6368, 0x7a8187], pitch: 1.9 },
    ground: 'grass',
    rooftopClutter: false,
    palms: false,
    wires: false,
    stalls: [
      ['#2E5E8C', '#F4EEDC'],
      ['#7A2E3B', '#F4EEDC'],
      ['#2F6B4F', '#F4EEDC'],
    ] as [string, string][],
    vehicles: {
      labels: ['LIGNE 38', 'LIGNE 69', 'NAVETTE', 'LIGNE 21', 'LIGNE 72'],
      colors: [0x2e8b57, 0xeeeeee, 0x2e5e8c, 0xe8b04a, 0x7a2e3b],
      busShare: 0.2,
    },
    skins: [SKIN.fair, SKIN.olive, SKIN.deep, SKIN.light, SKIN.tan, SKIN.darker],
    waxPrint: false,
  },
  // Rough share of six-hour blocks with each weather.
  climate: { clear: 0.3, cloudy: 0.35, rain: 0.25, fog: 0.1 },
  places: [
    {
      id: 'church',
      bi: 1,
      bj: 2,
      side: 'S',
      name: t('Church of the Good Shepherd', 'Église du Bon Berger'),
      label: t('CHURCH', 'ÉGLISE'),
      sign: 'ÉGLISE DU BON BERGER',
      open: HOURS_CHURCH,
      opts: CHURCH_OPTS,
    },
    {
      id: 'chop',
      bi: 3,
      bj: 1,
      side: 'S',
      name: t('Café de la Place', 'Café de la Place'),
      label: t('EAT', 'MANGER'),
      sign: 'CAFÉ DE LA PLACE',
      open: HOURS_EAT,
      opts: mealOpts(
        t('Croissant and café crème', 'Croissant et café crème'),
        t('Croque-monsieur and salad', 'Croque-monsieur et salade'),
      ),
    },
    {
      id: 'home',
      bi: 4,
      bj: 3,
      side: 'W',
      name: t('Your studio', 'Votre studio'),
      label: t('HOME', 'MAISON'),
      sign: 'CHEZ MOI',
      open: HOURS_HOME,
      opts: HOME_OPTS,
    },
    { id: 'market', bi: 0, bj: 2, side: 'E', deco: true, label: t('MARKET', 'MARCHÉ'), sign: 'MARCHÉ' },
    { id: 'tech', bi: 2, bj: 4, side: 'N', deco: true, label: t('TOWER', 'TOUR'), sign: 'LA DÉFENSE' },
    { id: 'site', bi: 3, bj: 3, side: 'N', deco: true, label: t('SITE', 'TRAVAUX'), sign: 'CHANTIER' },
  ],
  people: PARIS_PEOPLE,
  map: { url: 'maps/paris.json' },
};
