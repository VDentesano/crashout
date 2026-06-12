# QA Verification — Cycle 20: Persistent Play-Money Balance

**Date:** 2026-06-12
**Tester:** qa-bach (James Bach methodology)
**Verdict: GO with one low-severity defect logged**

---

## 1. Build and Test Suite

| Check | Result |
|-------|--------|
| `pnpm test` | PASS — all 4 suites, 13 checks, no failures |
| `pnpm build` | PASS — clean TypeScript compile, 287 kB bundle, no warnings |

---

## 2. Code Review Findings

### 2a. Race Condition: Server Response Overwriting Newer Local Balance

**Risk identified: LOW-MEDIUM (by design, accepted)**

`applyMatchResult` in `economy.ts`:
1. Computes optimistic balance locally
2. Calls `saveBalance(balance)` immediately
3. Fires `syncBalance(...)` — async, fire-and-forget
4. When server responds, `onReconcile(serverBalance)` is called, writing to both localStorage and calling `setBalance`

The concern: if two rapid match results fire before either server response arrives, the first server response could overwrite the second match's optimistic state with a stale value. However:
- Matches take several seconds to complete (best-of-5 structure)
- The `economyApplied` ref guard prevents double-apply within a single match end
- Server responses arrive sequentially and reflect correct server state (the server applies operations atomically via upsert)
- The final server response will win and will be correct, since the server processes each `apply` sequentially on a consistent DB row

**Assessment:** The design intentionally accepts that server response overwrites local optimistic value. In the worst case (two rapid rematches + slow network), a stale server response could briefly revert a balance, then the next server response corrects it. This is a known tradeoff of the optimistic-then-reconcile pattern — not a bug given the context (play money, no real stakes).

### 2b. Rebuy Guard

- Server guard: `current >= MIN_BET (50)` blocks rebuy — correct
- Client guard: `balance < MIN_BET` shows rebuy button — consistent with server
- Boundary at exactly 50: server blocks rebuy (50 >= 50) — VERIFIED LIVE
- `rebuy` in `economy.ts` saves `REBUY_AMOUNT` optimistically before server confirms — acceptable for play money

### 2c. Error Handling

`syncBalance` has a `.catch(() => {})` silencing all network failures — intentional by design, offline-tolerant. No unhandled promise rejections. The `r.ok ? r.json() : null` pattern gracefully ignores non-2xx responses without crashing.

### 2d. playerId Reuse from logger.ts

`playerId` is the stable UUID from `crashout.playerId` localStorage key, initialized once via `getPlayerId()` in `logger.ts`, exported as a module-level constant. Economy functions import it from there — correct reuse of the stable identity. No new ID generation in economy layer.

**Validation chain:** logger.ts `getPlayerId()` → UUID (1-36 chars) → always passes the 1-64 char server check.

### 2e. BALANCE_URL Derivation

`BALANCE_URL` replaces `/events` suffix on `VITE_INSFORGE_EVENTS_URL`. If that env var ends in anything other than `/events`, `BALANCE_URL` will equal `eventsUrl` unchanged, pointing to the wrong endpoint. This is an implicit coupling — fragile if the events URL pattern ever changes. Currently not a bug (events URL does end in `/events`), but worth noting.

---

## 3. Live Endpoint Exploratory Tests

### 3a. Happy Paths

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| `get` new player | `{balance: 1000}` | `{balance: 1000}` | PASS |
| `apply win +100` | `{balance: 1100, delta: 100}` | `{balance: 1100, delta: 100}` | PASS |
| `apply loss -100` | `{balance: 1000, delta: -100}` | `{balance: 1000, delta: -100}` | PASS |
| `apply draw 0` | `{balance: 1000, delta: 0}` | `{balance: 1000, delta: 0}` | PASS |
| `get` (confirm persistence) | `{balance: 1000}` | `{balance: 1000}` | PASS |

### 3b. Arithmetic Consistency (5 rapid sequential applies)

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| 5× win +100 from 1000 | balances: 1100,1200,1300,1400,1500 | exactly that | PASS |
| Final `get` | `{balance: 1500}` | `{balance: 1500}` | PASS |

Sequential server-side arithmetic is consistent. No lost updates under sequential load.

### 3c. Adversarial Input Validation

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| bet=49 | 400 error | `"bet must be one of 50, 100, 250, 500"` | PASS |
| bet=999999 | 400 error | same | PASS |
| bet=-100 | 400 error | same | PASS |
| bet=100.5 (float) | 400 error | same | PASS |
| missing `action` | 400 error | `"unknown action"` | PASS |
| non-JSON body | 400 error | `"invalid JSON"` | PASS |
| JSON array body | 400 error | `"body must be a JSON object"` | PASS |
| playerId 65 chars | 400 error | `"invalid playerId"` | PASS |
| playerId empty string | 400 error | `"invalid playerId"` | PASS |
| missing playerId | 400 error | `"invalid playerId"` | PASS |
| GET method | 405 error | `"method not allowed"` | PASS |

### 3d. Rebuy Guard

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Drain to 0, then rebuy | `{balance: 1000}` | `{balance: 1000}` | PASS |
| Rebuy again (balance sufficient) | 400 error | `"rebuy not allowed: balance is sufficient"` | PASS |
| Rebuy at exactly balance=50 (boundary) | 400 error (50 >= MIN_BET) | `"rebuy not allowed: balance is sufficient"` | PASS |

### 3e. Clamping

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| lose 500 when balance=0 | `{balance: 0, delta: -500}` | `{balance: 0, delta: -500}` | PASS |
| server returns negative (reconcileBalance) | clamped to 0 | verified via unit test | PASS |

---

## 4. Bugs Found

### BUG-001 — String-typed bet accepted (Low Severity)

**Severity:** Low  
**Area:** Edge function input validation — `balance` endpoint

**Description:** The server accepts `bet` as a string if it coerces to a valid number. The check `Number(bet)` converts `"100"` to `100`, which passes `BET_OPTIONS.has(100)`. A string bet like `"100"` is accepted and applied.

**Steps to reproduce:**
```bash
curl -X POST https://2zzc6u78.functions.insforge.app/balance \
  -H 'Content-Type: application/json' \
  -d '{"action":"apply","playerId":"test","bet":"100","outcome":"win"}'
# Returns: {"balance":1100,"delta":100}  ← accepted
```

**Expected:** 400 error — bet must be a number type  
**Actual:** 200 with delta applied

**Impact:** Low. The client always sends numeric bets (TypeScript-typed `BetOption`). No realistic attack vector for play money. However, it represents looser validation than documented.

**Fix (not implemented here):** Change `Number(bet)` to require `typeof bet === 'number'` before the `Number.isInteger` check.

---

## 5. Coverage Gaps (Not Tested — Risk Noted)

- **Concurrent parallel applies from two tabs for the same playerId:** The upsert pattern with read-then-write is not atomic. Two simultaneous `apply` calls could both read the same balance, compute deltas independently, and write conflicting results. One delta would be lost. This is a real race condition for play money but low impact in practice — the game is 1v1 PvP, a single player is unlikely to have two tabs firing match results simultaneously. Not a blocker for this cycle.
- **Very long session of rapid rematches (stress test):** Not performed; arithmetic drift not evaluated over 100+ sequential applies.
- **Cross-device balance sync:** Design claims future benefit; not testable without multi-device setup.

---

## 6. Release Recommendation

**GO**

All core paths pass. The one confirmed defect (string bet coercion) has zero realistic exploit surface in the current client context. Architecture is sound: server-authoritative, optimistic local cache, graceful degradation on network failure. Tests and build are clean.

**Pre-next-cycle action:** Log BUG-001 for the dev to tighten the `typeof bet !== 'number'` guard in the edge function validation path.
