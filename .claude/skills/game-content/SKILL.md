---
name: game-content
description: Edit or add conversations, people, places, scoring and balance in Go and Tell (people.data.ts, places.data.ts, GameService rules). Use when adding a person or round, changing answers or feedback, tuning energy/Word/openness numbers, or opening/closing hours. Content about faith is the owner's call - see escalation.
---

# Game content

## Data shape

`Person` = id, name, role, shirt colour, `req` (Word needed), `spot`, and `rounds`. Each round has a
question and answers `[text, 'good'|'ok'|'bad', feedback, scripture reference]`.

## Rules for answers

- Exactly three answers per round: one `good`, one `ok`, one `bad`. The "wiser reply" shown after a
  miss is the `good` one.
- Feedback explains **why**, in one or two kind sentences, and the reference supports that point.
- `bad` answers are plausible mistakes real people make (harshness, prosperity gospel, prying), not
  caricatures.
- Names of people and places stay realistic for the Accra setting.

## Balance numbers (in `GameService`)

- Talk costs 1 hour and 8 energy. Hours cost 1.5 energy and 0.2 Word each.
- Openness starts at 50: good +18, ok +3, bad -25. Outcome: 80+ open, 45+ seed, otherwise away; 0 ends
  the talk early.
- Adding a person: give a unique `id`, a `req` that fits the Word curve (0, 15, 20, ... 60), a `spot`
  on a free street segment, and add them to the women list in `engine.ts` if the model should be a dress.

## Escalate to the owner

Any change to doctrine, to which answers are marked good/bad, to Bible references, or to how a
religion or community is portrayed. Propose the text and wait; do not rewrite it on your own.

## Gotchas

- 2026-10-10: Saved games key results by person `id`. Renaming an `id` silently drops that person's
  progress - add a migration in `GameService.load()` if you must rename.
