# Cycle 22 — Global Leaderboard

## What was built

1. **`leaderboard` edge function** — keyless POST API, `list` action only. Aggregates the `matches` table by player_id, supports three metrics and two time windows.
2. **Migration `20260612181433_leaderboard-index.sql`** — composite index `(player_id, outcome, delta, created_at)` supporting the GROUP BY aggregation and 7d window scans.
3. **`src/game/leaderboard.ts`** — frontend fetch wrapper, offline-tolerant (returns null on failure), derives URL from `VITE_INSFORGE_EVENTS_URL` (`/events` → `/leaderboard`).
4. **`src/components/LeaderboardPanel.tsx`** — panel opened from ⋯ menu, metric tabs (NET / BEST × / WIN %), window toggle (ALL TIME / 7 DAYS), highlights current player's row with ★. Reuses all `history-panel` / `history-*` CSS classes exactly.
5. **`src/game/leaderboard.test.ts`** — 27 pure-logic checks mirroring server-side validation; wired into `pnpm test`.
6. **`App.tsx`** — added 🏆 Leaderboard menu item + `showLeaderboard` state; imports `LeaderboardPanel`.
7. **CSS** — added `.lb-*` rules to `App.css` (tabs, window toggle, rows).

## Schema / index

```sql
create index if not exists matches_leaderboard
  on public.matches (player_id, outcome, delta, created_at);
```

No new table. Aggregation runs on `matches` with GROUP BY via in-function map.

## Endpoint contract

Live base: `https://2zzc6u78.functions.insforge.app/leaderboard`

```
POST { "action": "list", "metric"?, "window"?, "limit"? }
  metric: 'netDelta' (default) | 'bestCashout' | 'winRate'
  window: 'all' (default) | '7d'
  limit:  integer 1–50, default 20

→ 200 {
    "leaderboard": [
      { "rank": 1, "playerId": "...", "value": 350, "matchesPlayed": 2 },
      ...
    ]
  }

winRate: requires ≥ 5 matches; players with fewer are excluded.
Unknown action / metric / window → 400 { "error": "..." }
```

## Verification evidence

```
# netDelta (default, all time)
POST {action:'list'}
→ [{rank:1,playerId:"qa-cycle21-x7k9p",value:9999599,matchesPlayed:4}, ...]

# bestCashout, limit 3
POST {action:'list',metric:'bestCashout',limit:3}
→ [{rank:1,playerId:"qa-cycle21-other-player",value:5,...}, ...]

# 7d window
POST {action:'list',window:'7d',limit:3}
→ same as all-time (all seeded rows within 7d)

# winRate — no player has ≥5 matches yet
POST {action:'list',metric:'winRate'}
→ {leaderboard:[]}

# invalid metric → 400
POST {action:'list',metric:'totalWins'}
→ {"error":"metric must be 'netDelta', 'bestCashout', or 'winRate'"}

# unknown action → 400
POST {action:'record'}
→ {"error":"unknown action"}

# pnpm test — all checks pass (27 new + all prior suites)
# pnpm build — clean, 293.60 kB JS bundle
# prod: https://crashout-euq.pages.dev → HTTP 200
```

## QA fixes (post-NO-GO, docs/qa/cycle22-leaderboard-verification.md)

- **F-01 (Blocker, fixed):** purged all QA/test artifacts from `matches` via
  `npx @insforge/cli db query` — deleted rows where `player_id LIKE 'qa-%'`,
  `'test-%'`, or `'lb-seed-%'` (20 rows across 7 test players, including
  `qa-cycle21-x7k9p` with its garbage 9,999,599 netDelta). Table count after
  delete: 0 (only test data ever existed). Verified live:
  `POST {action:'list'} → {"leaderboard":[]}` — no test players returned.
- **F-02 (Major, fixed):** `limit` is now strictly validated — if provided it
  must be an integer in 1–50, otherwise 400. Redeployed and verified live:
  ```
  limit:0    → 400 {"error":"limit must be an integer between 1 and 50"}
  limit:-1   → 400
  limit:51   → 400
  limit:"bad"→ 400
  limit:2.5  → 400
  limit:20   → 200 {"leaderboard":[]}
  (absent)   → 200 (defaults to 20)
  ```
- `leaderboard.test.ts` limit section rewritten to mirror the strict guard
  (10 checks). `pnpm test` all pass; `pnpm build` clean with identical bundle
  hash — no frontend change, no Pages redeploy needed.

## Known risks

- Aggregation is in-function (not SQL GROUP BY). Acceptable at current scale; if `matches` grows to 100k+ rows, replace with a raw SQL aggregate query via INSFORGE's RPC/execute endpoint, or add a materialized `leaderboard` view refreshed on insert.
- No rate-limiting on the leaderboard function — same posture as balance/history. Turnstile / IP-limit is the deferred fast-follow.
- winRate leaderboard empty until real players accumulate ≥5 matches each.
