---
name: game-content
description: Add or edit cities, people, conversations, places, translations, scoring and balance in Go and Tell (src/app/game/cities/*, i18n/*, GameService rules). Use when adding a city or a person, changing answers or feedback, translating, tuning energy/Word/openness numbers, or opening hours. Content about faith is the owner's call - see escalation.
---

# Game content

## Where things live

- `cities/<id>.ts` - a `City`: `id`, `country`, `name`, `tagline`, `reviewed`, `theme`, `places`, `people`.
- `cities/<id>.people.ts` - that city's conversations. `cities/common.ts` has helpers: `t(en, fr)`,
  `ans(...)`, `rnd3(...)`, shared church/home/meal options and the `SKIN` palette.
- `cities/index.ts` - the registry (`CITIES`, `getCity`). Add a new city here.
- `i18n/ui.ts` (UI strings), `i18n/rules.ts` (rulebook), `i18n/bible.ts` (French book names).

## Data shape

`Person` = `id`, `name`, `role` (L10n), `shirt`, `req` (Word needed), `spot`, `rounds`, optional `female`,
`skin`, `hair`. A round is a question and three answers `[text, quality, feedback, reference]`. All text is
`L10n`: a plain string or `{ en, fr }`. References are written once in English ("Romans 3:23; 1 John 1:9");
the French book names are applied on display. If you cite a book that is not in `i18n/bible.ts`, add it.

## Adding a city

1. Create `cities/<id>.ts` and `cities/<id>.people.ts`. Pick a `theme` (wall colours, roof kind and colours,
   ground `laterite` or `grass`, palms, wires, stall colours, vehicle labels, skin tones).
2. Give it `places` for `church`, `chop` (somewhere to eat) and `home`, plus decorative `market`, `tech`, `site`.
   Each place needs its own block (`bi`, `bj`) and a `side` that faces a road. Home must exist.
3. Write 6 or more people with a Word curve that starts at 0 (for example 0, 0, 15, 25, 35, 45), each with
   3 rounds of 3 answers (one good, one ok, one bad), in English **and** French.
4. Set `reviewed: false` and register the city in `cities/index.ts`.
5. `npm test`: `cities.spec.ts` checks structure and that every non-Accra city is fully French.
6. Look at it in the browser (picker, intro, a conversation, the map, night time).

## Rules for answers

- Exactly three answers per round: one `good`, one `ok`, one `bad`. The "wiser reply" after a miss is the `good` one.
- Feedback explains **why**, in one or two kind sentences, and the reference supports that point.
- `bad` answers are plausible mistakes real people make (harshness, prosperity gospel, prying, deception,
  adding rules to grace), never caricatures. Treat every faith and community with respect: Catholics,
  Muslims, atheists, the hurt and the homeless are people first.
- Names, jobs, places and speech fit the city. French uses "vous" for adults; "tu" only for the very young.
- Write a natural French version, not a word-for-word one.

## Balance numbers (in `GameService`)

- Talk costs 1 hour and 8 energy. Hours cost 1.5 energy and 0.2 Word each.
- Openness starts at 50: good +18, ok +3, bad -25. Outcome: 80+ open, 45+ seed, otherwise away; 0 ends the talk early.
- Chapel study gives +12 Word, training +20 (needs 20), so a `req` above about 60 needs several visits.

## Escalate to the owner

Any change to doctrine, to which answers are marked good/bad, to Bible references, or to how a religion or
community is portrayed. Draft the text, mark the city `reviewed: false`, and wait for approval before setting
it to `true`. Never mark your own draft as reviewed.

## Gotchas

- 2026-10-10: Saved games key results by person `id` and city `id` (`goandtell:<cityId>`). Renaming either
  silently drops progress; add a migration if you must rename.
- 2026-10-10: `Person.female` drives the dress model and wax-print wrap; there is no longer a hard-coded list.
- 2026-10-10: Place `sign` text is painted on the building and stays in the city's language; `name`, `label`
  and option labels are translated.
- 2026-10-10: Home signs and shop signs are lifted for steeper roofs (`theme.roof.pitch`); if a new theme
  uses a very steep roof, check that the sign is not hidden behind it.
