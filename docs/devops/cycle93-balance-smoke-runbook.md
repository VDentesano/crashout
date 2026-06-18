# Cycle 93 DevOps Runbook: INSFORGE Balance Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Infrastructure State

- Backend host: INSFORGE project `crashout`, public function root `https://2zzc6u78.functions.insforge.app`.
- Existing manual smoke command: `pnpm run smoke:insforge` from `projects/crashout`.
- Existing workflow: `.github/workflows/crashout-insforge-smoke.yml`, manual `workflow_dispatch`.
- Existing evidence artifact: `insforge-persistence-smoke`, uploaded from `docs/qa/insforge-persistence-smoke/`.
- Current smoke coverage before the Cycle 93 extension: `/rounds` commit/reveal and `/history` record/list persistence.
- Cycle 93 target coverage: add `/balance` reconciliation checks to the same smoke runner and artifact.

Keep this smoke manual until the backend has either disposable test branches or cleanup automation for synthetic rows.

## Local Verification Commands

Run from the worktree root:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
pnpm run smoke:insforge
pnpm run check
```

To target another INSFORGE app, keep the URL ending in `/events`; the script derives sibling function URLs:

```bash
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events pnpm run smoke:insforge
pnpm run smoke:insforge https://<project>.functions.insforge.app/events
```

Expected Cycle 93 balance checks:

1. `POST /balance {action:"get", playerId}` returns HTTP `200` and `balance: 1000`.
2. `POST /balance {action:"rebuy", playerId}` returns HTTP `400` while the synthetic player still has sufficient balance.
3. `POST /balance {action:"apply", playerId, bet:100, outcome:"win"}` returns HTTP `200`, `delta: 100`, `balance: 1100`.
4. A follow-up `get` returns persisted `balance: 1100`.
5. `POST /balance {action:"apply", playerId, bet:500, outcome:"loss"}` returns HTTP `200`, `delta: -500`, `balance: 600`.
6. A follow-up `get` returns persisted `balance: 600`.
7. `POST /balance {action:"apply", playerId, bet:250, outcome:"draw"}` returns HTTP `200`, `delta: 0`, `balance: 600`.
8. A follow-up `get` returns persisted `balance: 600`.
9. Two more loss applies move the player to `100` and then clamp at `0`.
10. `POST /balance {action:"rebuy", playerId}` returns HTTP `200` and `balance: 1000`.
11. A final `get` returns persisted `balance: 1000`.

Local evidence should land here:

```text
docs/qa/insforge-persistence-smoke/summary.json
```

The summary should include `eventsUrl`, `roundsUrl`, `historyUrl`, `balanceUrl`, the unique `smoke-*` player id, all step statuses, and `status: "passed"` or `status: "failed"`.

## GitHub Actions Evidence Plan

Use the existing manual workflow instead of adding another YAML file:

```bash
gh workflow run crashout-insforge-smoke.yml \
  --ref <branch> \
  -f events_url=https://2zzc6u78.functions.insforge.app/events

gh run list --workflow crashout-insforge-smoke.yml --limit 5
gh run view <run-id> --log
```

Evidence to capture for the release note or PR:

- Workflow name: `Crashout INSFORGE Smoke`.
- Branch/SHA under test.
- Input `events_url`.
- Successful `Run INSFORGE persistence smoke` step.
- Downloadable artifact named `insforge-persistence-smoke`.
- `summary.json` with passing `/rounds`, `/history`, and `/balance` steps.

The workflow already pins Node `24`, pnpm `11.5.1`, `pnpm install --frozen-lockfile`, and uploads artifacts for 14 days. Keep `concurrency.cancel-in-progress: false` so overlapping manual smoke runs do not hide evidence from an earlier operator.

## Risks

- The smoke writes real synthetic data to the shared INSFORGE backend: one `smoke-*` player row, round rows, and history rows per run.
- There is no public delete action for cleanup today, so repeated CI use will accumulate synthetic data.
- The balance function is sequential read-modify-write. This smoke proves the normal single-client reconciliation path, not concurrent accounting correctness.
- A passing smoke does not prove the frontend localStorage cache is correct; it proves the server-authoritative function contract.
- Running against the wrong `events_url` can write evidence to the wrong backend because `/rounds`, `/history`, and `/balance` are derived from that URL.

## Rollback And Cleanup

No infrastructure rollback is required for a runbook-only change.

If the Cycle 93 smoke extension fails after code is added:

```bash
git revert <cycle93-smoke-extension-commit>
cd projects/crashout
pnpm run smoke:insforge
```

That returns the release gate to the previous `/rounds` plus `/history` coverage while keeping the existing manual workflow intact.

Cleanup is currently operational, not automated:

- Keep synthetic ids prefixed with `smoke-` so they can be identified later.
- Do not run the INSFORGE smoke on every PR against the shared backend.
- Add scheduled cleanup or a disposable INSFORGE backend before making this workflow automatic.

## Time And Cost

- Local syntax/lint checks: under 1 minute on a warm install.
- Live INSFORGE smoke: normally under 30 seconds after dependencies are installed.
- GitHub Actions run: roughly 1-2 minutes plus queue time.
- Resource cost: several edge function invocations and a few small database rows per run.
