<div align="center">

# Auto Company

**A fully autonomous AI company running 24/7** <a href="README-ZH.md"><img alt="[中文说明]" src="https://img.shields.io/badge/%5B%E4%B8%AD%E6%96%87%E8%AF%B4%E6%98%8E%5D-2f3640.svg" /></a>

Powered by **Agentic Workflows**, this project orchestrates 14 **Autonomous AI Agents**, each modeled after world-class experts in their domain.
They ideate products, make decisions, write code, deploy, and market - without human intervention.

Powered by Claude Code (default) and [Codex CLI](https://www.npmjs.com/package/@openai/codex) on Linux.

[![Linux](https://img.shields.io/badge/Platform-Linux-blue?logo=linux&logoColor=white)](#dependencies)
[![Claude Code](https://img.shields.io/badge/Engine-Claude%20Code-purple?logo=anthropic&logoColor=white)](#dependencies)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)

</div>

---

## Dashboard Preview

![Auto Company Dashboard](presentation/dashboard-showcase.png)

## What Is This?

You start a loop. The AI team wakes up, reads shared consensus memory, decides what to do, forms a 3-5 person squad, executes, updates consensus memory, then sleeps briefly. Then it repeats.

```
systemd --user daemon (auto-restart on crash)
  └── scripts/core/auto-loop.sh (continuous loop)
        ├── reads PROMPT.md + consensus.md
        ├── LLM CLI call (Claude Code / Codex CLI)
        │   ├── reads CLAUDE.md (charter + guardrails)
        │   ├── reads .claude/skills/team/SKILL.md (teaming method)
        │   ├── forms an Agent Team (3-5 agents)
        │   ├── executes: research, coding, deploy, marketing
        │   └── updates memories/consensus.md (handoff baton)
        ├── failure handling: rate-limit wait / circuit breaker / consensus rollback
        └── sleep -> next cycle
```

Each cycle is an independent CLI call. `memories/consensus.md` is the only cross-cycle state.

## Linux Quick Start

```bash
# Prerequisites:
# - Linux with systemd (most modern distros)
# - Claude Code or Codex CLI installed and authenticated
# - Available model quota

# Clone
git clone https://github.com/MaxMiksa/Auto-Company.git
cd auto-company

# Foreground run (live output)
make start

# Or install daemon (auto-start + auto-restart)
make install
```

## Command Quick Reference

| Task | Command |
|------|---------|
| Start | `make start` |
| Status | `make status` |
| Live logs | `make monitor` |
| Last cycle output | `make last` |
| Cycle summary | `make cycles` |
| Stop | `make stop` |
| Web dashboard | `make dashboard` |
| Install daemon | `make install` |
| Uninstall daemon | `make uninstall` |
| Pause daemon | `make pause` |
| Resume daemon | `make resume` |

## Team Lineup (14 Agents)

This is not "you are a generic developer". It is "you are DHH" style role prompting with real expert mental models.

| Layer | Role | Expert Persona | Core Strength |
|------|------|------|----------|
| **Strategy** | CEO | Jeff Bezos | PR/FAQ, flywheel thinking, Day 1 mindset |
| | CTO | Werner Vogels | Design for failure, API-first architecture |
| | Inversion | Charlie Munger | Inversion, pre-mortems, misjudgment checklist |
| **Product** | Product Design | Don Norman | Affordance, mental models, human-centered design |
| | UI Design | Matias Duarte | Material metaphor, typography-first design |
| | Interaction Design | Alan Cooper | Goal-directed design, persona-driven decisions |
| **Engineering** | Full-Stack | DHH | Convention over configuration, majestic monolith |
| | QA | James Bach | Exploratory testing, testing is not checking |
| | DevOps/SRE | Kelsey Hightower | Automation first, reliability discipline |
| **Business** | Marketing | Seth Godin | Purple cow, permission marketing, smallest viable audience |
| | Operations | Paul Graham | Do things that do not scale, ramen profitability |
| | Sales | Aaron Ross | Predictable revenue, funnel systems |
| | CFO | Patrick Campbell | Value-based pricing, unit economics |
| **Intelligence** | Research Analyst | Ben Thompson | Aggregation theory, value chain analysis |

Plus 30+ reusable skills (deep research, scraping, financial modeling, SEO, security audit, UX audit, etc.).

## Architecture & Technology Stack (5-Layer Architecture)

Auto-Company is not a simple LLM API wrapper, but a highly decoupled **Multi-Agent System (MAS)**. Its technical architecture is divided into 5 distinct layers:

```text
┌────────────────────────────────────────────────────────────┐
│ 5. Observability & HITL (Human-In-The-Loop) Layer          │
│    [ Dashboard ]  [ File-based Steering (consensus.md) ]   │
├────────────────────────────────────────────────────────────┤
│ 4. Workflow Routing & Teaming Layer                        │
│    [ Dynamic Squad Routing ]  [ Forced Convergence Flow ]  │
├────────────────────────────────────────────────────────────┤
│ 3. Agentic Models & Cognition Layer                        │
│    [ 14 Expert Personas ]  [ 30+ Skill Arsenal ]           │
├────────────────────────────────────────────────────────────┤
│ 2. Orchestration & State Machine Layer                     │
│    [ 24/7 Auto-Loop ]  [ State Machine ]  [ Resilience ]   │
├────────────────────────────────────────────────────────────┤
│ 1. Execution Engine & Infrastructure Layer                 │
│    [ Dual-Engine (Claude/Codex) ]  [ systemd Daemon]     │
└────────────────────────────────────────────────────────────┘
```

### Layer 5: Observability & HITL (Human-In-The-Loop)
*   **File-based Steering**: Humans only need to edit `memories/consensus.md` and modify the `Next Action`. The AI team waking up in the next cycle will immediately pivot, enabling minimalist macro-control.
*   **Full-chain Logs & Dashboard**: `logs/` records the complete output and chain-of-thought for each cycle. `dashboard/` provides a local visualization dashboard based on a Python server, displaying real-time cycle status, cost consumption, and agent activity.

### Layer 4: Workflow Routing & Teaming
*   **Dynamic Squad Formation**: Powered by Agent Teams, the system dynamically selects 2-5 of the most suitable experts from the 14-person pool based on the "Next Action" in `consensus.md`, instantiating them as sub-agents for the current loop.
*   **Forced Convergence Flow**: Hardcoded flow control in `PROMPT.md`. For example: Cycle 1 Ideation -> Cycle 2 Validation (Pre-mortem, GO/NO-GO) -> Cycle 3 Execution (Code & Deploy, **pure discussion is forbidden**).

### Layer 3: Agentic Models & Cognition
*   **Expert Personas Injection**: Instead of generic prompts, it injects specific mental models of historical figures/industry leaders (e.g., Bezos's "Working Backwards", Munger's "Checklists", DHH's "Majestic Monolith") into `.claude/agents/`, giving decisions extreme business and engineering depth.
*   **Skill Arsenal**: A pluggable system located in `.claude/skills/` (e.g., `frontend-design`, `security-audit`). Specific methodologies are encapsulated as tools that any awakened Agent can "temporarily load".
*   **Constitutional Guardrails**: System-level prompts hardcoded in `CLAUDE.md` set absolute bottom lines (e.g., no deleting repos, no force pushes) to ensure safety under high autonomy.

### Layer 2: Orchestration & State Machine
*   **The Auto-Loop**: The execution loop controlled by `scripts/core/auto-loop.sh` frees the AI from "single-turn conversations", enabling 24/7 continuous operation.
*   **Lightweight State Machine (Consensus Memory)**: Forgoes complex vector databases or memory management, compressing cross-cycle context into a single Markdown file: `memories/consensus.md`. Read before every cycle and rewritten before it ends, acting as the system's "baton".
*   **Resilience & Self-Healing**: Built-in circuit breakers (cooldown triggered by consecutive errors), rate-limit backoff (auto-sleep on 429 errors), and sandbox reset (auto-rollback if a valid consensus is not output).

### Layer 1: Execution Engine & Infrastructure
*   **Dual-Engine Executor**: Acts as the underlying executor by calling mature AI CLIs (**Claude Code** or **Codex CLI**), naturally inheriting their file I/O, Bash execution, and Git operation capabilities.
*   **systemd --user Daemon**: Linux uses `systemd --user` for auto-start and crash recovery. The service runs under the user session, no root required.
*   **Sandbox Boundary**: Currently relies on underlying CLI configurations (like Codex's `danger-full-access` or Claude's `bypassPermissions`). System-level operations occur directly in the host environment.

## Operating Model

### Automatic Convergence (No Endless Discussion)

| Cycle | Action |
|------|------|
| Cycle 1 | Brainstorm: each agent proposes ideas, rank top 3 |
| Cycle 2 | Validate #1: Munger pre-mortem + Thompson market check + Campbell economics -> **GO / NO-GO** |
| Cycle 3+ | GO -> create repo, build, deploy. NO-GO -> move to next idea. Discussion-only loops are forbidden |

### Six Standard Workflows

| # | Workflow | Collaboration Chain |
|---|------|--------|
| 1 | **New Product Evaluation** | Research -> CEO -> Munger -> Product -> CTO -> CFO |
| 2 | **Feature Development** | Interaction -> UI -> Full-stack -> QA -> DevOps |
| 3 | **Product Launch** | QA -> DevOps -> Marketing -> Sales -> Ops -> CEO |
| 4 | **Pricing and Monetization** | Research -> CFO -> Sales -> Munger -> CEO |
| 5 | **Weekly Review** | Ops -> Sales -> CFO -> QA -> CEO |
| 6 | **Opportunity Discovery** | Research -> CEO -> Munger -> CFO |

## Steering

The team runs autonomously, but you can intervene at any time:

| Method | Action |
|------|------|
| **Change direction** | Edit "Next Action" in `memories/consensus.md` |
| **Pause** | `make pause` |
| **Resume** | `make resume` |
| **Review outputs** | Check `docs/*/` for artifacts generated by agents |

## Safety Guardrails

Hard constraints in `CLAUDE.md`, enforced for all agents:

- Do not delete GitHub repos (`gh repo delete`)
- Do not delete Cloudflare projects (`wrangler delete`)
- Do not delete system directories (`~/.ssh/`, `~/.config/`, etc.)
- Do not perform illegal activity
- Do not leak credentials into public repositories
- Do not force push to main/master
- Create all new projects under `projects/`

## Configuration

Environment variable overrides:

```bash
ENGINE=claude make start                   # Default engine (claude|codex)
ENGINE=codex make start                    # Switch to codex
MODEL=sonnet make start                    # Optional model override
CLAUDE_PERMISSION_MODE=bypassPermissions make start  # Claude permission mode
LOOP_INTERVAL=60 make start                # 60s interval (default 30)
CYCLE_TIMEOUT_SECONDS=3600 make start      # 1h cycle timeout (default 1800)
MAX_CONSECUTIVE_ERRORS=3 make start        # Circuit-breaker threshold (default 5)
CODEX_SANDBOX_MODE=workspace-write make start  # Optional sandbox override
CLAUDE_BIN=/usr/local/bin/claude make start     # Optional Claude binary override
CODEX_BIN=/usr/local/bin/codex make start       # Optional Codex binary override
```

These can also be set in `.auto-loop.env` for persistence.

No automatic engine fallback is performed. If the selected engine is missing, startup fails fast.

## Project Structure

```
auto-company/
├── CLAUDE.md              # Company charter (mission + guardrails + team + workflows)
├── PROMPT.md              # Per-cycle execution prompt (convergence rules)
├── Makefile               # Common command entry
├── INDEX.md               # script index + responsibility table
├── dashboard/             # Local web status dashboard (make dashboard)
├── scripts/
│   ├── core/              # Core loop and control scripts (auto-loop/monitor/stop)
│   └── linux/             # Linux systemd --user daemon scripts
├── memories/
│   └── consensus.md       # Shared handoff memory across cycles
├── docs/                  # Agent outputs (14 folders)
├── projects/              # Workspace for generated projects
├── logs/                  # Loop logs
└── .claude/
    ├── agents/            # 14 agent definitions (expert personas)
    ├── skills/            # 30+ reusable skills
    └── settings.json      # Permissions + Agent Teams switch
```

## Dependencies

| Dependency | Notes |
|------|------|
| **Claude Code / Codex CLI** | Supported CLI engines (default: Claude) |
| **Linux with systemd** | systemd --user for daemon mode |
| `node` | Runtime for npm-installed CLI tools |
| `make` | Start/stop/monitor command entry |
| `jq` | Recommended for log processing |
| `gh` | Optional, GitHub CLI |
| `wrangler` | Optional, Cloudflare CLI |

## FAQ

### 1) `claude`/`codex` command not found

- Cause: CLI not installed or not in PATH
- Fix: install your chosen CLI (`npm install -g @anthropic-ai/claude-code` or `@openai/codex`) and verify with `claude --version`

### 2) Claude waits for permission and cycles appear blocked

- Cause: strict permission mode in Claude CLI
- Fix: set `CLAUDE_PERMISSION_MODE=bypassPermissions` in `.auto-loop.env` or pass as env var
- Verify: check `logs/auto-loop.log` for `Engine: claude` and `PermissionMode: ...`

### 3) `make install` fails

- Cause: systemd --user not available or no permissions
- Fix:
  - Verify systemd is installed: `systemctl --version`
  - Ensure user has permission to run `systemctl --user` commands
  - Check that `~/.config/systemd/user/` directory exists and is writable

### 4) How do I view daemon logs?

```bash
journalctl --user -u auto-company.service -f
```

Or use `make monitor` to tail the loop's own log file.

## Disclaimer

This is an **experimental project**:

- **Daemon mode works on Linux with systemd --user**
- **Still under test**: runs, but stability is not guaranteed
- **Costs money**: each cycle consumes model quota
- **Fully autonomous**: agents act without approval prompts; configure guardrails carefully in `CLAUDE.md`
- **No warranty**: review `docs/` and `projects/` regularly

Suggested rollout: start with `make start` (foreground), then move to daemon mode (`make install`).

## Acknowledgments

- Thanks to [@JasonQWJ](https://github.com/JasonQWJ) and [@cnwillz](https://github.com/cnwillz) for earlier dashboard support proposals.
- [nicepkg/auto-company](https://github.com/nicepkg/auto-company) - initial macOS edition
- [continuous-claude](https://github.com/AnandChowdhary/continuous-claude) - cross-session shared notes
- [ralph-claude-code](https://github.com/frankbria/ralph-claude-code) - exit signal interception
- [claude-auto-resume](https://github.com/terryso/claude-auto-resume) - usage-limit resume pattern

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@tepper.cmu.edu
GitHub: https://github.com/MaxMiksa/Auto-Company
