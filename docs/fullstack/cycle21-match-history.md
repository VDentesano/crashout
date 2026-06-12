# Cycle 21 — Match History + Basic Stats

## What was built

1. **`matches` table** — server-authoritative record of every completed match.
2. **`history` edge function** — keyless POST API with two actions: `record` and `list`.
3. **Frontend `history.ts`** — fire-and-forget `recordMatch` + best-effort `fetchHistory`, wired into the match lifecycle in `App.tsx`.
4. **`HistoryPanel` component** — opens via ⋯ menu, shows recent matches + aggregate stats styled to the existing CRASHOUT visual system.
5. **`history.test.ts`** — pure-logic validation tests mirroring server-side guards; added to `pnpm test`.

## Schema

```sql
create table public.matches (
  id                 uuid        primary key default gen_random_uuid(),
  player_id          text        not null check (char_length(player_id) between 1 and 64),
  bet                integer     not null check (bet in (50, 100, 250, 500)),
  outcome            text        not null check (outcome in ('win', 'loss', 'draw')),
  crash_point        numeric(10,4) not null check (crash_point >= 1),
  cashout_multiplier numeric(10,4) check (cashout_multiplier is null or cashout_multiplier >= 1),
  delta              integer     not null,
  created_at         timestamptz not null default now()
);
create index matches_player_created on public.matches (player_id, created_at desc);
```

Migration applied: `20260612180026_matches.sql` (INSFORGE auto-timestamped from `npx @insforge/cli db migrations new matches`).

## Endpoints

Live base: `https://2zzc6u78.functions.insforge.app/history`

### `record`
```json
POST { "action": "record", "playerId": "...", "bet": 100, "outcome": "win",
       "crashPoint": 2.5, "cashoutMultiplier": 2.1, "delta": 100 }
→ 201 { "ok": true }
```

### `list`
```json
POST { "action": "list", "playerId": "...", "limit": 20 }
→ 200 {
    "matches": [...],
    "stats": { "total", "wins", "losses", "draws", "winRate", "netDelta", "bestCashout" }
  }
```

Aggregates computed server-side from all rows (no separate stats table). Limit clamped to 50 max, default 20.

## Verification evidence

```
# record win
curl -X POST https://2zzc6u78.functions.insforge.app/history \
  -d '{"action":"record","playerId":"test-cycle21","bet":100,"outcome":"win","crashPoint":2.5,"cashoutMultiplier":2.1,"delta":100}'
→ {"ok":true}

# record loss (bust — no cashoutMultiplier)
curl -X POST ... -d '{"action":"record","playerId":"test-cycle21","bet":500,"outcome":"loss","crashPoint":1.3,"delta":-500}'
→ {"ok":true}

# list
curl -X POST ... -d '{"action":"list","playerId":"test-cycle21","limit":10}'
→ {"matches":[...],"stats":{"total":2,"wins":1,"losses":1,"draws":0,"winRate":0.5,"netDelta":-400,"bestCashout":2.1}}

# invalid bet rejected
curl -X POST ... -d '{"action":"record","playerId":"test-cycle21","bet":75,...}'
→ {"error":"bet must be one of 50, 100, 250, 500"}

# pnpm test — all 43 checks pass
# pnpm build — clean, 290 KB JS bundle
# prod: https://crashout-euq.pages.dev → HTTP 200
```

## QA fixes (post-GO)

- **F-01 (Major, fixed):** `record` now enforces server-authoritative delta — same rule as
  the `balance` function: win = +bet, loss = −bet, draw = 0. Any other delta is rejected 400
  (`delta inconsistent with bet/outcome`). Verified live:
  `loss/delta:9999999 → 400`, `win 100/delta:200 → 400`, `draw 250/delta:0 → 201`.
  Frontend already sends `computeDelta(outcome, bet)` so no client change was needed.
- **F-03 (Minor, fixed):** removed the dead slice-based bestCashout loop in `list`; the
  single top-1 DB query is the sole source.
- `history.test.ts` extended with 8 delta-consistency checks; full suite passes, clean build.

## Known risks

- Aggregates require two extra DB queries on `list` (one for win/loss/draw counts, one for best cashout). Acceptable at current scale; add a materialized view or pre-aggregated column if this becomes a bottleneck.
- `cashoutMultiplier` recorded from the last round only (not a full per-round breakdown). The match is a best-of-5 so this is a summary value; per-round detail could be added later if needed.
- No rate-limiting on `history/record` — same posture as `balance`. Turnstile / IP-limit is the deferred fast-follow.
