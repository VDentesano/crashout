# Cycle 99 CTO Architecture: INSFORGE Smoke Cleanup and Isolation

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Inspected Surface

- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `.github/workflows/crashout-insforge-smoke.yml`
- `projects/crashout/DEPLOY.md`
- `docs/ceo/cycle99-smoke-cleanup-decision.md`
- `docs/cto/cycle92-history-smoke-architecture.md`
- `docs/cto/cycle93-balance-smoke-architecture.md`
- `docs/cto/cycle94-leaderboard-smoke-architecture.md`
- `docs/devops/cycle92-history-smoke-runbook.md`
- `docs/devops/cycle93-balance-smoke-runbook.md`
- `docs/devops/cycle94-leaderboard-smoke-runbook.md`
- `projects/crashout/backend/migrations/20260611130000_rounds.sql`
- `projects/crashout/backend/migrations/20260612100000_players.sql`
- `projects/crashout/backend/migrations/20260612110000_matches.sql`

## Constraint

The current smoke is valuable because it proves the customer-facing public contract:

```text
/rounds start -> persisted commit rows -> /rounds reveal
/history record -> persisted match rows -> /history list
/balance get/apply/rebuy -> persisted player balance
/history seed -> /leaderboard aggregate
```

Do not replace this with privileged SQL readback. SQL readback can be a later audit layer, but it does not prove what the player depends on. The immediate problem is side effect control: the smoke writes durable synthetic rows into the shared INSFORGE backend.

Current side effects per successful run:

- `public.rounds`: two rows for the run-scoped `playerId` and `matchToken`.
- `public.matches`: two history rows for `playerId` plus five leaderboard seed rows for `leaderboardPlayerId`.
- `public.players`: one balance row for `playerId`, mutated through win/loss/draw/rebuy checks.

The script already uses unique `smoke-cycle94-<timestamp>-<uuid>` IDs and writes `summary.json`. That gives us enough identity to isolate or purge; it does not by itself stop leaderboard pollution.

## Decision

Use a long-lived smoke-only INSFORGE backend as the Cycle 99 architecture.

This is the smallest safe isolation move because the existing script and workflow already accept an `events_url` ending in `/events` and derive all sibling functions from it. No public cleanup endpoint, no production delete permission, and no smoke-runner fork is required.

```text
manual operator
  -> Crashout INSFORGE Smoke workflow
     input events_url = https://<smoke-project>.functions.insforge.app/events
       -> existing smoke script
          -> smoke-only /rounds, /history, /balance, /leaderboard
             -> smoke-only public.rounds / public.matches / public.players
```

Production INSFORGE remains available for rare release validation, but it should not be the default target for Cycle 99 smoke evidence.

Cycle 99 implementation adds the first control toward this architecture: the
runner refuses the known shared production URL unless the operator sets
`INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true`, and the manual workflow exposes the
same decision as `allow_shared_backend`. Isolated backend URLs can run without
that acknowledgement.

## Why Not Cleanup First

An automated purge against the shared backend is riskier than an isolated target. Deletes are one-way doors. A bad prefix, broad `LIKE`, missing run id, or wrong target URL can remove real player state. That violates the first rule here: reduce blast radius before adding more mechanism.

Run-scoped cleanup is acceptable only as a fallback or later operational hardening. If implemented, it should be privileged operator tooling, not a public edge-function action. The cleanup scope must be:

```sql
delete from public.rounds
where player_id = :playerId
   or match_token = :matchToken;

delete from public.matches
where player_id in (:playerId, :leaderboardPlayerId);

delete from public.players
where player_id = :playerId;
```

Do not use a bare `player_id like 'smoke-%'` cleanup as the primary path. That is acceptable for an explicit emergency purge with release-owner signoff, not for routine automation.

## Required Architecture

Create or reserve one non-production INSFORGE project for smoke evidence. It should mirror the production public function contracts, not production data.

Minimum setup:

- Apply the same `rounds`, `players`, `matches`, and leaderboard index migrations.
- Deploy the same `events`, `rounds`, `history`, `balance`, and `leaderboard` functions.
- Record its `/events` URL as the default smoke target in release runbooks or as a GitHub environment variable.
- Keep `.github/workflows/crashout-insforge-smoke.yml` manual.
- Keep `concurrency.cancel-in-progress: false` so one operator run does not erase another run's evidence.
- Keep the generated evidence under ignored `docs/qa/insforge-persistence-smoke/` and uploaded as `insforge-persistence-smoke`.

The workflow already has the right abstraction:

```yaml
workflow_dispatch:
  inputs:
    events_url:
      description: "INSFORGE events endpoint ending in /events"
```

Cycle 99 should use that input instead of adding another runner.

## Failure Modes

| Failure mode | Impact | Control |
| --- | --- | --- |
| Operator runs the smoke against production by accepting the old default URL | Synthetic rows keep polluting customer-visible aggregates | Change docs/default operator habit to smoke-only URL; require explicit production override |
| Smoke backend drifts from production migrations or functions | Passing smoke proves the wrong contract | Deploy smoke backend from the same source artifacts as production; include backend SHA in run notes |
| Cleanup SQL targets the wrong project | Data loss | Prefer isolation; if cleanup exists, print project URL and run ids before execution |
| Synthetic leaderboard rows dominate smoke-only board | Harmless noise in non-production | Periodic broad purge is acceptable only in smoke backend |
| Production-only config differs from smoke backend | A smoke pass misses a production env issue | Keep one rare production smoke before major backend releases, followed by explicit run-scoped purge or signed acceptance of residue |

## Operational Cost

The isolation path costs one additional INSFORGE project and the discipline to deploy the same backend functions there. That is cheaper than putting delete authority into a public or CI path.

Expected complexity:

- Setup: medium, one-time backend clone and function deploy.
- Daily operation: low, same manual workflow with a different `events_url`.
- Maintenance: low, update smoke backend whenever production backend functions or migrations change.
- Blast radius: low, smoke rows cannot affect production leaderboard trust.

## Recommended Cycle 99 Implementation Plan

1. Provision or identify a smoke-only INSFORGE project.
2. Apply current backend migrations and deploy the current public functions.
3. Update DevOps docs and workflow inputs so the manual INSFORGE smoke either targets the smoke-only `/events` URL or explicitly acknowledges shared-backend writes.
4. Keep production smoke execution manual and exceptional.
5. Add a later operator-only purge command for production run ids if production smoke remains necessary.

Do not add more smoke coverage until this isolation exists. The current coverage is enough; the architecture problem is side effect containment.

## Success Criteria

- A manual INSFORGE smoke proves rounds, history, balance, and leaderboard persistence without writing to production tables.
- `summary.json` still records `eventsUrl`, sibling URLs, `runId`, `playerId`, `leaderboardPlayerId`, and all step results.
- Production leaderboard state no longer changes during routine smoke evidence collection.
- Any production-targeted smoke run is visibly exceptional and has a written cleanup or residue decision.
