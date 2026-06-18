# Cycle 99 QA Verification: INSFORGE Smoke Cleanup and Isolation

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Risk

The INSFORGE smoke is now a useful public-contract check, but it is also a production data writer. It creates synthetic round commits, match history rows, leaderboard-qualifying wins, and balance rows through the same functions players use.

The Cycle 99 quality risk is not missing coverage. The risk is that release evidence pollutes durable customer-visible state, especially leaderboard state, and makes operators distinguish real play from smoke artifacts by convention instead of by enforced cleanup or isolation.

## Current Smoke Coverage Inspected

Entrypoint:

```bash
projects/crashout/scripts/insforge-persistence-smoke.mjs
```

Command:

```bash
pnpm run smoke:insforge
```

The current runner derives sibling URLs from the configured `/events` endpoint:

- `/rounds`
- `/history`
- `/balance`
- `/leaderboard`

It writes evidence to `docs/qa/insforge-persistence-smoke/summary.json` by default, or to `SMOKE_OUT_DIR` when provided.

Checked behavior today:

- Rounds: `start` commits two rows, hides `serverSeed`, returns hashes/nonces/crash points, then `reveal` reads persisted rows and verifies each revealed seed hashes to the committed hash.
- History: records one win and one loss for a unique synthetic player, lists the rows, and verifies stats including total, wins, losses, win rate, net delta, and best cashout.
- Leaderboard: records five qualifying wins for a unique synthetic leaderboard player, verifies history stats, rejects invalid `limit: 51`, and verifies the synthetic player appears with exact values for `netDelta`, `bestCashout`, and `winRate`.
- Balance: creates a synthetic player balance, rejects premature rebuy, applies win/loss/draw/loss transitions, clamps at zero, rebuys, and verifies persisted readback after state changes.
- Evidence: records `runId`, `playerId`, `leaderboardPlayerId`, endpoint URLs, timestamps, and all request step labels/statuses/bodies.

Cycle 99 changes observed:

- New smoke IDs use `cycle99` in `runId` instead of the old `cycle94` label.
- The smoke refuses the checked-in shared backend unless `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND` is truthy.
- The manual GitHub workflow exposes `allow_shared_backend` and passes it to the smoke runner.

This is an isolation guard, not row cleanup. It prevents accidental shared-backend writes and makes intentional shared-backend evidence explicit.

## Cleanup Or Isolation Acceptance Criteria

Accept the Cycle 99 cleanup/isolation improvement only when one manual smoke run can prove the same public contracts without leaving durable customer-visible synthetic state behind.

Minimum criteria:

- The smoke still uses unique run-scoped identities with `smoke-*` prefixes and a Cycle 99 run label.
- No fixed test identity, shared `qa` identity, or broad wildcard cleanup is introduced.
- Cleanup, if implemented, is scoped to the current run's exact synthetic identifiers: `playerId`, `leaderboardPlayerId`, and `matchToken` or their persisted row equivalents.
- Isolation, if implemented, runs against a disposable/non-production INSFORGE backend and the summary artifact clearly identifies that backend endpoint.
- Shared-backend execution is blocked by default before any request steps run.
- Shared-backend execution requires explicit `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true` locally or `allow_shared_backend=true` in GitHub Actions.
- The existing rounds, history, leaderboard, and balance assertions continue to pass before cleanup is judged successful.
- Cleanup success is verified by readback, not only by a successful delete response.
- Cleanup cannot touch real player rows, even if a real player id contains the word `smoke` outside the expected generated prefix and run id shape.
- The summary artifact preserves enough evidence to audit both the public-contract checks and the cleanup/isolation result.

## Verification Steps

Run static checks from `projects/crashout`:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
```

Run the smoke with an explicit artifact directory:

```bash
SMOKE_OUT_DIR=/tmp/crashout-cycle99-smoke-cleanup pnpm run smoke:insforge
```

For the checked-in shared backend, this command should fail by default before any backend write. Inspect the artifact and require:

- `status` is `failed`.
- `sharedBackend` is `true`.
- `sharedBackendAcknowledged` is `false`.
- `steps.length` is `0`.
- The error message explains how to use an isolated endpoint or acknowledge the shared backend.

For a disposable backend isolation path, prefer:

```bash
INSFORGE_EVENTS_URL=https://<disposable-project>.functions.insforge.app/events \
SMOKE_OUT_DIR=/tmp/crashout-cycle99-smoke-cleanup \
pnpm run smoke:insforge
```

Inspect the artifact:

```bash
node -e "const s=require('/tmp/crashout-cycle99-smoke-cleanup/summary.json'); console.log({status:s.status, runId:s.runId, playerId:s.playerId, leaderboardPlayerId:s.leaderboardPlayerId, eventsUrl:s.eventsUrl, steps:s.steps.length})"
```

Required artifact checks:

- `status` is `passed`.
- `runId` starts with `cycle99-`.
- `playerId` starts with `smoke-cycle99-`.
- `leaderboardPlayerId` starts with `smoke-leaderboard-cycle99-`.
- `eventsUrl`, `roundsUrl`, `historyUrl`, `balanceUrl`, and `leaderboardUrl` are present.
- `sharedBackend` is `false` for routine isolated evidence, or `sharedBackendAcknowledged` is `true` for an intentional shared-backend run.
- Existing step labels for rounds, history, leaderboard, and balance are present with expected success or expected rejection statuses.
- If cleanup is implemented in the smoke runner, cleanup step labels and parsed response bodies are present.
- If isolation is used instead of cleanup, the endpoint is the approved disposable backend, not the shared production backend.

## Readback Checks After Cleanup

If cleanup is implemented as deletes against the same backend, verify absence through public contracts or a narrowly approved operator readback:

- `history list` for the Cycle 99 `playerId` returns zero smoke-created matches, or an equivalent absence result.
- `history list` for `leaderboardPlayerId` returns zero smoke-created leaderboard seed matches.
- `leaderboard list` for `netDelta`, `bestCashout`, and `winRate` no longer includes `leaderboardPlayerId`.
- `balance get` does not recreate evidence accidentally during cleanup verification unless that is explicitly understood and documented.
- Round cleanup, if supported, removes only rows tied to the current `matchToken`; if public readback cannot prove absence, use a narrow operator query and attach the query result to the release evidence.

Do not accept cleanup based only on logs such as "deleted smoke rows" without readback. That is checking the cleanup code's claim, not testing the resulting backend state.

## Failure Classification

- Blocker: cleanup can delete non-smoke player data, uses a broad prefix without run scoping, or targets the shared production backend unintentionally.
- Blocker: default shared-backend smoke writes any request step without explicit acknowledgement.
- Critical: smoke passes but synthetic leaderboard rows remain visible after a claimed cleanup.
- Major: artifact omits cleanup/isolation evidence, making release verification non-auditable.
- Major: cleanup succeeds but breaks any existing rounds/history/balance/leaderboard smoke assertion.
- Minor: Cycle 99 labels or artifact paths are inconsistent but the backend state is correctly isolated or cleaned.

## Release Signal

GO for Cycle 99 guard when static checks pass and a default shared-backend run fails before backend requests with `steps.length === 0`.

GO for routine backend evidence when the artifact proves both things in one run: the existing INSFORGE public-contract smoke still passes, and the synthetic state is either contained in an approved disposable backend or removed with run-scoped readback evidence.

NO-GO if the smoke must run against shared production and leaves leaderboard/history/balance synthetic data behind. In that case, keep `pnpm run smoke:insforge` manual and rare, and require release-owner signoff before each run.
