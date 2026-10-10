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

## Update: quality levels

The fixed budget became three levels (Low, Medium, High) plus Auto (`graphics.ts`, `graphics.service.ts`). Each level sets the
render resolution, shadows and shadow size, raindrops, share of trees, most vehicles and most background people. The game
starts on Medium with Auto on. A frame watcher (`FrameMeter`) lowers the level one step, with a notice, when 40% of recent
frames take over 52 ms (after a 4 s warm-up); it never raises the level on its own. Choosing a level yourself turns Auto off.
The choice is saved. This protects slow machines such as the owner's 2016 laptop without needing to measure them in advance.
