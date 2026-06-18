# Cycle 93 CTO Architecture: INSFORGE Balance Reconciliation Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Inspected Surface

- `projects/crashout/backend/functions/balance/balance.bundled.ts`
- `projects/crashout/scripts/insforge-persistence-smoke.mjs`
- `projects/crashout/src/game/economy.ts`
- `projects/crashout/src/game/economy.pure.ts`
- `projects/crashout/backend/migrations/20260612100000_players.sql`
- `docs/cto/cycle92-history-smoke-architecture.md`
- `docs/ceo/cycle93-balance-smoke-decision.md`

## Constraint

No schema or function change is needed for this cycle. The deployed `balance` edge function already owns the server-authoritative balance contract for anonymous players:

- `POST /balance` with `{action:"get", playerId}` creates a missing `public.players` row and returns `{balance}`.
- `POST /balance` with `{action:"apply", playerId, bet, outcome}` validates the allowed bet and outcome, applies the delta, clamps at zero, persists, and returns `{balance, delta}`.
- `POST /balance` with `{action:"rebuy", playerId}` is allowed only when current balance is below the minimum bet and then resets to `{balance:1000}`.

The client treats localStorage as optimistic only. The edge function and `public.players.balance` are the authority. The smoke must therefore verify the function API, not local browser state.

## API/Data-Flow Contract To Verify

Use the same sibling URL pattern as the existing smoke:

```text
configured /events URL
  -> derive /rounds
  -> derive /history
  -> derive /balance
```

Run with a unique synthetic player id, for example `smoke-cycle93-<timestamp>-<uuid>`. That keeps blast radius to a single `public.players` row and avoids customer-visible state.

The narrow verification sequence should be:

1. `POST /balance {action:"get", playerId}`.
   - Expect HTTP 200.
   - Expect numeric `balance === 1000`.
   - This proves missing-player upsert works.
2. `POST /balance {action:"apply", playerId, bet:100, outcome:"win"}`.
   - Expect HTTP 200.
   - Expect `delta === 100`.
   - Expect `balance === 1100`.
   - This proves positive reconciliation persists.
3. `POST /balance {action:"get", playerId}`.
   - Expect HTTP 200.
   - Expect `balance === 1100`.
   - This proves readback returns the persisted win value, not only the previous response body.
4. `POST /balance {action:"apply", playerId, bet:500, outcome:"loss"}`.
   - Expect HTTP 200.
   - Expect `delta === -500`.
   - Expect `balance === 600`.
   - This proves negative reconciliation persists.
5. `POST /balance {action:"get", playerId}`.
   - Expect HTTP 200.
   - Expect `balance === 600`.
   - This proves readback returns the persisted loss value.
6. `POST /balance {action:"apply", playerId, bet:250, outcome:"draw"}`.
   - Expect HTTP 200.
   - Expect `delta === 0`.
   - Expect `balance === 600`.
   - This proves draw semantics are stable and do not accidentally mutate value.
7. `POST /balance {action:"get", playerId}`.
   - Expect HTTP 200.
   - Expect `balance === 600`.
   - This proves draw state was persisted.
8. `POST /balance {action:"apply", playerId, bet:500, outcome:"loss"}`.
   - Expect HTTP 200.
   - Expect `balance === 100`.
   - This moves the synthetic player near broke.
9. `POST /balance {action:"apply", playerId, bet:100, outcome:"loss"}`.
   - Expect HTTP 200.
   - Expect `delta === -100`.
   - Expect `balance === 0`.
   - This proves clamp-at-zero behavior through a normal apply call.
10. `POST /balance {action:"rebuy", playerId}`.
   - Expect HTTP 200.
   - Expect `balance === 1000`.
   - This proves allowed rebuy restores the persisted bankroll.
11. `POST /balance {action:"get", playerId}`.
   - Expect HTTP 200.
   - Expect `balance === 1000`.
   - This proves rebuy readback.

Also call `rebuy` immediately after the initial `get` while the player has `1000`.
   - Expect HTTP 400.
   - Expect an error body.
   - This proves the rebuy guard is active and prevents unauthorized resets.

## Failure Modes Covered

- Wrong or missing `/balance` sibling URL derivation.
- Function unreachable, wrong method handling, or malformed JSON response.
- Missing `INSFORGE_BASE_URL` or `API_KEY` in the function runtime.
- `players` table missing, RLS/admin-key path broken, or `player_id` upsert conflict behavior changed.
- Default balance drift from `1000`.
- Bet validation drift for the product-supported options `50`, `100`, `250`, `500`.
- Outcome semantic drift: `win` must add bet, `loss` must subtract bet, `draw` must return zero delta.
- Clamp behavior regression that allows negative balances in later extension tests.
- Persist/readback split-brain where `apply` returns a calculated number but the later `get` reads a different stored value.
- Rebuy authorization regression that lets a sufficiently funded player reset to `1000`.

## Important Failure Mode Not Covered

The current `balance` function performs read-modify-write through separate API calls. Two concurrent `apply` requests for the same `playerId` can lose an update if both read the same starting balance and then upsert different final values.

That is acceptable for this smoke because the client path is effectively sequential for completed matches. It is not acceptable as a long-term accounting model if balance becomes valuable, transferable, or monetized. The production-grade fix would be a database-side atomic balance mutation, not a broader smoke script.

## Narrow Implementation Recommendation

Extend `scripts/insforge-persistence-smoke.mjs` in place instead of creating a second smoke runner. Add:

- `const balanceUrl = siblingUrl(eventsUrl, "balance");`
- `balanceUrl` in the summary JSON.
- A short balance section after the existing history checks.
- Reuse `postJson` and `check`; do not introduce an SDK client or direct database access.
- Keep the run manual under the existing `pnpm run smoke:insforge` script.

This preserves the operational shape already established in Cycle 92: one public-edge-function smoke, one synthetic player, one evidence file, no privileged local database dependency.

## Operational Cost

The smoke adds one synthetic `public.players` row per run and several edge function invocations. That is cheap enough for manual release evidence.

Do not run this automatically on every PR against the shared production-like backend until one of these exists:

- disposable InsForge backend branches,
- scheduled cleanup for `smoke-*` players and related rows,
- or a dedicated non-production backend URL wired into CI.

The business impact is trust in account-like state. The engineering boundary is intentionally small: verify the contract customers depend on without turning the smoke into a general backend audit.
