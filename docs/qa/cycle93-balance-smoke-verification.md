# Cycle 93 QA Verification Plan: Balance Reconciliation Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Risk

Balance is account-like state. The existing INSFORGE smoke already checks committed rounds and match history, but the current `scripts/insforge-persistence-smoke.mjs` does not yet call the deployed `/balance` function. That leaves a release risk where matches can be remembered while the server-authoritative play-money balance silently drifts, fails to persist, or allows an invalid rebuy.

## Inspected Surface

- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `projects/crashout/backend/functions/balance/balance.bundled.ts`
- `projects/crashout/package.json`
- `docs/cto/cycle93-balance-smoke-architecture.md`
- `docs/ceo/cycle93-balance-smoke-decision.md`

## Acceptance Criteria

The Cycle 93 balance smoke is acceptable only if the existing manual `pnpm run smoke:insforge` path also verifies `/balance` through the same public edge-function contract used by the app.

- The smoke derives `balanceUrl` from the configured `/events` URL using the same sibling URL pattern as `/rounds` and `/history`.
- The summary artifact includes `balanceUrl`, the synthetic `playerId`, the `runId`, timestamps, all request step labels, HTTP statuses, and parsed response bodies.
- The smoke uses a unique `smoke-cycle93-*` player id or an equivalent unique `smoke-*` id for every run.
- `POST /balance` with `{ "action": "get", "playerId": "<smoke-player>" }` returns HTTP 200 and `{ "balance": 1000 }` for the new synthetic player.
- `apply` with `bet: 100` and `outcome: "win"` returns HTTP 200, `delta: 100`, and `balance: 1100`.
- `rebuy` while the player has `1000` returns HTTP 400 with an error body, proving the sufficient-balance guard is active.
- `apply` with `bet: 100` and `outcome: "win"` is followed by a `get` that reads persisted `balance: 1100`.
- `apply` with `bet: 500` and `outcome: "loss"` returns HTTP 200, `delta: -500`, and is followed by a `get` that reads persisted `balance: 600`.
- `apply` with `bet: 250` and `outcome: "draw"` returns HTTP 200, `delta: 0`, and is followed by a `get` that keeps `balance: 600`.
- Two more loss applies move the balance to `100` and then clamp it at `0`.
- `rebuy` while the player has `0` returns HTTP 200 and `balance: 1000`.
- A final `get` returns HTTP 200 and `balance: 1000`, proving persisted readback rather than only response arithmetic.
- Existing rounds and history checks still pass in the same smoke run.
- A failed assertion writes `summary.json` with `status: "failed"` and error detail before the process exits non-zero.

## Expected Artifact Contents

Default artifact path:

```text
docs/qa/insforge-persistence-smoke/summary.json
```

The JSON should contain at least:

```json
{
  "status": "passed",
  "startedAt": "ISO-8601 timestamp",
  "finishedAt": "ISO-8601 timestamp",
  "runId": "cycle93-...",
  "playerId": "smoke-cycle93-...",
  "matchToken": "uuid",
  "eventsUrl": "https://.../events",
  "roundsUrl": "https://.../rounds",
  "historyUrl": "https://.../history",
  "balanceUrl": "https://.../balance",
  "steps": [
    {
      "label": "balance get creates persisted player row",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 1000 }
    },
    {
      "label": "balance rebuy rejects sufficient bankroll",
      "url": "https://.../balance",
      "status": 400,
      "body": { "error": "rebuy not allowed: balance is sufficient" }
    },
    {
      "label": "balance apply win persists positive delta",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 1100, "delta": 100 }
    },
    {
      "label": "balance apply loss persists negative delta",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 600, "delta": -500 }
    },
    {
      "label": "balance apply draw persists zero delta",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 600, "delta": 0 }
    },
    {
      "label": "balance apply loss clamps at zero",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 0, "delta": -100 }
    },
    {
      "label": "balance rebuy restores persisted bankroll",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 1000 }
    },
    {
      "label": "balance get reads rebuy reconciliation",
      "url": "https://.../balance",
      "status": 200,
      "body": { "balance": 1000 }
    }
  ]
}
```

The artifact may include rounds and history steps before the balance steps. That is expected because Cycle 93 extends the existing persistence smoke instead of creating a separate runner.

## Verification Commands

Run from `projects/crashout` after the Cycle 93 smoke implementation exists:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
SMOKE_OUT_DIR=/tmp/crashout-cycle93-balance-smoke pnpm run smoke:insforge
pnpm run check
```

Use a non-default backend when needed:

```bash
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events \
SMOKE_OUT_DIR=/tmp/crashout-cycle93-balance-smoke \
pnpm run smoke:insforge
```

Inspect the artifact directly:

```bash
node -e "const s=require('/tmp/crashout-cycle93-balance-smoke/summary.json'); console.log({status:s.status, playerId:s.playerId, balanceUrl:s.balanceUrl, steps:s.steps.map(x=>[x.label,x.status,x.body])})"
```

Gate the result with focused artifact assertions:

```bash
node - <<'NODE'
const s = require('/tmp/crashout-cycle93-balance-smoke/summary.json');
const byLabel = new Map(s.steps.map((step) => [step.label, step]));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
assert(s.status === 'passed', 'smoke did not pass');
assert(typeof s.balanceUrl === 'string' && /\/balance$/.test(s.balanceUrl), 'missing balanceUrl');
assert(/^smoke-/.test(s.playerId), 'playerId is not isolated');
assert(byLabel.get('balance get creates persisted player row')?.body?.balance === 1000, 'initial balance mismatch');
assert(byLabel.get('balance rebuy rejects sufficient bankroll')?.status === 400, 'rebuy guard did not reject');
assert(byLabel.get('balance apply win persists positive delta')?.body?.balance === 1100, 'win balance mismatch');
assert(byLabel.get('balance apply win persists positive delta')?.body?.delta === 100, 'win delta mismatch');
assert(byLabel.get('balance get reads win reconciliation')?.body?.balance === 1100, 'win readback mismatch');
assert(byLabel.get('balance apply loss persists negative delta')?.body?.balance === 600, 'loss balance mismatch');
assert(byLabel.get('balance apply loss persists negative delta')?.body?.delta === -500, 'loss delta mismatch');
assert(byLabel.get('balance get reads loss reconciliation')?.body?.balance === 600, 'loss readback mismatch');
assert(byLabel.get('balance apply draw persists zero delta')?.body?.balance === 600, 'draw balance mismatch');
assert(byLabel.get('balance apply draw persists zero delta')?.body?.delta === 0, 'draw delta mismatch');
assert(byLabel.get('balance get reads draw reconciliation')?.body?.balance === 600, 'draw readback mismatch');
assert(byLabel.get('balance apply loss clamps at zero')?.body?.balance === 0, 'zero clamp mismatch');
assert(byLabel.get('balance rebuy restores persisted bankroll')?.body?.balance === 1000, 'rebuy balance mismatch');
assert(byLabel.get('balance get reads rebuy reconciliation')?.body?.balance === 1000, 'rebuy readback mismatch');
console.log('cycle93 balance smoke artifact accepted');
NODE
```

## Exploratory Follow-Up

This smoke is a release check, not a full balance audit. It intentionally does not cover concurrent `apply` calls for the same player, a successful rebuy after draining below `50`, long sequential arithmetic runs, or cross-device reconciliation. Those are separate test sessions because they add state and operational cost beyond this cycle's narrow goal.

## Release Signal

GO for Cycle 93 only when the live smoke passes and the artifact proves both arithmetic and persisted readback through `/balance`. A passing frontend build alone is not enough evidence for this risk.
