# ADR-001 — Real-time transport for the CRASHOUT v0 duel

- **Status:** Accepted (Cycle 3/4)
- **Author:** cto-vogels (coordinator)
- **Decision owner:** CTO, ratified by CEO go/no-go

## Context

The locked MVP spec mandates a **ghost / async opponent** (Munger standing veto #3:
"NO synchronous-only MVP"). The opponent is a *recorded cash-out curve replayed*
against the round, never a live human matched in real time.

The open question from Cycle 2 was: real-time transport = Cloudflare Durable
Objects + WebSockets **vs** INSFORGE edge functions?

## Decision

**v0 needs no real-time transport at all. The entire duel runs client-side.**

The mandate to use a ghost opponent collapses the question:

- There is no second live player to synchronise → no authoritative game server,
  no socket fan-out, no matchmaking liquidity problem.
- The crash point is **deterministic** from a provably-fair seed (HMAC-SHA256),
  so the client can compute the whole round locally and still be verifiable.
- The opponent is a recorded `intent` (cash-out multiplier, or "rode to bust")
  replayed against the round's crash point. Pure function, no network.

Therefore the Durable-Objects-vs-edge-functions decision is **deferred to Phase 2**,
where it actually matters (live PVP, real money, server-authoritative escrow).
Choosing it now would be speculative complexity against a requirement we don't have.

This is "boring technology / monolith first": ship the smallest thing that
answers the retention question.

## What the backend IS on the critical path for

The client runs the *game*, but the backend runs the *experiment*. The gate
metrics (median rematches/session, post-loss rematch rate, **D1 retention**)
require **centralized aggregation across players and across days**. localStorage
is per-device and un-aggregatable — a local-only build proves the loop runs, not
the gate.

- **Backend = INSFORGE** (project rule). Needs only: an events ingest endpoint +
  a table, and a shared ghost-curve pool. No real-time anything.
- **BLOCKER (human escalation filed):** `npx @insforge/cli login` requires
  browser OAuth, which the autonomous loop cannot complete. Until a human logs in
  and we wire `VITE_INSFORGE_EVENTS_URL`, the client buffers events locally and
  the experiment cannot collect real gate data.

## Architecture (v0)

```
React + TS + Vite (client, pnpm)
├─ crashEngine.ts   provably-fair crash point (HMAC-SHA256) + multiplier curve
├─ ghosts.ts        ghost pool + replay + win/loss resolution (pure)
├─ useDuel.ts       rAF game-state machine
└─ analytics/       event log → buffer → POST to INSFORGE (when wired)

INSFORGE (deferred wiring, NOT real-time)
├─ POST /events     ingest (playerId, sessionId, name, props, ts)
└─ ghost_pool       shared recorded curves (centralizes the local pool)
```

## Phase 2 revisit (gated behind the retention gate)

When/if the gate passes and we add **live** PVP + real-money escrow, revisit:
Cloudflare Durable Objects (one object per duel = natural authoritative room,
WebSocket hibernation, strong consistency) vs INSFORGE edge functions. Durable
Objects is the current front-runner for the live-duel room model — but we do not
pay that cost until the loop is proven.

## Consequences

- ✅ Fastest path to a playable, verifiable retention experiment. ~0 infra cost.
- ✅ Provably-fair preserved without a server (seeds revealed client-side).
- ⚠️ Real gate data blocked on INSFORGE OAuth (human escalation).
- ⚠️ Ghost pool is per-device until the backend centralizes it; starter pool +
  local recording keep the lobby non-empty in the meantime.
