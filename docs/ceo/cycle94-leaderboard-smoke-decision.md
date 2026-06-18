# Cycle 94 CEO Decision: Ship Leaderboard Aggregation Smoke

## Customer Problem

The customer is a CRASHOUT player deciding whether the game rewards real performance in a way other players can see. Rounds persistence proves fairness mechanics. History persistence proves completed matches can be remembered. Balance reconciliation proves account-like state can survive a backend write/read cycle.

The next customer-visible trust question is whether those persisted outcomes can compound into a credible ranking surface. A leaderboard is not just a data view; it is the start of competition, status, repeat play, and shareable progress.

## Decision

Choose leaderboard aggregation smoke for Cycle 94 over direct event SQL/CLI readback.

This should extend the manual INSFORGE persistence smoke through the public leaderboard contract. The smoke should create isolated synthetic player activity, read the resulting leaderboard, and fail unless the synthetic rankings and aggregate values are deterministic.

## Why Leaderboard Before Direct Event Readback

Leaderboard aggregation is closer to customer value. Players do not care whether an operator can inspect raw event rows through a privileged SQL or CLI path. They care whether the product can turn completed play into visible standing.

This choice also strengthens the flywheel: trusted matches create durable history and balances; durable outcomes create rankings; rankings create competition; competition creates more matches. Direct event readback is useful operational evidence, but it does not move that player-facing loop by itself.

SQL/CLI event readback also couples the release gate to INSFORGE internals. That is a reasonable later audit if we need table-level assurance, but it is the wrong next default after three public-contract persistence smokes. Keep the gate oriented around the same surface the app and future customers depend on.

## Risks

- Leaderboard data can become misleading if synthetic rows are not isolated. Use unique `smoke-*` player ids and deterministic match inputs.
- Aggregation bugs may hide behind broad assertions. The smoke must verify exact ordering and exact aggregate fields, not just that `/leaderboard` returns HTTP 200.
- The smoke still writes to a shared backend. Keep it manual until cleanup support or disposable backend branches exist.
- Direct event readback remains a gap for backend-table observability. Accept that gap for this cycle because the higher-value customer contract is leaderboard correctness.

## Rejected Option

Direct event SQL/CLI readback is deferred, not discarded. It should be reconsidered after leaderboard aggregation passes, especially if the team needs to audit event ingestion independent of public edge functions. For Cycle 94, it is lower priority because it proves an operator pathway rather than a customer promise.

## Next Action

Inspect the current `/leaderboard` contract and extend `projects/crashout/scripts/insforge-persistence-smoke.mjs` so one manual run creates deterministic `smoke-cycle94-*` activity, reads `/leaderboard`, asserts the expected synthetic player ordering and aggregate values, and records the result in the existing INSFORGE smoke artifact.
