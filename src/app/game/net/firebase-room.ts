import { type RoomClient, RoomError } from './room-client';
import { MAX_PLAYERS, type PeerState } from './room-logic';

/**
 * The web settings of the "go-and-tell-game" Firebase project. These identify the project and are meant to be public;
 * what protects the data is database.rules.json (sign-in required, you can only write your own player, rooms cannot
 * be listed).
 */
const CONFIG = {
  apiKey: 'AIzaSyAqP212_VGJX95-FKcqcuEAo1Cemw5A4kI',
  authDomain: 'go-and-tell-game.firebaseapp.com',
  databaseURL: 'https://go-and-tell-game-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'go-and-tell-game',
  appId: '1:1058464497595:web:65c0b16a0417a3bcf9ce9e',
};

/** Connects to Firebase. The library is loaded only now, so players who never play together do not download it. */
export async function openFirebaseRoom(): Promise<RoomClient> {
  const [{ initializeApp, getApps }, { getAuth, signInAnonymously }, db] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/database'),
  ]).catch(() => {
    throw new RoomError('offline');
  });

  let uid: string;
  let base: ReturnType<typeof db.getDatabase>;
  try {
    const app = getApps()[0] ?? initializeApp(CONFIG);
    const cred = await signInAnonymously(getAuth(app));
    uid = cred.user.uid;
    base = db.getDatabase(app);
  } catch {
    throw new RoomError('offline');
  }

  let code = '';
  let unsubscribe: (() => void) | null = null;
  const room = (path = '') => db.ref(base, `rooms/${code}${path}`);
  const me = () => room(`/players/${uid}`);

  /** Puts you in the room and arranges for you to vanish if you close the tab. */
  async function enter(state: PeerState): Promise<void> {
    await db.onDisconnect(me()).remove();
    await db.set(me(), state);
  }

  return {
    uid,

    async create(newCode, city, state) {
      code = newCode;
      try {
        await db.set(room('/host'), uid);
      } catch {
        code = '';
        throw new RoomError('taken');
      }
      await db.set(room('/city'), city);
      await enter(state);
    },

    async join(joinCode, state) {
      code = joinCode;
      try {
        const [city, players] = await Promise.all([db.get(room('/city')), db.get(room('/players'))]);
        if (!city.exists()) throw new RoomError('not-found');
        const others = Object.keys((players.val() ?? {}) as Record<string, unknown>).filter((id) => id !== uid);
        if (others.length >= MAX_PLAYERS) throw new RoomError('full');
        await enter(state);
        return city.val() as string;
      } catch (e) {
        code = '';
        throw e instanceof RoomError ? e : new RoomError('offline');
      }
    },

    publish(state) {
      if (code) void db.set(me(), state).catch(() => undefined);
    },

    onPlayers(cb) {
      unsubscribe?.();
      unsubscribe = db.onValue(room('/players'), (snap) => {
        cb(snap.val());
      });
    },

    async leave() {
      if (!code) return;
      unsubscribe?.();
      unsubscribe = null;
      const left = code;
      code = '';
      const path = (p: string) => db.ref(base, `rooms/${left}${p}`);
      try {
        await db.remove(db.ref(base, `rooms/${left}/players/${uid}`));
        const rest = await db.get(path('/players'));
        // Nobody else here: close the room (only its host may remove these, which is who is last in practice)
        if (!rest.exists()) {
          await db.remove(path('/city')).catch(() => undefined);
          await db.remove(path('/host')).catch(() => undefined);
        }
      } catch {
        /* offline: the server drops our player when the connection closes */
      }
    },
  };
}
