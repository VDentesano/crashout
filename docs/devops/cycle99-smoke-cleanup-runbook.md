# Cycle 99 DevOps Runbook: INSFORGE Smoke Cleanup And Isolation

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Scope

This runbook reviews the current INSFORGE persistence smoke for cleanup and
isolation risk. It covers:

- `.github/workflows/crashout-insforge-smoke.yml`
- `projects/crashout/DEPLOY.md`
- `projects/crashout/scripts/insforge-persistence-smoke.mjs`

Do not make the INSFORGE persistence smoke an automatic PR or `main` CI gate
against the shared backend until smoke data is either isolated from production
or deleted through an approved, run-scoped cleanup path.

## Current State

- Workflow: `Crashout INSFORGE Smoke`
- Trigger: manual `workflow_dispatch`
- Input: `events_url`, defaulting to
  `https://2zzc6u78.functions.insforge.app/events`
- Input: `allow_shared_backend`, defaulting to `false`
- Job working directory: `projects/crashout`
- Runtime: Node `24`, pnpm `11.5.1`
- Command: `pnpm run smoke:insforge`
- Evidence upload: `docs/qa/insforge-persistence-smoke/`
- Artifact: `insforge-persistence-smoke`, retained for 14 days
- Concurrency group: `crashout-insforge-smoke`
- `cancel-in-progress`: `false`

The smoke script derives sibling endpoints from the configured `/events` URL:

```text
/events
/rounds
/history
/balance
/leaderboard
```

The script uses unique run-scoped synthetic ids:

```text
runId: cycle99-<timestamp>-<uuid8>
playerId: smoke-<runId>
leaderboardPlayerId: smoke-leaderboard-<runId>
```

That identity shape prevents cross-run assertion collisions, but it does not
clean up rows after the run.

## Recommendation

The workflow should stay manual, and shared-backend writes should require an
explicit operator acknowledgement.

The current workflow is correctly conservative for the current backend:

- It is manual, not attached to PR or push triggers.
- It serializes runs with one fixed concurrency group.
- It keeps `cancel-in-progress: false`, preserving evidence from an earlier
  operator run instead of hiding it behind a later dispatch.
- It accepts an alternate `events_url`, which is enough to target a future
  staging or disposable INSFORGE backend without changing YAML.
- It now exposes `allow_shared_backend`; when false, the smoke runner refuses
  the checked-in shared backend before making any backend requests.

Do not add cleanup logic to the GitHub workflow until the backend exposes a
safe cleanup mechanism. YAML-level cleanup without a narrow backend contract
would either be impossible or would encourage broad production deletes.

## Cleanup And Isolation Risk

The smoke currently writes durable synthetic state to the target backend:

- `/rounds` creates committed round rows for a unique `smoke-*` player.
- `/history` creates match rows for `smoke-*` and
  `smoke-leaderboard-*` players.
- `/balance` creates or mutates the synthetic player balance row.
- `/leaderboard` reads global aggregation that can include accumulated
  synthetic match rows.

The leaderboard section intentionally writes five high-value wins for
`smoke-leaderboard-*` so that the synthetic player qualifies for `winRate` and
appears in `netDelta`, `bestCashout`, and `winRate` checks. This proves the
customer-visible contract, but it also creates customer-visible data pollution
when run against the shared production backend.

The current smoke is isolated by identity, not by environment or lifecycle.
That is enough for occasional manual release evidence. It is not enough for
automatic CI.

## Required Before Automatic CI

Choose one of these before adding `pull_request`, `push`, scheduled, or required
branch-protection usage for `crashout-insforge-smoke.yml`.

### Preferred: Dedicated Non-Production Backend

Create a staging or disposable INSFORGE project and run the smoke only there.

Operational shape:

1. Store the staging `/events` URL in a GitHub environment variable or secret.
2. Keep the workflow manual first, but default the workflow input or command to
   the staging URL.
3. After several clean runs, consider adding a scheduled or PR-adjacent smoke
   against staging only.
4. Keep production smoke manual and rare for final release evidence.

This is the lowest-risk path because production data never needs to be deleted.

### Acceptable: Run-Scoped Cleanup Contract

Add an explicit backend cleanup action that deletes only rows for the exact
current run ids.

Minimum guardrails:

- Cleanup must require an exact `runId` or exact synthetic `playerId` list.
- Cleanup must reject broad prefixes such as only `smoke-`.
- Cleanup must only delete rows created by that run:
  `smoke-<runId>` and `smoke-leaderboard-<runId>`.
- Cleanup must cover every table touched by `/rounds`, `/history`, and
  `/balance`.
- Cleanup must write evidence showing which ids were deleted and how many rows
  were affected.
- Cleanup must run in an `always`/`finally` path after smoke execution, while
  preserving the original smoke failure.

Only after that backend contract exists should the workflow grow a cleanup step.

### Fallback: Manual Production Purge

If leaderboard trust is affected before staging or automated cleanup exists,
perform a one-time manual purge through an approved INSFORGE operational path.

Rules:

- Require release-owner signoff.
- Take a backup or export first when the platform supports it.
- Delete only synthetic identities with known safe prefixes and reviewed
  filters.
- Record the command, affected row counts, timestamp, and operator in
  `docs/devops/`.

This is an emergency operating procedure, not a CI design.

## Workflow Change Guidance

Cycle 99 changed `.github/workflows/crashout-insforge-smoke.yml` only to add
the manual `allow_shared_backend` acknowledgement input. Do not add automatic
CI triggers.

Future workflow changes are appropriate only after isolation or cleanup exists:

- Add an environment-scoped `INSFORGE_EVENTS_URL` for staging.
- Add a smoke job that targets staging by default.
- Keep production dispatch manual, with an explicit production URL input.
- Add a cleanup step only if the smoke script or backend exposes a safe
  run-scoped cleanup command.
- Keep evidence upload on `!cancelled()` or equivalent so failed smokes still
  publish `summary.json`.
- Keep `cancel-in-progress: false` for manual production evidence.

Avoid these workflow changes:

- Do not add `pull_request` or `push` triggers against the shared production
  backend.
- Do not make this smoke a required branch-protection check while it writes to
  production.
- Do not add broad SQL, CLI, or API deletes in workflow YAML.
- Do not reuse fixed test players, because that would create cross-run races and
  ambiguous evidence.

## Operator Procedure Today

Run production persistence smoke only when backend persistence, balance, or
leaderboard behavior changed and release evidence is needed.

Local run:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
pnpm run smoke:insforge
```

The default shared-backend local run should fail before backend writes unless
acknowledged. For an intentional shared-backend production evidence run:

```bash
INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true pnpm run smoke:insforge
```

For routine evidence, prefer an isolated backend:

```bash
INSFORGE_EVENTS_URL=https://<smoke-project>.functions.insforge.app/events pnpm run smoke:insforge
```

Manual GitHub Actions run:

```bash
gh workflow run crashout-insforge-smoke.yml \
  --ref <branch> \
  -f events_url=https://2zzc6u78.functions.insforge.app/events \
  -f allow_shared_backend=true

gh run list --workflow crashout-insforge-smoke.yml --limit 5
gh run view <run-id> --log
```

Evidence to preserve:

- Branch and SHA under test.
- Exact `events_url`.
- Exact `allow_shared_backend` value.
- Artifact `insforge-persistence-smoke`.
- `summary.json` with `status`, `runId`, `playerId`,
  `leaderboardPlayerId`, endpoint URLs, `sharedBackend`,
  `sharedBackendAcknowledged`, and request `steps`.

If the smoke fails, do not immediately rerun in a loop against production.
Inspect `summary.json`, determine whether the failure is product, backend,
environment, or test-data related, then rerun once after a concrete fix or
operator decision.

## Success Criteria

Cycle 99 is complete from DevOps/SRE when:

- The current smoke remains manual against production.
- The team has an explicit recommendation not to wire it into automatic CI yet.
- The checked-in shared backend cannot be written by accident; it requires
  explicit `allow_shared_backend=true` or
  `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true`.
- The next implementation path is clear: staging/disposable backend first, or a
  narrow run-scoped cleanup contract before workflow automation.
- Production leaderboard pollution stops compounding through repeated automatic
  smoke runs.

## Rollback

Rollback the Cycle 99 workflow/script guard by removing the
`allow_shared_backend` input and the `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND`
environment variable only if the team accepts accidental shared-backend writes
again. The safer rollback is to keep the guard and pass the acknowledgement for
intentional production evidence.

If a later cleanup implementation causes trouble, remove the workflow cleanup
step first and return to the current manual workflow behavior. Restoring manual
production smoke is safer than leaving an unsafe cleanup path active.
