# ADR — Cycle 13: Platform Architecture for Multi-Game Crypto Casino

**Author:** Werner Vogels (cto-vogels)
**Status:** Proposed — analysis only, no code this cycle
**Date:** 2026-06-12
**Continuity:** Builds on ADR-001 (cycle3-adr-realtime-transport.md) and ADR-Cycle6 (cycle6-server-side-architecture.md)

---

## 0. TL;DR

CRASHOUT must evolve from a single `App.tsx` screen into a routed multi-game casino shell. The path is disciplined: route shell first, game plugin interface second, wallet layer third. Crash stays live on every commit. The correct chain is **Polygon PoS** for phase 1 crypto. The single biggest risk is regulatory — gambling licensing is a legal blocker, not a technical one, and it must be escalated to the human now.

---

## 1. Frontend Architecture: From One Screen to a Routed Platform

### 1.1 Current state

Everything lives in `src/App.tsx` (375 lines). One component is both the shell and the entire game. Adding a second game means forking `App.tsx` — a structural dead end.

### 1.2 Target structure

The model is a **shell + pluggable games** pattern. The shell owns navigation, wallet, auth, and global chrome. Each game is a self-contained module that satisfies a typed interface and mounts inside the shell.

```
src/
  shell/
    Shell.tsx               # top-level layout: sidebar nav + main content slot
    Header.tsx              # brand, wallet pill, notifications
    Sidebar.tsx             # game nav, user stats (Dynamic Island candidate for GSAP)
    routes.ts               # central route map
  games/
    crash/
      index.tsx             # entry point — exports GameModule conforming to IGame
      CrashGame.tsx         # current App.tsx content, cleaned up
      engine/               # crashEngine.ts, useMatch.ts, ghosts.ts, types.ts (move here)
      components/           # CurveCanvas.tsx, etc.
    dice/                   # future — empty dir reserves the slot
    roulette/               # future
  shared/
    wallet/
      WalletProvider.tsx    # wallet-connect context (Phase 2)
      WalletPill.tsx        # connect/disconnect button + balance chip
    auth/
      usePlayer.ts          # playerId, session token, guest vs connected
    game-registry.ts        # IGame registry — maps slug -> GameModule
    types/
      IGame.ts              # the plugin contract (see §1.3)
  pages/
    Lobby.tsx               # game selection grid (future)
    GamePage.tsx            # loads a game by slug from registry
    ProfilePage.tsx         # stats, history, provably fair log
```

This is still a **monolith** — one Vite build, one Cloudflare Pages deployment. No micro-frontends, no module federation. Those add ops cost we cannot justify with one game live. Split only when build times or team size force it.

### 1.3 The IGame plugin interface

Every game module exports one object that satisfies this contract. The shell does not know what game is inside — it knows only this interface.

```typescript
interface IGame {
  slug: string;              // 'crash' | 'dice' | ...
  label: string;             // display name
  description: string;
  minBet: number;            // in platform credits or wei
  Component: React.FC<GameProps>;
}

interface GameProps {
  playerId: string;
  balance: number;           // platform custodial balance (Phase 1)
  onBetPlaced: (amount: number) => void;
  onWin: (amount: number) => void;
  onLoss: (amount: number) => void;
}
```

`crash/index.tsx` exports this today (wrapping the existing `CrashGame`). `dice/index.tsx` will export it later. The shell never imports game internals directly.

### 1.4 Router

**TanStack Router v1** (file-based, type-safe, tree-shakeable). React Router v6 is also fine — both are production stable and boring. Do NOT use Next.js App Router; this is Cloudflare Pages + Vite, not a Node server, and the migration cost is not justified.

Routes:

```
/                   → redirect to /play/crash (while crash is the only game)
/play/:gameSlug     → GamePage (loads from registry by slug)
/lobby              → Lobby (game selection grid — build when 2nd game ships)
/profile            → ProfilePage
/verify/:roundToken → standalone provably fair verifier (shareable link)
```

### 1.5 State approach

- **Game-local state stays local.** `useMatch`, `crashEngine`, ghosts — these stay inside `games/crash/`. The shell does not touch them.
- **Cross-shell state (wallet, session, balance):** React Context + a simple Zustand store. No Redux — overkill for one dev.
- **URL is the primary navigation state.** No custom in-memory router state for page transitions.

### 1.6 What NOT to change now

`App.tsx` content moves to `games/crash/CrashGame.tsx` with zero logic changes. The existing `useMatch`, `crashEngine`, `ghosts` stay functionally identical. The `server.ts` client stays. Routing wraps around it. The live game must keep working on every commit.

---

## 2. GSAP — Where It Fits Without Hurting Performance

### 2.1 The mandate

GSAP is mandated. The question is placement: wrong placement kills the bundle and/or causes jank.

### 2.2 Bundle constraint

GSAP core + ScrollTrigger is ~80KB gzipped. That is acceptable for a game app. Do NOT import the full GSAP Club bundle — it includes plugins (MorphSVG, DrawSVG) that have zero use here. Import only what runs.

```
pnpm add gsap
```

Import selectively:
```typescript
import { gsap } from 'gsap';                    // core only in most components
import { gsap, ScrollTrigger } from 'gsap/all'; // only in the one file that uses it
```

### 2.3 What GSAP should animate (and what it should NOT)

**Good GSAP targets — non-game-loop, triggered by state changes:**

| Target | Why GSAP is right |
|--------|-------------------|
| Sidebar / Dynamic Island open/close | Complex spring physics, stagger, clip-path. rAF loop overkill. |
| Match verdict entrance (WIN/LOSE banner) | One-shot sequence with bounce, needs timeline precision. |
| Nav transitions between games | Page-level dissolve/slide between `/play/crash` and `/lobby`. |
| Wallet connect modal | Entrance/exit choreography (backdrop + panel + stagger items). |
| Notification toasts | Enter-stagger, exit-dissolve sequence. |
| Score counter animations | Already using `useCountUp` — replace with GSAP's numTo for better easing. |

**Bad GSAP targets — leave these alone:**

| Target | Why GSAP is wrong |
|--------|-------------------|
| The rising multiplier curve (CurveCanvas) | rAF loop already owns this at 60fps. GSAP adding a second rAF driver here = frame budget conflict. Keep it in Canvas2D. |
| The `ticker` number (`1.79×`) | Updating 60x/second via GSAP `.to` causes excessive DOM writes. Current inline state update is correct. |
| Crash flash effects (`redflash`, `voltflash`) | CSS keyframes are already correct here — they are GPU-composited (opacity + transform only). GSAP brings no benefit. |

**Rule:** GSAP owns UI chrome animations. The game loop owns game animations. They never share the same elements.

### 2.4 Performance checklist

- Animate only `transform` and `opacity` via GSAP (GPU compositing). Never animate `width`, `height`, `top`, `left` — these trigger layout.
- Use `gsap.context()` inside React components for safe cleanup on unmount.
- Set `gsap.ticker.lagSmoothing(0)` to prevent GSAP from "catching up" on tab-resume, which produces a visual jump. This is especially important when the game loop resumes after a background tab.
- Lazy-import GSAP in the sidebar/chrome bundle, not the game bundle, so the game's first paint is unblocked.

---

## 3. Backend Evolution on INSFORGE

### 3.1 Current schema

Three tables: `events`, `ghost_runs`, `rounds`. The `rounds` table is clean (match_token + round_token + provably fair fields). This is a solid foundation — reuse it.

### 3.2 Target data model for a multi-game platform

Every game that involves money needs: a player identity, a balance, a round record, and a payout ledger. Most of this structure is game-agnostic.

**New tables:**

```sql
-- Platform player identity (wallet-free in Phase 1, wallet-linked in Phase 2)
CREATE TABLE players (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_token    text UNIQUE,          -- anonymous device token (Phase 1)
  wallet_address text UNIQUE,          -- linked wallet (Phase 2, nullable)
  username       text UNIQUE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Custodial balance per player (Phase 1 — platform holds funds)
-- Phase 2: this becomes a mirror of the on-chain escrow, not the source of truth
CREATE TABLE balances (
  player_id  uuid PRIMARY KEY REFERENCES players(id),
  amount_wei bigint NOT NULL DEFAULT 0,  -- store in smallest unit always
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ledger — immutable, append-only financial record
CREATE TABLE ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES players(id),
  game_slug   text NOT NULL,           -- 'crash', 'dice', 'roulette'
  round_token uuid,                    -- FK to game-specific rounds table (nullable for deposits/withdrawals)
  type        text NOT NULL,           -- 'bet', 'win', 'refund', 'deposit', 'withdrawal'
  amount_wei  bigint NOT NULL,         -- signed: negative = debit, positive = credit
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_player_idx ON ledger(player_id, created_at DESC);

-- Game round — generic header, game-specific payload is in the game's own table
CREATE TABLE game_rounds (
  round_token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug   text NOT NULL,
  player_id   uuid NOT NULL REFERENCES players(id),
  bet_wei     bigint NOT NULL,
  payout_wei  bigint,                  -- null until resolved
  state       text NOT NULL DEFAULT 'pending', -- pending | resolved | abandoned
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX game_rounds_player_idx ON game_rounds(player_id, created_at DESC);
```

The existing `rounds` table (crash-specific provably fair data) becomes a child of `game_rounds`, linked by `round_token`. Other games add their own child tables (e.g. `dice_rounds`, `roulette_rounds`).

### 3.3 Provably fair seed service — reusable across games

The crash seed commit/reveal pattern in `backend/functions/rounds` is already the right model. Abstract it to a shared service:

```
backend/functions/
  seed-service/     # platform-level; any game calls this
    commit.ts       # generate serverSeed, return hash, store in seed_commits table
    reveal.ts       # return serverSeed + verify hash integrity
  rounds/           # crash-specific adjudication (keep as-is)
  events/           # analytics (keep as-is)
  session/          # Turnstile session mint (from cycle6 plan)
  balance/          # debit/credit + ledger write, atomic
```

The `seed_commits` table is game-agnostic:

```sql
CREATE TABLE seed_commits (
  seed_token   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_token  uuid NOT NULL,          -- references game_rounds.round_token
  server_seed  text NOT NULL,          -- RLS: never readable by anon
  server_seed_hash text NOT NULL,
  client_seed  text NOT NULL,
  nonce        integer NOT NULL,
  revealed_at  timestamptz
);
ALTER TABLE seed_commits ENABLE ROW LEVEL SECURITY;
-- No anon policies. Service key only.
```

### 3.4 Matchmaking — defer, but design the seam

Current ghost system is correct for Phase 1: no real matchmaking, no liquidity problem. Design the seam for Phase 2:

```
backend/functions/
  matchmaking/      # DEFERRED — add when live 1v1 is built
    queue.ts        # enqueue player, match by stake size + game mode
    room.ts         # hand off to Durable Object room (see §5)
```

The matchmaking function is a stub today. When real PVP lands, it writes to a `match_queue` table and Cloudflare Durable Objects picks up from there (per ADR-Cycle6 §7).

### 3.5 What is reusable across games

| Component | Reuse strategy |
|-----------|----------------|
| `players` + `balances` + `ledger` | Fully shared — every game uses these |
| `game_rounds` | Shared header; game-specific child table per game |
| Seed service (commit/reveal) | Shared — any provably fair game calls it |
| `events` ingest | Shared — game_slug field already in scope |
| Session / Turnstile gate | Shared — one session per user regardless of game |
| `ghost_runs` | Crash-specific — keep namespaced under crash |

---

## 4. Crypto / Wallet Architecture

### 4.1 Phase 1 — Custodial balance (build this)

Users connect a wallet to prove identity and fund their account. The platform holds funds in a custodial hot wallet. Game outcomes debit/credit the `balances` table. Withdrawals are a platform-initiated transfer.

**Why start here:** zero smart contract risk, zero audit cost, fast to ship. The user gets wallet-connected identity and a real balance without on-chain settlement latency on every round.

**The honest downside:** it is custodial. Users must trust the platform. This is acceptable for an early product — every casino, including Stake.com, started custodial. It is NOT acceptable long-term for a "provably fair" claim at scale.

### 4.2 Wallet connect approach

**Use RainbowKit + wagmi** for wallet connection. These are the industry standard for EVM wallets (MetaMask, Coinbase Wallet, WalletConnect modal). They handle the connection flow, chain switching, and signature requests. Do not build a custom wallet modal.

```
pnpm add @rainbow-me/rainbowkit wagmi viem
```

For Solana (if chosen): use `@solana/wallet-adapter-react`. Solana and EVM wallet stacks do not overlap — you pick one primary or maintain two separate contexts. This is a reason to pick one chain and stay on it.

### 4.3 Phase 2 — On-chain escrow (design now, build later)

When real-money duels go on-chain, the model is:
1. Both players approve and lock funds into an escrow smart contract before the round starts.
2. The contract holds funds during the round. Neither party can withdraw.
3. After the server-authoritative cashout resolve, the server submits a signed result to the contract.
4. The contract pays out the winner.

The server's signing key is the trust anchor — it must be a hardware-secured key (AWS KMS, Cloudflare Workers Secrets). This is the "house" in the trust model.

**Provably fair on-chain:** the commit hash can be stored on-chain at round start, making the commitment immutable and publicly auditable without a withdrawal gate.

### 4.4 Chain recommendation: Polygon PoS

**Recommendation: Polygon PoS for Phase 1 crypto.**

| Criterion | Polygon PoS | Solana |
|-----------|-------------|--------|
| Transaction cost | ~$0.001–0.01 | ~$0.00025 |
| Time to finality | 2–3 seconds (PoS checkpoints) | 400ms |
| EVM compatibility | Full | None — separate toolchain |
| Wallet ecosystem | MetaMask, WalletConnect, Coinbase (massive) | Phantom, Backpack (gaming-focused but smaller) |
| DeFi/liquidity for USDC/USDT deposits | Deep — Polygon USDC is liquid | Solana USDC exists but different bridge |
| Smart contract auditors available | Abundant (Solidity ecosystem) | Fewer (Rust/Anchor) |
| RainbowKit/wagmi support | First-class | Requires separate adapter |
| Casino precedents | Stake, Roobet, Rollbit all use EVM | Fewer established casino references |
| Operational risk | Lower — more infra, more oracles | Higher — outages in 2022 |

**Reasoning:** Solana's speed and cost advantages are real but marginal for a crash game where round latency is dominated by the ~200ms INSFORGE edge function round-trip, not the chain settlement. The EVM ecosystem moat (wallets, auditors, bridges, USDC liquidity) is decisive. A Polygon PoS transaction at $0.005 is not a friction point for bets above $1. Solana makes sense if this were a high-frequency trading game or a game with sub-second on-chain settlement requirements — Crash is neither.

**Defer the Polygon vs zkEVM decision** to Phase 2. Polygon PoS is the pragmatic first choice. If gas costs become a real user complaint at scale, Polygon zkEVM (EVM-compatible, cheaper) is a drop-in upgrade with minimal code change.

### 4.5 REGULATORY FLAG — HUMAN ESCALATION REQUIRED

**This is a hard stop. Do not proceed to real-money on-chain wagering without addressing this.**

Operating a crypto gambling platform is regulated in most jurisdictions. The specific exposure:

- **Gambling licensing:** In the UK, US (most states), EU (most countries), operating a game of chance for real money requires a license. The penalties for operating without one include domain seizure, asset forfeiture, and criminal liability in some jurisdictions. "Crypto" does not exempt the platform from gambling law — regulators in the UK (UKGC), Malta (MGA), and Curacao have all issued guidance to this effect.
- **KYC/AML requirements:** Any real-money platform is subject to Know Your Customer and Anti-Money Laundering obligations. Wallet address alone does not satisfy KYC.
- **Curacao eGaming license:** The most common option for offshore crypto casinos. Stake.com, Roobet, and Rollbit all operate under Curacao licenses. Cost: $30,000–$50,000 one-time + ongoing compliance. This is the minimum viable path to a legal real-money product.
- **US exposure:** Serving US users under any license structure is extremely high risk. Geofencing US IPs is table stakes before any real-money launch.

**Recommended human escalation:** Before building Phase 2 crypto features, the founder must consult a gambling licensing attorney and answer: (a) what jurisdictions will the platform serve, (b) is a Curacao license the intended path, (c) what is the KYC vendor (Sumsub, Onfido). No CTO decision resolves this. It is a business/legal call with financial and criminal consequences.

---

## 5. Phased Migration Path

### Invariant: the live game at crashout-euq.pages.dev must work on every commit.

**Phase 1A — Shell restructure (no new features, no visible change)**

Goal: wrap existing game in the routed shell without changing any logic.

Milestones:
1. Add TanStack Router. `App.tsx` → `games/crash/CrashGame.tsx`. Shell renders `CrashGame` at `/play/crash`. Existing URL (`/`) redirects. Deploy. Verify live game works identically.
2. Extract `Sidebar.tsx` and `Header.tsx` from App chrome (brand, mute button, help). Wire GSAP to sidebar open/close. No new content, just structural split.
3. Add `/profile` route (stub page). Add `/verify/:roundToken` route (stub page). Routing works; pages are empty.

**Phase 1B — Identity + custodial balance**

Goal: wallet connect, guest play stays default, connected players get a persistent balance.

Milestones:
1. INSFORGE: `players`, `balances`, `ledger` tables. `balance` edge function (debit/credit atomic).
2. RainbowKit/wagmi wired to Polygon PoS mainnet. `WalletPill` in header (connect optional).
3. Guest play unchanged. Connected players: bet from balance, balance updates on win/loss.
4. `/profile` shows balance + round history from `ledger`.

**Phase 1C — Lobby + game registry**

Goal: navigation shell usable when a second game exists.

Milestones:
1. `game-registry.ts` + `IGame` interface. Crash registered as the first game.
2. `/lobby` page renders the game grid (one card: Crash). Navigation works.
3. Placeholder game slot ("Coming Soon") for Dice or Roulette to demonstrate the grid.

**Phase 2 — Durable Objects + real-time live PVP**

Per ADR-Cycle6 §7. Cloudflare Durable Object per duel room. WebSocket push from server. This eliminates the ~200ms cashout adjudication latency gap that is acceptable for play-money but not for real-money. Build only after licensing is confirmed.

**Phase 3 — On-chain escrow**

Smart contract on Polygon PoS. Server signs results. Commit hash on-chain. Full provably fair at the bustabit standard (precommitted server seed hash chain). Build only after Phase 2 is stable and licensing is in place.

---

## 6. Top Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Regulatory/legal — operating without a gambling license** | Critical | Escalate to human now. Do not ship real-money features until licensing path is confirmed. No code decision resolves this. |
| **INSFORGE edge function cold starts cause cashout latency spikes** | High | The `round/cashout` path is latency-sensitive. Measure p99 latency under load. If cold starts exceed 500ms, move adjudication to a Durable Object before real money. The ADR-Cycle6 residual latency gap becomes a financial dispute gap with real funds. |
| **Shell refactor breaks the live game** | Medium | Phase 1A must be zero-logic-change. CI smoke-test: the existing game behavior (provably fair flow, ghost animation, match scoring) must pass before and after every structural commit. |
| **Wallet library dependency risk (RainbowKit/wagmi)** | Medium | Both are actively maintained and have large ecosystems. Risk: wagmi v2 broke wagmi v1 APIs. Pin major versions. The `WalletProvider` is an isolation seam — swapping the wallet library does not touch game code. |
| **GSAP in the game loop** | Medium | If a future engineer adds GSAP to `CurveCanvas` or the ticker, it will conflict with the rAF loop and cause frame drops. Document the rule: GSAP owns chrome, game loop owns game. Add a comment in `CurveCanvas.tsx` explicitly prohibiting GSAP imports. |
| **Polygon PoS withdrawal UX** | Medium | Users unfamiliar with bridging MATIC/USDC may find withdrawal confusing. Design the withdrawal flow with a guided bridge link before launch. This is a UX risk, not a technical one. |
| **Single-point failure: INSFORGE** | Medium | The backend is fully on INSFORGE. If INSFORGE has an outage, the server-authoritative seed path fails and the game falls back to "DEMO RNG." The fallback is already implemented. For real-money phases, a Durable Object adjudicator as a secondary path is required — the INSFORGE fallback is not acceptable when real funds are at stake. |
| **Ghost pool staleness** | Low | Ghost intents are recorded locally per device. The shared `ghost_runs` table in INSFORGE centralizes this. Keep the sync job that uploads local ghosts to the pool. Without it, new users see only the seed ghost pool. |

---

## 7. What to Defer

These are explicitly out of scope until the phases above are stable:

- **Micro-frontend architecture:** not needed until there are multiple teams or build times exceed 5 minutes.
- **Tournaments:** requires matchmaking, bracket logic, scheduling. Design when Lobby is live and at least two games exist.
- **Solana integration:** revisit only if Polygon PoS proves too expensive or the user base is Solana-native.
- **Custom wallet SDK:** RainbowKit covers this. Do not build a custom modal.
- **Pre-commit server seed hash chain (bustabit-grade):** real-money upgrade, Phase 3.
- **Behavioral bot detection:** needs a 300-player data baseline. Do not build before traffic.
- **zkEVM or L3 rollup:** Polygon PoS is sufficient for Phase 1 and Phase 2. Revisit at 10,000 daily active users.

---

## 8. Architecture Diagram (simplified)

```
Cloudflare Pages (crashout-euq.pages.dev)
└── React 19 + Vite SPA
    ├── Shell (TanStack Router)
    │   ├── Header (WalletPill, brand)      ← GSAP: entrance animations
    │   ├── Sidebar (Dynamic Island nav)    ← GSAP: open/close, stagger
    │   └── <Outlet>
    │       ├── /play/crash   → CrashGame   ← game loop: Canvas rAF, NO GSAP
    │       ├── /play/dice    → DiceGame    (future)
    │       ├── /lobby        → Lobby
    │       └── /profile      → ProfilePage
    └── WalletProvider (RainbowKit / wagmi / Polygon PoS)

INSFORGE (backend)
├── edge: session         (Turnstile gate)
├── edge: rounds          (crash seed commit/reveal — existing)
├── edge: events          (analytics — existing)
├── edge: seed-service    (shared commit/reveal for future games)
├── edge: balance         (debit/credit, ledger write)
└── Postgres
    ├── players, balances, ledger      (shared platform tables)
    ├── game_rounds, seed_commits      (shared game tables)
    ├── rounds, ghost_runs             (crash-specific — existing)
    └── sessions                       (auth)

Blockchain (Phase 2+)
└── Polygon PoS
    ├── Escrow contract (per-duel)
    └── Commit hash registry (provably fair on-chain anchor)

Cloudflare Durable Objects (Phase 2+)
└── DuelRoom (one DO per live 1v1 match)
    ├── WebSocket: server-push multiplier ticks
    └── Authoritative cashout adjudication (eliminates latency gap)
```
