# Roadmap: a living, real-feeling world

Goal: make Go and Tell feel like a real place with real people, in the spirit of an open-world game, but built
around everyday life and evangelism (no crime or violence). Everything must run smoothly on a 2016 laptop with
integrated graphics, so each stage has a performance budget and is verified before the next begins.

Legend: ✅ done · 🔄 in progress · ⏳ planned · ⏸ waiting on owner

## Phase 1: A living street

- ✅ 1.1 Ambient clock: time passes while you walk (about 3 real minutes per game hour); HH:MM on the HUD
- ✅ 1.2 Weather: clear, cloudy, rain, fog, by day and city; rain particles, light and fog change
- ✅ 1.3 Traffic: cars and buses on every road, traffic lights, vehicles yield to the player
- ✅ 1.4 Pedestrians: a crowd with daily routines (commute, lunch, evening, night), drawn with instancing
- ✅ 1.5 Sound: generated in the browser (no audio files): ambience, rain, traffic, birds, footsteps, bells, mute

## Phase 2: A real place

- ✅ 2.1 Pilot: a real Lille neighbourhood from OpenStreetMap (streets and building footprints), loaded on demand
- ✅ 2.2 Road network on real maps: traffic (junction turn-taking, yielding) and the crowd walk the real streets; chunking was not needed (about 115 KB, one draw call per material)
- ✅ 2.3 Real maps for Paris (Latin Quarter), Douai (the belfry area) and Accra (Osu)

## Phase 3: A real person's life

- 🔄 3.1 Needs and money: eat, sleep, small income and costs
- ⏳ 3.2 Phone: contacts from good conversations, follow-up meetings, Bible reading together
- ⏳ 3.3 Relationships and reputation that change how people respond
- ⏳ 3.4 Missions: hospital visit, a small group at a home, helping a neighbour

## Phase 4: Look and polish

- ✅ 4.0 Camera: tilts to look down when buildings are in the way, never enters a building, soft see-through hole only as a fallback; moves in during conversations
- ✅ 4.1 Better characters: faces, four hairstyles, scarves, breathing, waving, talking gestures; crowd with arms and hair (sitting and glTF models still open)
- ⏳ 4.2 Shops and homes you can walk into
- ✅ 4.3 Landmarks at their real places (Lille belfry and Goddess column, Douai belfry, Sorbonne dome), roadside stalls in Accra
- ✅ 4.5 City-specific buildings (brick, stone, plaster facades; hipped, mansard and flat roofs; shop fronts and awnings), street details (kerbs, lines, crossings, benches, bins), sky glow, lamp light at night
- ✅ 4.6 Screens: illustrated city cards, icons, a loading state, portraits and an openness gauge in conversations
- ✅ 4.4 Quality settings (low, medium, high) plus Auto, which lowers the detail when the frame rate cannot be held

## Phase 5: Friends' feedback (2026-10-10)

- ✅ 5.1 Lille café renamed to "La Majesté Cafe and Pastries" and the church to "Lille City Church"
- ✅ 5.2 Choose your character: guy or lady, skin, hair, clothes (kept on the device, shared by every city)
- ✅ 5.3 Autopilot: walk to the church, café, home or a person around the buildings (grid path finding, `pathfind.ts`)
- ✅ 5.4 Typed replies on one question per person, judged by ideas in both languages (`typed-answer.ts`, content in `cities/typed.ts`, draft for review)
- ✅ 5.5 Playing together (Firebase, ADR 0007): room codes, anonymous join, see each other walk with names, blue dots on the minimap
- ⏳ 5.6 Meet a group of people together and take turns answering (host leads the scene, everyone sees the result; draft content for review)
- ✅ 5.7 Faster start: the 3D engine loads only when a city is chosen (first download 1.04 MB → 459 kB)

## Standing rules

- No crime, violence or chaos; realism means everyday life.
- Owner approval for: doctrine and conversation content, anything that costs money, publishing.
- Map data: OpenStreetMap, credited in the app (ODbL). No scraping beyond the public API, cache locally.
- Performance budget: 30 fps on integrated graphics; stay under about 600 draw calls; instance crowds and traffic.
- Every stage ends with: lint, types, tests green, a check in the browser, docs updated, committed and pushed.
