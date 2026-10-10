---
name: release
description: Release and deploy Go and Tell - versioning, changelog, production build, hosting options and what needs the owner's approval. Use when asked to ship, deploy, tag a version or publish anywhere.
---

# Release

**Deploying or publishing is the owner's decision.** Never deploy, buy a domain, or enable a paid plan
without an explicit yes. Offer options with a recommendation.

## Prepare (allowed autonomously)

1. `npm run check` and `npm run build` green; CI green on `main`.
2. Update `CHANGELOG.md` (Keep a Changelog style) and bump `version` in `package.json`.
3. Smoke-test the production build locally: serve `dist/go-and-tell/browser` with a static server and
   click through intro, a conversation, sleep, reload.
4. Commit `chore(release): vX.Y.Z`, tag `vX.Y.Z`. Pushing the tag is fine; creating a GitHub Release
   is public publishing - ask first.

## Hosting options (static site, no server)

| Option           | Cost      | Notes                                        |
| ---------------- | --------- | -------------------------------------------- |
| GitHub Pages     | free      | simple; needs `base-href` for a project page |
| Cloudflare Pages | free tier | fast CDN, good headers support               |
| Vercel / Netlify | free tier | easy previews per PR                         |

Recommendation: Cloudflare Pages or GitHub Pages. Ask before choosing; mention the custom domain is a
separate cost.

## Gotchas

- 2026-10-10: `ng build` warns if the initial bundle exceeds the budget; three.js is the bulk. Raise
  the budget deliberately in `angular.json`, do not ignore the warning.
