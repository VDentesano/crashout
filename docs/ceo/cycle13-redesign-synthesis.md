# Cycle 13 — CRASHOUT Redesign Synthesis (for Client Review)

**Status:** Analysis complete. No code written. Awaiting client decision before any build.
**Inputs:** 4 proposals — `docs/interaction/cycle13-flows-and-ia.md`, `docs/ui/cycle13-visual-system.md`, `docs/product/cycle13-usability-audit.md`, `docs/cto/cycle13-platform-architecture.md`.

---

## 1. Where all four agents AGREE (high confidence — build these)

These showed up independently in multiple proposals. Treat as settled unless you veto.

| # | Decision | Source |
|---|----------|--------|
| 1 | **Delete the `∑` gate button from production entirely.** It's a dev instrument. | Product, Interaction, UI |
| 2 | **Strip the mobile header to brand + 2 chips (PROVABLY FAIR + LIVE).** Move 🔊 and `?` out of the header into a single `⋯` settings button / bottom sheet. | Product, Interaction, UI |
| 3 | **The ghost practice match IS the onboarding.** Kill the overlay-first gate; let players play in <5s, no signup. `?` survives as optional help. | Interaction, Product |
| 4 | **Wallet gate fires once, on player intent** (a "Play for real / Win something real" CTA), never on load. Wallet = identity; username is an optional post-connect step. | Interaction, CTO |
| 5 | **Desktop = 3-column grid, not a stretched column.** Left "Dynamic Island" glass sidebar (~240–260px) / centered arena / optional right social panel. | UI, Interaction, CTO |
| 6 | **The look is "prototype" because surfaces are ~5 lightness points apart and color only appears in semantic moments.** Fix = deeper surface ladder + a full accent system (add violet + gold to the existing volt/crash/ghost). | UI, Product |
| 7 | **Provably-fair must become a real expandable commit→reveal→verify panel**, not an 8-char hash chip. This is a trust/integrity requirement once money is involved. | Product, CTO |
| 8 | **GSAP owns the chrome (sidebar, verdicts, nav, wallet modal) — NEVER the curve canvas or ticker** (those are the rAF game loop; two drivers = frame conflicts). | CTO, UI |
| 9 | **"CASHED X.XX×" is the single most important feedback moment and is currently undersized** (13px). Make it big (20–22px), extend the cash-burst. | Product, UI |

---

## 2. Where they DIVERGE (your call)

**A. Multi-game navigation pattern — when and how.**
- *Interaction (Cooper):* Start with a **segmented control** (1v1 / Solo / Tournament) on the Crash screen. Defer the multi-game bottom-tab lobby until there's a 2nd game. "Don't build platform nav for one game."
- *CTO (Vogels):* Build the **routed shell + game-registry interface now** (Phase 1A) so games plug in later — but the user-facing nav can still start minimal.
- **Recommendation:** Do both at their own layer — CTO's routing shell underneath (cheap insurance), Cooper's minimal segmented control on top (don't over-expose). Full lobby deferred.

**B. Right-side social panel on desktop.**
- UI + Interaction want a live-feed / taunt / history panel. Norman (Product) is silent — risk of clutter.
- **Recommendation:** Ship the LEFT Dynamic Island first; right panel is Phase 2 (needs real opponents/feed data to justify).

**C. Taunts & partial cash-out.**
- Cooper proposes a 3-chip taunt system + flags partial cash-out as a "player-control" differentiator.
- **Recommendation:** Defer both. They're post-crypto retention features, not part of the readability/professional-look milestone you asked for.

---

## 3. The hard escalation (CTO flagged — needs YOU)

> **Real-money crypto wagering without a gambling license** exposes the operator to domain seizure, asset forfeiture, and criminal liability in most jurisdictions. The established offshore path is a **Curaçao eGaming license (~$30–50K one-time)** + a gambling-licensing attorney.

**This blocks Phase 2 (real crypto) but NOT the redesign.** All the UI/UX/visual work below is play-money-safe and can ship now. The wallet/escrow layer must wait on your legal decision.

**Chain rec (when you get there):** **Polygon PoS** — EVM wallet ecosystem (MetaMask/RainbowKit/wagmi), USDC liquidity, and Solidity auditors outweigh Solana's speed (which is irrelevant since latency is bottlenecked by the INSFORGE edge function, not chain finality).

---

## 4. Recommended unified plan (phased, ship-safe)

**Milestone "PROFESSIONAL" (play-money, no legal blocker) — build in this order:**
1. **Visual system overhaul** — new surface ladder + accent palette + typography scale (UI doc §2–3). Pure CSS, biggest perceived-quality jump per hour.
2. **Mobile header cleanup** — delete `∑`, collapse 🔊/`?` into `⋯`, enlarge the cash-out confirmation (Product P0/P1).
3. **Desktop 3-column shell + Dynamic Island left sidebar** (glass/blur), behind GSAP reveal.
4. **GSAP motion layer** on chrome only (UI doc §5: ticker is OFF-limits, stays rAF).
5. **Provably-fair expandable proof panel** (Product §3).
6. **Routing shell + minimal mode segmented control** (CTO Phase 1A + Cooper).

**Milestone "REAL MONEY" (BLOCKED on legal):** wallet connect → custodial balance → on-chain escrow. Polygon. Do not start until licensing is resolved.

---

## 5. What we need from you to proceed

1. **Approve / edit the unified plan order in §4.**
2. **Confirm scope of Milestone 1** — is "PROFESSIONAL" (visual + layout + fair-panel, still play-money) the right next build, or do you want the routing/multi-game shell pulled forward?
3. **Legal call on §3** — do we pause all crypto work pending a license decision (recommended), or research licensing in parallel?
