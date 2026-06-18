# Cycle 94 QA Verification Plan: Leaderboard Aggregation Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Risk

Leaderboard trust depends on aggregation, not only persistence. Cycles 92 and 93 prove that rounds, match history, and balances can survive public INSFORGE write/read cycles. Cycle 94 must prove the next customer-visible claim: persisted match outcomes become a deterministic ranking surface.

The main risk is false confidence from a weak smoke. A `200` response from `/leaderboard` is not enough. The smoke must create isolated synthetic players, write deterministic match rows through the same public `/history` contract, read `/leaderboard`, and verify exact aggregate values and ordering.

## Inspected Surface

- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `projects/crashout/backend/functions/leaderboard/leaderboard.bundled.ts`
- `projects/crashout/src/game/leaderboard.ts`
- `projects/crashout/src/game/leaderboard.test.ts`
- `docs/ceo/cycle94-leaderboard-smoke-decision.md`
- `docs/qa/cycle92-history-smoke-verification.md`
- `docs/qa/cycle93-balance-smoke-verification.md`

## Existing Smoke And Artifact Convention

Cycle 94 should extend the existing manual INSFORGE smoke rather than create a separate runner.

- Entrypoint: `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- Command: `pnpm run smoke:insforge`
- Config input: `INSFORGE_EVENTS_URL` or `VITE_INSFORGE_EVENTS_URL`, defaulting to the live `/events` URL
- Derived sibling URLs already follow the pattern `/events` -> `/rounds`, `/history`, `/balance`
- Cycle 94 should add `/leaderboard` using the same sibling URL pattern
- Default artifact path: `docs/qa/insforge-persistence-smoke/summary.json`
- Override artifact path: `SMOKE_OUT_DIR=/tmp/<run-dir>`
- Every request step should be appended to `steps` with `label`, `url`, HTTP `status`, and parsed `body`
- Failed assertions should still write `summary.json` with `status: "failed"` and error detail before the process exits non-zero

## Leaderboard Contract Under Test

`POST /leaderboard` accepts:

```json
{ "action": "list", "metric": "netDelta", "window": "all", "limit": 20 }
```

Supported values:

- `metric`: `netDelta` default, `bestCashout`, `winRate`
- `window`: `all` default, `7d`
- `limit`: integer `1` through `50`, default `20`

Expected response:

```json
{
  "leaderboard": [
    { "rank": 1, "playerId": "smoke-cycle94-...", "value": 300, "matchesPlayed": 3 }
  ]
}
```

Ranking rule from the current function: sort descending by `value`, then descending by `matchesPlayed`.

Metric rules:

- `netDelta`: sum of `delta` for each player.
- `bestCashout`: max non-null `cashout_multiplier`; bust-only players are excluded.
- `winRate`: wins divided by total matches; players with fewer than 5 matches are excluded.

## Required Synthetic Data Shape

Use one unique run id and unique synthetic player ids for every smoke run. Recommended pattern:

```text
runId: cycle94-<timestamp>-<uuid8>
player A: smoke-cycle94-<runId>-alpha
player B: smoke-cycle94-<runId>-bravo
player C: smoke-cycle94-<runId>-charlie
```

Record match rows through `/history` only. Do not seed through SQL or privileged INSFORGE CLI paths for this smoke.

Recommended deterministic rows:

| Player | Rows | Expected aggregate |
|---|---:|---|
| alpha | win `+500`, loss `-250`, win `+50` | `netDelta: 300`, `matchesPlayed: 3`, `bestCashout: 4.2`, no `winRate` qualification |
| bravo | win `+250`, win `+100`, loss `-100`, loss `-50`, win `+50` | `netDelta: 250`, `matchesPlayed: 5`, `bestCashout: 3.1`, `winRate: 0.6` |
| charlie | loss `-50`, loss `-50`, draw `0`, draw `0`, win `+100` | `netDelta: 0`, `matchesPlayed: 5`, `bestCashout: 2`, `winRate: 0.2` |

This shape gives the smoke multiple useful comparisons:

- `netDelta` ranks alpha above bravo despite fewer matches.
- `winRate` excludes alpha because it has only 3 matches.
- `winRate` ranks bravo above charlie.
- `bestCashout` ranks alpha above bravo above charlie.
- Loss and draw rows count toward `matchesPlayed`.
- Null `cashoutMultiplier` on losses does not pollute `bestCashout`.

## Acceptance Criteria

The Cycle 94 leaderboard smoke is acceptable only if all of these checks pass in one manual `pnpm run smoke:insforge` run:

- The script derives `leaderboardUrl` from the configured `/events` URL using the sibling path `/leaderboard`.
- The summary artifact includes `leaderboardUrl`, `runId`, all synthetic `playerId`s, timestamps, request step labels, HTTP statuses, and parsed response bodies.
- The run uses only unique `smoke-cycle94-*` player ids; no shared `qa-*`, `test-*`, or fixed seed ids.
- The script records the deterministic alpha, bravo, and charlie match rows through `/history` and verifies each record returns HTTP `201` with `{ "ok": true }`.
- `POST /leaderboard` with default metric or `{ "metric": "netDelta", "window": "all", "limit": 50 }` returns HTTP `200`.
- The synthetic netDelta ordering is exact: alpha appears before bravo, and bravo appears before charlie.
- Alpha has `value: 300` and `matchesPlayed: 3` in the netDelta board.
- Bravo has `value: 250` and `matchesPlayed: 5` in the netDelta board.
- Charlie has `value: 0` and `matchesPlayed: 5` in the netDelta board.
- The synthetic `rank` fields are sequential within the returned leaderboard and the relative rank order of alpha/bravo/charlie matches the sorted aggregate.
- `POST /leaderboard` with `{ "metric": "bestCashout", "window": "all", "limit": 50 }` returns HTTP `200`.
- The synthetic bestCashout ordering is exact: alpha `4.2`, bravo `3.1`, charlie `2`.
- Loss-only or null-cashout rows do not create a larger bestCashout value.
- `POST /leaderboard` with `{ "metric": "winRate", "window": "all", "limit": 50 }` returns HTTP `200`.
- Alpha is absent from the winRate board because it has fewer than 5 matches.
- Bravo appears with `value: 0.6` and `matchesPlayed: 5`.
- Charlie appears with `value: 0.2` and `matchesPlayed: 5`.
- Bravo ranks ahead of charlie in winRate.
- `POST /leaderboard` with `{ "metric": "netDelta", "window": "7d", "limit": 50 }` includes the same synthetic alpha/bravo/charlie values as `all`, because the smoke rows were created during the run.
- Invalid input checks return the documented errors: unknown action, invalid metric, invalid window, `limit: 0`, `limit: 51`, non-integer limit, and string limit all return HTTP `400`.
- Existing Cycle 92 rounds/history checks and Cycle 93 balance checks still pass in the same smoke run.
- Any failed assertion writes `summary.json` with `status: "failed"` and enough detail to identify the mismatched player, metric, expected value, and actual response.

## Expected Artifact Contents

Default artifact path:

```text
docs/qa/insforge-persistence-smoke/summary.json
```

The JSON should contain at least the following fields. The sample ranks below are illustrative; artifact assertions should use relative synthetic ordering because a shared backend may contain other players.

```json
{
  "status": "passed",
  "startedAt": "ISO-8601 timestamp",
  "finishedAt": "ISO-8601 timestamp",
  "runId": "cycle94-...",
  "playerId": "smoke-cycle94-...",
  "leaderboardPlayers": {
    "alpha": "smoke-cycle94-...-alpha",
    "bravo": "smoke-cycle94-...-bravo",
    "charlie": "smoke-cycle94-...-charlie"
  },
  "eventsUrl": "https://.../events",
  "roundsUrl": "https://.../rounds",
  "historyUrl": "https://.../history",
  "balanceUrl": "https://.../balance",
  "leaderboardUrl": "https://.../leaderboard",
  "steps": [
    {
      "label": "leaderboard history seed alpha win 1",
      "url": "https://.../history",
      "status": 201,
      "body": { "ok": true }
    },
    {
      "label": "leaderboard list netDelta ranks synthetic players",
      "url": "https://.../leaderboard",
      "status": 200,
      "body": {
        "leaderboard": [
          { "rank": 1, "playerId": "smoke-cycle94-...-alpha", "value": 300, "matchesPlayed": 3 },
          { "rank": 2, "playerId": "smoke-cycle94-...-bravo", "value": 250, "matchesPlayed": 5 },
          { "rank": 3, "playerId": "smoke-cycle94-...-charlie", "value": 0, "matchesPlayed": 5 }
        ]
      }
    },
    {
      "label": "leaderboard list bestCashout ranks synthetic players",
      "url": "https://.../leaderboard",
      "status": 200,
      "body": {
        "leaderboard": [
          { "playerId": "smoke-cycle94-...-alpha", "value": 4.2, "matchesPlayed": 3 },
          { "playerId": "smoke-cycle94-...-bravo", "value": 3.1, "matchesPlayed": 5 },
          { "playerId": "smoke-cycle94-...-charlie", "value": 2, "matchesPlayed": 5 }
        ]
      }
    },
    {
      "label": "leaderboard list winRate excludes underqualified synthetic player",
      "url": "https://.../leaderboard",
      "status": 200,
      "body": {
        "leaderboard": [
          { "playerId": "smoke-cycle94-...-bravo", "value": 0.6, "matchesPlayed": 5 },
          { "playerId": "smoke-cycle94-...-charlie", "value": 0.2, "matchesPlayed": 5 }
        ]
      }
    }
  ]
}
```

The artifact may include rounds, history, and balance steps before the leaderboard steps. That is expected because Cycle 94 extends the existing persistence smoke.

## Verification Commands

Run from `projects/crashout` after the Cycle 94 smoke implementation exists:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
SMOKE_OUT_DIR=/tmp/crashout-cycle94-leaderboard-smoke pnpm run smoke:insforge
pnpm run check
```

Use a non-default backend when needed:

```bash
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events \
SMOKE_OUT_DIR=/tmp/crashout-cycle94-leaderboard-smoke \
pnpm run smoke:insforge
```

Inspect the artifact directly:

```bash
node -e "const s=require('/tmp/crashout-cycle94-leaderboard-smoke/summary.json'); console.log({status:s.status, leaderboardUrl:s.leaderboardUrl, players:s.leaderboardPlayers, steps:s.steps.filter(x=>x.label.startsWith('leaderboard')).map(x=>[x.label,x.status,x.body])})"
```

Gate the result with focused artifact assertions:

```bash
node - <<'NODE'
const s = require('/tmp/crashout-cycle94-leaderboard-smoke/summary.json');
const byLabel = new Map(s.steps.map((step) => [step.label, step]));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function findPlayer(stepLabel, playerId) {
  return byLabel.get(stepLabel)?.body?.leaderboard?.find((entry) => entry.playerId === playerId);
}
function indexOf(stepLabel, playerId) {
  return byLabel.get(stepLabel)?.body?.leaderboard?.findIndex((entry) => entry.playerId === playerId);
}
const players = s.leaderboardPlayers;
assert(s.status === 'passed', 'smoke did not pass');
assert(typeof s.leaderboardUrl === 'string' && /\/leaderboard$/.test(s.leaderboardUrl), 'missing leaderboardUrl');
assert(Object.values(players).every((id) => /^smoke-cycle94-/.test(id)), 'leaderboard players are not isolated cycle94 ids');

const net = 'leaderboard list netDelta ranks synthetic players';
assert(findPlayer(net, players.alpha)?.value === 300, 'alpha netDelta mismatch');
assert(findPlayer(net, players.alpha)?.matchesPlayed === 3, 'alpha match count mismatch');
assert(findPlayer(net, players.bravo)?.value === 250, 'bravo netDelta mismatch');
assert(findPlayer(net, players.bravo)?.matchesPlayed === 5, 'bravo match count mismatch');
assert(findPlayer(net, players.charlie)?.value === 0, 'charlie netDelta mismatch');
assert(indexOf(net, players.alpha) < indexOf(net, players.bravo), 'alpha should outrank bravo by netDelta');
assert(indexOf(net, players.bravo) < indexOf(net, players.charlie), 'bravo should outrank charlie by netDelta');

const cashout = 'leaderboard list bestCashout ranks synthetic players';
assert(findPlayer(cashout, players.alpha)?.value === 4.2, 'alpha bestCashout mismatch');
assert(findPlayer(cashout, players.bravo)?.value === 3.1, 'bravo bestCashout mismatch');
assert(findPlayer(cashout, players.charlie)?.value === 2, 'charlie bestCashout mismatch');
assert(indexOf(cashout, players.alpha) < indexOf(cashout, players.bravo), 'alpha should outrank bravo by bestCashout');
assert(indexOf(cashout, players.bravo) < indexOf(cashout, players.charlie), 'bravo should outrank charlie by bestCashout');

const winRate = 'leaderboard list winRate excludes underqualified synthetic player';
assert(!findPlayer(winRate, players.alpha), 'alpha should be excluded from winRate');
assert(findPlayer(winRate, players.bravo)?.value === 0.6, 'bravo winRate mismatch');
assert(findPlayer(winRate, players.charlie)?.value === 0.2, 'charlie winRate mismatch');
assert(indexOf(winRate, players.bravo) < indexOf(winRate, players.charlie), 'bravo should outrank charlie by winRate');

console.log('cycle94 leaderboard smoke artifact accepted');
NODE
```

## Edge Cases To Keep In Scope

- Limit validation: `0`, `51`, `2.5`, `"bad"`, and `null` must fail with HTTP `400`; valid `1`, `20`, `50`, and absent limit must succeed.
- Metric validation: unknown metrics such as `totalWins` must fail with HTTP `400`.
- Window validation: unknown windows such as `30d` must fail with HTTP `400`.
- Action validation: anything other than `list` must fail with HTTP `400`.
- Method validation: optional but useful; `GET /leaderboard` should return HTTP `405`.
- Qualification boundary: a 3-match player is excluded from winRate; 5-match players qualify.
- Tie behavior: if a future variant adds equal metric values, more `matchesPlayed` must rank first.
- Shared-backend contamination: assertions must find the synthetic players inside the returned board, not assume they occupy global ranks 1, 2, and 3 unless the deterministic values make that unavoidable.

## Exploratory Follow-Up

This smoke is a release check, not a full leaderboard audit. It intentionally does not prove old-row exclusion for the `7d` window because the public `/history` contract does not allow backdating `created_at`. It also does not prove performance at high row counts, cleanup of synthetic rows, anti-abuse controls, or concurrent writes during leaderboard reads. Those should be separate test sessions.

## Release Signal

GO for Cycle 94 only when the live smoke passes and the artifact proves exact aggregation for `netDelta`, `bestCashout`, and `winRate` through the public `/history` and `/leaderboard` contracts. A passing build, a passing pure logic test, or a generic `200` from `/leaderboard` is insufficient evidence for this risk.
