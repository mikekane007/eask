# 0004. Render budget for modest hardware

Status: accepted

## Context

The owner's laptop (2016 quad-core, integrated Intel HD 530 plus a Quadro M1000M) hit 100% CPU and froze
while the original-quality scene ran with other tools.

## Decision

Cap rendering at 30 fps while playing and 10 fps behind the intro, pause when the tab is hidden, disable
MSAA, cap pixel ratio at 1.25 and use a 1024 shadow map. Quality may only be raised behind a setting.

## Options considered

- Keep the original quality: best looking, unusable on the target machine.
- Adaptive quality from measured frame time: better long term, more code; backlog item.
- Fixed light budget: simple and predictable.

## Consequences

Positive: far lower CPU and GPU use; cooler, quieter laptop.
Negative: slightly softer edges and shadows; 30 fps motion is less smooth.
