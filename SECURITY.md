# Security policy

Go and Tell is a client-only game: no server, no accounts, no personal data. Progress is stored in the
browser's localStorage under the key `goandtell`.

## Reporting a vulnerability

Please report privately to the repository owner (kaniobed28@gmail.com) rather than opening a public issue.

## Practices

- Dependencies are audited in CI (`npm audit --omit=dev`) and updated weekly by Dependabot.
- Secrets are scanned on every commit (secretlint) and across full history in CI (gitleaks).
- No third-party scripts; the only external request is Google Fonts (Bungee, Karla).
