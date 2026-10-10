# 0001. Angular 19 standalone components with signals and one rules service

Status: accepted

## Context

The game began as one HTML file with global variables and `innerHTML`. We need testable rules, typed
data and a UI that can grow.

## Decision

Standalone components, signals for state, and a single `GameService` that owns all rules and
persistence. Components render signals and call service methods. The 3D engine is plain TypeScript
that runs outside the Angular zone and talks to the service through signals.

## Options considered

- Keep the single file: fastest, but untestable and hard to change safely.
- NgRx or another store: more ceremony than a game this size needs.
- Signals plus a service: small, testable without a DOM, idiomatic Angular 19.

## Consequences

Positive: rules are unit tested in milliseconds; UI components stay thin.
Negative: the engine is large and only covered by end-to-end tests; splitting it is on the backlog.

## Update (2026-10-10)

Upgraded to Angular 21 (LTS) because Angular 19 and 20 carried high-severity security advisories. Angular 22 needs
Node 24.15 or later; move to it when the development machines have that Node.
