import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AVATAR,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFITS,
  SKIN_TONES,
  css,
  decodeLook,
  encodeLook,
  parseAvatar,
} from './avatar';

describe('avatar', () => {
  it('has a default that is itself valid', () => {
    expect(parseAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR);
  });

  it('keeps a valid saved avatar as it is', () => {
    const a = { female: true, skin: 2, hair: 5, outfit: OUTFITS.length - 1, style: 3 };
    expect(parseAvatar(a)).toEqual(a);
  });

  it('falls back field by field on bad data', () => {
    expect(parseAvatar(null)).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar('x')).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar({ female: 'yes', skin: 99, hair: -1, outfit: 1.5 })).toEqual(DEFAULT_AVATAR);
    expect(parseAvatar({ female: true, skin: SKIN_TONES.length })).toEqual({
      ...DEFAULT_AVATAR,
      female: true,
      style: 2,
    });
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

describe('look text', () => {
  it('reads the older four-character form, choosing the hair that was drawn then', () => {
    expect(decodeLook('1406')).toEqual({ female: true, skin: 4, hair: 0, outfit: 6, style: 2 });
    expect(decodeLook('0406')).toEqual({ female: false, skin: 4, hair: 0, outfit: 6, style: 0 });
  });

  it('gives older saved looks a hairstyle', () => {
    expect(parseAvatar({ female: true, skin: 1, hair: 1, outfit: 1 }).style).toBe(2);
    expect(parseAvatar({ female: false, skin: 1, hair: 1, outfit: 1, style: 9 }).style).toBe(0);
  });

  it('round-trips every look', () => {
    for (const female of [false, true])
      for (let skin = 0; skin < SKIN_TONES.length; skin++)
        for (let hair = 0; hair < HAIR_COLORS.length; hair++)
          for (let outfit = 0; outfit < OUTFITS.length; outfit++)
            for (let style = 0; style < HAIR_STYLES.length; style++) {
              const a = { female, skin, hair, outfit, style };
              expect(decodeLook(encodeLook(a))).toEqual(a);
            }
  });

  it('stays short enough for the room rules', () => {
    expect(encodeLook({ female: true, skin: 7, hair: 5, outfit: 7, style: 3 }).length).toBeLessThanOrEqual(20);
  });

  it('turns bad text into the default look', () => {
    for (const bad of ['', 'abcd', '9999', 12, null, undefined, '140601'])
      expect(decodeLook(bad)).toEqual(DEFAULT_AVATAR);
  });
});
