import type { MapData } from './types';

/** Checks the parts of a downloaded map the game depends on, so a bad file fails loudly and early. */
export function validateMap(data: unknown): MapData {
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
  const anchors = isObject(data) ? data['anchors'] : undefined;
  const ok =
    isObject(data) &&
    typeof data['w'] === 'number' &&
    typeof data['h'] === 'number' &&
    Array.isArray(data['roads']) &&
    Array.isArray(data['buildings']) &&
    Array.isArray(data['parks']) &&
    Array.isArray(data['water']) &&
    isObject(anchors) &&
    Array.isArray(anchors['people']) &&
    isObject(anchors['home']) &&
    isObject(anchors['church']) &&
    isObject(anchors['chop']) &&
    isObject(anchors['landmarks']);
  if (!ok) throw new Error('The city map file is not in the expected format.');
  return data as unknown as MapData;
}

/** Downloads and checks a city map. */
export async function loadMap(url: string): Promise<MapData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load the city map (${res.status}).`);
  return validateMap(await res.json());
}
