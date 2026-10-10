import { Injectable, InjectionToken, NgZone, inject, signal } from '@angular/core';
import { encodeLook } from '../avatar';
import { GameService } from '../game.service';
import type { UiKey } from '../i18n/ui';
import { openFirebaseRoom } from './firebase-room';
import { type OpenRoomClient, type RoomClient, RoomError } from './room-client';
import { type Peer, type PeerState, PeerTracker, cleanName, isCode, makeCode, normalizeCode } from './room-logic';

/** How the room is reached. Tests replace this with a pretend room. */
export const OPEN_ROOM = new InjectionToken<OpenRoomClient>('OPEN_ROOM', {
  providedIn: 'root',
  factory: () => openFirebaseRoom,
});

const NAME_KEY = 'goandtell:name';
/** Position updates go out at most this often (milliseconds), and at least this often even when standing still. */
const SEND_EVERY_MS = 250;
const HEARTBEAT_MS = 5000;
const SWEEP_MS = 5000;

export type RoomStatus = 'idle' | 'connecting' | 'in';

/** Playing together: opens or joins a room and keeps the list of the other players up to date. */
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly game = inject(GameService);
  private readonly zone = inject(NgZone);
  private readonly open = inject(OPEN_ROOM);

  readonly status = signal<RoomStatus>('idle');
  readonly code = signal('');
  readonly peers = signal<Peer[]>([]);
  /** A message key for the last thing that went wrong, or null. */
  readonly error = signal<UiKey | null>(null);
  readonly menuOpen = signal(false);
  readonly name = signal(this.readName());

  private client: RoomClient | null = null;
  private tracker: PeerTracker | null = null;
  private lastAll: unknown = null;
  private lastSent = 0;
  private lastKey = '';
  private sweep: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.game.onLeaveCity = () => {
      void this.leave();
    };
  }

  private readName(): string {
    try {
      return cleanName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      return 'Friend';
    }
  }

  setName(value: string): void {
    this.name.set(value.replace(/[\r\n]/g, '').slice(0, 20));
  }

  private me(x: number, z: number, rot: number): PeerState {
    return {
      name: cleanName(this.name()),
      x: Math.round(x * 10) / 10,
      z: Math.round(z * 10) / 10,
      rot: Math.round(rot * 100) / 100,
      look: encodeLook(this.game.avatar()),
      t: Date.now(),
    };
  }

  private remember(): void {
    try {
      localStorage.setItem(NAME_KEY, cleanName(this.name()));
    } catch {
      /* storage unavailable */
    }
  }

  private async connect(): Promise<RoomClient> {
    this.status.set('connecting');
    this.error.set(null);
    try {
      return await this.open();
    } catch (e) {
      this.fail(e);
      throw e;
    }
  }

  private fail(e: unknown): void {
    const failure = e instanceof RoomError ? e.failure : 'offline';
    this.error.set(
      failure === 'not-found'
        ? 'roomNotFound'
        : failure === 'full'
          ? 'roomFull'
          : failure === 'taken'
            ? 'roomFailed'
            : 'roomOffline',
    );
    this.status.set('idle');
    this.code.set('');
  }

  private listen(client: RoomClient, code: string): void {
    this.client = client;
    this.tracker = new PeerTracker(client.uid);
    this.lastAll = null;
    this.code.set(code);
    this.status.set('in');
    this.menuOpen.set(true);
    client.onPlayers((all) => {
      this.lastAll = all;
      this.refresh();
    });
    // Players who went quiet are dropped even when nothing new arrives.
    this.sweep = setInterval(() => {
      this.refresh();
    }, SWEEP_MS);
  }

  private refresh(): void {
    const tracker = this.tracker;
    if (!tracker) return;
    const next = tracker.update(this.lastAll, Date.now());
    this.zone.run(() => {
      this.peers.set(next);
    });
  }

  /** Opens a new room in the city you are in and gives you its code. */
  async create(): Promise<void> {
    const city = this.game.cityId();
    if (!city || this.status() !== 'idle') return;
    this.remember();
    let client: RoomClient;
    try {
      client = await this.connect();
    } catch {
      return; // connect() has already said what went wrong
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = makeCode();
      try {
        await client.create(code, city, this.me(this.game.live.x, this.game.live.z, this.game.live.rot));
        this.listen(client, code);
        return;
      } catch (e) {
        if (!(e instanceof RoomError && e.failure === 'taken')) {
          this.fail(e);
          return;
        }
      }
    }
    this.fail(new RoomError('taken'));
  }

  /** Joins a friend's room from the code they gave you, moving you to their city. */
  async join(input: string): Promise<void> {
    const code = normalizeCode(input);
    if (this.status() !== 'idle') return;
    if (!isCode(code)) {
      this.error.set('roomNotFound');
      return;
    }
    this.remember();
    let client: RoomClient;
    try {
      client = await this.connect();
    } catch {
      return;
    }
    try {
      // Go to the room's city first, so the position we announce belongs to the right map.
      const city = await client.join(code, this.me(0, 0, 0));
      if (this.game.cityId() !== city || !this.game.playing()) {
        this.game.selectCity(city);
        this.game.start();
      }
      this.listen(client, code);
    } catch (e) {
      this.fail(e);
    }
  }

  /** Sends your position. Called every frame by the engine; this decides when to actually send. */
  publish(x: number, z: number, rot: number): void {
    const client = this.client;
    if (!client || this.status() !== 'in') return;
    const now = Date.now();
    const key = `${x.toFixed(1)},${z.toFixed(1)},${rot.toFixed(2)}`;
    const moved = key !== this.lastKey;
    if (now - this.lastSent < (moved ? SEND_EVERY_MS : HEARTBEAT_MS)) return;
    this.lastSent = now;
    this.lastKey = key;
    client.publish(this.me(x, z, rot));
  }

  async leave(): Promise<void> {
    const client = this.client;
    clearInterval(this.sweep);
    this.client = null;
    this.tracker = null;
    this.code.set('');
    this.peers.set([]);
    this.status.set('idle');
    this.menuOpen.set(false);
    if (client) await client.leave();
  }
}
