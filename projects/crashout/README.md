# CRASHOUT — 1v1 Crash PVP Ladder Duel (play-money MVP)

A **best-of-5 crash duel** (Hypothesis B): each round a multiplier rises and you
cash out before it crashes; the cash-out is **banked as points** (a crash zeroes
only that round, never your banked total). Highest **cumulative score** across 5
rounds takes the duel. v0 is a **play-money retention experiment** — no crypto,
no wallets, no accounts. It exists to answer one question: *does the branded 1v1
crash rematch loop retain once a crash no longer wipes the whole result?*

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # tsc -b && vite build
node src/game/logic.test.ts   # pure game-logic tests
```

## How it works

- **Provably fair** (`src/game/crashEngine.ts`): crash point derived from
  HMAC-SHA256 over a committed server seed + client seed. Verifiable after each
  round; the seed hash is shown in the HUD.
- **Ghost / async opponent** (`src/game/ghosts.ts`, **mandatory**): the opponent
  is a recorded **5-round run** (one `intent` per round — cash-out multiplier or
  "rode to bust") replayed against each round's crash point. The lobby is never
  empty; we test the *loop*, not matchmaking liquidity. Your completed run is
  recorded to grow the pool. No real-time transport — the whole duel runs
  client-side (see `docs/cto/cycle3-adr-realtime-transport.md`).
- **Scoring & the experiment arm** (`scoreMatch` in `src/game/ghosts.ts`): each
  round banks `multiplier` (0 on a bust). The **variance-protection arm** is the
  pre-registered experiment variable, assigned 50/50 per player and persisted:
  - `banked` — match score = sum of all 5 rounds.
  - `drop-lowest` — match score = sum of the best 4 (worst round dropped).
  The same arm scores **both** sides; the winning arm is whichever maximizes
  post-loss rematch rate. Per-round badge still uses highest-valid-cash-out; the
  **match** winner is the higher cumulative score (equal → draw).
- **Instrumentation** (`src/analytics/logger.ts`): the **atomic unit is the
  match**. `match_result` (win/loss/draw) is the post-loss-rematch denominator; a
  `rematch` fires only at match end, tagged with the match outcome. Every event
  carries the `arm`. Events buffer locally and POST to the backend when wired.
  Toggle the live read-out with the `∑` button.

## ⚠️ Backend not yet connected

The re-baselined gate for the longer ladder unit — **post-(match-)loss rematch
rate ≥35%** (the make-or-break metric) **AND** (median duels/session ≥3 **OR**
median engaged session ≥8 min) **AND D1 ≥18%**, over ≥300 players / ≥7 days —
needs **centralized cross-player / cross-day** aggregation. localStorage is
per-device and proves only that the loop *runs*.

Backend = **INSFORGE** (`npx @insforge/cli`). Wiring is blocked on browser OAuth
login — a human-escalation item. Once logged in + deployed, set
`VITE_INSFORGE_EVENTS_URL` to the events ingest endpoint and the client starts
shipping real gate data. **Deploy** to Cloudflare Pages is likewise blocked on
`wrangler login` (browser OAuth) — escalated.

## Brand

CRASHOUT — volt green `#00FF85`, crash red `#FF3B30`, near-black `#0A0A0F`.
Fonts: Chakra Petch (display) + JetBrains Mono (numbers).

## Out of scope for v0

crypto · wallets · escrow · real money · accounts/login · cosmetics ·
leaderboards · missions · paid ads · any "skill" framing (Munger veto #2).
