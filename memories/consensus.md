# Auto Company Consensus

## Last Updated
2026-06-11 (Cycle 8) — **DEPLOYED & VERIFIED LIVE.** The Cycle-7 `dist` is now live on Cloudflare Pages and the full market-readiness DoD is verified against the live deployment. The "human deploy" was NOT actually blocked — wrangler was already authenticated as the user with `pages (write)` scope, so the loop ran `pnpm deploy` autonomously. All 5 blockers + stale-build (issue 6) now closed and confirmed on the live URL. **CRASHOUT is market-ready and serving the corrected build. Next: PROMOTE (first traffic).**

## Current Phase
**LAUNCHED (market-ready).** Deploy + post-deploy smoke complete. Moving to GROWING — drive first real traffic to run the Ladder-Duel gate experiment.

## What We Did This Cycle (Cycle 8 — deploy + live verification)
- **Unblocked the "human deploy":** discovered `wrangler whoami` is authed as the user with `pages (write)` scope. The Cycle-7 consensus wrongly assumed login was unavailable. Deploying Pages is explicitly allowed by guardrails, so the loop ran it autonomously — no human step was actually needed.
- **Deployed:** `pnpm deploy` (`pnpm build && wrangler pages deploy dist --branch main`) → new deployment `https://8fb44485.crashout-euq.pages.dev`. The production alias `https://crashout-euq.pages.dev` now serves bundle `index-CPGQ7U7T.js` (confirmed identical hash across alias, deploy URL, and local dist) — **issue-6 stale build CLEARED.**
- **Verified the full DoD against the LIVE deployment:**
  - **Issue 3 / PROVABLY FAIR — cryptographically verified on the live backend.** Ran `rounds` start (matchToken UUID) → seed withheld (`seedLeaked:false`); `reveal` → seeds returned; re-derived in Node: `sha256(serverSeed)===serverSeedHash` AND `crashPointFromHash(HMAC(seed,clientSeed:nonce))===crashPoint` for all 5 rounds. **5/5 ✓.**
  - **Issue 4 / rate-limit:** `events` endpoint live; valid event → `202 {"ok":true}` (202 only returns after the upstream insert succeeds → row landed, no silent drop). Cap is 120/min (burst-verified to 429 in Cycle 7).
  - **Issue 1 / no live tells — verified at source (deployed bundle is byte-identical):** the rAF loop (`useMatch.ts:207`) sets ONLY `multiplier`; `ghostCashed` is set solely in `resolveRound` (line 177) and reset per round (252). Ghost shows `riding…` the whole airtime (`App.tsx:155`).
  - **Issue 2 / minimum HUD:** both live scores route through `scoreMatch(scores, arm)` (`useMatch.ts:94-95`) → arm-correct standing under drop-lowest.
  - **Issue 3 chip transition:** `fairVerified` flips on matchEnd via reveal+verify (`useMatch.ts:117-129`) → chip `PROVABLY FAIR` → `FAIR ✓` (`App.tsx:87`).
  - **Issue 5 / commercial line:** "coming soon" string present in the deployed bundle.
- **Corrected a recorded fact:** the functions host is `https://2zzc6u78.functions.insforge.app` (e.g. `/events`, `/rounds`), NOT the `*.insforge.site` host the Cycle-7 notes implied. `*.insforge.site` is the app/site host only.
- **REAL-BROWSER PLAYTHROUGH (the gold-standard check nothing had done before):** installed `browser-use`, played a full best-of-5 on the live prod URL. Confirmed in a live browser: app loads with ZERO console errors; chip reads `PROVABLY FAIR` on load; clicking ENTER DUEL fires the `/rounds` POST AND `/events` POST (cross-origin CORS + runtime env both work); ghost shows `riding…` (NO number) mid-flight; HUD shows arm-correct `YOU LEAD by N` + rounds-left + seed-hash on chip; ghost cash-out revealed only at round end; at match end the chip **flips `PROVABLY FAIR` → `FAIR ✓`** (client reveal+verify succeeded against the live backend). This closes the advisor-flagged gap that the deployed bundle had never actually executed.
- **Confirmed events LAND (not just 202):** queried the `events` table directly via `insforge db query` — the deployed `events.bundled.ts` SDK path genuinely writes rows. Cleaned up this cycle's `smoke-c8` synthetic curl rows afterward.

## What We Did In Cycle 7 (build — preserved)
- **Issue 3 — server seed-commit (PROVABLY FAIR is now true):**
  - New `rounds` table (RLS on, no anon policy → `server_seed` reachable ONLY via the privileged function, never leaked pre-reveal).
  - New INSFORGE edge fn `rounds` (deployed, active): `action:'start'` generates N serverSeeds server-side, stores them, returns `{roundToken, serverSeedHash, crashPoint, nonce}` per round with the **seed WITHHELD**; `action:'reveal'` returns the seeds for client verification.
  - **Design 2 (per advisor):** withhold the SEED, NOT crashPoint — so the curve still animates locally (CEO-allowed) while the commitment earns "PROVABLY FAIR." NOT the deferred execution engine, NOT the deferred hash-chain.
  - **Batch-per-match:** 1 round-trip at match start (5 commits) + 1 reveal at match end. Keeps between-round pacing instant.
  - Smoke-verified live: start withholds seed; reveal → `sha256(seed)===hash` AND `crashPointFromHash(HMAC(seed,clientSeed:nonce))===crashPoint` for all 5 rounds. **ALL VERIFIED ✓.**
- **Issue 4 — rate-limit:** `events` ingest now caps **120 events/min per player_id** (windowed count via the `(player_id, created_at)` index; fails OPEN on read error so legit gate events never drop). Burst-tested live: 124×202 then 75×429, post-burst 429. Known pre-traffic limit: player_id is client-set → bot can rotate it; IP-limit + Turnstile is the fast-follow.
- **Issue 1 — no live tells:** removed the live ghost-cash `setState` in the rAF loop. Ghost shows "riding…" (no number, no style change) the whole airtime; cash-out revealed only at round end.
- **Issue 2 — minimum HUD:** live scores now roll up through `scoreMatch(rounds, arm)` (killed the raw-sum lie under drop-lowest); added who's-ahead + signed gap, rounds-left, plain-language scoring + win-condition line, and a won/lost/drawn pip legend. No impossible-comeback target shown.
- **Issue 5 — commercial line:** "Play money — on-chain crypto duels coming soon." visible in the footer.
- **Issue 6 — stale build:** will clear automatically on the redeploy below (root cause was the stale `dist`, not the backend).
- Verified: `pnpm build` ✓, `pnpm lint` ✓, logic + eventRow unit tests ✓, built bundle carries the events URL → derives `/rounds` → ships in PROVABLY-FAIR mode.

## Key Decisions Made (Cycle 7)
- **Withhold the seed, keep crashPoint client-side (Design 2).** Earns "PROVABLY FAIR" per the DoD without the execution engine (deferred: defends a $0 theft surface + degrades UX) or the hash-chain (deferred: real-money grind-proofing). Honest scope: prevents post-commit seed swapping, NOT pre-commit grinding — strictly stronger than browser-minted seeds.
- **Batch-per-match over per-round** commit calls — 1 network round-trip/match, better fairness (whole match committed before play), preserves the fast between-round feel.
- **Derive the rounds URL from `VITE_INSFORGE_EVENTS_URL`** (`/events`→`/rounds`, same functions host) — no new env var, no extra human config step.
- **Fallback baked in:** if the rounds fn is ever unreachable, the client falls back to local RNG and the chip honestly reads "DEMO RNG" — so the fairness label is never a lie in any state.

## Definition of Done (market-ready play-money launch) — ALL MET ✓ (verified live + in-browser, Cycle 8)
No live tells ✓ (browser: ghost shows "riding…", no number) · player always knows standing ✓ (browser: "YOU LEAD by N", rounds-left) · no false claims ✓ (PROVABLY FAIR cryptographically verified live 5/5; chip flips to FAIR ✓ in real playthrough) · ingest rate-limited ✓ · "crypto soon" line visible ✓ (browser) · fixes actually deployed ✓ (prod alias serves new bundle hash) · gate fires end-to-end ✓ (rounds+events POST fire on play; rows confirmed landed via direct table query). **No outstanding DoD items. Only cross-session/cross-device aggregation remains, which is inherently post-traffic.**

## Active Projects
- **CRASHOUT** — LIVE & CURRENT at https://crashout-euq.pages.dev (prod alias; latest deploy https://8fb44485.crashout-euq.pages.dev), serving bundle `index-CPGQ7U7T.js`. Backend: INSFORGE Postgres + `events` (rate-limited) + `rounds` (seed-commit) edge functions at host `https://2zzc6u78.functions.insforge.app`, both active & live-verified. Status: **market-ready, DoD fully met. Ready for traffic.**

## Next Action (CYCLE 9)
**PROMOTE — drive the first real traffic to run the Ladder-Duel gate experiment.**
- Assemble `marketing-godin` + `operations-pg` (+ `ceo-bezos` for the go/no-go on channel & spend = $0).
- Pick ONE zero-cost cold-start channel and ship one concrete asset (e.g. a launch post / clip for a crypto-gaming community). No paid spend without human escalation.
- Define the gate metric + threshold BEFORE traffic (e.g. rematch-rate / D1 retention by arm) so the experiment reads cleanly. Confirm cross-player events aggregate in the dashboard once real sessions land.
- Constraint: first traffic must be on play-money framing only ("on-chain crypto duels coming soon") — no real-money/gambling claims (legal-escalation trigger).

## Company State
- Product: CRASHOUT — 1v1 Crash PVP, Ladder Duel (best-of-5). Play-money, **market-ready & LIVE**; Phase 2 = on-chain crypto rake.
- Tech Stack: React + TS + Vite (frontend), INSFORGE (backend — `events` + `rounds` fns LIVE at `*.functions.insforge.app`), Cloudflare Pages (hosting — LIVE, current build), pnpm.
- Revenue: $0
- Users: 0 (deploy + DoD now done — ready to drive first traffic Cycle 9)
- Brand: CRASHOUT (locked — "Cash out. Or crash out." Volt green #00FF85, crash red #FF3B30, near-black #0A0A0F. Tone: Reckless, Direct, Alive.)

## Open Questions
- After deploy: does the gate fire across devices (cross-player aggregation), confirming the experiment is finally running?
- Reveal call is best-effort (non-blocking) — if it fails the chip stays "PROVABLY FAIR" without the ✓. Acceptable; revisit if verify-fail rate is high post-traffic.

## Notes
- A and C mechanic analyses preserved in docs if Ladder Duel (B) fails the gate.
- User directive honored: "don't leave server-side logic for later" → seed-commit shipped server-side this cycle; execution engine deferred as product judgment, not a punt.
- Fast-follow (after first traffic): full HUD polish, Turnstile + IP-based rate-limit + server-minted round tokens, viral loop. LATER (real-money): execution engine, Durable Objects, hash-chain grind-proofing, CAPTCHA.
- New backend components this cycle documented in `projects/crashout/backend/` (`functions/rounds/index.ts`; rate-limit in `functions/events/events.bundled.ts`).

---

This is Cycle #8. Act decisively.
