# Cycle 6 — Market-Readiness Pre-Mortem & Inversion

**Author:** critic-munger (Charlie Munger thinking model)
**Date:** 2026-06-11
**Subject:** Should CRASHOUT receive traffic with the 6 play-test issues unfixed? Inversion + Pre-Mortem.
**Verdict in one line:** **DO NOT drive traffic yet.** Four of the six issues are fatal *before* traffic — but only two of them require real work, and the user's "full server-side crash engine" demand is 80% wasted motion for a play-money launch. Fix the cheap-but-fatal four, veto the expensive theater, ship.

---

## 0. The Only Two Questions That Decide "Fatal"

Reverse the user's framing. The user says "make it 100% functional." That is a trap — "100% functional" is an infinite checklist that never ships and never measures anything. Munger does not ask "is it perfect." Munger asks: **how does this kill us?**

This launch exists for exactly one reason: **to measure rematch rate** (the Ladder Duel gate). Everything else is downstream. So there are only two tests for FATAL-before-traffic:

1. **Does it corrupt the gate?** (We'd be measuring the wrong thing, or nothing.)
2. **Is it an active lie to the user?** (Branding that the code contradicts. This destroys trust before crypto, when trust is the only asset.)

If an issue fails neither test, it is FIXABLE-LATER **by definition** — no matter how "unpolished" it feels. Polish that doesn't corrupt the gate or lie to users is vanity, and vanity before traffic is how you spend two weeks shipping nothing.

---

## 1. Inversion — How Exactly Does This Product Fail If We Launch As-Is?

Assume it is six months from now and CRASHOUT failed. Here are the failure chains, ranked by how certain they are.

### Failure Chain A — "We measured a ghost game" (CERTAINTY: near 100%)
We drove traffic. The gate read **low rematch rate**. The CEO killed Ladder Duel as the wrong mechanic. **But the number was a lie**, because:
- **(Issue 1)** Players saw the opponent's exact target every round. The rematch decision stopped being emotional ("damn, I bailed at 1.4 and the crash was 3.0, ONE more") and became arithmetic ("ghost cashed 1.85, I just need 1.86"). We measured a *solved puzzle*, not a *crash duel*. The thing that makes crash sticky — the bail-or-greed gut-punch — was never in the experiment.
- **(Issue 6)** Worse: the deployed build was stale and sent **zero events to the backend**. The gate panel said "LOCAL." We measured one device, or nothing. We made a strategic kill decision on **noise**.

This is the deadliest chain because it is silent. We don't see an error. We see a *number*, we trust it, and it's garbage. Munger's nightmare: a confident decision built on a corrupted instrument.

### Failure Chain B — "We got botted into a false negative" (CERTAINTY: medium-high once we promote)
We promote on social. A bored scripter (or a competitor) points a headless loop at the ingest endpoint — there's no rate limit **(Issue 4)** and the crash point sits in client JS **(Issue 3)**. Bots play perfectly and never rematch emotionally (bots have no emotions). The gate reads "not sticky." We kill a mechanic that was actually fine. Same outcome as Chain A, different cause.

### Failure Chain C — "We told them it was provably fair, and it wasn't" (CERTAINTY: 100% if anyone technical looks)
We promote "provably fair, crypto soon." A Twitter/Discord crypto-native opens DevTools, sees `crashPoint` computed in the browser before the round ends **(Issue 3 / crashEngine.ts:61)**, and posts "CRASHOUT 'provably fair' is fake, the client knows the crash point." That screenshot is the launch. In crypto, the *accusation* of a rigged/fake-fair game is unrecoverable — it precedes any money. We poisoned the brand for a claim we didn't need to make yet.

### Failure Chain D — "They came, didn't understand, and never came back" (CERTAINTY: medium)
**(Issue 2)** Players can't see their score, the active scoring rule, points-to-win, or whether they're winning. They lose the match, don't know why, and leave. Rematch rate drops — **not because the mechanic is unsticky, but because the HUD is illegible.** This *also* corrupts the gate: we'd blame the mechanic for a UI failure. (This is product-norman's deep dive, but it touches the gate, so it's in scope here.)

### Failure Chain E — "They came once and had no reason to think about us again" (CERTAINTY: low/slow)
**(Issue 5)** No "crypto coming soon," no links. A curious player plays, shrugs, leaves, forgets. This does **not** corrupt the gate and is **not** a lie. It's a missed opportunity, not a fatal flaw. Slow bleed, not a bullet.

**Lollapalooza warning:** Chains A, B, and D all converge on the *same* corrupted output — a falsely-low rematch rate. Three independent causes pushing the gate the same wrong direction. That is exactly the multi-cause confluence that produces a confident, catastrophic, wrong decision. This is why the gate-integrity fixes are non-negotiable: we are about to make a strategic kill/keep call on this number.

---

## 2. The Six, Classified — Theater vs. Real

| # | Issue | Fails which test? | Ruling | Real or Theater | Cost |
|---|-------|-------------------|--------|-----------------|------|
| 1 | Opponent reveals cash-out live | **Corrupts gate** | **FATAL** | Real corruption | ~Near-zero (stop rendering one value live) |
| 6 | Stale build → events not flowing (shows LOCAL) | **Corrupts gate (measures nothing)** | **FATAL** | Real | Near-zero effort, but **human-gated** (redeploy) |
| 3 | All logic client-side / "provably fair" is fake | **Active lie** (the *claim*, not the execution) | **FATAL — but only the seed-commit part** | Mostly theater to fix fully | Small (seed-commit) vs. Huge (full engine) |
| 2 | HUD hides score/rule/points-to-win/status | **Corrupts gate** (illegibility → false unsticky) | **FATAL (minimum HUD only)** | Real | Low-moderate (frontend only) |
| 4 | No anti-bot/anti-cheat | **Corrupts gate** (bot floods) | **PARTIAL — rate-limit only** | Mostly defer | Low (one endpoint guard) |
| 5 | No commercial "crypto soon" / viral loop | Neither | **FIXABLE-LATER** | Vanity-before-traffic | Low but not required |

---

## 3. Ruling — Issue 1: Does the live reveal invalidate the rematch gate? **YES. Unambiguously.**

This is the contested question and the answer is not close.

The rematch rate is supposed to measure **emotional stickiness** — the "one more, I bailed too early / I got greedy" reflex that defines crash games. `useMatch.ts:194-200` reveals the ghost's exact cash-out the instant the live multiplier crosses it (`m >= intent` → render `fmt(ghostCashed)` at `App.tsx`). The moment the player sees "ghost cashed 1.85×," the round stops being a nerve game and becomes **arithmetic**: cash out at 1.86 and win.

You are no longer measuring "does the bail-or-greed tension make people come back." You are measuring "do people enjoy a trivially-solved target-chase." **That is a different game than the one you will attach crypto to.** Whatever rematch number it produces does not transfer to the real product. The gate is invalidated. **FATAL, and the fix is one of the cheapest on the board** — stop revealing `ghostCashed` mid-round; reveal it only at round-end (keep "riding…", drop the live number). High impact, near-zero cost: this is the most obvious fix in the entire cycle.

---

## 4. Ruling — Issue 3: Is a full server-authoritative crash engine a MUST-HAVE now? **NO. This is where I veto wasted motion.**

The user collapsed two very different things into one demand. Split them:

- **(a) Server seed-COMMIT** — the server publishes `serverSeedHash` *before* the round and reveals `serverSeed` *after*. This is the SMALL piece that converts "provably fair" from **theater into truth**. Right now `crashEngine.ts:53` generates the seed in the browser, so the client knows everything — "provably fair" is a marketing lie (Failure Chain C). The commit is cheap: one edge function returns a pre-committed hash; the client can't see the seed until reveal.
- **(b) Server-authoritative EXECUTION** — moving the rAF timing loop, multiplier tick, and cashout resolution server-side so the client *never* holds `crashPoint`. This is **expensive** (real-time server loop, latency, reconnection, state sync) and **for play-money it buys nothing**: there is no money to steal by reading the crash point early. A bot reading `crashPoint` in a play-money game wins fake points. So what.

**Ruling:** The minimum that is **not a lie** is **(a) OR an honesty fix.** Concretely, do ONE of:
1. Implement the server seed-commit (server commits hash before round, reveals after), **or**
2. **Stop branding it "provably fair"** — say "fair crash, on-chain verifiable coming with crypto" — until (a) ships.

Either satisfies the only binding constraint (don't lie). I **VETO full server-authoritative execution (b) as a pre-traffic requirement.** It is precisely the expensive, plausible-sounding scope that Munger exists to brake. The user's directive "don't leave server-side logic for later if we can do it now" is **fully satisfied by the seed-commit (a)** — that IS doing the server-side logic that matters now. It does not compel the execution engine, and pretending it does would burn two weeks to protect fake points from imaginary thieves.

(Note for cto-vogels: if the seed-commit is genuinely as cheap as it looks, do it — it kills Failure Chain C *and* is the honest move. If it slips, fix the branding string in the same commit as Issue 1. The branding fix is 5 minutes and removes the lie immediately.)

---

## 5. Ruling — Issues 2, 4, 5: Minimum vs. Over-Fix

- **Issue 2 (HUD):** FATAL but **minimum only.** The gate needs the player to understand win/loss or Chain D corrupts it. Minimum = (1) cumulative score visible, (2) points-to-win visible, (3) winning/losing indicator. The active-scoring-rule indicator (banked vs drop-lowest) is *nice* but defer it if it costs more than an hour — it doesn't corrupt the gate, it just adds polish. Hand the exact minimum to product-norman; don't gold-plate the HUD.
- **Issue 4 (anti-bot):** **Rate-limit the ingest endpoint. That's it.** A single rate-limit on the events endpoint stops a bot from swamping the gate with thousands of emotionless matches (Chain B). CAPTCHA, fingerprinting, bot-detection = **DEFER until after first ~300 real players.** Building a fingerprinting stack before you have a single user is the textbook over-engineering Munger mocks. Veto everything beyond rate-limiting.
- **Issue 5 (commercial):** **FIXABLE-LATER.** It fails neither test. To "promote it" you need exactly ONE line ("Crypto rake coming soon — play free now") and a links button. That's 30 minutes and it's the *only* commercial item that is even arguably pre-traffic. The viral loop, roadmap, wallet-connect stub = defer. This is marketing-godin's call, not a blocker.

---

## 6. Self-Serve vs. Human-Gated (so the list is actually actionable)

A minimum set with a hidden human dependency is not a plan. Mark them:

| Fix | Loop can self-serve? |
|-----|----------------------|
| Issue 1 — stop live ghost reveal | **YES** (code) |
| Issue 2 — minimum HUD | **YES** (code) |
| Issue 3 — seed-commit OR drop "provably fair" wording | **YES** (code + edge fn) |
| Issue 4 — rate-limit ingest endpoint | **YES** (edge fn) |
| **Issue 6 — rebuild + REDEPLOY** | **NO — HUMAN-GATED.** `wrangler login` belongs to the user. The loop can rebuild `dist`, but the user must run the deploy. |

**Issue 6 is the critical path and the loop cannot finish it alone.** The committed `dist` is stale; the events URL is already in source. Fix = `pnpm build` + redeploy. The build is self-serve; the deploy is the user's hands. **Flag this loudly to the CEO and user: no redeploy = no events = no gate, full stop.** Issues 1, 2, 3, 4 are worthless until 6 ships, because their fixes also live in `dist` and won't reach a single player until someone redeploys.

---

## 7. MINIMUM-BEFORE-TRAFFIC

Do these. Nothing else. Then drive traffic.

1. **Kill the live opponent reveal (Issue 1).** Stop rendering `ghostCashed` mid-round; reveal only at round end. *[self-serve, near-zero cost, restores the gate]*
2. **Minimum HUD (Issue 2):** cumulative score + points-to-win + winning/losing indicator visible during the match. *[self-serve]*
3. **Stop the lie (Issue 3):** ship the server **seed-commit**, OR remove "provably fair" wording until it ships. Pick one in this cycle. **VETO the full server-authoritative execution engine.** *[self-serve]*
4. **Rate-limit the ingest endpoint (Issue 4).** One guard. No CAPTCHA, no fingerprinting. *[self-serve]*
5. **Rebuild + REDEPLOY (Issue 6).** Loop builds; **user must redeploy.** This is the critical path — without it, 1–4 never reach a player and the gate stays dead. *[HUMAN-GATED]*

**Explicitly DEFERRED (do NOT spend time on before traffic):**
- Full server-authoritative crash execution engine (VETOED — wasted motion for play-money)
- CAPTCHA / browser fingerprinting / bot-detection stack
- Active scoring-rule HUD indicator (unless trivial)
- Viral loop, roadmap, wallet-connect stub
- Commercial layer beyond one "crypto soon" line + links (optional, not blocking)

**The brake, stated plainly:** The user's instinct to "make it 100% functional / full server-side now" would have us build a real-time authoritative game server to protect play-money points nobody can spend, while the actually-fatal problems (live reveal corrupting the gate; a stale build sending zero data) are near-free to fix. Fix the cheap fatal four, redeploy, measure a *clean* rematch number. If that number is good, *then* spend on the server engine for the crypto phase — where it finally protects something real.
