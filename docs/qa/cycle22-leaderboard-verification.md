# Cycle 22 QA — Leaderboard Verification

**Date:** 2026-06-12  
**QA:** qa-bach (James Bach philosophy)  
**Verdict:** GO (re-verified after fixes; was NO-GO — see Re-verification section)

---

## Findings

### F-01 — BLOCKER: Garbage Cycle 21 test data permanently tops the netDelta leaderboard

**Severity:** Blocker  
**Area:** Data integrity / product credibility  

Player `qa-cycle21-x7k9p` has `value: 9999599` (netDelta) with `matchesPlayed: 4`. This was injected by Cycle 21 QA to test invalid-delta rejection. The data persists in `matches` and tops the all-time board by a factor of ~20,000x over legitimate players.

**Repro:**
```
POST https://2zzc6u78.functions.insforge.app/leaderboard {"action":"list","limit":1}
→ {"rank":1,"playerId":"qa-cycle21-x7k9p","value":9999599,"matchesPlayed":4}
```

**Impact:** Any real player opening the Leaderboard panel sees rank #1 as a fake test account with an astronomically inflated score. This destroys leaderboard trust on day one.

**Remediation:** Delete all `qa-*` rows from the `matches` table server-side via INSFORGE console or a one-shot edge function call. Also consider adding a server-side sanity cap (e.g., reject delta > bet * MAX_MULTIPLIER) at the `/history` record path to prevent recurrence — though the /history function already validates delta for valid bets.

---

### F-02 — MAJOR: Invalid `limit` values (0, -1, non-number) silently fall back to default 20 instead of returning 400

**Severity:** Major  
**Area:** Input validation / API contract  

The endpoint contract specifies `limit: integer 1–50`. However, `limit: 0`, `limit: -1`, and `limit: "bad"` all return HTTP 200 with the default 20 results. No 400 is returned.

**Repro:**
```
POST {"action":"list","limit":0}   → 200 {leaderboard: [...20 items]}
POST {"action":"list","limit":-1}  → 200 {leaderboard: [...20 items]}
POST {"action":"list","limit":"bad"} → 200 {leaderboard: [...20 items]}
```

**Root cause:** Code path in `leaderboard.bundled.ts` lines 71–74: invalid limit silently falls back to `DEFAULT_LIMIT`. This is a silent coercion, not explicit validation.

**Impact:** Clients sending garbage limit values receive no indication of error. Less severe than F-01 but violates the documented contract. If a client sends `limit:0` expecting an empty response (e.g. existence check), it gets 20 rows instead.

**Remediation:** Add explicit rejection before the fallback:
```ts
if (limitRaw !== undefined && (typeof limitRaw !== 'number' || !Number.isInteger(limitRaw) || limitRaw < 1)) {
  return json(400, { error: 'limit must be an integer between 1 and 50' });
}
```

---

### F-03 — Minor: 7d window shows same count as all-time (no historical data to distinguish)

**Severity:** Minor / Informational  
**Area:** Time window filtering  

All 7 players in the DB have matches within the last 7 days (all seeded today), so the 7d filter cannot be verified as excluding old data. The filter logic is correct in code (line 91–93: `gte('created_at', since)`), but live verification of exclusion is not possible without historical rows.

**Assessment:** Code path is correct; risk is low. Will self-verify as the product ages.

---

### F-04 — Minor: `bestCashout` tie-break at `value: 5` is map-iteration-order-dependent

**Severity:** Minor  
**Area:** Ranking determinism  

`qa-cycle22-playerA` (4 matches) and `qa-cycle21-other-player` (1 match) both have `bestCashout: 5`. Tie-break is `matchesPlayed desc`, which correctly ranks playerA first. Verified live:
```
POST {"action":"list","metric":"bestCashout","limit":3}
→ rank 1: qa-cycle22-playerA (4m), rank 2: qa-cycle21-other-player (1m)
```
Tie-break works correctly.

---

## Correctness Verification (PASS where noted)

| Check | Expected | Actual | Result |
|---|---|---|---|
| netDelta top player | qa-cycle21-x7k9p (garbage) | qa-cycle21-x7k9p value:9999599 | CONFIRMED (F-01) |
| qa-cycle22-playerA netDelta | +200 (3×+100, 1×-100) | value:200, matchesPlayed:4 | PASS |
| qa-cycle22-playerB winRate | 0.4 (2/5), qualifies | rank:1, value:0.4, matchesPlayed:5 | PASS |
| qa-cycle22-playerA NOT in winRate | <5 matches → excluded | not present | PASS |
| bestCashout playerA | 5.0 (max of 2.5,5.0,2.0) | value:5 | PASS |
| limit 9999 clamped to 50 | ≤50 entries | 7 entries (< 50, correct) | PASS |
| limit 0 → fallback 20 | 200 with default | 200 with 7 rows | PASS (but see F-02) |
| 7d window | entries restricted | 7 (same as all-time, F-03) | INDETERMINATE |

---

## Input Abuse (all return correct HTTP status)

| Input | Expected | Actual | Result |
|---|---|---|---|
| `action:"delete"` | 400 | `{"error":"unknown action"}` | PASS |
| `metric:"totalWins"` | 400 | `{"error":"metric must be..."}` | PASS |
| `window:"30d"` | 400 | `{"error":"window must be..."}` | PASS |
| missing body | 400 | `{"error":"invalid JSON"}` | PASS |
| malformed JSON | 400 | `{"error":"invalid JSON"}` | PASS |
| GET method | 405 | `{"error":"method not allowed"}` | PASS |
| huge metric string (10k chars) | 400 | `{"error":"metric must be..."}` | PASS |
| `limit:0` | 400 (per contract) | 200 (F-02) | FAIL |
| `limit:-1` | 400 (per contract) | 200 (F-02) | FAIL |
| `limit:"bad"` | 400 (per contract) | 200 (F-02) | FAIL |

---

## Frontend Code Review (PASS)

- `leaderboard.ts`: URL derivation from `VITE_INSFORGE_EVENTS_URL` (`/events` → `/leaderboard`) correct. All errors silently return null (offline-tolerant).
- `LeaderboardPanel.tsx`: Metric tabs (NET/BEST×/WIN%) and window toggle (ALL TIME/7 DAYS) correctly wired via `useState` + `useEffect`. State changes trigger re-fetch.
- Current player highlight: `entry.playerId === currentPlayerId` → adds `lb-row-me` class and ★ suffix. Correct.
- Offline tolerance: `!data` state shows "Unavailable offline." message. Correct.
- Empty winRate handled with custom message "No players with ≥5 matches yet." Correct.

---

## Build / Tests

- `pnpm test`: All 27 leaderboard unit tests pass + all prior suites pass. PASS
- `pnpm build`: Clean, 293.60 kB JS bundle, no TypeScript errors. PASS

---

## Scale / Performance Risk

In-function JS aggregation fetches all matching `matches` rows into memory, then groups in a Map. At current scale (~7 rows) this is fine. Risk materializes at:

- **~10k rows**: noticeable latency (100–300ms extra)
- **~100k rows**: likely timeout (Deno edge functions typically 30s max, but memory is the binding constraint)
- **Mitigation path**: Replace with a SQL `GROUP BY` via INSFORGE's raw execute/RPC endpoint, or add a materialized `leaderboard_summary` view refreshed by a DB trigger/cron.

The composite index `(player_id, outcome, delta, created_at)` is present and will help with 7d window scans but does not eliminate the full-table fetch for aggregation.

---

## Initial Verdict: NO-GO (superseded)

1. **F-01** (Blocker): garbage test data at rank #1.
2. **F-02** (Major): silent `limit` fallback instead of 400.

---

## Re-verification (same day, post-fix)

**F-01 — FIXED.** All test rows (`qa-%`, `test-%`, `lb-seed-%`) deleted; `matches` table empty.
- `POST {action:'list'}` → `{"leaderboard":[]}` — no test players.
- Re-seeded 3 matches via /history (prefix `qa-cycle22r-`): rankings correct — `qa-cycle22r-b` +500 rank 1, `qa-cycle22r-a` +200 (2m) rank 2.
- Seed rows deleted via `npx @insforge/cli db query`; board confirmed empty again.

**F-02 — FIXED.** Strict limit guard verified live:
- `limit: 0, -1, 51, "bad", 2.5` → all HTTP 400.
- `limit: 1, 20, 50` and absent → all HTTP 200.

**Tests:** `pnpm test` passes including the 10 new strict-limit checks. No frontend change.

## Final Verdict: GO

Remaining known risks (non-blocking, tracked): in-function aggregation scale limit (~100k rows), no rate limiting (deferred fast-follow), 7d window exclusion unverifiable until data ages (F-03).
