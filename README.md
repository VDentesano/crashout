# Crash Crypto PVP — Auto-Company Project

A fully autonomous AI company building a **1v1 Crash PVP crypto game**.

## What is This?

This project uses the **Auto-Company** framework with a **multi-model orchestration** system:

| Role | Model | Purpose |
|------|-------|---------|
| **Coordinator** | Claude Fable 5 | Strategic decisions, workflow orchestration |
| **Strategic Agents** | Claude Fable 5 | CEO, Critic, Research — deep reasoning |
| **Architecture Agents** | Claude Opus 4.8 | CTO, CFO, Fullstack — complex code & systems |
| **Execution Agents** | Claude Sonnet 4.6 | UI, Product, QA, DevOps — fast execution |

## The Game

A 1v1 Crash PVP duel where two players bet crypto and compete to cash out at the highest multiplier before the crash.

**Core Features:**
- 1v1 Crash PVP with crypto betting
- House rake (3-5%) + double crash jackpot
- Streaks, badges, leaderboards, bounties
- Player control mechanics (partial cash-outs, power-ups)
- Cosmetic economy (skins, animations, avatars)
- Provably fair crash algorithm
- i18n: English primary, Spanish secondary

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: INSFORGE (https://insforge.dev/)
- Infrastructure: Cloudflare
- Package Manager: **pnpm** (never npm)
- Blockchain: TBD (Polygon or Solana)

## Quick Start

```bash
# Start the autonomous loop (foreground)
make start

# Check status
make status

# View live logs
make monitor

# Start dashboard
make dashboard

# Stop
make stop
```

## Project Structure

```
.
├── CLAUDE.md              # Company charter (mission, guardrails, team)
├── PROMPT.md              # Per-cycle execution prompt
├── Makefile               # Command entry
├── .auto-loop.env         # Loop configuration
├── memories/
│   └── consensus.md       # Cross-cycle state
├── docs/                  # Agent outputs (14 directories)
├── projects/              # Generated projects
├── logs/                  # Cycle logs
├── scripts/core/          # Auto-loop, monitor, stop
├── dashboard/             # Local web status dashboard
└── .claude/
    ├── agents/            # 14 agent definitions with models
    ├── skills/            # Reusable skills
    └── settings.json      # Agent Teams + permissions
```

## Team Architecture

14 AI agents, each modeled on a world-class expert:

**Strategy:** `ceo-bezos` (Fable) | `cto-vogels` (Opus) | `critic-munger` (Fable)
**Product:** `product-norman` (Sonnet) | `ui-duarte` (Sonnet) | `interaction-cooper` (Sonnet)
**Engineering:** `fullstack-dhh` (Opus) | `qa-bach` (Sonnet) | `devops-hightower` (Sonnet)
**Business:** `marketing-godin` (Sonnet) | `operations-pg` (Sonnet) | `sales-ross` (Sonnet) | `cfo-campbell` (Opus)
**Intelligence:** `research-thompson` (Fable)

## Workflows

1. **New Product Evaluation**: research → CEO → Critic → Product → CTO → CFO
2. **Feature Development**: Interaction → UI → Fullstack → QA → DevOps
3. **Product Launch**: QA → DevOps → Marketing → Sales → Ops → CEO
4. **Pricing & Monetization**: Research → CFO → Sales → Critic → CEO

## Safety Guardrails

- Never delete GitHub repos or Cloudflare projects
- Never commit credentials
- Never use npm (always pnpm)
- Never perform illegal activity
- Human escalation for business decisions and tool access

## Status

**Current Phase:** Day 0 — Exploring
**Next Action:** Execute "New Product Evaluation" workflow

---

*Built by Auto-Company with Claude Fable 5, Opus 4.8, and Sonnet 4.6.*
