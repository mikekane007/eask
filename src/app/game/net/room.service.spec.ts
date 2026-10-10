import { Injector, NgZone } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameService } from '../game.service';
import { I18n } from '../i18n/i18n.service';
import { type OpenRoomClient, type RoomClient, RoomError } from './room-client';
import { OPEN_ROOM, RoomService } from './room.service';
import { MAX_PLAYERS, type PeerState } from './room-logic';

/** An in-memory stand-in for the shared database, so two players can be tested together. */
class FakeServer {
  rooms = new Map<string, { host: string; city: string; players: Record<string, PeerState> }>();
  listeners = new Map<string, ((all: unknown) => void)[]>();
  private n = 0;

  notify(code: string): void {
    const room = this.rooms.get(code);
    for (const cb of this.listeners.get(code) ?? []) cb(room ? { ...room.players } : null);
  }

  open: OpenRoomClient = () => {
    const uid = `u${++this.n}`;
    let code = '';
    const client: RoomClient = {
      uid,
      create: (c, city, me) => {
        if (this.rooms.has(c)) return Promise.reject(new RoomError('taken'));
        code = c;
        this.rooms.set(c, { host: uid, city, players: { [uid]: me } });
        return Promise.resolve();
      },
      join: (c, me) => {
        const room = this.rooms.get(c);
        if (!room) return Promise.reject(new RoomError('not-found'));
        if (Object.keys(room.players).length >= MAX_PLAYERS) return Promise.reject(new RoomError('full'));
        code = c;
        room.players[uid] = me;
        this.notify(c);
        return Promise.resolve(room.city);
      },
      publish: (me) => {
        const room = this.rooms.get(code);
        if (room) room.players[uid] = me;
        this.notify(code);
      },
      onPlayers: (cb) => {
        this.listeners.set(code, [...(this.listeners.get(code) ?? []), cb]);
        cb(this.rooms.get(code)?.players ?? null);
      },
      leave: () => {
        const room = this.rooms.get(code);
        if (room) {
          room.players = Object.fromEntries(Object.entries(room.players).filter(([id]) => id !== uid));
          if (!Object.keys(room.players).length) this.rooms.delete(code);
        }
        this.notify(code);
        return Promise.resolve();
      },
    };
    return Promise.resolve(client);
  };
}

function makeRoomService(server: FakeServer, cityId = 'lille') {
  const injector = Injector.create({
    providers: [
      { provide: I18n, useClass: I18n },
      { provide: NgZone, useValue: { run: <T>(fn: () => T): T => fn() } },
      { provide: OPEN_ROOM, useValue: server.open },
      { provide: GameService, useClass: GameService },
      { provide: RoomService, useClass: RoomService },
    ],
  });
  const game = injector.get(GameService);
  const room = injector.get(RoomService);
  game.selectCity(cityId);
  game.start();
  return { game, room };
}

describe('playing together', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a room and shows its code', async () => {
    const server = new FakeServer();
    const { room } = makeRoomService(server);
    await room.create();
    expect(room.status()).toBe('in');
    expect(room.code()).toMatch(/^[A-Z2-9]{5}$/);
    expect(server.rooms.get(room.code())?.city).toBe('lille');
  });

  it('lets a friend join with the code, in the same city, and they see each other', async () => {
    const server = new FakeServer();
    const host = makeRoomService(server, 'lille');
    host.room.setName('Ama');
    await host.room.create();

    const friend = makeRoomService(server, 'accra');
    friend.room.setName('Kofi');
    await friend.room.join(
      host.room
        .code()
        .toLowerCase()
        .replace(/(.{2})/, '$1-'),
    );

    expect(friend.room.status()).toBe('in');
    expect(friend.game.cityId()).toBe('lille');
    expect(friend.room.peers().map((p) => p.name)).toEqual(['Ama']);
    expect(host.room.peers().map((p) => p.name)).toEqual(['Kofi']);
  });

  it('sends your position, but not more often than it needs to', async () => {
    const server = new FakeServer();
    const host = makeRoomService(server);
    const friend = makeRoomService(server);
    await host.room.create();
    await friend.room.join(host.room.code());

    vi.setSystemTime(10_000);
    friend.room.publish(5, 6, 1);
    friend.room.publish(5.4, 6, 1); // too soon after the last
    expect(host.room.peers()[0]).toMatchObject({ x: 5, z: 6 });
    vi.setSystemTime(10_300);
    friend.room.publish(7, 6, 1);
    expect(host.room.peers()[0]).toMatchObject({ x: 7 });
  });

  it('tells you when the code is wrong', async () => {
    const server = new FakeServer();
    const { room } = makeRoomService(server);
    await room.join('AAAAA');
    expect(room.error()).toBe('roomNotFound');
    expect(room.status()).toBe('idle');
    await room.join('abc');
    expect(room.error()).toBe('roomNotFound');
  });

  it('tells you when the room is full', async () => {
    const server = new FakeServer();
    const host = makeRoomService(server);
    await host.room.create();
    for (let i = 1; i < MAX_PLAYERS; i++) await makeRoomService(server).room.join(host.room.code());
    const late = makeRoomService(server);
    await late.room.join(host.room.code());
    expect(late.room.error()).toBe('roomFull');
  });

  it('retries another code when one is taken', async () => {
    const server = new FakeServer();
    server.rooms.set('AAAAA', { host: 'x', city: 'lille', players: {} });
    const { room } = makeRoomService(server);
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);
    await room.create();
    expect(room.status()).toBe('in');
    expect(room.code()).not.toBe('AAAAA');
    vi.restoreAllMocks();
  });

  it('leaves the room when you leave the city, and closes it when empty', async () => {
    const server = new FakeServer();
    const host = makeRoomService(server);
    await host.room.create();
    const code = host.room.code();
    host.game.leaveCity();
    await vi.advanceTimersByTimeAsync(0);
    expect(host.room.status()).toBe('idle');
    expect(host.room.peers()).toEqual([]);
    expect(server.rooms.has(code)).toBe(false);
  });

  it('shows a message when the service cannot be reached', async () => {
    const injector = Injector.create({
      providers: [
        { provide: I18n, useClass: I18n },
        { provide: NgZone, useValue: { run: <T>(fn: () => T): T => fn() } },
        { provide: OPEN_ROOM, useValue: () => Promise.reject(new RoomError('offline')) },
        { provide: GameService, useClass: GameService },
        { provide: RoomService, useClass: RoomService },
      ],
    });
    injector.get(GameService).selectCity('lille');
    const room = injector.get(RoomService);
    await room.create();
    expect(room.error()).toBe('roomOffline');
    expect(room.status()).toBe('idle');
  });
});
