# Cycle 94 Full-stack Plan: Leaderboard Smoke Extension

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Business Need

The current INSFORGE smoke proves persisted rounds, match history, and balance reconciliation. The leaderboard is the next read model built from the same `matches` rows. A production smoke should catch the simple but expensive failure mode where history writes succeed while leaderboard aggregation is broken, mis-routed, or reading the wrong table shape.

Do this as the smallest extension to the existing smoke. Do not add a second script, frontend work, migrations, or product-code changes.

## Current State

- Script: `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- Existing derived endpoints:
  - `roundsUrl = siblingUrl(eventsUrl, 'rounds')`
  - `historyUrl = siblingUrl(eventsUrl, 'history')`
  - `balanceUrl = siblingUrl(eventsUrl, 'balance')`
- Leaderboard backend:
  - `projects/crashout/backend/functions/leaderboard/leaderboard.bundled.ts`
  - Public sibling endpoint: `/leaderboard`
  - Action: `{action:'list', metric?, window?, limit?}`
  - Response: `{leaderboard: [{rank, playerId, value, matchesPlayed}]}`
- Existing history smoke rows for the unique synthetic `playerId`:
  - win: `bet: 100`, `delta: 100`, `cashoutMultiplier: 2.12`
  - loss: `bet: 50`, `delta: -50`, `cashoutMultiplier: null`
  - expected aggregate for that player: `netDelta = 50`, `bestCashout = 2.12`, `matchesPlayed = 2`

## Smallest Code Change

Edit only `projects/crashout/scripts/insforge-persistence-smoke.mjs`.

1. Add the leaderboard sibling URL beside the existing endpoint derivations:

```js
const leaderboardUrl = siblingUrl(eventsUrl, 'leaderboard');
```

2. Include `leaderboardUrl` in `writeSummary()` beside `eventsUrl`, `roundsUrl`, `historyUrl`, and `balanceUrl` so `docs/qa/insforge-persistence-smoke/summary.json` records the exact endpoint under test.

3. After the existing history stats assertions and before the balance block, query leaderboard twice:

```js
const netDeltaLeaderboard = await postJson(
  leaderboardUrl,
  'leaderboard list aggregates persisted net delta',
  {
    action: 'list',
    metric: 'netDelta',
    window: 'all',
    limit: 50,
  },
);

check(
  Array.isArray(netDeltaLeaderboard?.leaderboard),
  'leaderboard netDelta did not return leaderboard array',
  netDeltaLeaderboard,
);

const netDeltaEntry = netDeltaLeaderboard.leaderboard.find((entry) => entry.playerId === playerId);
check(Boolean(netDeltaEntry), 'leaderboard netDelta did not include synthetic player', netDeltaLeaderboard);
check(netDeltaEntry.value === 50, 'leaderboard netDelta aggregate mismatch', netDeltaEntry);
check(netDeltaEntry.matchesPlayed === 2, 'leaderboard netDelta matchesPlayed mismatch', netDeltaEntry);
check(
  typeof netDeltaEntry.rank === 'number' && netDeltaEntry.rank >= 1,
  'leaderboard netDelta rank missing',
  netDeltaEntry,
);

const cashoutLeaderboard = await postJson(
  leaderboardUrl,
  'leaderboard list aggregates persisted best cashout',
  {
    action: 'list',
    metric: 'bestCashout',
    window: 'all',
    limit: 50,
  },
);

check(
  Array.isArray(cashoutLeaderboard?.leaderboard),
  'leaderboard bestCashout did not return leaderboard array',
  cashoutLeaderboard,
);

const cashoutEntry = cashoutLeaderboard.leaderboard.find((entry) => entry.playerId === playerId);
check(Boolean(cashoutEntry), 'leaderboard bestCashout did not include synthetic player', cashoutLeaderboard);
check(Number(cashoutEntry.value) === 2.12, 'leaderboard bestCashout aggregate mismatch', cashoutEntry);
check(cashoutEntry.matchesPlayed === 2, 'leaderboard bestCashout matchesPlayed mismatch', cashoutEntry);
```

## Why This Shape

- Reuses the two existing history rows, so the smoke adds only two network calls and no extra test data setup.
- Uses `limit: 50`, matching the endpoint maximum, because production data may contain players ranked above the synthetic smoke player.
- Checks membership instead of exact rank, because global leaderboard ordering is intentionally affected by existing production rows.
- Skips `winRate` in this smoke because the endpoint requires at least five matches. Testing it would require three more synthetic match rows for little additional persistence coverage.
- Places assertions before the balance block because leaderboard reads from `matches`, while balance reads from `players`; failures stay close to their write source in `summary.json`.

## Verification

Run from `projects/crashout` after the coordinator implements:

```bash
pnpm run smoke:insforge
```

Expected result: the existing smoke still writes `docs/qa/insforge-persistence-smoke/summary.json`, and `steps` includes two new successful `/leaderboard` calls for `netDelta` and `bestCashout`.
