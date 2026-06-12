# QA Verification: Match History + Stats — Cycle 21

**Date:** 2026-06-12
**Tester:** qa-bach
**Feature:** `matches` table + `history` edge function + frontend HistoryPanel
**Endpoint:** https://2zzc6u78.functions.insforge.app/history
**Live app:** https://crashout-euq.pages.dev

---

## Verdict: **GO** (with one open risk flagged)

All critical and blocking paths pass. One Major finding (client-controlled delta) was present before this cycle and is acceptable within play-money context but must be tracked.

---

## Test Execution

### 1. Build & Unit Tests

```
pnpm build   → ✓ clean (TypeScript + Vite, 290 kB JS)
pnpm test    → ✓ all checks passed (history.test.ts + all prior test suites)
```

### 2. Live API — Happy Path Round-Trip

Test player: `qa-cycle21-x7k9p`

Recorded 3 matches: win (bet=100, delta=+100, cashout=2.5×), loss (bet=500, delta=−500), draw (bet=250, delta=0).

List response stats:
- total=3, wins=1, losses=1, draws=1
- winRate=0.3333… ✓ (expected 1/3)
- netDelta=−400 ✓ (100−500+0)
- bestCashout=2.5 ✓

Cross-player isolation: player2 (`qa-cycle21-other-player`) listed only 1 own match; original player still showed 4. **Isolation confirmed.**

### 3. Input Abuse Matrix

| Probe | Expected | Actual | Result |
|---|---|---|---|
| bet=75 (not in set) | 400 error | `{"error":"bet must be one of 50, 100, 250, 500"}` | ✓ |
| outcome="bust" | 400 error | `{"error":"outcome must be 'win', 'loss', or 'draw'"}` | ✓ |
| crashPoint=0.5 | 400 error | `{"error":"crashPoint must be a number >= 1"}` | ✓ |
| delta=50.5 (float) | 400 error | `{"error":"delta must be an integer"}` | ✓ |
| missing bet/outcome fields | 400 error | `{"error":"bet must be one of 50, 100, 250, 500"}` | ✓ |
| malformed JSON | 400 error | `{"error":"invalid JSON"}` | ✓ |
| action="delete" | 400 unknown | `{"error":"unknown action"}` | ✓ |
| playerId 65 chars | 400 error | `{"error":"invalid playerId"}` | ✓ |
| limit=999999 | clamped to 50 | returns ≤50 rows | ✓ |
| outcome=loss, delta=+9999999 | **accepted** | `{"ok":true}` | ✗ (see finding F-01) |

---

## Findings

### F-01 — Client controls delta value without server-side cross-validation
**Severity: Major**

The server validates that `delta` is an integer but does not verify it against `bet` and `outcome`. A client can POST `outcome:"loss", delta:9999999` and it is accepted, polluting the player's stats (winRate stays correct, but netDelta and MATCH HISTORY records are garbage).

- **Risk:** Inflated play-money stats; stats panel shows misleading netDelta. No financial impact (play money only). If real money is ever introduced this becomes a Blocker.
- **Evidence:** `curl` with `outcome:"loss", delta:9999999` → `{"ok":true}` → netDelta inflated to 9999599 in subsequent list.
- **Recommendation:** Server should enforce: win→delta=round(cashoutMultiplier×bet−bet), loss→delta=−bet, draw→delta=0. At minimum, clamp abs(delta) ≤ bet×10.

### F-02 — Stats aggregate query fetches ALL rows (unbounded growth)
**Severity: Minor**

The `list` action runs a second DB query (`select outcome, delta from matches where player_id=X`) with no LIMIT to compute aggregate stats. For a prolific player with thousands of rows this becomes a full table scan per request.

- **Risk:** Latency/cost issue at scale. Not user-visible at current player counts.
- **Recommendation:** Replace with a DB-side aggregation (`select count(*), sum(delta), ...`) instead of fetching all rows to JS.

### F-03 — bestCashout computed from paged slice first, then overridden by a third DB query
**Severity: Minor / Code quality**

The code computes `bestCashout` from the already-fetched matches slice (lines 155–159), then immediately discards it and fires a third DB call to get the true best. The first computation is dead code.

- **Risk:** Extra DB round-trip on every list request; code confusion.
- **Recommendation:** Remove the initial slice-based bestCashout computation; keep only the dedicated query.

### F-04 — No rate limiting on record action
**Severity: Minor**

Any caller knowing a valid playerId can insert unlimited match rows. There is no per-player throttle or authentication on the edge function.

- **Risk:** Stats pollution by a malicious caller. Play-money only, so low severity now.
- **Recommendation:** Add per-IP or per-player rate limit (or require an auth header derived from the session).

### F-05 — XSS surface: none (✓ cleared)
HistoryPanel renders all user-facing data via React JSX (no `dangerouslySetInnerHTML`). All dynamic values go through `String()`, `.toFixed()`, or enum-matched string literals. No XSS vector found.

---

## Code Review Notes

- `history.ts` (frontend): correct fire-and-forget pattern, no leaked promises, offline-tolerant. `playerId` sourced from `analytics/logger` module — same identity anchor as the rest of the app. ✓
- `HistoryPanel.tsx`: clean React, no XSS, no uncontrolled rendering. Graceful loading/offline states. ✓
- `history.bundled.ts`: validation logic is thorough for all fields except delta consistency (F-01). CORS headers open (`*`) — intentional for a public game API.
- Migration `20260612110000_matches.sql`: correct DB-level constraints (CHECK clauses mirror server validation), RLS enabled, index on `(player_id, created_at desc)`. ✓

---

## Summary

| ID | Severity | Status |
|----|----------|--------|
| F-01 | Major | Open — delta not cross-validated against bet/outcome |
| F-02 | Minor | Open — unbounded aggregate query |
| F-03 | Minor | Open — dead code + redundant DB call |
| F-04 | Minor | Open — no rate limit on record action |
| F-05 | — | Cleared (no XSS) |

**No blockers. No criticals. Feature ships.**
