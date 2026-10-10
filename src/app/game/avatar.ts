/** What the player looks like. Pure data and checks, no rendering code, so it can be tested and saved safely. */

export interface Avatar {
  /** Wears a dress and a longer look when true, trousers and a shirt otherwise. */
  female: boolean;
  /** Index into SKIN_TONES. */
  skin: number;
  /** Index into HAIR_COLORS. */
  hair: number;
  /** Index into OUTFITS. */
  outfit: number;
}

export const SKIN_TONES: readonly number[] = [
  0xe8c3a0, 0xd9a87c, 0xc68b5e, 0xa66b43, 0x8a5a3b, 0x6b4630, 0x4a2f1d, 0x3e2716,
];
export const HAIR_COLORS: readonly number[] = [0x15100c, 0x3b2a20, 0x6b4630, 0xb08a4a, 0xc9c2b4, 0xa13b2c];

export interface Outfit {
  /** Plain colour of the top (or the dress). */
  color: number;
  /** A printed cloth instead of a plain colour. */
  print?: 'kente';
}

export const OUTFITS: readonly Outfit[] = [
  { color: 0xd7263d },
  { color: 0x2e86c1 },
  { color: 0x1e8a4c },
  { color: 0xf2b705 },
  { color: 0xf4eedc },
  { color: 0x6c3f8f },
  { color: 0x111c17 },
  { color: 0xd7263d, print: 'kente' },
];

export const DEFAULT_AVATAR: Avatar = { female: false, skin: 4, hair: 0, outfit: 0 };

const index = (v: unknown, size: number, fallback: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < size ? v : fallback;

/** Turns anything read back from storage into a valid avatar, keeping each valid field and defaulting the rest. */
export function parseAvatar(raw: unknown): Avatar {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    female: typeof r['female'] === 'boolean' ? r['female'] : DEFAULT_AVATAR.female,
    skin: index(r['skin'], SKIN_TONES.length, DEFAULT_AVATAR.skin),
    hair: index(r['hair'], HAIR_COLORS.length, DEFAULT_AVATAR.hair),
    outfit: index(r['outfit'], OUTFITS.length, DEFAULT_AVATAR.outfit),
  };
}

/** CSS colour for the preview and swatches. */
export const css = (hex: number): string => '#' + hex.toString(16).padStart(6, '0');

/** A short text form of a look, such as "1406", so other players' games can draw the same character. */
export const encodeLook = (a: Avatar): string => `${a.female ? 1 : 0}${a.skin}${a.hair}${a.outfit}`;

/** The look for a text made by encodeLook. Anything else gives the default look rather than an error. */
export function decodeLook(s: unknown): Avatar {
  if (typeof s !== 'string' || !/^[01]\d{3}$/.test(s)) return DEFAULT_AVATAR;
  return parseAvatar({ female: s.startsWith('1'), skin: Number(s[1]), hair: Number(s[2]), outfit: Number(s[3]) });
}
