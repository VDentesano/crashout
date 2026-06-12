# CRASHOUT — 1v1 Crash PVP Duel

> **Play free, no account needed → [crashout-euq.pages.dev](https://crashout-euq.pages.dev)**

CRASHOUT is a **best-of-5 crash duel**. A multiplier climbs — cash out before it crashes. Your cash-outs bank as points across 5 rounds. Highest cumulative score wins.

No wallets. No real money. Pure skill vs. ghost opponents drawn from real player runs.

---

## How it works

- **Provably fair** — each round's crash point is derived from HMAC-SHA256 over a committed server seed + client seed. Verifiable after every round; the seed hash is shown in the HUD.
- **Ghost opponents** — you always have an opponent: a recorded 5-round run from a real player, replayed against the same crash points. No matchmaking wait. Your completed run grows the pool.
- **Banked scoring** — busting a round zeroes only that round, never your total. The loop tests *strategy under variance*, not luck.
- **Leaderboard** — net delta, best cash-out, and win rate tracked globally across all players.
- **Match history** — every duel recorded; review your runs anytime.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend / DB | [INSFORGE](https://insforge.dev) (edge functions + D1) |
| Deploy | Cloudflare Pages + Workers |

---

## Run locally

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build
```

---

## Brand

**Volt green** `#00FF85` · **Crash red** `#FF3B30` · **Near-black** `#0A0A0F`  
Fonts: Chakra Petch (display) · JetBrains Mono (numbers)

---

## Status

Play-money MVP — live. Working toward the retention gate: post-loss rematch rate ≥35% across ≥300 players / ≥7 days before introducing real stakes.

Feedback welcome — open an issue or reach out.
