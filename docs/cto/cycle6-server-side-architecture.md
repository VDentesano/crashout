# ADR — Cycle 6: Server-Authoritative Crash Engine on INSFORGE

**Author:** Werner Vogels (cto-vogels)
**Status:** Proposed → build in Cycle 7
**Context:** CRASHOUT 1v1 Crash PVP, Ladder Duel best-of-5, async ghost opponent. Play-money now, on-chain crypto later.
**Directive (verbatim):** "do not leave server-side logic for later if we can do it now" + make it "100% functional to launch to market."

---

## 0. TL;DR

The current "provably fair" scheme is **theater**. `generateRound()` (`src/game/crashEngine.ts:52`) mints the server seed **in the browser** and the crash point lives in `proof.crashPoint` in client JS for the entire round. A bot reads it and cashes one tick early — every time. 100% win rate, zero risk.

The fix is one structural change: **the server generates the round, returns only `serverSeedHash` up front, and keeps `crashPoint` SECRET until the client has committed its cashout time.** The instant `crashPoint` is no longer in client JS, a bot is *epistemically blind — in the exact same position as a human*. It must decide when to cash without knowing the crash. That single change kills the entire exploit class.

We do this with INSFORGE edge functions (Deno, request/response) + a Postgres `rounds` table holding the secret. **No websocket. No Durable Object. Not yet.** For play-money this is good enough, and I will be honest below about exactly where the residual gap is (it is small and it is acceptable).

---

## 1. Constraints & Requirements

**Hard constraints:**
- INSFORGE gives us **request/response edge functions only** — no server push, no websocket. The multiplier curve is continuous; the player cashes "live." We must adjudicate a continuous-time event over a stateless HTTP round-trip.
- Keep the **async ghost** design (recorded intent arrays replayed locally — `src/game/ghosts.ts`). The spec mandates ghosts so the lobby is never empty. **No live matchmaking.** Ghosts stay 100% client-side.
- pnpm. Boring tech. Monolith first. Ship.

**Requirements:**
1. `crashPoint` never reaches the client before the cashout is committed.
2. The client can still render a smooth rising curve at 60fps (rendering stays local).
3. A player can verify the round was fair *after* it resolves (real commit-reveal).
4. Minimum viable anti-bot before traffic; nothing speculative.

---

## 2. The Core Fix — Secret Crash Point + Committed Cashout

### 2.1 The security claim, right-sized

The exploit today is "read `proof.crashPoint`, cash at `crashPoint − ε`." We remove `crashPoint` from the client. That's the **95% win.** Once the crash point is secret:

- A bot and a human have **identical information**: the live multiplier and nothing else.
- There is no oracle to read. The bot can play a *strategy* (always cash at 1.5x), but it cannot play *perfectly*. That's just a player with a policy — which is fine, that's the game.

**The only residual gap** in a request/response model is **live-click latency arbitrage**: the ~100–300ms round-trip between the client clicking and the server timestamping. We do NOT achieve frame-perfect server adjudication without a websocket. For **play-money, this is acceptable** and I will not pretend otherwise. When real money is on the line, §7 names the upgrade (Durable Objects). We are not building that now.

### 2.2 The invariant (write this on the wall)

> **The client never receives `crashPoint` until it has committed a cashout time (or committed `null` = "I'm riding it").**

Everything below exists to enforce that one sentence.

### 2.3 Why we can trust the client's claimed cashout time

This is the argument that justifies the whole approach — it must be spelled out, not hand-waved.

The client sends `clientElapsedMs` (how long after round start it clicked). The server:
1. **Clamps** it: `elapsed = min(clientElapsedMs, serverReceiveTs − serverStartTs + SLACK)` where `SLACK ≈ 250ms` covers honest network latency. A client cannot claim a time in the future beyond the slack window.
2. Then reason through self-interest **with `crashPoint` secret**:
   - Claiming an **earlier** time only **lowers your own multiplier** (curve is monotincreasing) — self-harm.
   - Claiming a **later** time risks **crossing the secret crash** and busting — you don't know where it is.
   - **There is no winning lie.** The optimal honest play and the optimal cheating play converge, because the cheater is blind.

That is the entire safety proof for trusting a client timestamp. It holds *only* because the crash point is secret. The clamp handles the one dishonest direction (claiming the future) that secrecy alone doesn't cover.

---

## 3. Request / Response Flow (INSFORGE edge functions)

Three edge functions. All under `backend/functions/`. Secrets (`INSFORGE_SERVICE_KEY`, `ROUND_HMAC_KEY`, `TURNSTILE_SECRET`) held server-side via INSFORGE function secrets, never shipped.

```
┌──────────┐   1. session/start (Turnstile)      ┌─────────────────┐
│  Client  │ ───────────────────────────────────▶│  edge: session  │──┐
│ (React)  │ ◀─────────── sessionToken ──────────│                 │  │
└──────────┘                                       └─────────────────┘  │
     │                                                                   ▼
     │ 2. round/start {sessionToken, clientSeed}        ┌──────────────────────┐
     │ ────────────────────────────────────────────────▶  edge: round-start   │
     │                                                  │  - gen serverSeed     │
     │ ◀── {roundToken, serverSeedHash, serverStartTs} ─│  - compute crashPoint │
     │     (crashPoint NOT returned)                    │  - INSERT rounds row  │
     │                                                  └──────────┬───────────┘
     │  [client renders rising curve locally]                      │ writes secret
     │                                                             ▼
     │ 3. round/cashout {roundToken, clientElapsedMs|null}   ┌──────────┐
     │ ─────────────────────────────────────────────────────▶ Postgres │
     │                                                       │ rounds   │
     │ ◀── {outcome, playerMultiplier|null, crashPoint, ─────│ (secret) │
     │      serverSeed, clientSeed, nonce}  ← FULL REVEAL    └──────────┘
     └────────────────────────────────────────────────────── edge: round-cashout
```

### 3.1 `edge: session-start`
- **In:** `{ turnstileToken }`
- Verifies Turnstile server-side (`TURNSTILE_SECRET`) against Cloudflare siteverify.
- Mints a `sessionToken` (random, signed/stored), TTL ~30 min, bound to IP. Stored in `sessions` table.
- **Out:** `{ sessionToken }`
- **Purpose:** a round can only be minted by a holder of a valid session token. Headless mass round-minting is blocked at the door.

### 3.2 `edge: round-start`
- **In:** `{ sessionToken, clientSeed }`
- Validates `sessionToken` (exists, not expired, IP matches). Rate-limit check (§4).
- Server generates `serverSeed = randomHex(32)` **on the server**.
- `serverSeedHash = sha256(serverSeed)`, `roundHash = HMAC(serverSeed, clientSeed:nonce)`, `crashPoint = crashPointFromHash(roundHash)` — same math as today's `crashEngine.ts`, **moved server-side**.
- `INSERT` into `rounds`: `{ roundToken (random uuid), playerId, crashPoint, serverSeed, serverSeedHash, clientSeed, nonce, serverStartTs (now), consumed=false, expiresAt (now + 60s) }`.
- **Out:** `{ roundToken, serverSeedHash, serverStartTs, nonce }` — **crashPoint and serverSeed withheld.**

### 3.3 `edge: round-cashout` (the terminal — get this right)

There are **two** ways a round ends. Both go through this one endpoint. **The client cannot detect a bust on its own** (it doesn't know `crashPoint`), so it MUST send a resolve request either way.

- **In:** `{ roundToken, clientElapsedMs }` where `clientElapsedMs` is a number (player clicked Cash Out) **or `null`** (player chose to ride it to the bust — "resolve me").
- Load `rounds` row by `roundToken`. Reject if missing, `consumed=true` (replay), or `expiresAt < now` past grace.
- **Mark `consumed=true` immediately** (single-use; prevents replay/double-cash).
- Adjudicate:
  - If `clientElapsedMs === null` → player rode it → `playerMultiplier = null` (bust), outcome computed vs ghost.
  - Else `elapsed = min(clientElapsedMs, (serverReceiveTs − serverStartTs) + SLACK)`; `m = multiplierAt(elapsed)`.
    - If `m >= crashPoint` → the crash beat the click → `playerMultiplier = null` (bust).
    - Else → `playerMultiplier = m` (banked).
- **Out (FULL REVEAL):** `{ playerMultiplier, crashPoint, serverSeed, clientSeed, nonce, serverSeedHash }`.
- Client now has everything to: (a) animate the curve to its true crash, (b) resolve the ghost (`resolveGhost(intent, crashPoint)`), (c) verify the commit-reveal.

**Token-TTL fallback:** if the client never sends cashout (tab closed, network drop), the row simply expires `consumed=false`; a nightly job (or lazy read) treats unconsumed-expired rounds as abandoned (no result logged). No money is at stake, so abandonment = no-op.

---

## 4. Anti-Bot Architecture (minimum viable)

| Layer | Mechanism | Before traffic? | Why |
|---|---|---|---|
| **Turnstile gate** | Cloudflare Turnstile on `session-start`; no token → no session → no rounds | **YES** | Stops headless browsers mass-minting rounds. The cheapest highest-leverage control. Cloudflare-native, free. |
| **Session token to mint rounds** | `round-start` requires a valid `sessionToken`. Tokens are server-issued, IP-bound, TTL'd. Cannot be forged client-side. | **YES** | A bot can't skip the human-check and go straight to round-start. |
| **Server-issued round token** | `roundToken` is random, single-use, server-minted, stored in Postgres. Cashout consumes it. | **YES** | No client can fabricate a round or replay one. Adjudication authority is server-only. |
| **Per-identity rate limit** | At the edge function: cap rounds/min per `playerId` and per IP (count `rounds` rows in a sliding window, or a `rate_limits` counter row). | **YES (basic)** | A human plays ~6–12 rounds/min. Cap at e.g. 40/min. Blunt but sufficient pre-launch. |
| **Behavioral detection** | Flag inhuman cashout timing variance, identical clientElapsedMs, win-rate outliers. | **AFTER ~300 players** | Needs a data baseline. Premature now — don't build it. |
| **Proof-of-work / device fingerprint** | Heavier friction. | **LATER, only if abused** | Don't add friction we don't yet need. |

**Honest limit:** none of this stops a determined human running a *legitimate strategy* (always cash at 1.4x). That is not cheating — it's a playstyle, and with the house edge / ghost dynamics it's fine for play-money. We are defending against *omniscient* bots, and secrecy + the above does that.

---

## 5. Migration Path — What Moves, What Stays

The beauty of this design: **rendering stays client-side, authority moves server-side.** The rAF loop in `useMatch.ts` barely changes.

| Concern | Today | After |
|---|---|---|
| `serverSeed` generation | browser (`crashEngine.ts:53`) | **server** (`round-start`) |
| `crashPoint` computation | browser, exposed in `proof` | **server**, secret in `rounds` table |
| `serverSeedHash` (commit) | browser | **server**, returned up front |
| Rising curve render (`multiplierAt`, rAF loop) | browser | **browser (unchanged)** — purely cosmetic, no authority |
| Player cashout decision | browser compares to `proof.crashPoint` (`useMatch.ts:276`) | **server** adjudicates `clientElapsedMs` vs secret crashPoint |
| Ghost live cash animation (`m >= intent`) | browser | **browser (unchanged)** — needs only live multiplier, not crashPoint |
| Ghost final bust resolution (`resolveGhost`) | browser, at round start | **browser, but deferred to the cashout REVEAL** (now it has crashPoint) |
| Round/match logging (`events` fn) | unchanged | unchanged |

### 5.1 Concrete client changes

- **`crashEngine.ts`**: keep `multiplierAt`, `timeToReach`, `crashPointFromHash` (verification reuses it). **Delete `generateRound` from the client path** — seed generation is now a server call. (Keep `crashPointFromHash` exported for the verify widget.)
- **`useMatch.ts`**:
  - `startRound()` → `await insforge.functions.invoke('round-start', {...})` instead of `generateRound()`. Store `roundToken`, `serverSeedHash`, `serverStartTs`. **Do not** store `crashPoint` (we don't have it yet).
  - The rAF loop **no longer reads `proof.crashPoint`** to detect the crash. It just renders `multiplierAt(elapsed)` rising. It cannot end the round on its own anymore.
  - The round ends when the **player clicks Cash Out** (`cashOut()` → invoke `round-cashout` with `clientElapsedMs`) **or** the player explicitly chooses to ride (a "ride it" affordance, or an auto-resolve when the curve passes some max display ceiling → invoke with `clientElapsedMs: null`).
  - On the cashout response: now we have `crashPoint`. **Animate the curve to its true crash, then run `resolveGhost(intent, crashPoint)` and `resolveRound()`** with the revealed values.
- **The "crash moment" UX — be honest, this has a real consequence.** Because the client doesn't know `crashPoint`, the rendered curve **keeps rising past the true crash** until the player acts. Three cases:
  - Player cashes at displayed X, real crash > X → server confirms ~X. Clean, no snap.
  - Player cashes at displayed X, **real crash < X** (player rode past the hidden crash) → server returns **bust at Y < X**. The UI must snap *down* from a multiplier the player already saw on screen: "I clicked at 5x and you told me I busted at 2x." **This is NOT invisible** — it is the core loss case, and it happens on exactly the rounds that matter. It is a retroactive correction inherent to request/response. **Mitigated, not eliminated**, by tuning curve speed + a display ceiling so the curve rarely runs far past the likely crash. **Eliminated only by Durable Objects** (server push, §7).
  - Player rides to ceiling / sends `null` → snaps to the revealed crashPoint. Acceptable (felt as "I gambled and lost").

  This is the honest latency cost of having no websocket. It is tolerable for play-money. It is the single strongest reason to move to DO before real money.

### 5.2 Ghost design — untouched

Ghosts stay fully client-side. `pickGhostRun()`, intent replay, the live "ghost cashes the instant m ≥ intent" animation — all unchanged. Only `resolveGhost(intent, crashPoint)` (the bust check) moves from round-start to the reveal callback, because that's when crashPoint first exists on the client. **Zero server work for ghosts.**

---

## 6. Provably Fair — Done Right

Real commit-reveal, now that the server owns the seed:

1. **Commit (before round):** `round-start` returns `serverSeedHash = sha256(serverSeed)`. Client stores it. The server is now *bound* — it cannot change `serverSeed` after the fact without breaking the hash.
2. **Play:** `crashPoint` stays secret in Postgres. Client plays blind.
3. **Reveal (after cashout):** `round-cashout` returns `serverSeed`, `clientSeed`, `nonce`, `crashPoint`.
4. **Verify (client-side widget, reusing existing math):**
   - `sha256(serverSeed) === serverSeedHash` ? (server didn't swap the seed)
   - `crashPointFromHash(HMAC(serverSeed, clientSeed:nonce)) === crashPoint` ? (crash was derived, not chosen)
5. **Client-seed contribution (optional, real-money-grade):** let the player supply `clientSeed` at session start so the server cannot precompute a player-specific crash. For play-money, a fixed `clientSeed` per session is fine; the commit-reveal already prevents post-hoc manipulation.

**Honest scope of this scheme:** because `round-start` receives `clientSeed` and generates `serverSeed` in the *same call*, the server could in principle grind `serverSeed` against the known `clientSeed` to pick a favorable `crashPoint` *before* committing the hash. So this scheme **prevents post-commit seed swapping (which is what matters for a no-house-profit play-money game) but NOT pre-commit grinding.** True grind-proofing (the full bustabit standard) requires a **precommitted serverSeed hash chain generated before any clientSeed exists** — a real-money upgrade, landing with Durable Objects. Do not claim "bustabit-grade" until then. What we ship in Cycle 7 is still genuinely verifiable and strictly stronger than today (the seed no longer lives in the same JS that adjudicates the round).

---

## 7. Phasing

### Cycle 7 (buildable now — request/response, no websocket)
Everything in §2–§6. INSFORGE edge functions + Postgres `rounds`/`sessions` tables. This is the **monolith-first** answer and it ships a genuinely fair, bot-resistant play-money game.

### Later (real-money grade — do NOT build now)
- **Cloudflare Durable Objects** for true real-time server authority: the server owns the tick clock and pushes the crash over a websocket, eliminating the live-click latency gap entirely. This is the *correct* answer for money on the line. It is also more infra, more ops, more cost. **Premature for play-money. Named here so we don't reinvent it later.**
- Behavioral anti-bot (post-300-players, data-driven).
- On-chain escrow + settlement (separate ADR when crypto lands).

### Cycle-7 Build Checklist
1. **Postgres `rounds` table** — `roundToken (uuid pk)`, `playerId`, `crashPoint`, `serverSeed`, `serverSeedHash`, `clientSeed`, `nonce`, `serverStartTs`, `consumed (bool)`, `expiresAt`. Index on `roundToken`. **crashPoint/serverSeed are NEVER selected by anon-key reads** — only the service-key edge function reads them.
2. **Postgres `sessions` table** — `sessionToken`, `ip`, `expiresAt`.
3. **`edge: session-start`** — Turnstile siteverify (`TURNSTILE_SECRET`), mint sessionToken.
4. **`edge: round-start`** — validate session, generate seed + crashPoint server-side, insert row, return `{roundToken, serverSeedHash, serverStartTs}` (withhold crashPoint).
5. **`edge: round-cashout`** — load by roundToken, mark consumed (replay guard), clamp `clientElapsedMs`, adjudicate vs secret crashPoint (incl. `null`=ride/bust), FULL REVEAL response.
6. **Function secrets** set via INSFORGE: `INSFORGE_SERVICE_KEY`, `ROUND_HMAC_KEY`, `TURNSTILE_SECRET`.
7. **Per-IP / per-playerId rate limit** in `round-start` (sliding-window count or counter row).
8. **Client: `useMatch.ts`** — replace `generateRound()` with `round-start` invoke; rAF loop renders curve only; round ends on cashout/ride invoke; resolve ghost + round on reveal.
9. **Client: `crashEngine.ts`** — remove client `generateRound` from the play path; keep `crashPointFromHash`/`multiplierAt`/`timeToReach`.
10. **Client: Turnstile widget** on session start + verify widget (commit-reveal check) on round-end screen.
11. **Local build before deploy** (pnpm); deploy edge functions via INSFORGE CLI; smoke-test the three endpoints (start→round→cashout reveal).

### Complexity & ops cost
- **Build:** ~1 cycle. Three small Deno functions (the `events` function already proves the pattern — service key server-side, CORS, JSON) + two tables + ~80 lines of client wiring.
- **Ops:** low. Stateless functions, Postgres holds the secret. No new infra to run. Failure modes: round-start fails → retry (idempotent on a fresh token); cashout fails → client retries with same `roundToken` (consumed flag makes it safe). Blast radius of a function crash = one round, not the match.
- **The honest caveat, restated:** ~100–300ms live-click latency gap remains. Acceptable for play-money. Closed by Durable Objects when real money arrives.
