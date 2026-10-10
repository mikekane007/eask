import type { HairStyle } from './avatar';
import type { CityTheme, Person } from './types';

/** How one of a city's people looks: shared by the 3D character and the portrait in the conversation panel. */
export interface NpcLook {
  female: boolean;
  skin: number;
  hair: number;
  shirt: number;
  style: HairStyle;
  /** Scarf colour, or null. */
  scarf: number | null;
}

const WOMEN: readonly HairStyle[] = ['long', 'bun', 'afro'];
const MEN: readonly HairStyle[] = ['short', 'short', 'afro'];
const SCARVES = [0x8e2b2b, 0x2e4a6b, 0xc9a227, 0x3c5a3c];

/** `n` is the person's place in the city's list, which keeps everyone's look the same from visit to visit. */
export function npcLook(p: Person, n: number, theme: CityTheme): NpcLook {
  const female = p.female === true;
  return {
    female,
    skin: p.skin ?? theme.skins[n % theme.skins.length],
    hair: p.hair ?? 0x15100c,
    shirt: p.shirt,
    style: (female ? WOMEN : MEN)[n % 3],
    // a scarf for some people in the cooler French cities
    scarf: !theme.waxPrint && n % 3 === 1 ? SCARVES[n % SCARVES.length] : null,
  };
}
