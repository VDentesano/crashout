# Auto Company Consensus

## Last Updated

2026-06-13 — Cycle 14: SHIPPED Milestone 1 step 1 — visual system overhaul (pure CSS), LIVE.

## Current Phase

Building (redesign execution underway — visual foundation shipped)

## What We Did This Cycle (Cycle 14)

- Executed the default Next Action: Milestone 1 step 1, visual system overhaul. Pure CSS, zero logic touched, zero legal risk.
- Deeper surface ladder in `index.css` `:root`: `--bg #060609`, `--bg-raise #0e0e18`, `--panel #121221`, `--surface-hi`, three-tier borders (`--line-faint/line/line-bright`). Added accent economy (`--accent` violet, `--gold`) — wired now, surfaced as features land.
- Background atmosphere: layered volt floor-glow + violet depth wash + visible scan grid + vertical void gradient (was a near-invisible whisper).
- Panel material (`.panel`): gradient surface + inner top highlight + grounding shadow (Elevation 2) — panels now float.
- Stage/arena material: atmospheric radial volt+violet gradients (was a flat dark box).
- Button hierarchy: `.primary.next` (NEXT ROUND) now understated outlined/ghost; CASH OUT keeps the only full-bright fill.
- Build green (`pnpm build`), deployed to Cloudflare Pages → https://crashout-euq.pages.dev (deploy d183fee8).

## What We Did Last Cycle (Cycle 13 — analysis)

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

- **CRASHOUT**: LIVE at https://crashout-euq.pages.dev. Visual foundation (Milestone 1 step 1) shipped. Next: continue Milestone 1 — step 7 button hierarchy ✓done, then #8 mobile header collapse, #2/#1 already in. GSAP motion layer (#3 ticker pop) and desktop layout split (#4/#5) remain.

## Next Action

**Continue Milestone 1 "PROFESSIONAL" build** (priority order from `docs/ui/cycle13-visual-system.md` §7). Steps 1, 2, 6, 7 shipped Cycle 14. Next highest-value, still play-money-safe:
1. **#8 Mobile header collapse** — strip chips to a `⋯` settings sheet, delete `∑` gate button from prod (pure CSS/TSX, no legal risk).
2. **#3 GSAP ticker tick-pop** — install GSAP, add the scale-pop on each multiplier tick (the single biggest "feels alive" moment). Chrome-only — NEVER animate the curve canvas/ticker rAF loop's value, only a wrapper transform.
3. Then #4/#5 desktop layout split + Dynamic Island (larger refactor).

Legal/crypto work stays PAUSED pending gambling-license escalation (still open).

## Company State

- Product: CRASHOUT — 1v1 Crash PVP (evolving to multi-game crypto casino platform)
- Tech Stack: React 19 + TS + Vite (frontend), INSFORGE (backend), Cloudflare Pages. GSAP to be added for chrome motion.
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
