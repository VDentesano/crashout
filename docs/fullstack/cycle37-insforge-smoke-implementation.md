# Cycle 37 Full-stack Note — INSFORGE Smoke Implementation

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Changed Files

- `.github/workflows/crashout-insforge-smoke.yml`
- `.gitignore`
- `projects/crashout/DEPLOY.md`
- `projects/crashout/package.json`
- `projects/crashout/scripts/insforge-persistence-smoke.mjs`

## Implementation

Added `pnpm run smoke:insforge`, a dependency-free Node smoke script that:

1. Uses `INSFORGE_EVENTS_URL`, `VITE_INSFORGE_EVENTS_URL`, an optional CLI arg, or the live default endpoint.
2. Derives `/rounds` from `/events`.
3. Creates a synthetic `smoke-*` player and UUID match token.
4. Calls `rounds start` for two committed rounds.
5. Asserts no `serverSeed` leaks in the commit response.
6. Calls `rounds reveal`.
7. Verifies token, nonce, client seed, crash point, and SHA-256 seed hash consistency.
8. Writes local JSON evidence under `docs/qa/insforge-persistence-smoke/`.

The manual GitHub workflow runs the same script and uploads the evidence directory.

## Scope Control

No new dependencies. No balance, history, or leaderboard writes. No automatic PR trigger for backend writes.
