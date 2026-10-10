/** Rules for playing together that need no network: room codes, names, and which other players to show. */
import { type Avatar, decodeLook } from '../avatar';

/** Letters and digits that cannot be mistaken for each other (no 0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

/** A new room code. `random` gives numbers from 0 up to (not including) 1. */
export function makeCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

/** What the player typed, tidied into a code: upper case, spaces and dashes dropped. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  for (const c of code) if (!ALPHABET.includes(c)) return false;
  return true;
}

const MAX_NAME = 20;

/** A name safe to show and store: no control characters, trimmed, not too long. */
export function cleanName(input: string, fallback = 'Friend'): string {
  let kept = '';
  for (const ch of input) if (ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127) kept += ch;
  const n = kept.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return n || fallback;
}

/** What one player tells the others about themselves. */
export interface PeerState {
  name: string;
  x: number;
  z: number;
  rot: number;
  /** See encodeLook. */
  look: string;
  /** Changes whenever the player sends an update, so a silent player can be noticed. */
  t: number;
}

export interface Peer {
  id: string;
  name: string;
  x: number;
  z: number;
  rot: number;
  look: Avatar;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Reads one player's data from the shared database. Returns null if it is not a well-formed player. */
export function parsePeer(id: string, raw: unknown): (Peer & { t: number }) | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r['name'] !== 'string' || !finite(r['x']) || !finite(r['z']) || !finite(r['rot']) || !finite(r['t']))
    return null;
  return {
    id,
    name: cleanName(r['name']),
    x: r['x'],
    z: r['z'],
    rot: r['rot'],
    look: decodeLook(r['look']),
    t: r['t'],
  };
}

/** A player nobody has heard from for this long (milliseconds) is treated as gone, e.g. a closed laptop. */
export const SILENT_MS = 20000;

/**
 * Keeps track of the other players in a room. Feed it the whole player list each time it changes; it hides yourself
 * and anyone who has gone quiet. Silence is measured on this device's clock, from when their `t` last changed.
 */
export class PeerTracker {
  private readonly seen = new Map<string, { t: number; at: number }>();

  constructor(private readonly selfId: string) {}

  update(all: unknown, now: number): Peer[] {
    const out: Peer[] = [];
    const rows = all && typeof all === 'object' ? Object.entries(all as Record<string, unknown>) : [];
    const present = new Set<string>();
    for (const [id, raw] of rows) {
      if (id === this.selfId) continue;
      const p = parsePeer(id, raw);
      if (!p) continue;
      present.add(id);
      let last = this.seen.get(id);
      if (last?.t !== p.t) {
        last = { t: p.t, at: now };
        this.seen.set(id, last);
      }
      if (now - last.at > SILENT_MS) continue;
      out.push({ id: p.id, name: p.name, x: p.x, z: p.z, rot: p.rot, look: p.look });
    }
    for (const id of [...this.seen.keys()]) if (!present.has(id)) this.seen.delete(id);
    return out;
  }
}

/** The most players in one room. Keeps the scene light and the conversations manageable. */
export const MAX_PLAYERS = 6;
