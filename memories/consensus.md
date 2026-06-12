# Auto Company Consensus

## Last Updated

2026-06-13 — Cycle 18: SHIPPED Milestone 1 #9 — GSAP crash shake + win celebration + particle bursts, LIVE.

## Current Phase

Building (redesign execution underway — visual foundation + header IA + motion + desktop layout + impact FX shipped)

## What We Did This Cycle (Cycle 18)

- Executed the default Next Action: Milestone 1 #9 crash-thud shake + win celebration via GSAP. Pure chrome motion, zero game logic touched, zero legal risk.
- New hook `src/hooks/useImpactFx.ts` (3 exports, shared edge-detect + particle-shower primitives):
  - `useCrashShake(showCrashFx)` on `.app` — decaying GSAP trauma timeline (hard first jolt → smaller swings → settle), replaces the old `@keyframes shake`. Richer than the CSS loop.
  - `useWinCelebration(matchWon)` on the YOU ScorePanel — elastic scale pop (`elastic.out(1.2,0.6)`) + 10-dot gold/volt shower. Replaces `@keyframes win-pop`. GSAP owns only the transform; the held volt glow stays in `.panel.won` CSS so the two never fight over box-shadow.
  - `useCashShower(running && playerCashedOut)` on `.stage` — 8-dot volt burst layered over the existing CSS ring on cash-out.
- All fire once per rising edge (no re-fire on unrelated re-renders); all no-op under reduced-motion (checked via `window.matchMedia` at fire time — GSAP bypasses the global CSS `animation:none` rule). Red/volt flash overlays unchanged (React-rendered opacity, fire regardless → signal preserved when motion off).
- Removed orphaned CSS: `@keyframes shake` + `@keyframes win-pop` (index.css), `.app.is-crashed` / `.app.is-won` rules + their classNames (App.tsx). Added `.fx-dot` particle base + `position:relative` on `.panel`.
- Build green (`pnpm test` + `pnpm build`, CSS 15.45→15.12kB gz 4.24kB — net smaller from dropped keyframes; JS +0 new deps, GSAP already in). Deployed → https://crashout-euq.pages.dev (deploy 1f980c52). Commit ad413a3.

## What We Did Cycle 17

- Executed the default Next Action: Milestone 1 #4/#5 desktop layout split + glass Dynamic Island. Pure layout/CSS + one chrome GSAP beat, zero game logic touched, zero legal risk.
- Desktop (>=1024px) restructured from a stretched mobile column into a 2-zone grid: full-height glass **Dynamic Island** LEFT sidebar (best-of-5 ladder + live standing) + central arena (header strip · score panels · stage · verdict · CTA).
- **Surgical, no DOM duplication**: wrapped ladder + matchinfo in `<aside className="rail">`. Mobile = `display: contents` (children flow as today, zero visual change). Desktop = `grid-template-areas` repositions the *same* DOM into the sidebar; rail gets glass material (blur(28px) saturate, layered shadows, radius 20px) per `docs/ui/cycle13-visual-system.md` §4. In-island the ladder stacks vertically (taller 8px pips) and standing anchors to the bottom.
- New hook `src/hooks/useSidebarReveal.ts`: rail rows stagger in on mount via `gsap.matchMedia('(min-width:1024px) and (prefers-reduced-motion:no-preference)')`. No-op on mobile; reduced-motion users get it instantly. rAF curve loop untouched.
- Build green (`pnpm test` + `pnpm build`, CSS 15.45kB/4.34kB gz), deployed → https://crashout-euq.pages.dev (deploy cd3b6c46). Commit ebec9f3.
- **Deferred** (documented, not dropped): right scoreboard column (Phase 2 — needs real opponent data, ties to Open Q #3); idle-collapse-to-64px-pill island state (polish follow-up — adds idle-detection state, low value now).

## What We Did Cycle 16

- Executed the default Next Action: Milestone 1 #3 GSAP ticker tick-pop. Pure chrome motion, zero game logic touched, zero legal risk.
- Installed GSAP 3.15.0 (pnpm). New hook `src/hooks/useTickPop.ts`: discrete scale-pop on the live multiplier ticker via `gsap.fromTo` on a wrapper transform — NEVER the rAF value (honors the "two drivers conflict" rule).
- Pop quantized to 0.1 steps so cadence tracks the curve: slow heartbeat early → frantic flutter near crash (maps rising tension). Throttled to ~18 pops/sec so a fast climb reads as flutter, not blur. Re-arms cleanly each round.
- `prefers-reduced-motion` honored via `gsap.matchMedia()` — value still counts, pop suppressed.
- Wired into `App.tsx` `.ticker` (ref + active=running). Build green (`pnpm test` + `pnpm build`, +23kB gzip from GSAP), deployed → https://crashout-euq.pages.dev (deploy 23b094aa). Commit 9ad3fc8.

## What We Did Cycle 15

- Executed the default Next Action: Milestone 1 #8 mobile header collapse. Pure UI (App.tsx + App.css), zero game logic touched, zero legal risk.
- Collapsed the three inline icon buttons (🔊 / ? / ∑) into ONE `⋯` settings sheet — unified for mobile + desktop. Header now reads brand + 2 status chips (FAIR / LIVE) + single menu affordance.
- Sheet is an anchored popover (`.sheet`): Sound on/off toggle, How to play, and a DEV-only Gate instrument row. Click-away backdrop closes it; `sheet-in` micro-animation; full a11y roles (menu/menuitem/menuitemcheckbox).
- **Stripped `∑` gate instrument from production**: render guarded by `import.meta.env.DEV` — verified tree-shaken out of the prod bundle (grep = 0 matches). Devs keep it locally.
- Build green (`pnpm build`), deployed to Cloudflare Pages → https://crashout-euq.pages.dev (deploy 4521b195). Commit Cycle 15.

## What We Did Cycle 14

- Milestone 1 step 1, visual system overhaul. Pure CSS, zero logic touched.
- Deeper surface ladder in `index.css` `:root`; background atmosphere; panel/stage material; button hierarchy (CASH OUT = only full-bright fill). Deploy d183fee8.

## What We Did Cycle 13 (analysis)

- Ran the requested analysis-only cycle (NO code) with 4 agents in parallel:
  - `docs/interaction/cycle13-flows-and-ia.md` — personas, onboarding (ghost→wallet) flow, multi-game IA, Dynamic Island states, taunts.
  - `docs/ui/cycle13-visual-system.md` — "why it looks prototype" diagnosis, full dark-casino palette (hex), typography scale, glass material spec, 7-animation GSAP motion layer, mobile vs desktop wireframes.
  - `docs/product/cycle13-usability-audit.md` — ranked problem inventory (Norman principles), mobile hierarchy redesign, provably-fair commit/reveal/verify panel, usability-test plan.
  - `docs/cto/cycle13-platform-architecture.md` — routed multi-game shell, INSFORGE data model, wallet/escrow architecture, Polygon recommendation, phased migration, regulatory escalation.
- Synthesized everything into a decision-ready doc: **`docs/ceo/cycle13-redesign-synthesis.md`** (client reads this first).

## Key Decisions Made (high-confidence convergence — all agents agree)

- Delete the `∑` gate button from production; strip mobile header to brand + 2 chips; move 🔊/`?` into a `⋯` settings sheet.
- Ghost practice match = the onboarding (no signup); wallet gate fires once on player intent, not on load. Wallet = identity.
- Desktop = 3-column grid with a glass "Dynamic Island" LEFT sidebar — not a stretched mobile column.
- "Prototype look" root cause = surfaces ~5 lightness pts apart + color only in semantic moments → fix with deeper surface ladder + violet/gold accents.
- GSAP animates chrome only; NEVER the curve canvas/ticker (rAF game loop — two drivers conflict).
- Provably-fair must become an expandable commit→reveal→verify panel.
- Chain (when crypto ships): **Polygon PoS** (EVM ecosystem > Solana speed; latency bound by INSFORGE edge fn).

## Active Projects

- **CRASHOUT**: LIVE at https://crashout-euq.pages.dev. Shipped to date: visual foundation (#1/#2/#6), button hierarchy (#7), header collapse + ∑ strip (#8), GSAP ticker tick-pop (#3), desktop layout split + glass Dynamic Island (#4/#5), crash shake + win celebration + particle bursts (#9). **Milestone 1 §7 list now #1–#9 done.** Remaining §7 item: #10 (heat ramp via GSAP color tween) — polish.

## Next Action

**Milestone 1 §7 is #1–#9 DONE.** Remaining work from `docs/ui/cycle13-visual-system.md` §7, all play-money-safe, chrome-only:
1. **#10 — heat ramp via GSAP color tween** (smoother volt→gold→amber than the current CSS state-class transition on the ticker). Spec §5.2. Last §7 item; small.
2. Polish follow-ups now unblocked by the desktop split: Dynamic Island idle-collapse-to-pill (spec §5.1), sidebar alert pulse on ghost cashout / lead flip (spec §5.6).

After #10 + polish, the redesign milestone is complete → next strategic gate is the **gambling-license escalation** (still the hard blocker on real-money crypto). If that stays unresolved, candidate next milestone = gamification systems (streaks/badges/leaderboards) which are play-money-safe and drive retention.

Legal/crypto work stays PAUSED pending gambling-license escalation (still open).

## Company State

- Product: CRASHOUT — 1v1 Crash PVP (evolving to multi-game crypto casino platform)
- Tech Stack: React 19 + TS + Vite (frontend), INSFORGE (backend), Cloudflare Pages. GSAP 3.15 in for chrome motion.
- Revenue: $0
- Users: 0
- Brand: CRASHOUT (locked)

## Open Questions (escalations for the human)

1. **Gambling license** (~$30–50K Curaçao + attorney) — blocks all real-money crypto. Engineering cannot decide. ESCALATED.
2. Custodial balance vs on-chain escrow — depends on (1).
3. Right-side social/feed panel on desktop — defer to Phase 2 (needs real opponent data)?

## Notes

- User is the client. Agents are the design team. This cycle delivered proposals to compare; user picks.
- Think final product, but ship play-money "PROFESSIONAL" milestone first (no legal blocker).
- Reference sites: Stake.com, Roobet, Rollbit, Bustabit.
