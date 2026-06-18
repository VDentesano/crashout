# Cycle 94 DevOps Runbook: INSFORGE Leaderboard Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Scope

This runbook covers the manual INSFORGE persistence smoke once Cycle 94 leaderboard coverage is present in `projects/crashout/scripts/insforge-persistence-smoke.mjs`.

Do not add this smoke to automatic PR CI against the shared backend yet. It writes synthetic `smoke-*` match rows to the live INSFORGE project and the leaderboard is customer-visible aggregate state.

## Infrastructure State

- Backend host: INSFORGE project `crashout`, public function root `https://2zzc6u78.functions.insforge.app`.
- Default smoke input: `https://2zzc6u78.functions.insforge.app/events`.
- Manual workflow: `.github/workflows/crashout-insforge-smoke.yml`.
- Workflow name: `Crashout INSFORGE Smoke`.
- Job: `INSFORGE persistence smoke`.
- Local command: `pnpm run smoke:insforge` from `projects/crashout`.
- Evidence directory: `docs/qa/insforge-persistence-smoke/`.
- Uploaded artifact: `insforge-persistence-smoke`, retained for 14 days.

The workflow accepts only an `events_url` input ending in `/events`. The smoke runner derives sibling public functions:

```text
/events
/rounds
/history
/balance
/leaderboard
```

At inspection time the checked-in workflow already supports Cycle 94 without YAML changes because it runs the shared `smoke:insforge` script and uploads the shared evidence directory.

## How To Run Locally

Run from the repo root:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
pnpm run smoke:insforge
```

To target another INSFORGE project, keep the URL ending in `/events`:

```bash
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events pnpm run smoke:insforge
pnpm run smoke:insforge https://<project>.functions.insforge.app/events
```

Use `SMOKE_OUT_DIR=/tmp/<dir>` only when you need scratch evidence outside the repo. Release evidence should remain either in the terminal output or in the GitHub Actions artifact.

## Expected Leaderboard Checks

The Cycle 94 leaderboard smoke should seed rows through the public `/history` contract, then read aggregation through the public `/leaderboard` contract. It should not use privileged SQL or CLI readback.

Expected synthetic history inputs are the existing two rows for the run-specific `smoke-*` player:

- win: `bet: 100`, `delta: 100`, `cashoutMultiplier: 2.12`
- loss: `bet: 50`, `delta: -50`, `cashoutMultiplier: null`

Expected leaderboard assertions:

1. `POST /leaderboard {action:"list", metric:"netDelta", window:"all", limit:50}` returns HTTP `200`.
2. The synthetic player appears with `value: 50`, `matchesPlayed: 2`, and a positive integer `rank`.
3. `POST /leaderboard {action:"list", metric:"bestCashout", window:"all", limit:50}` returns HTTP `200`.
4. The synthetic player appears with `value: 2.12` and `matchesPlayed: 2`.
5. `POST /leaderboard {action:"list", metric:"winRate", window:"all", limit:50}` returns HTTP `200`.
6. The synthetic player is absent from win-rate results because the backend requires at least 5 matches.
7. Invalid public-contract requests return HTTP `400`: `metric:"totalWins"`, `window:"30d"`, and `limit:0`.

Do not assert global rank number, first row identity, array length, or absence of unrelated players. The board is global state and can contain valid non-smoke players.

## Artifact Expectations

Local and CI evidence should include:

```text
docs/qa/insforge-persistence-smoke/summary.json
```

For Cycle 94, `summary.json` should contain:

- `status: "passed"` or `status: "failed"`.
- `startedAt`, `finishedAt`, `runId`, `playerId`, and `matchToken`.
- `eventsUrl`, `roundsUrl`, `historyUrl`, `balanceUrl`, and `leaderboardUrl`.
- A `steps` array containing the existing `/rounds`, `/history`, and `/balance` checks plus the Cycle 94 `/leaderboard` checks.
- Failure detail under `error` when the script exits non-zero.

The successful terminal line should report all INSFORGE persistence checks passing and print the relative evidence path. In GitHub Actions, the `Upload INSFORGE smoke evidence` step should upload the same directory as artifact `insforge-persistence-smoke`.

If `leaderboardUrl` or leaderboard step labels are missing from `summary.json`, do not count the run as Cycle 94 evidence even if the workflow itself is green.

## GitHub Actions Run

Trigger the existing manual workflow:

```bash
gh workflow run crashout-insforge-smoke.yml \
  --ref <branch> \
  -f events_url=https://2zzc6u78.functions.insforge.app/events

gh run list --workflow crashout-insforge-smoke.yml --limit 5
gh run view <run-id> --log
```

Evidence to record in release notes or PR comments:

- Workflow name: `Crashout INSFORGE Smoke`.
- Branch and SHA under test.
- Input `events_url`.
- Successful `Run INSFORGE persistence smoke` step.
- Downloadable artifact named `insforge-persistence-smoke`.
- `summary.json` showing `/leaderboard` public-contract checks alongside `/rounds`, `/history`, and `/balance`.

The workflow uses Node `24`, pnpm `11.5.1`, `pnpm install --frozen-lockfile`, and `concurrency.cancel-in-progress: false`. Keep that concurrency setting so a later manual smoke does not cancel and hide evidence from an earlier operator.

## CI And Manual Workflow Implications

Keep this workflow manual for now. It has side effects:

- `/history` writes synthetic match rows.
- `/balance` writes or mutates the synthetic player balance.
- `/leaderboard` reads global match aggregation and can expose accumulated synthetic rows.

The protected PR gate remains `Crashout CI` with `pnpm run check`. The manual INSFORGE smoke is release evidence for backend persistence paths, not a required branch-protection check.

Make the smoke automatic only after one of these exists:

- a disposable INSFORGE backend per CI run,
- scheduled cleanup for `smoke-*`, `qa-*`, and `test-*` rows,
- or a dedicated non-production backend URL wired into repository or environment secrets.

## Risks

- Synthetic rows are durable and customer-visible through aggregate leaderboard state.
- The smoke proves the public leaderboard contract, not privileged table-level correctness.
- The `7d` window exclusion path is not proven because the public API cannot create old rows.
- The win-rate positive path is not proven unless the smoke writes at least five rows for a synthetic player.
- In-function leaderboard aggregation can become slow at high match volume; Cycle 22 identified SQL aggregation or a materialized summary as the scale path.
- Running with the wrong `events_url` writes to and reads from the wrong INSFORGE project because sibling endpoints are derived from that URL.
- A passing smoke does not prove frontend rendering in `LeaderboardPanel`; it proves the server response shape consumed by the frontend.

## Rollback And Cleanup

No infrastructure rollback is required for this runbook-only change.

If a Cycle 94 leaderboard smoke extension fails after product code is added, revert only that smoke-runner extension and keep the existing manual workflow:

```bash
git revert <cycle94-leaderboard-smoke-commit>
cd projects/crashout
pnpm run smoke:insforge
```

That returns the manual smoke to the previous `/rounds`, `/history`, and `/balance` coverage.

Cleanup is currently operational:

- Keep every synthetic player id prefixed with `smoke-`.
- Do not run the INSFORGE smoke repeatedly as a general CI check.
- If leaderboard trust is affected by accumulated smoke rows, purge synthetic `smoke-*`, `qa-*`, and `test-*` rows through the INSFORGE operational console or an approved one-shot cleanup path.

## Time And Cost

- Local syntax and lint checks: normally under 1 minute after dependencies exist.
- Live INSFORGE smoke: normally under 30 seconds after install.
- GitHub Actions manual run: roughly 1-2 minutes plus queue time.
- Resource cost: a small number of edge-function invocations and a few durable database rows per run.
