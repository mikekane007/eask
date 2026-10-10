# 0005. Selectable cities and an English/French switch

Status: accepted

## Context

The game was a single street in Accra, in English only. The owner wants players to choose a city, for
example Lille, Paris or Douai in France, and to play in English or French.

## Decision

- A **city** is data: theme (look), places (names, positions, hours), people (conversations). The registry
  is `src/app/game/cities/index.ts`. The engine builds whichever city is selected and is rebuilt on change.
- Progress is saved **per city** under `goandtell:<cityId>`. Saves from before cities existed (`goandtell`)
  are read as Accra.
- Text that may be translated is `L10n`: a plain string, or `{ en, fr }`. A missing `fr` falls back to English.
  Scripture references are written once in English and the book names are translated on display
  (`i18n/bible.ts`, Louis Segond names).
- UI strings live in `i18n/ui.ts` (typed so every key must exist in both languages) and the rules in
  `i18n/rules.ts`. The language is remembered in `goandtell:lang`.
- New cities start as **drafts** (`reviewed: false`). The owner approves the conversations before the flag
  is set. The picker and intro show a "draft" notice until then.
- Every non-Accra city must be fully playable in French; a unit test enforces it. Accra's conversations are
  English-only for now.

## Options considered

- One shared cast for all cities: fastest, but inauthentic.
- A city picker with only visual changes: cheaper, but the conversations are the point of the game.
- Separate apps per country: duplicates all the code.

## Consequences

Positive: new cities are mostly data plus a theme; consistency is enforced by tests; one engine for all.
Negative: a lot of conversation content to write and review per city; Accra's French translation is pending;
the street grid is shared by all cities (only places, theme and people differ).
