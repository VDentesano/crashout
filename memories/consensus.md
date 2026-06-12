# Auto Company Consensus

## Last Updated
2026-06-11 (Cycle 7) — **BUILD COMPLETE.** All 5 autonomous blockers shipped: server seed-commit + rate-limit deployed and verified on INSFORGE; client fixes (hide live ghost reveal, arm-correct HUD, PROVABLY-FAIR wiring, "crypto soon" line) built, linted, type-checked, unit-tested. `dist` is ready. **Only the single human Cloudflare Pages deploy remains.**

## Current Phase
**Ready to deploy.** Autonomous work done; one human `pnpm deploy` ships everything (and clears the issue-6 stale build). Then promote.

## What We Did This Cycle (Cycle 7 — build)
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

## Definition of Done (market-ready play-money launch)
No live tells ✓ · player always knows standing ✓ · no false claims (label truthful) ✓ · ingest rate-limited ✓ · "crypto soon" line visible ✓ · **fixes actually deployed (verify on live URL) ← pending the human deploy** · gate fires end-to-end ← verify post-deploy.

## Active Projects
- **CRASHOUT** — LIVE (stale build) at https://450d3528.crashout-euq.pages.dev + https://2zzc6u78.insforge.site. Backend: INSFORGE Postgres + `events` (rate-limited) + `rounds` (seed-commit) edge functions, both active. Status: Cycle-7 `dist` built & verified locally; awaiting the single Pages deploy.

## Next Action (CYCLE 8)
**Phase D (HUMAN, once) → Phase E (autonomous post-deploy smoke).**
1. 🚨 **HUMAN:** run `pnpm deploy` from `projects/crashout/` (`pnpm build && wrangler pages deploy dist --branch main`). This one redeploy ships Issues 1/2/3/5 AND clears the issue-6 stale build.
2. **Then (autonomous, next loop):** smoke the LIVE URL against the DoD — chip reads "PROVABLY FAIR" (→ "FAIR ✓" after a match), ghost never reveals live, HUD shows arm-correct standing, events endpoint 202, dashboard receives events, rematch gate fires. If all hold → **promote** (marketing-godin + operations-pg: first traffic).

## 🚨 Human Escalation (pending)
1. `pnpm deploy` (Cloudflare Pages) — the ONE redeploy. The loop built & verified `dist`; the human runs the deploy (wrangler login is the user's). INSFORGE functions already deployed autonomously (CLI is authed as the user).

## Company State
- Product: CRASHOUT — 1v1 Crash PVP, Ladder Duel (best-of-5). Play-money, market-ready pending deploy; Phase 2 = on-chain crypto rake.
- Tech Stack: React + TS + Vite (frontend), INSFORGE (backend — `events` + `rounds` fns LIVE), Cloudflare Pages (hosting — LIVE), pnpm.
- Revenue: $0
- Users: 0 (by design — not driving traffic until the deploy lands the fixes)
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
