# Cycle 20 — Persistent Identity + Play-Money Balance

## What shipped

Anonymous player identity already existed (`crashout.playerId` in localStorage via `src/analytics/logger.ts`). This cycle adds a server-authoritative balance backed by INSFORGE, with localStorage as an optimistic cache. No spinners, no blocking — the UI stays instant; the server reconciles in the background.

## Backend

### Migration

- File: `backend/migrations/20260612100000_players.sql` (reference copy)
- CLI artifact: `migrations/20260612174215_20260612100000-players.sql` (what was actually applied)
- Table: `public.players(player_id text PK, balance integer default 1000, updated_at timestamptz)`
- RLS enabled, no anon policy — same pattern as `rounds`; only the privileged `API_KEY` can read/write

### Edge function `balance`

- Deploy artifact: `backend/functions/balance/balance.bundled.ts`
- Public URL: `https://2zzc6u78.functions.insforge.app/balance`
- Actions:
  - `{action:'get', playerId}` — upsert if missing, return `{balance}`
  - `{action:'apply', playerId, bet, outcome}` — validate bet ∈ {50,100,250,500}, compute delta server-side, clamp ≥0, return `{balance, delta}`
  - `{action:'rebuy', playerId}` — only if balance < 50; reset to 1000, return `{balance}`
- Validation: playerId must be non-empty string ≤ 64 chars; bad input → 400

## Smoke test results (live, post-deploy)

```
get  (new player)                → {balance: 1000}
apply win  +100                  → {balance: 1100, delta: 100}
apply loss -100                  → {balance: 1000, delta: -100}
get  (confirm)                   → {balance: 1000}
drain to 0 (two ×500 losses)     → {balance: 0}
rebuy                            → {balance: 1000}
rebuy again (balance sufficient) → {error: "rebuy not allowed: balance is sufficient"}
invalid bet (75)                 → {error: "bet must be one of 50, 100, 250, 500"}
missing playerId                 → {error: "invalid playerId"}
```

## Frontend

### New files

- `src/game/economy.pure.ts` — pure helpers (`computeDelta`, `applyDelta`, `reconcileBalance`, `BET_OPTIONS_SET`); no browser imports; the testable seam

### Modified files

- `src/game/economy.ts` — imports pure helpers; adds `fetchAndReconcileBalance`, `BALANCE_URL` derivation (replaces `/events` suffix with `/balance` in the existing env var); `applyMatchResult` and `rebuy` accept optional `onReconcile` callback; network failure is silent
- `src/App.tsx` — `useEffect([], [])` on mount calls `fetchAndReconcileBalance(setBalance)`; `applyMatchResult` and `rebuy` pass `setBalance` as reconcile callback

### Reconciliation contract

- localStorage is updated immediately (optimistic, keeps UI instant and offline-tolerant)
- Server response reconciles to `Math.max(0, serverBalance)` — server wins
- Network failure: silent, local value kept; no spinners, no blocking
- On app load: fetch `get`, reconcile; this handles cross-device drift (future) and stale caches

## Tests

- `src/game/economy.test.ts` — 13 checks on `computeDelta`, `applyDelta`, `reconcileBalance`, `BET_OPTIONS_SET`
- All 4 test suites pass: `pnpm test` clean
- `pnpm build` clean (287 kB bundle, no TS errors)
