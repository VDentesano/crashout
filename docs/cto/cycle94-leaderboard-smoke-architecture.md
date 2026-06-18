# Cycle 94 CTO Architecture: Leaderboard Persistence Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Inspected Surface

- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `projects/crashout/src/game/leaderboard.ts`
- `projects/crashout/src/components/LeaderboardPanel.tsx`
- `projects/crashout/backend/functions/leaderboard/leaderboard.bundled.ts`
- `projects/crashout/src/game/leaderboard.test.ts`
- `projects/crashout/backend/migrations/20260612120000_leaderboard-index.sql`
- `projects/crashout/migrations/20260612181433_leaderboard-index.sql`
- `docs/fullstack/cycle22-leaderboard.md`
- `docs/qa/cycle22-leaderboard-verification.md`
- `docs/cto/cycle92-history-smoke-architecture.md`
- `docs/cto/cycle93-balance-smoke-architecture.md`

## Constraint

Do not verify leaderboard persistence by adding a privileged database read. The public product contract is:

- Client derives `/leaderboard` from `VITE_INSFORGE_EVENTS_URL` by replacing a trailing `/events`.
- Client posts `{action:"list", metric?, window?, limit?}`.
- Client consumes only `{leaderboard:[{rank, playerId, value, matchesPlayed}]}`.
- Client treats every fetch failure as offline-tolerant and returns `null`.

The smoke should therefore use the same public edge-function path the app uses. It should seed rows through `/history` and then read the aggregate through `/leaderboard`.

## Endpoint Assumptions

Extend the existing sibling URL model:

```text
configured /events URL
  -> /rounds
  -> /history
  -> /balance
  -> /leaderboard
```

The current script accepts only an events URL ending in `/events`; keep that guard. Add `leaderboardUrl = siblingUrl(eventsUrl, "leaderboard")` and include it in `summary.json`.

Expected leaderboard API contract:

- `POST /leaderboard {action:"list"}` defaults to `metric:"netDelta"`, `window:"all"`, `limit:20`.
- `metric` is one of `netDelta`, `bestCashout`, or `winRate`.
- `window` is one of `all` or `7d`.
- `limit` is an integer from `1` through `50`.
- Success returns HTTP `200` and a `leaderboard` array.
- Invalid action, metric, window, or limit returns HTTP `400` with an error body.

## Safest Public-Contract Assertions

Use the same unique synthetic `playerId` already created by the persistence smoke. The existing history section records:

- one win: `bet:100`, `delta:100`, `cashoutMultiplier:2.12`
- one loss: `bet:50`, `delta:-50`, `cashoutMultiplier:null`

After the `/history` list readback succeeds, the narrow leaderboard checks should be:

1. `POST /leaderboard {action:"list", metric:"netDelta", window:"all", limit:50}` returns HTTP `200`.
2. Response has a `leaderboard` array.
3. The synthetic `playerId` appears somewhere in the array.
4. The synthetic entry has `value === 50` and `matchesPlayed === 2`.
5. The synthetic entry has a positive integer `rank`.
6. `POST /leaderboard {action:"list", metric:"bestCashout", window:"all", limit:50}` returns HTTP `200`.
7. The synthetic `playerId` appears somewhere in that response.
8. The synthetic best-cashout entry has `value === 2.12` and `matchesPlayed === 2`.
9. `POST /leaderboard {action:"list", metric:"winRate", window:"all", limit:50}` returns HTTP `200`.
10. The synthetic `playerId` does not appear in the win-rate response because the backend requires at least 5 matches for win-rate qualification.
11. `POST /leaderboard {action:"list", metric:"totalWins", window:"all", limit:50}` returns HTTP `400`.
12. `POST /leaderboard {action:"list", metric:"netDelta", window:"30d", limit:50}` returns HTTP `400`.
13. `POST /leaderboard {action:"list", metric:"netDelta", window:"all", limit:0}` returns HTTP `400`.

Do not assert global rank number, array length, first row identity, or absence of other players. The leaderboard is global customer-visible state and can legitimately contain unrelated rows. The smoke should only prove that rows written through `/history` become visible through the public leaderboard aggregate.

## Failure Modes Covered

- Missing or incorrect `/leaderboard` sibling URL derivation.
- Function unreachable, wrong method handling, invalid JSON response, or missing CORS-compatible JSON shape.
- Missing backend runtime env such as `INSFORGE_BASE_URL` or `API_KEY`.
- `matches` table unavailable to the function.
- `history` writes succeeding but leaderboard read path failing to observe those rows.
- Aggregation drift for `netDelta`: sum of `delta` must preserve `+100 - 50 = 50`.
- Aggregation drift for `bestCashout`: max non-null `cashout_multiplier` must preserve `2.12`.
- Qualification drift for `winRate`: the 2-match synthetic player must be excluded.
- Public validation drift for invalid metric, invalid window, and invalid limit.
- Response-shape drift affecting the frontend contract: `rank`, `playerId`, `value`, and `matchesPlayed`.

## Failure Modes Not Covered

- Exact SQL/index performance under large match volumes.
- `7d` exclusion semantics for old rows, because the public API has no way to create historical timestamps.
- Complete win-rate positive case, unless the smoke writes at least 5 synthetic rows for the same player.
- Frontend rendering, loading, and offline-copy behavior in `LeaderboardPanel`.
- Cleanup of synthetic rows. There is no public delete endpoint in this smoke path.
- Cross-run pollution if many synthetic players accumulate in the shared backend.
- Concurrent history writes racing with leaderboard reads. The smoke is intentionally sequential.

## Complexity And Blast Radius

Implementation complexity is low if the check stays inside `insforge-persistence-smoke.mjs`:

- one derived URL constant,
- one summary field,
- a short helper to find an entry by `playerId`,
- five public POST calls after the existing history checks.

Runtime cost is also low: two existing synthetic match rows are reused, and the leaderboard section adds a handful of edge-function invocations. The data cost is unchanged if no extra history rows are added.

The blast radius is not zero because leaderboard reads global `matches` data and synthetic history rows are customer-visible in aggregate. Keep the `smoke-*` player prefix, keep the workflow manual, and do not run this against a shared production-like backend on every PR until one of these exists:

- disposable INSFORGE backend branches,
- scheduled cleanup for `smoke-*`, `qa-*`, and `test-*` rows,
- or a dedicated non-production backend URL for CI.

## Architectural Recommendation

Add leaderboard coverage to the existing persistence smoke, not a separate runner. The value of this smoke is an end-to-end public contract:

```text
/history record -> public matches row -> /leaderboard aggregate -> frontend-consumed shape
```

Keep assertions deliberately local to the synthetic player. That gives the release gate useful confidence without depending on global leaderboard contents, and it minimizes operational risk in a system where everything can fail and public ranking data has high trust sensitivity.
