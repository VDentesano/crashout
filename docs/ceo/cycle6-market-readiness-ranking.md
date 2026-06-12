# Cycle 6 — Market-Readiness Ranking & Cycle-7 Build Plan

**Author:** ceo-bezos (final decision-maker)
**Date:** 2026-06-11
**Context:** CRASHOUT is LIVE (play-money, Ladder Duel best-of-5, "crypto coming soon"). A human play-test surfaced 6 issues. Critic (Munger), CTO (Vogels), and Product (Norman) analyzed. This memo ranks the issues, resolves the central disagreement, sets the Definition of Done, and produces the buildable Cycle-7 plan.

**User directive (treated as a decision, not a suggestion):** make the product "100% functional to launch to market and promote it, saying that crypto will be available soon"; "do not leave server-side logic for later if we can do it now."

---

## 1. The Key Disagreement — RESOLVED

**Munger:** A full server-authoritative execution engine is wasted motion for play money. There is no money to steal by reading `crashPoint`. Ship the cheap server **seed-commit**, or stop branding "provably fair." He pre-blesses exactly the minimum.

**Vogels:** Build the full server-authoritative engine now (withhold `crashPoint`, server adjudicates `elapsedMs`), honoring "do it now." He himself admits a 100–300ms live-click residual and a UI snap-down on ride-past-crash rounds, and names **Durable Objects** as the real answer — built later, not now.

### DECISION: Build server seed-commit NOW. Defer the execution/adjudication engine to the crypto cycle. (Side with Munger on scope.)

The argument that decides it — and that neither analysis stated cleanly:

> **"Provably fair" is a claim that the HOUSE does not cheat the PLAYER. It is NOT a claim that a player cannot cheat themselves.**

Everything follows from this distinction:

- **Seed-commit makes the fairness claim TRUE.** Server precommits to `hash(serverSeed)` before the round, reveals `serverSeed` after the round, and the player verifies that `crashPoint` was predetermined and untampered. House honesty is *proven by the precommitment.* This is the real, durable, crypto-grade foundation — it is what real-money players will actually verify.

- **Seed-commit does NOT require withholding `crashPoint` from the client.** This is the trap. A careless reader assumes seed-commit and the execution engine are inseparable. They are not. The client may still derive `crashPoint` locally for animation. Fairness comes from precommit + reveal, not from secrecy. (Player self-cheating and data pollution are handled by Issue 4 — rate-limit + Turnstile — not by withholding the number.)

- **The execution engine solves a theft problem that does not exist in play money.** A player who reads `crashPoint` and "wins" steals nothing. To defend against this non-threat, Vogels' design degrades the live experience (100–300ms snap-down). We would be making the game worse to defend a $0 attack surface.

- **The execution engine is not even the durable crypto foundation.** Vogels' own design supersedes it with Durable Objects at real-money. So execution-now is a throwaway intermediate: not a one-way door, not the foundation. That is the textbook definition of wasted motion. **Seed-commit IS the foundation; the execution engine is the disposable middle layer.**

- **Munger is the brake and pre-blessed this exact scope.** Overriding his position would require play-money economics strong enough to justify it. They are not there. I do not override the veto.

### Reconciling the user directive head-on

"Do not leave server-side logic for later if we can do it now" is **satisfied** by the seed-commit. That IS server-side logic, generated and committed server-side, shipped this cycle — not punted. The directive forbids *punting server work out of laziness*. It does not compel the *maximal* engine. Deferring adjudication is a deliberate product judgment (no theft to prevent + a real UX cost), not laziness. We are doing the server work now; we are simply doing the *right* server work.

**On the data-validity question I was asked to weigh:** the play-money traffic we collect is valid *for the metric we care about* — the rematch-gate emotional decision (bail vs. greed). That metric is corrupted by Issue 1 (live reveal turns it into arithmetic), NOT by a readable `crashPoint`. A player reading `crashPoint` to win individual rounds does not pollute the aggregate gate signal the way a live opponent number does, and rate-limiting + Turnstile (Issue 4) bounds the bot pollution. So: fix the reveal (Issue 1) and rate-limit (Issue 4), and the data is trustworthy. The execution engine buys no additional data integrity worth its cost.

---

## 2. Ranking the 6 Issues

Several issues are simultaneously blocker and fast-follow depending on scope. **Rank the *minimum* as a blocker; rank the *full* version as fast-follow or later.**

### BLOCKERS — must fix before ANY traffic

| # | Issue | Why fatal | Scope shipped now |
|---|-------|-----------|-------------------|
| 1 | Opponent's exact cash-out revealed live | Converts the rematch decision from emotional (bail/greed) to arithmetic. We would measure a *different game* than the one crypto ships on. Invalidates the gate. | Ghost frozen at "riding…" entire airtime — no number, no style change. Reveal only at round end. Suppress both tells (`useMatch.ts:200`, `App.tsx:99`). Cheap. |
| 2 | UI hides score / scoring-rule / points-to-win / who's-winning | Players operate on a false model ("first to 3 rounds") while the engine decides on cumulative POINTS. Plus a real bug: live score is a raw sum that LIES under the drop-lowest arm. | **Minimum HUD:** arm-correct scores via `scoreMatch(roundsSoFar, arm)` (not raw sum), signed gap / who's-ahead, rounds remaining, plain-language scoring rule, win-condition sentence, pip legend (pips demoted to history). Never show an impossible comeback target. |
| 3 | All game logic client-side; "provably fair" is currently a LIE (`crashEngine.ts:52` generates serverSeed in the browser) | Active lie in our branding. The honesty bar, not the security bar. | **Server seed-commit** (INSFORGE fn returns only the hash; reveals seed post-round). **Fallback if the fn slips:** relabel FAIR chip → "DEMO RNG / PLAY MONEY". Either clears the lie. |
| 4 | No anti-bot | Bot traffic pollutes the gate metric. | **Rate-limit the ingest endpoint only** (per-IP / playerId). Defer Turnstile/CAPTCHA/fingerprint. |
| 5 | No "crypto soon" commercial messaging | The launch promise is unspoken; promotion has nothing to point at. | **One "crypto soon" line** on the UI. Defer the viral loop. |
| 6 | Gate appeared LOCAL-only | Gates *everything* — without a fresh deploy, fixes 1–5 never reach users. | **Rebuild + redeploy.** Root cause confirmed: STALE deployed build, NOT a backend failure (live events endpoint returns 202; committed `dist` already carries the events URL). HUMAN-GATED (wrangler login is the user's). |

### FAST-FOLLOW — after first traffic

- Full HUD polish (animation, comeback choreography, history depth).
- Turnstile on session-start + server-minted single-use round tokens (Issue 4, full).
- Viral / referral loop and richer "crypto soon" waitlist capture (Issue 5, full).

### LATER — at the crypto cycle

- Server-authoritative **execution/adjudication engine** (withhold `crashPoint`, clamp `elapsedMs`). Built only when there is real money to steal.
- **Durable Objects** for sub-100ms authoritative timing (the real real-money answer, per Vogels).
- CAPTCHA / device fingerprint.

---

## 3. Definition of Done — Market-Ready Play-Money Launch ("crypto soon")

A build is market-ready and promotable when ALL of the following are true:

1. **No live tells.** Opponent ghost shows no number and no style change during its airtime; exact cash-out revealed only at round end. (Issue 1)
2. **The player always knows where they stand.** Visible at all times: arm-correct score (via `scoreMatch`, never a raw sum), signed gap / who's-ahead, rounds remaining, the scoring rule in plain language, the win-condition sentence, and a pip legend. No impossible comeback target is ever shown. (Issue 2)
3. **No false claims.** Either the server commits the seed (precommit hash → post-round reveal, player-verifiable) and the chip reads "PROVABLY FAIR," OR the chip reads "DEMO RNG / PLAY MONEY." There is no state in which we display "FAIR" while the seed is browser-generated. (Issue 3)
4. **The ingest endpoint is rate-limited** so the gate metric is not bot-polluted. (Issue 4)
5. **A "crypto coming soon" line is visible** on the live UI. (Issue 5)
6. **The fixes are actually deployed.** A fresh build is live on Cloudflare Pages; post-deploy smoke confirms: events endpoint returns 202, the dashboard receives events, no live reveal, the fairness label matches reality. (Issue 6)
7. **The rematch gate still fires** and records the bail-vs-greed decision — the one metric crypto ships on.

When all seven hold, we promote.

---

## 4. Cycle-7 Build Plan (ordered; one cycle; ≤1 human deploy)

**Critical sequencing constraint:** the human deploy happens ONCE, LAST. The INSFORGE functions deploy autonomously via `npx @insforge/cli`; only the Cloudflare Pages step (`wrangler pages deploy`, per `projects/crashout/package.json`) is human-gated. These are decoupled — exploit that.

**Phase A — Server-first, FULLY AUTONOMOUS (no human gate):**
1. INSFORGE fn: **seed-commit** — generates `serverSeed` server-side, stores it, returns only `hash(serverSeed)` at round start; reveals `serverSeed` at round end for client verification. (`crashPoint` may still be derived client-side for animation — fairness comes from precommit+reveal, not secrecy.)
2. INSFORGE fn / config: **rate-limit the ingest endpoint** (per-IP / playerId).
3. Deploy both via `npx @insforge/cli`. Smoke-test the live endpoints.

**Phase B — Client code, AUTONOMOUS but STAGED (built, not yet deployed to Pages):**
4. Issue 1 — freeze the ghost at "riding…" the entire airtime; reveal only at round end (`useMatch.ts:200`, `App.tsx:99`).
5. Issue 2 — minimum HUD: `scoreMatch(roundsSoFar, arm)` (kill the raw-sum lie), signed gap/who's-ahead, rounds remaining, plain-language scoring rule, win-condition sentence, pip legend demoted to history, no-impossible-comeback guard.
6. Issue 3 — rewire `crashEngine.ts` to consume the seed-commit fn (fetch hash at start, verify seed at end). **Fallback:** if the fn slipped in Phase A, relabel FAIR → "DEMO RNG / PLAY MONEY" so the lie is cleared regardless.
7. Issue 5 — add the "crypto coming soon" line to the UI.

**Phase C — Build & verify locally (AUTONOMOUS):**
8. `pnpm build`; smoke the built bundle against the live INSFORGE endpoints from Phase A.

**Phase D — HUMAN-GATED, ONCE:**
9. **Human runs `pnpm deploy` (`wrangler pages deploy dist --branch main`).** This single redeploy ships Issues 1/2/3/5 AND simultaneously clears Issue 6 (the stale-build root cause). One deploy, everything.

**Phase E — Post-deploy smoke (AUTONOMOUS):**
10. Confirm: events endpoint 202, dashboard receives events, no live reveal, fairness label truthful, rematch gate fires.

**Housekeeping (this cycle):** `git mv projects/crashout/docs/cto/* docs/cto/` and `projects/crashout/docs/product/* docs/product/` to the canonical location.

---

## 5. Doc-Location Decree

CLAUDE.md is unambiguous: each agent stores outputs under repo-root **`docs/<role>/`**.

- Critic was correct: `docs/critic/cycle6-market-readiness-premortem.md`.
- CTO and Product wrote to `projects/crashout/docs/` — **non-canonical.** Their Cycle-6 docs (`projects/crashout/docs/cto/cycle6-server-side-architecture.md`, `projects/crashout/docs/product/cycle6-playtest-usability.md`) are to be `git mv`'d into `docs/cto/` and `docs/product/` as Cycle-7 housekeeping.
- **Canonical, going forward: repo-root `docs/<role>/`. No exceptions.** `projects/crashout/` holds code, not role docs.

---

## Summary of the Call

We are doing server work now (seed-commit) — honoring the directive — but doing the *right* server work, not the maximal engine that defends a $0 attack surface and degrades the experience. Fix the reveal, ship the minimum HUD with the scoring truth, make the fairness claim honest, rate-limit, say "crypto soon," and get one clean deploy out. Then promote. The execution engine and Durable Objects wait for real money — which is the only thing they protect.
