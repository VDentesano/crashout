# Cycle 99 CEO Decision: Prioritize Smoke Cleanup and Isolation

## Customer and Problem

The customer is a CRASHOUT player deciding whether persisted game state is trustworthy. Main already proves the right customer-facing contracts through INSFORGE smokes: rounds can be committed and revealed, match history can be read back, balances reconcile, and leaderboard aggregation reflects persisted outcomes.

The new problem is not missing proof. It is that the proof mechanism now leaves durable synthetic production rows. That can pollute leaderboard state, complicate operator interpretation, and weaken trust in the very surfaces the smoke is meant to protect.

## Decision

Prioritize cleanup/isolation now for Cycle 99.

Do not make direct SQL readback the next product priority yet. Direct SQL readback is useful operational evidence, but it proves an operator pathway, not a customer promise. The higher-value move is to preserve the public-contract smoke while removing or containing its production side effects.

Recommended priority order:

1. Add an approved cleanup or isolation path for INSFORGE smoke data.
2. Keep the existing rounds/history/balance/leaderboard smoke manual until that path exists.
3. Add direct SQL readback later as an audit layer after smoke data can be safely isolated or purged.

## Why This Is the Right Trade

The flywheel depends on trusted visible outcomes: play creates history, history updates balance, balance and wins produce ranking, ranking creates repeat play. Accumulated synthetic rows slow that flywheel because they make global ranking less credible and create ambiguity between real customer behavior and release evidence.

Cleanup/isolation is also the better Day 1 decision. It is a reversible operational improvement with immediate risk reduction. By contrast, adding direct SQL readback before cleanup would increase confidence in internals while leaving the customer-visible data-pollution problem in place.

## Scope Guidance

The next implementation should choose the smallest shippable control that stops production pollution from compounding:

- Best option: run the smoke against a disposable or non-production INSFORGE backend.
- Acceptable option: add an explicit cleanup path that deletes only run-scoped `smoke-*` rows written by the current smoke.
- Fallback option: keep production writes manual and rare, but add a documented purge procedure with release-owner signoff.

Avoid broad production deletes, fixed test identities, or any cleanup that can touch real player rows. The smoke must continue using unique run-scoped IDs.

## Risks and One-Way Doors

- Real player data deletion is a one-way-door risk. Cleanup must be prefix- and run-scoped, with narrow filters.
- Making the smoke automatic before isolation exists would compound production pollution.
- Direct SQL readback can couple release evidence to backend internals and should not replace public-contract assertions.
- Leaving the current state unchanged makes every smoke run slightly more expensive to reason about and potentially more visible to players.

## Next Action

Write a short implementation plan for one of two paths: disposable backend smoke environment or run-scoped cleanup for `smoke-*` rows. Ship that before adding new smoke coverage or direct SQL readback.

Success criteria: one manual INSFORGE smoke can prove rounds, history, balance, and leaderboard persistence without leaving durable customer-visible synthetic state behind.
