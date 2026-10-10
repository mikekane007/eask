import type { PeerState } from './room-logic';

/** Why joining or creating a room failed. */
export type RoomFailure = 'not-found' | 'full' | 'taken' | 'offline';

export class RoomError extends Error {
  constructor(readonly failure: RoomFailure) {
    super(failure);
  }
}

/**
 * The shared room, whatever service carries it. The game only talks to this, so the provider (Firebase today)
 * can be swapped by writing one more file.
 */
export interface RoomClient {
  /** This player's id in the room. */
  readonly uid: string;
  /** Opens a room that does not exist yet. Throws RoomError('taken') if the code is already used by someone else. */
  create(code: string, city: string, me: PeerState): Promise<void>;
  /** Enters an existing room and returns the city it is set in. */
  join(code: string, me: PeerState): Promise<string>;
  /** Tells the others where you are. */
  publish(me: PeerState): void;
  /** Calls `cb` with everyone in the room (including you) now and whenever it changes. */
  onPlayers(cb: (all: unknown) => void): void;
  /** Leaves the room. The room is closed if nobody else is in it. */
  leave(): Promise<void>;
}

export type OpenRoomClient = () => Promise<RoomClient>;
