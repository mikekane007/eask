# 0007. Playing together over Firebase

Status: accepted

## Context

Players asked to meet friends in the game and evangelise together. The game had no server: it is a static site,
progress lives in the browser. Playing together needs a small live service.

## Decision

Use the Firebase Realtime Database (project `go-and-tell-game`, region europe-west1) with anonymous sign-in.

- A room is `rooms/<CODE>` with `host`, `city` and `players/<uid>`. Codes are 5 characters from an alphabet without
  look-alikes (no 0/O, 1/I/L). Rooms cannot be listed; you need the code.
- Each player writes only their own `players/<uid>` (`name`, `x`, `z`, `rot`, `look`, `t`), at most 4 times a second
  while moving and every 5 seconds when still. The server removes it when the connection drops.
- Players who stop sending for 20 seconds are hidden (`PeerTracker`, measured on each device's own clock).
- At most 6 players per room. There is no chat: names are the only free text, cleaned and capped at 20 characters.
- The rules (`database.rules.json`) enforce all of this on the server, not just in the app.
- The game talks to an interface (`RoomClient`); Firebase is one file (`net/firebase-room.ts`). The Firebase library
  is loaded only when someone opens or joins a room.

## Options considered

- Supabase Realtime: good, and better for SQL data later, but free projects pause after a week unused.
- Firebase Realtime Database: simplest presence and disconnect handling, no pausing on the free plan. Chosen.
- Peer-to-peer (WebRTC): no server costs, but needs signalling and fails behind many networks.

## Consequences

Positive: friends see each other walk in the same city with no accounts; offline play is unchanged.
Negative: depends on Google's service; the web API key is public by design, so all protection is in the database
rules. Free-plan limits (about 100 simultaneous connections) cap how many people can play together at once.

Follow-ups: meeting a group of people together with turn-taking (roadmap 5.5 part 2); restrict the API key to the
game's domains in the Google Cloud console once the final domain is known.
