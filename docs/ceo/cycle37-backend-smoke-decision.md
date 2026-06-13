# Cycle 37 CEO Decision — INSFORGE Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Customer Problem

CRASHOUT now has frontend release evidence and production URL smoke, but a user-facing promise still depends on backend persistence: server-authoritative committed rounds must survive a write/read cycle. If that path fails silently, the FAIR claim degrades to trust-me backend theater.

## Decision

Merge PR #8 first, then ship the smallest backend persistence smoke. The selected slice is INSFORGE `rounds` commit/reveal:

- It writes synthetic committed rounds for a `smoke-*` player.
- It reads them back through the public reveal contract.
- It verifies hidden seeds at commit time and matching SHA-256 hashes after reveal.

This is higher-value than more discussion and lower blast radius than touching balances, history, or leaderboard rows.

## Risks

- It appends synthetic rows to the `rounds` table. That is acceptable because they are isolated by a `smoke-*` player id and do not affect visible product state.
- Running it on every PR would create backend noise. Keep it manual unless a disposable backend branch exists.

## Next Step

Make the smoke runnable locally and as a manual GitHub Action, then verify it against the live INSFORGE endpoint once.
