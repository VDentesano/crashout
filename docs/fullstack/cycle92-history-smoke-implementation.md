# Cycle 92 Full-stack Implementation: History Smoke Extension

## Change

`projects/crashout/scripts/insforge-persistence-smoke.mjs` now verifies two backend persistence surfaces:

- `/rounds`: commit/reveal rows are written and revealed without leaking `serverSeed` at commit time.
- `/history`: synthetic match rows are recorded and listed back with aggregate stats.

## Assertions

The history path records:

- one win: bet `100`, cashout `2.12`, delta `100`
- one loss: bet `50`, null cashout, delta `-50`

Then it checks:

- exactly two matches for the unique synthetic player
- generated `id`, valid `created_at`, valid `crash_point`
- row field preservation for bet, outcome, delta, and cashout
- stats: total `2`, wins `1`, losses `1`, draws `0`, winRate `0.5`, netDelta `50`, bestCashout `2.12`

## Scope Control

No frontend, migration, dependency, or workflow split was added. The existing manual smoke command remains the release interface:

```bash
pnpm run smoke:insforge
```
