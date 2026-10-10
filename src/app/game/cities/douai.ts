import type { City } from '../types';
import { CHURCH_OPTS, HOME_OPTS, HOURS_CHURCH, HOURS_EAT, HOURS_HOME, SKIN, mealOpts, t } from './common';
import { DOUAI_PEOPLE } from './douai.people';

export const DOUAI: City = {
  id: 'douai',
  country: t('France', 'France'),
  name: 'Douai',
  tagline: t(
    'A quiet historic town of stone and brick, a belfry and the Gayant giants.',
    'Une petite ville historique de pierre et de brique, un beffroi et les géants de Gayant.',
  ),
  reviewed: false,
  theme: {
    wallColors: [0xe3d3b3, 0xd6c19a, 0xb8613f, 0xc9a98a, 0xe9dec6, 0xa85a3c, 0xdcc8a4, 0xf1e8d4],
    roof: { kind: 'tile', colors: [0xb5532f, 0xa24a2a, 0xc2623b], pitch: 2.2 },
    ground: 'grass',
    rooftopClutter: false,
    palms: false,
    wires: false,
    stalls: [
      ['#B5532F', '#F4EEDC'],
      ['#3B6E8F', '#F4EEDC'],
      ['#D9A441', '#5A3A22'],
    ] as [string, string][],
    vehicles: {
      labels: ['LIGNE A', 'LIGNE B', 'NAVETTE', 'LIGNE C', 'LIGNE D'],
      colors: [0x3b6e8f, 0xb5532f, 0xeeeeee, 0xd9a441, 0x4f7a4a],
    },
    skins: [SKIN.fair, SKIN.light, SKIN.fair, SKIN.olive, SKIN.light, SKIN.fair],
    waxPrint: false,
  },
  // Rough share of six-hour blocks with each weather.
  climate: { clear: 0.2, cloudy: 0.36, rain: 0.3, fog: 0.14 },
  places: [
    {
      id: 'church',
      bi: 2,
      bj: 1,
      side: 'S',
      name: t('Reformed Evangelical Church', 'Église Évangélique Réformée'),
      label: t('CHURCH', 'ÉGLISE'),
      sign: 'ÉGLISE ÉVANGÉLIQUE',
      open: HOURS_CHURCH,
      opts: CHURCH_OPTS,
    },
    {
      id: 'chop',
      bi: 1,
      bj: 3,
      side: 'N',
      name: t('Boulangerie du Beffroi', 'Boulangerie du Beffroi'),
      label: t('EAT', 'MANGER'),
      sign: 'BOULANGERIE',
      open: HOURS_EAT,
      opts: mealOpts(
        t('Pain au chocolat and coffee', 'Pain au chocolat et café'),
        t('Quiche and soup of the day', 'Quiche et soupe du jour'),
      ),
    },
    {
      id: 'home',
      bi: 3,
      bj: 0,
      side: 'S',
      name: t('Your room', 'Votre chambre'),
      label: t('HOME', 'MAISON'),
      sign: 'CHEZ MOI',
      open: HOURS_HOME,
      opts: HOME_OPTS,
    },
    { id: 'market', bi: 0, bj: 2, side: 'E', deco: true, label: t('MARKET', 'MARCHÉ'), sign: 'MARCHÉ' },
    { id: 'tech', bi: 4, bj: 2, side: 'W', deco: true, label: t('BELFRY', 'BEFFROI'), sign: 'BEFFROI' },
    { id: 'site', bi: 1, bj: 1, side: 'S', deco: true, label: t('SITE', 'TRAVAUX'), sign: 'CHANTIER' },
  ],
  people: DOUAI_PEOPLE,
};
