import type { City } from '../types';
import { ACCRA_PEOPLE } from './accra.people';
import { withTyped } from './typed';
import { CHURCH_OPTS, HOME_OPTS, HOURS_CHURCH, HOURS_EAT, HOURS_HOME, SKIN, mealOpts, t } from './common';

export const ACCRA: City = {
  id: 'accra',
  country: t('Ghana', 'Ghana'),
  name: 'Accra',
  tagline: t(
    'Tro-tros, chop bars and a street full of real questions.',
    'Tro-tros, gargotes et une rue pleine de vraies questions.',
  ),
  reviewed: true,
  hidden: true,
  theme: {
    wallColors: [0xf3e2b3, 0xf4b183, 0x9fd3e6, 0xe98c73, 0xf6f1e7, 0xc6e2a3, 0xe7b97f, 0xd9c3e6, 0xffffff, 0xf7d774],
    roof: { kind: 'corrugated', colors: [0xd0d0d0, 0xb08070], pitch: 1.5 },
    blocks: { facade: 'plaster', roof: 'flat', surface: 'concrete', shopShare: 0.6 },
    ground: 'laterite',
    rooftopClutter: true,
    palms: true,
    wires: true,
    stalls: [
      ['#E53935', '#FFFFFF'],
      ['#F2B705', '#1E8A4C'],
      ['#1F5D8C', '#F4EEDC'],
    ],
    vehicles: {
      labels: ['GOD IS GOOD', 'NO KING AS GOD', 'PSALM 23', 'BY HIS GRACE', 'JESUS NEVER FAILS'],
      colors: [0xf2b705, 0x2e86c1, 0xe9e9e9, 0xd7263d, 0x1e8a4c],
      busShare: 0.6,
    },
    skins: [0x5b3a24, SKIN.darker, SKIN.deep, SKIN.darkest],
    waxPrint: true,
  },
  // Rough share of six-hour blocks with each weather.
  climate: { clear: 0.42, cloudy: 0.26, rain: 0.28, fog: 0.04 },
  places: [
    {
      id: 'church',
      bi: 2,
      bj: 2,
      side: 'S',
      name: 'Grace Chapel',
      label: t('CHAPEL', 'ÉGLISE'),
      sign: 'GRACE CHAPEL',
      open: HOURS_CHURCH,
      opts: CHURCH_OPTS,
    },
    {
      id: 'chop',
      bi: 1,
      bj: 1,
      side: 'S',
      name: "Auntie Esi's Chop Bar",
      label: t('EAT', 'MANGER'),
      sign: 'CHOP BAR',
      open: HOURS_EAT,
      opts: mealOpts(t('Waakye plate', 'Assiette de waakye'), t('Fufu & light soup', 'Fufu et soupe légère')),
    },
    {
      id: 'home',
      bi: 0,
      bj: 3,
      side: 'E',
      name: t('Your room', 'Votre chambre'),
      label: t('HOME', 'MAISON'),
      sign: 'HOME',
      open: HOURS_HOME,
      opts: HOME_OPTS,
    },
    { id: 'market', bi: 0, bj: 1, side: 'E', deco: true, label: t('MARKET', 'MARCHÉ'), sign: 'MARKET' },
    { id: 'tech', bi: 3, bj: 3, side: 'N', deco: true, label: t('TECH', 'TECH'), sign: 'TECH HUB' },
    { id: 'site', bi: 3, bj: 1, side: 'S', deco: true, label: t('SITE', 'TRAVAUX'), sign: 'SITE' },
  ],
  people: withTyped(ACCRA_PEOPLE),
  map: { url: 'maps/accra.json' },
};
