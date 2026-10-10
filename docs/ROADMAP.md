# Roadmap: a living, real-feeling world

Goal: make Go and Tell feel like a real place with real people, in the spirit of an open-world game, but built
around everyday life and evangelism (no crime or violence). Everything must run smoothly on a 2016 laptop with
integrated graphics, so each stage has a performance budget and is verified before the next begins.

Legend: ✅ done · 🔄 in progress · ⏳ planned · ⏸ waiting on owner

## Phase 1: A living street

- ✅ 1.1 Ambient clock: time passes while you walk (about 3 real minutes per game hour); HH:MM on the HUD
- ✅ 1.2 Weather: clear, cloudy, rain, fog, by day and city; rain particles, light and fog change
- ✅ 1.3 Traffic: cars and buses on every road, traffic lights, vehicles yield to the player
- 🔄 1.4 Pedestrians: a crowd with daily routines (commute, lunch, evening, night), drawn with instancing
- ⏳ 1.5 Sound: generated in the browser (no audio files): ambience, rain, traffic, birds, footsteps, bells, mute

## Phase 2: A real place

- ⏳ 2.1 Pilot: a real Lille neighbourhood from OpenStreetMap (streets and building footprints), loaded on demand
- ⏳ 2.2 Chunked world: build only what is near the player, reuse meshes, level of detail
- ⏳ 2.3 Roll out to Paris and Douai; Accra if good map data exists

## Phase 3: A real person's life

- ⏳ 3.1 Needs and money: eat, sleep, small income and costs
- ⏳ 3.2 Phone: contacts from good conversations, follow-up meetings, Bible reading together
- ⏳ 3.3 Relationships and reputation that change how people respond
- ⏳ 3.4 Missions: hospital visit, a small group at a home, helping a neighbour

## Phase 4: Look and polish

- ⏳ 4.1 Better characters and animations (walk, wave, sit); glTF only if the size budget allows
- ⏳ 4.2 Shops and homes you can walk into
- ⏳ 4.3 Landmarks per city (belfry, tower, Braderie stalls)
- ⏳ 4.4 Quality settings (low, medium, high) with an automatic default from measured frame time

## Standing rules

- No crime, violence or chaos; realism means everyday life.
- Owner approval for: doctrine and conversation content, anything that costs money, publishing.
- Map data: OpenStreetMap, credited in the app (ODbL). No scraping beyond the public API, cache locally.
- Performance budget: 30 fps on integrated graphics; stay under about 600 draw calls; instance crowds and traffic.
- Every stage ends with: lint, types, tests green, a check in the browser, docs updated, committed and pushed.
