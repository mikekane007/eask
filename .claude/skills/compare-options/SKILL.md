---
name: compare-options
description: Choose between approaches or libraries for Go and Tell and record the decision as an ADR in docs/adr. Use when more than one reasonable design exists, when adding a runtime dependency, or when reversing an earlier decision.
---

# Compare options

1. State the decision and the constraints (machine power, Angular 19, three r128, no paid services).
2. List 2-4 real options, including "do nothing".
3. Score against: fit for constraints, complexity, performance on the owner's laptop, maintenance,
   reversibility, cost.
4. Pick one, say what would change your mind, and write `docs/adr/NNNN-title.md`:

```
# NNNN. Title
Status: accepted | superseded by NNNN
Context: ...
Decision: ...
Options considered: ...
Consequences: Positive / Negative
```

5. Add a line to `docs/adr/README.md`. Do not re-open an accepted ADR without new evidence; write a new
   one that supersedes it.

Decide yourself unless it costs money, needs an account, publishes publicly, or changes the product.

## Gotchas

- 2026-10-10: Use **Positive/Negative** sub-lists in ADRs, not lines starting with `+` or `-` signs
  as markers (Prettier turns them into bullets).
