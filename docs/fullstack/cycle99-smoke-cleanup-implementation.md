# Cycle 99 Full-stack Implementation: INSFORGE Smoke Shared-Backend Guard

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Scope

Touched files:

- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `docs/fullstack/cycle99-smoke-cleanup-implementation.md`
- `.github/workflows/crashout-insforge-smoke.yml`
- `projects/crashout/DEPLOY.md`

I inspected the INSFORGE smoke runner, the `smoke:insforge` package script, the manual INSFORGE smoke workflow, and the deploy/runbook notes. The package script and workflow already keep this as a manual smoke against the configured `/events` endpoint, and the deploy path is unrelated to this live backend persistence check.

## Change

The smoke runner no longer embeds the old `cycle94` label directly in the `runId` template. It now uses one local `smokeCycle` constant set to `cycle99`:

```js
const smokeCycle = 'cycle99';
const runId = `${smokeCycle}-${Date.now()}-${randomUUID().slice(0, 8)}`;
```

It also refuses to run against the checked-in shared CRASHOUT backend unless the operator explicitly acknowledges the durable synthetic writes:

```js
const allowSharedBackend = ['1', 'true', 'yes'].includes(
  String(process.env.INSFORGE_SMOKE_ALLOW_SHARED_BACKEND ?? '').toLowerCase(),
);
```

If the target is the default shared `/events` URL and `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND` is not truthy, the script exits before any backend request. The failure artifact includes `sharedBackend`, `sharedBackendAcknowledged`, endpoint URLs, run IDs, and `steps: []`, making the no-write refusal auditable.

The manual GitHub workflow now exposes `allow_shared_backend` and passes it as `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND`. `DEPLOY.md` documents the same local override and recommends an isolated INSFORGE backend URL for routine evidence.

## Verification

Run from `projects/crashout`:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
pnpm run smoke:insforge
pnpm run check
```

`pnpm run smoke:insforge` is expected to fail against the default shared backend unless acknowledged. The verified failure happened before any request: `summary.json` had `steps: []` and `sharedBackendAcknowledged: false`.

I did not run the acknowledged live smoke because it would write synthetic production rows. Use either an isolated `INSFORGE_EVENTS_URL` or `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true` for an intentional shared-backend run.
