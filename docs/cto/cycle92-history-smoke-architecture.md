# Cycle 92 CTO Architecture: INSFORGE History Persistence Check

## Constraint

No schema or function change is needed. The deployed `history` edge function already exposes:

- `record`: inserts a completed match row into `public.matches`.
- `list`: returns recent rows plus aggregate stats for a `playerId`.

## Approach

Extend `scripts/insforge-persistence-smoke.mjs` to derive `/history` from the configured `/events` URL, matching the existing `/rounds` derivation. The smoke uses a unique `smoke-cycle92-*` player per run to avoid collisions.

The verification sequence is:

1. Run existing `/rounds` start/reveal checks.
2. POST two `/history` records for the synthetic player.
3. POST `/history` list for that player.
4. Assert row count, preserved fields, generated ids, timestamps, and aggregate stats.

## Failure Modes Covered

- Function unreachable or wrong sibling URL.
- Insert fails or returns the wrong status.
- List cannot read persisted rows.
- Snake-case mapping drift on `cashout_multiplier`, `crash_point`, or `created_at`.
- Aggregate stats drift for total, wins, losses, draws, win rate, net delta, and best cashout.

## Operational Cost

The smoke appends two synthetic rows per manual run. That is acceptable for the manual workflow, but it should not run automatically on every PR until cleanup or an isolated backend branch exists.
