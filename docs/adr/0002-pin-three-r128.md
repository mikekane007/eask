# 0002. Pin three.js to r128

Status: accepted

## Context

The scene was authored against r128 (sRGB handled manually, legacy light units). Newer releases change
colour management and light intensity, so the same code looks different.

## Decision

Depend on `three@0.128.0` and `@types/three@0.128.0` exactly; Dependabot ignores minor and major bumps.

## Options considered

- Upgrade now: modern API, but needs a visual re-tuning pass of every colour and light.
- Stay on r128: identical look, older API.

## Consequences

Positive: no visual regressions; stable.
Negative: older docs and types; a future upgrade is a deliberate project. Supersede this ADR when done.
