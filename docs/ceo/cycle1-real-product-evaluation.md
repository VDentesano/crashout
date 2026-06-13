# Cycle 1 — What CRASHOUT Needs to Become a Real Product

**Decision owner:** CEO (Bezos). Lenses applied: Research (Thompson), Critic (Munger), CFO (Campbell).
**Status:** Evaluation complete → **GO** on Milestone "RETENTION CORE" (play-money). **NO-GO** on real-money until license.

---

## 1. The actual problem (not the one we keep solving)

We have spent cycles 13–18 making the game *look* professional. That work is done and good. But:

- **Users: 0. Revenue: $0.**
- The product is **single-player vs pre-recorded ghosts**, with **no account, no persistence, no leaderboard, no share**.
- You play a match, and then **nothing happens** — no record, no rank, no reason to return, no way to tell anyone.

A "real product" is not a prettier single-player toy. The minimum bar is a **value loop that survives a page refresh and leaves the site**:

> **Play → earn a score → see where you rank → come back to climb → share to recruit.**

Today, steps 2–5 do not exist. That — not visuals, not real money — is the gap between "demo" and "product."

**Munger inversion:** "How do we guarantee CRASHOUT stays at 0 users?" Answer: keep it stateless and unshareable so every session starts from zero and nobody can prove they won. We are currently doing exactly that. Fixing it is the whole job.

---

## 2. Ranked feature list (leverage × shippability × legal risk)

| # | Feature | Why it matters | Priority | Legal risk |
|---|---------|----------------|----------|-----------|
| 1 | **Persistent lightweight identity** (device-id + optional username via INSFORGE auth) | Nothing else can persist without it. Foundation. | **P0** | None |
| 2 | **Player profile + stats** (W/L, best multiplier, current streak, matches played) | First reason to return: "my number went up." | **P0** | None |
| 3 | **Global leaderboard** (daily + all-time, points/ELO) | The single biggest retention + competition driver for a PVP game. | **P0** | None |
| 4 | **Shareable result card** ("I beat apex_77 5–3, climbed to #142" → image/link) | Near-zero-CAC viral loop. Only growth channel we can afford at $0. | **P1** | None |
| 5 | **Daily streak / daily seed challenge** (everyone plays the same crash seed) | Habit hook + fair shared comparison + organic share. | **P1** | None |
| 6 | **Ghosts = real recorded player runs** (wire existing pool to backend) | Makes "1v1" honest; the pool already half-exists in `ghosts.ts`. | **P1** | None |
| 7 | **Seasonal ranked ladder / divisions** | Long-term retention once there's liquidity. | **P2** | None |
| 8 | **Real-money crypto wagering** (wallet → custodial balance → on-chain escrow, Polygon) | The business model. | **P2** | **BLOCKER — license** |

**Cut/defer:** taunts, partial cash-out, right-side social panel, multi-game lobby. All are polish on a loop that doesn't exist yet. Revisit after #1–5 ship and show retention.

---

## 3. GO / NO-GO

**GO — Milestone "RETENTION CORE" (#1–4, then #5–6).** Play-money. No legal blocker. Builds the missing loop on top of INSFORGE (auth + tables + the events/rounds functions already scaffolded). This is the first milestone that can actually move Users off 0.

**NO-GO — real money (#8).** Confirmed blocker from Cycle 13 CTO escalation: real-money crypto wagering without a gambling license (~$30–50K Curaçao + attorney) exposes us to seizure/forfeiture/criminal liability. **Do not write a single line of wallet/escrow code until the licensing decision is made.** Research licensing cost/timeline in parallel — that's a memo, not code.

**CFO note:** At 0 users the only rational spend is engineering time on the retention loop and $0-CAC virality (#4/#5). Spending $30–50K on a license to monetize 0 users is backwards. Earn retention first; license when daily-actives justify it.

---

## 4. Next milestone definition (for the build cycles)

**Milestone: RETENTION CORE.** Done = a returning player, on a fresh device, can:
1. Get a persistent identity without a forced signup wall (anonymous first, claim username later).
2. See their own stats update after a match and survive a refresh.
3. See a global leaderboard and their position on it.
4. Share a result card that links back to the game.

Build order: **#1 identity → #2 stats → #3 leaderboard → #4 share → #5 daily → #6 real-ghost pool.**
Backend: INSFORGE (extend existing migrations). Frontend: existing React/Vite/GSAP app.

**First build cycle (next):** ship #1 + #2 end-to-end — INSFORGE auth + a `players` table + a `matches` table, write match results on completion, render a real profile panel. One vertical slice, deployed to the live Pages site.
