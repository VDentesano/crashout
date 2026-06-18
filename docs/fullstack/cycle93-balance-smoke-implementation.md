# Cycle 93 Full-stack Plan: Balance Smoke Extension

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Business Need

Rounds persistence proves fairness state can be written and revealed. History persistence proves completed matches can be remembered. The next trust boundary is balance reconciliation: after a player wins, loses, drains, and rebuys, the backend must read back the same account-like state the app depends on.

This does not need a new workflow, new endpoint, frontend work, or a second smoke script. Extend the existing manual INSFORGE persistence smoke.

## Current State

- Script: `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- Existing derived endpoints:
  - `roundsUrl = siblingUrl(eventsUrl, 'rounds')`
  - `historyUrl = siblingUrl(eventsUrl, 'history')`
- Evidence:
  - `docs/qa/insforge-persistence-smoke/summary.json`
- Package command:
  - `pnpm run smoke:insforge`
- Balance backend:
  - `projects/crashout/backend/functions/balance/balance.bundled.ts`
  - Public sibling endpoint: `https://2zzc6u78.functions.insforge.app/balance`
  - Actions:
    - `{action:'get', playerId}` returns `{balance}` and creates a missing player at `1000`
    - `{action:'apply', playerId, bet, outcome}` validates bet, computes delta server-side, clamps balance at `0`, and returns `{balance, delta}`
    - `{action:'rebuy', playerId}` resets to `1000` only when current balance is below `50`

## Code-level Script Plan

Edit only `projects/crashout/scripts/insforge-persistence-smoke.mjs`.

1. Add the balance sibling URL next to the existing endpoint derivations:

```js
const balanceUrl = siblingUrl(eventsUrl, 'balance');
```

2. Change the synthetic run prefix from `cycle92` to `cycle93`:

```js
const runId = `cycle93-${Date.now()}-${randomUUID().slice(0, 8)}`;
```

This is not functionally required, but it makes production synthetic rows easier to identify.

3. Include `balanceUrl` in `writeSummary()` output:

```js
balanceUrl,
```

Place it beside `eventsUrl`, `roundsUrl`, and `historyUrl`.

4. Log the derived balance endpoint at startup if the script keeps endpoint logging terse:

```js
console.log(`Derived balance endpoint: ${balanceUrl}`);
```

This is optional but useful when debugging overridden `INSFORGE_EVENTS_URL` values.

5. Add a balance assertion block after the existing history stats checks and before `writeSummary('passed')`.

Use the same synthetic `playerId` as history. That keeps evidence tied to one smoke actor and avoids inventing another identity path. The `players` row is separate from `matches`; the existing public API has no delete action, so this remains a manual production smoke.

Exact sequence:

```js
const initialBalance = await postJson(balanceUrl, 'balance get creates starting row', {
  action: 'get',
  playerId,
});
check(initialBalance?.balance === 1000, 'balance get did not create default balance', initialBalance);

const rejectedRebuy = await postJson(
  balanceUrl,
  'balance rebuy rejects sufficient bankroll',
  {
    action: 'rebuy',
    playerId,
  },
  400,
);
check(
  rejectedRebuy?.error === 'rebuy not allowed: balance is sufficient',
  'balance rebuy rejection returned wrong error',
  rejectedRebuy,
);

const winBalance = await postJson(balanceUrl, 'balance apply win persists positive delta', {
  action: 'apply',
  playerId,
  bet: 100,
  outcome: 'win',
});
check(winBalance?.delta === 100, 'balance win returned wrong delta', winBalance);
check(winBalance?.balance === 1100, 'balance win returned wrong balance', winBalance);

const winReadback = await postJson(balanceUrl, 'balance get reads win persistence', {
  action: 'get',
  playerId,
});
check(winReadback?.balance === 1100, 'balance get did not read persisted win balance', winReadback);

const lossBalance = await postJson(balanceUrl, 'balance apply loss persists negative delta', {
  action: 'apply',
  playerId,
  bet: 500,
  outcome: 'loss',
});
check(lossBalance?.delta === -500, 'balance loss returned wrong delta', lossBalance);
check(lossBalance?.balance === 600, 'balance loss returned wrong balance', lossBalance);

const drawBalance = await postJson(balanceUrl, 'balance apply draw persists zero delta', {
  action: 'apply',
  playerId,
  bet: 250,
  outcome: 'draw',
});
check(drawBalance?.delta === 0, 'balance draw returned wrong delta', drawBalance);
check(drawBalance?.balance === 600, 'balance draw changed balance', drawBalance);

const drainOne = await postJson(balanceUrl, 'balance drain step 1 persists loss', {
  action: 'apply',
  playerId,
  bet: 500,
  outcome: 'loss',
});
check(drainOne?.delta === -500, 'balance drain step 1 returned wrong delta', drainOne);
check(drainOne?.balance === 100, 'balance drain step 1 returned wrong balance', drainOne);

const drainTwo = await postJson(balanceUrl, 'balance apply loss clamps at zero', {
  action: 'apply',
  playerId,
  bet: 100,
  outcome: 'loss',
});
check(drainTwo?.delta === -100, 'balance drain step 2 returned wrong delta', drainTwo);
check(drainTwo?.balance === 0, 'balance drain step 2 did not clamp at zero', drainTwo);

const rebuy = await postJson(balanceUrl, 'balance rebuy restores persisted bankroll', {
  action: 'rebuy',
  playerId,
});
check(rebuy?.balance === 1000, 'balance rebuy did not reset balance', rebuy);

const rebuyReadback = await postJson(balanceUrl, 'balance get reads rebuy reconciliation', {
  action: 'get',
  playerId,
});
check(rebuyReadback?.balance === 1000, 'balance get did not read rebuy balance', rebuyReadback);
```

6. Update the success log from:

```js
console.log(`OK ${summary.steps.length} INSFORGE persistence checks passed`);
```

to keep the same shape. No richer reporter is needed; `steps.length` will naturally include the new balance calls.

## Documentation Updates for the Implementation PR

Update these docs in the same future code PR:

- `projects/crashout/DEPLOY.md`
  - Change the Backend persistence smoke section to say the script derives `/rounds`, `/history`, and `/balance`.
  - Mention that it verifies commit/reveal, history write/read stats, and balance reconciliation including win, loss, draw, clamp-to-zero, and rebuy rejection.
- `docs/devops/cycle92-history-smoke-runbook.md`
  - Either replace it with a Cycle 93 runbook or add a new `docs/devops/cycle93-balance-smoke-runbook.md`.
  - The better move is a new Cycle 93 doc so old evidence stays historically accurate.
- `docs/qa/cycle92-history-smoke-verification.md`
  - Add a new `docs/qa/cycle93-balance-smoke-verification.md` listing the expected balance assertions.
- `docs/fullstack/cycle92-history-smoke-implementation.md`
  - Do not rewrite history. Add this Cycle 93 implementation doc after the code change, or keep this plan as the implementation note if the final diff matches it.

## Verification Commands

Run from `projects/crashout` after the script edit:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
pnpm run smoke:insforge
pnpm run check
```

Expected live smoke result:

- `/rounds` start returns two committed rows without `serverSeed`.
- `/rounds` reveal returns seeds matching the committed hashes.
- `/history` record returns `201` twice.
- `/history` list returns both synthetic rows and aggregate stats.
- `/balance` get creates a default `1000` balance for the synthetic player.
- `/balance` rejects rebuy while the synthetic player still has a sufficient bankroll.
- `/balance` apply returns and persists `+100`, `-500`, and `0` deltas.
- `/balance` clamps a losing apply at `0`.
- `/balance` rebuy resets to `1000`.
- `/balance` get reads back the final `1000` rebuy balance.

## Scope Control

Do not add cleanup. The live public balance API has no delete action, and adding one just for smoke cleanup would expand the trust surface.

Do not add frontend assertions. The client already treats the balance endpoint as the server authority; this cycle is about backend persistence and reconciliation.

Do not add a new package script or workflow. One manual command is enough:

```bash
pnpm run smoke:insforge
```

Do not test every validation branch here. Invalid bet, missing player ID, and method validation were covered in Cycle 20 notes. This smoke should prove durable reconciliation, not become an endpoint unit test suite.

## Complexity

- Script change: small, about 35-50 lines.
- Docs change: small, three focused docs.
- Risk: low operational risk, but it appends one synthetic `players` row and two synthetic `matches` rows to production per run.
- Estimated implementation time: 30-45 minutes including local syntax/lint checks and one live smoke run.
