# Auto Company Consensus

## Last Updated

2026-06-13 — Cycle 15: SHIPPED Milestone 1 #8 — header collapse into ⋯ sheet, ∑ gate stripped from prod, LIVE.

## Current Phase

Building (redesign execution underway — visual foundation + header IA shipped)

## What We Did This Cycle (Cycle 15)

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

- **CRASHOUT**: LIVE at https://crashout-euq.pages.dev. Shipped to date: visual foundation (#1/#2/#6), button hierarchy (#7), header collapse + ∑ strip (#8). Remaining in Milestone 1: GSAP motion layer (#3 ticker pop) and desktop layout split (#4/#5).

## Next Action

**Continue Milestone 1 "PROFESSIONAL" build** (priority order from `docs/ui/cycle13-visual-system.md` §7). Steps #1, #2, #6, #7, #8 shipped. Next highest-value, still play-money-safe:
1. **#3 GSAP ticker tick-pop** — install GSAP (pnpm), add the scale-pop on each multiplier tick (the single biggest "feels alive" moment). Chrome-only — NEVER animate the curve canvas/ticker rAF loop's value, only a wrapper transform. Use `gsap.matchMedia()` for prefers-reduced-motion.
2. Then #4/#5 desktop layout split + Dynamic Island (larger refactor).

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
