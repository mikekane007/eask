---
name: research
description: Establish facts before coding in Go and Tell - library behaviour for the installed versions (Angular 21, three r128, Vitest, Playwright), browser and WebGL behaviour, and anything uncertain. Use before writing code that depends on an API detail you are not sure of.
---

# Research

1. Write the question precisely, with the **installed version** (`npm ls <pkg>`).
2. Prefer primary sources: the package's own docs or types in `node_modules`, the official docs site,
   the source on GitHub. Use the docs MCP server (context7) if available; otherwise web search.
3. For three.js r128, remember most online examples are newer; check the r128 tag, not `master`.
4. Prove it: a 5-line experiment or a unit test beats a recollection.
5. Record non-obvious findings as a Gotcha in the relevant skill, with the date and the version.

Do not ask the owner things you can look up.

## Gotchas

- 2026-10-10: The three.js r128 API differs from current: `renderer.outputEncoding`,
  `Color.convertSRGBToLinear()`, legacy light units. Newer snippets will silently look wrong.
