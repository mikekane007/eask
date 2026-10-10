import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR, HAIR_COLORS, OUTFITS, SKIN_TONES, css, parseAvatar } from './avatar';

describe('avatar', () => {
  it('has a default that is itself valid', () => {
    expect(parseAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR);
  });

  it('keeps a valid saved avatar as it is', () => {
    const a = { female: true, skin: 2, hair: 5, outfit: OUTFITS.length - 1 };
    expect(parseAvatar(a)).toEqual(a);
  });

  it('falls back field by field on bad data', () => {
    expect(parseAvatar(null)).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar('x')).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar({ female: 'yes', skin: 99, hair: -1, outfit: 1.5 })).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar({ female: true, skin: SKIN_TONES.length })).toEqual({ ...DEFAULT_AVATAR, female: true });
  });

  it('offers a spread of choices', () => {
    expect(SKIN_TONES.length).toBeGreaterThanOrEqual(6);
    expect(HAIR_COLORS.length).toBeGreaterThanOrEqual(4);
    expect(OUTFITS.length).toBeGreaterThanOrEqual(6);
  });

  it('formats colours for css', () => {
    expect(css(0xd7263d)).toBe('#d7263d');
    expect(css(0x000f0f)).toBe('#000f0f');
  });
});
