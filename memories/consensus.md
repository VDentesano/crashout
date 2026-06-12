# Auto Company Consensus

## Last Updated
2026-06-11 (Cycle 6) — **MARKET-READINESS ANALYSIS COMPLETE.** The 6 play-test issues ran through critic → cto → product → CEO. Bezos has ranked them, resolved the server-engine disagreement, and locked a one-cycle build plan. **Next cycle is a BUILD cycle.**

## Current Phase
**Hardening.** Game is LIVE (play-money) but not market-ready. Analysis done; Cycle 7 executes the fixes that clear the path to traffic.

## What We Did This Cycle (Cycle 6 — analysis)
- Verified the 6 play-test issues against source (corrected 2 hypotheses):
  - **Issue 6 root cause FOUND:** events endpoint returns HTTP 202 (alive) and the committed `dist` bundle already carries `VITE_INSFORGE_EVENTS_URL`. So "LOCAL" = a **STALE deployed build**, NOT a backend failure. Fix = rebuild + redeploy. (Backend was never broken.)
  - **Issue 3 confirmed:** `crashEngine.ts:52` mints the server seed *in the browser*; crashPoint lives in client JS all round → "provably fair" is currently a **false claim**.
  - **Issue 1 confirmed:** `useMatch.ts:200` + `App.tsx:99` reveal the ghost's exact cash-out live.
- Produced 4 analysis docs (repo-root `docs/<role>/`): `critic/cycle6-market-readiness-premortem.md`, `cto/cycle6-server-side-architecture.md`, `product/cycle6-playtest-usability.md`, `ceo/cycle6-market-readiness-ranking.md`.
- Reconciled doc locations to canonical repo-root `docs/<role>/` (cto + product docs were nested under `projects/crashout/docs/`; moved).

## Key Decisions Made (Cycle 6)
- **CEO resolution of the critic-vs-cto disagreement:** Build server **seed-commit NOW**; **defer the full server-authoritative execution engine** to the crypto/real-money cycle. Side with Munger on scope.
  - Deciding insight: "provably fair" = *the house doesn't cheat the player*, NOT *the player can't cheat themselves*. A precommit-hash → post-round-reveal makes the claim TRUE without withholding crashPoint. The execution engine defends a $0 theft surface, degrades UX (100–300ms snap-down), and is thrown away at real-money (Durable Objects is the real answer). Seed-commit is the durable foundation and satisfies the user's "don't leave server logic for later."
- **Deferred research-thompson + marketing-godin docs** this cycle (lower leverage; the commercial layer is one "crypto soon" line per CEO, not a campaign). Pulled forward only if Cycle 7 needs them.
- **Product found a real bug:** live score (`playerLiveScore`) is a raw sum and **lies under the `drop-lowest` arm**; must be computed via `scoreMatch(roundsSoFar, arm)`. Also: 5 pips + "BEST OF 5" plant a false "first-to-3-rounds" model; the match is decided on cumulative **points**.

## Cycle 6 Issue Ranking (Bezos)
- **BLOCKERS (fix before ANY traffic):**
  1. Kill the live opponent reveal — ghost frozen at "riding…" (no number, no style change) all airtime; reveal only at round end. (`useMatch.ts`, `App.tsx`)
  2. Minimum HUD — arm-correct live scores both sides (via `scoreMatch`), signed gap/who's-ahead, rounds remaining, plain-language scoring rule, pip legend, win-condition sentence. No mathematically-impossible comeback targets.
  3. Server **seed-commit** (precommit hash → post-round reveal) **or** relabel the "FAIR" chip to `DEMO RNG / PLAY MONEY` until it ships. (Ship the commit.)
  4. Rate-limit the ingest endpoint (per IP/playerId at the edge function). No CAPTCHA/fingerprint yet.
  5. One "crypto coming soon" line + links visible in the UI.
  6. Rebuild + redeploy (clears the stale-build "LOCAL" simultaneously).
- **FAST-FOLLOW (after first traffic):** full HUD polish, Turnstile + server-minted round tokens, viral loop.
- **LATER:** server-authoritative execution engine, Durable Objects (real-money), CAPTCHA/behavioral anti-bot.

## Definition of Done (market-ready play-money launch)
No live tells · player always knows standing · no false claims (fairness label truthful) · ingest rate-limited · "crypto soon" line visible · fixes actually deployed (verify 202 + no reveal + truthful label on the live URL) · gate still fires end-to-end.

## Active Projects
- **CRASHOUT** — LIVE at https://450d3528.crashout-euq.pages.dev (CF Pages) + https://2zzc6u78.insforge.site. Backend: INSFORGE Postgres + `events` edge function (ingest). Status: analysis done, Cycle 7 builds the blockers.

## Next Action (CYCLE 7 — BUILD; discussion forbidden)
Execute Bezos's build plan, sequenced so a human deploy is needed **exactly once, last**:

- **A. Autonomous (loop does these via `npx @insforge/cli` + code edits):**
  - New INSFORGE edge function(s): server seed-commit (returns serverSeedHash before round; reveals serverSeed after) + **rate-limit** on the `events` ingest function.
  - Client fixes, staged: (1) hide ghost live cash-out; (2) minimum HUD incl. `scoreMatch`-based live score + who's-ahead/gap + plain-language rule + win-condition; (3) wire fairness to the seed-commit OR relabel chip to `DEMO RNG / PLAY MONEY`; (5) add "crypto coming soon" line + links.
  - Local `pnpm build` + smoke-test (verify endpoint 202, no reveal, truthful label) on the built `dist`.
- **B. HUMAN-GATED (escalate, needed once):** `wrangler pages deploy` of the new `dist` → clears blockers 1/2/3/5 **and** issue-6 stale build in one shot.
- **C. Post-deploy:** smoke-test the live URL against the Definition of Done.

**CTO Cycle-7 checklist** (in `docs/cto/cycle6-server-side-architecture.md`) is the engineering reference. Per CEO, build the seed-commit (NOT the full execution engine).

## 🚨 Human Escalation (pending for Cycle 7)
1. `wrangler pages deploy` — the ONE redeploy that ships all Cycle-7 client fixes + clears the "LOCAL" stale build. The loop builds `dist`; the human runs the deploy. (Last deploy was done by the user; wrangler login is the user's.)

## Company State
- Product: CRASHOUT — 1v1 Crash PVP, Ladder Duel (best-of-5). LIVE play-money; Phase 2 = on-chain crypto rake. Market-ready after Cycle 7 blockers.
- Tech Stack: React + TS + Vite (frontend), INSFORGE (backend — LIVE), Cloudflare Pages (hosting — LIVE), pnpm.
- Revenue: $0
- Users: 0 (no traffic yet — by design; not driving traffic until blockers clear)
- Brand: CRASHOUT (locked — "Cash out. Or crash out." Volt green #00FF85, crash red #FF3B30, near-black #0A0A0F. Tone: Reckless, Direct, Alive.)

## Open Questions
- Does seed-commit need its own table, or can it ride the existing INSFORGE Postgres + a new function? (CTO doc has the design; resolve during build.)
- After Cycle 7 redeploy: does the gate actually fire across devices (cross-player aggregation), confirming the experiment is finally running?

## Notes
- A and C mechanic analyses preserved in docs if Ladder Duel (B) fails the gate.
- User directive honored: "don't leave server-side logic for later" → seed-commit ships now; execution engine deferred as product judgment, not a punt.
- User directive honored: agents analyzed, were not told the solutions — CEO ranked and chose.
