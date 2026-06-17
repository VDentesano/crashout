# Cycle 92 CEO Decision: Ship History Persistence Smoke

## Customer and Problem

The customer is a first-time CRASHOUT player deciding whether the game feels fair and durable. Rounds commit/reveal already proves the game can persist hidden server seeds, but user-facing history still needs production evidence. If a player finishes matches and the backend cannot read those matches back, the product loses trust.

## Decision

Ship the next isolated INSFORGE persistence check against `/history`.

Rationale:
- It validates a visible product promise: completed matches are remembered.
- It exercises the same `matches` table that later powers leaderboard aggregation.
- It is narrow enough to ship in one cycle without touching UI or backend schema.

## Rejected Options

- Event direct readback via SQL/CLI: useful, but less visible to players and depends on privileged inspection rather than the public app contract.
- Balance reconciliation: important, but riskier because it touches account-like state and needs cleanup semantics.
- Leaderboard aggregation: higher blast radius because it depends on cross-player ranking and production data contamination controls.

## Next Step

Extend the existing manual INSFORGE smoke to record two synthetic history rows, list them back for the same synthetic player, and verify aggregate stats.
