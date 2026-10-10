import type { City } from '../types';
import { ACCRA } from './accra';
import { DOUAI } from './douai';
import { LILLE } from './lille';
import { PARIS } from './paris';

export const CITIES: City[] = [ACCRA, LILLE, PARIS, DOUAI];

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
