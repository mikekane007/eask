import { describe, expect, it } from 'vitest';
import { encodeLook } from '../avatar';
import {
  CODE_LENGTH,
  PeerTracker,
  SILENT_MS,
  cleanName,
  isCode,
  makeCode,
  normalizeCode,
  parsePeer,
} from './room-logic';

const row = (over: Record<string, unknown> = {}) => ({
  name: 'Ama',
  x: 1,
  z: 2,
  rot: 0.5,
  look: encodeLook({ female: true, skin: 3, hair: 1, outfit: 2 }),
  t: 100,
  ...over,
});

describe('room codes', () => {
  it('make valid codes of the right length, with no look-alike letters', () => {
    for (let i = 0; i < 200; i++) {
      const c = makeCode();
      expect(c).toHaveLength(CODE_LENGTH);
      expect(isCode(c)).toBe(true);
      expect(c).not.toMatch(/[01OIL]/);
    }
  });

  it('use the random source given', () => {
    expect(makeCode(() => 0)).toBe('AAAAA');
  });

  it('are tidied from what people type', () => {
    expect(normalizeCode(' ab-c d2 ')).toBe('ABCD2');
    expect(isCode(normalizeCode('k7m-2p'))).toBe(true);
    expect(isCode('ABCD')).toBe(false);
    expect(isCode('ABCD0')).toBe(false);
  });
});

describe('cleanName', () => {
  it('trims, limits and removes control characters', () => {
    expect(cleanName('  Kofi  \n Mensah ')).toBe('Kofi Mensah');
    expect(cleanName('x'.repeat(50))).toHaveLength(20);
    expect(cleanName('a\u0000b')).toBe('ab');
  });
  it('falls back when empty', () => {
    expect(cleanName('   ')).toBe('Friend');
    expect(cleanName('', 'Guest')).toBe('Guest');
  });
});

describe('parsePeer', () => {
  it('reads a well-formed player', () => {
    const p = parsePeer('u1', row());
    expect(p).toMatchObject({ id: 'u1', name: 'Ama', x: 1, z: 2, rot: 0.5, t: 100 });
    expect(p?.look).toEqual({ female: true, skin: 3, hair: 1, outfit: 2 });
  });
  it('rejects anything else', () => {
    for (const bad of [null, 'x', 5, {}, row({ x: 'a' }), row({ z: NaN }), row({ name: 7 }), row({ t: undefined })])
      expect(parsePeer('u', bad)).toBeNull();
  });
  it('falls back to the default look on a bad look', () => {
    expect(parsePeer('u', row({ look: 'zzzz' }))?.look).toBeDefined();
  });
});

describe('PeerTracker', () => {
  it('hides yourself and shows the others', () => {
    const tr = new PeerTracker('me');
    const peers = tr.update({ me: row(), u2: row({ name: 'Kofi' }) }, 0);
    expect(peers.map((p) => p.id)).toEqual(['u2']);
  });

  it('skips malformed rows', () => {
    const tr = new PeerTracker('me');
    expect(tr.update({ a: row(), b: { name: 'x' }, c: null }, 0).map((p) => p.id)).toEqual(['a']);
    expect(tr.update(null, 1)).toEqual([]);
  });

  it('drops a player who has gone quiet and brings them back when they speak again', () => {
    const tr = new PeerTracker('me');
    expect(tr.update({ a: row({ t: 1 }) }, 0)).toHaveLength(1);
    expect(tr.update({ a: row({ t: 1 }) }, SILENT_MS - 1)).toHaveLength(1);
    expect(tr.update({ a: row({ t: 1 }) }, SILENT_MS + 1)).toHaveLength(0);
    expect(tr.update({ a: row({ t: 2 }) }, SILENT_MS + 2)).toHaveLength(1);
  });

  it('forgets players who left', () => {
    const tr = new PeerTracker('me');
    tr.update({ a: row() }, 0);
    tr.update({}, 1);
    expect(tr.update({ a: row() }, SILENT_MS * 3)).toHaveLength(1);
  });
});
