---
name: write-docs
description: Write and maintain Go and Tell documentation - README, CLAUDE.md, ADRs, changelog, contributing notes. Use when behaviour, setup, commands or decisions change, or when asked for docs.
---

# Write docs

- **README.md** - what it is, how to run it (`npm install`, `npm start`), scripts, folder map. For a
  stranger on day one.
- **CLAUDE.md** - for the AI: stack, commands, skills, backlog, hard rules. Keep the backlog current;
  tick items and add new ones as they are found.
- **docs/adr/** - one file per significant decision (see `compare-options`).
- **CHANGELOG.md** - user-visible changes per release.
- **Skill Gotchas** - when something goes wrong in a new way, add a dated line to the relevant skill.

## Style

Say what and why, not how the code reads. Commands in code blocks, tested. No stale screenshots. Edit
Markdown with the Edit/Write tools, not shell one-liners (backticks run as commands in bash).

## Gotchas

- 2026-10-10: Prettier checks Markdown too; run `npx prettier --write <file>` before committing docs.
