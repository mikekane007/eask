---
name: security-audit
description: Security review for Go and Tell - dependencies, secrets, XSS and template safety, localStorage trust, third-party requests, CSP and headers when deployed. Use before releases, when adding dependencies or external requests, or when asked to audit security.
---

# Security audit

The app is client-only with no accounts or personal data, so the risks are small but real.

## Checklist

- **Dependencies**: `npm audit --omit=dev` clean at high; no new dependency without `dependency-vetting`.
- **Secrets**: none in the repo or history (secretlint on commit, gitleaks in CI). No `.env` committed.
- **XSS**: only Angular interpolation `{{ }}`; never `[innerHTML]`, `bypassSecurityTrust*`, or building
  HTML strings (the original artifact used `innerHTML`; the port removed it - keep it that way).
- **Saved data is untrusted**: `localStorage` can be edited by the user. `GameService.load()` parses
  defensively and merges over defaults; clamp numbers that drive the game if they ever matter beyond fun.
- **External requests**: only Google Fonts. Anything new (analytics, CDN) needs the owner's approval
  and a privacy note.
- **Deployment headers** (when deployed): `Content-Security-Policy` allowing self, Google Fonts and
  `data:`/`blob:` images; `X-Content-Type-Options: nosniff`; `Referrer-Policy`; HTTPS only.

## Gotchas

- 2026-10-10: `npm audit` reports vulnerabilities inside dev tooling (Angular build chain); judge by
  `--omit=dev` for what ships, and do not run `npm audit fix --force` (it can downgrade Angular).
