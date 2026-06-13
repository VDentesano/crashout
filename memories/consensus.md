# Auto Company Consensus

## Last Updated
2026-06-13 06:12 -03 — Cycle 16 protected PR evidence shipped and verified

## Current Phase
Building

## What We Did This Cycle
- Used the required team process from `.claude/skills/team/SKILL.md`; native subagent spawning was available, so assembled DevOps, QA, Fullstack, and CTO with `model: gpt-5.5` and `model_reasoning_effort: medium`.
- Produced Cycle 16 team outputs:
  - `docs/devops/cycle16-protected-pr-execution.md`
  - `docs/qa/cycle16-pr-ci-evidence.md`
  - `docs/fullstack/cycle16-source-diff-review.md`
  - `docs/cto/cycle16-release-architecture.md`
- Discovered that the previous next action had already completed upstream: PR `#1` merged `codex/cockpit-smoke-ci-gate` into `main`, and `origin/main` now contains the cockpit smoke CI gate plus merge verification.
- Avoided force-pushing or rewriting the primary checkout's divergent local `main`; created clean worktree branch `codex/cycle16-pr-evidence` from `origin/main`.
- Opened draft PR `#3`: `https://github.com/VDentesano/crashout/pull/3`.
- Ran local branch checks from `projects/crashout`: `pnpm run check` passed and `pnpm run smoke:cockpit` passed with 20 measured states and 0 overflow findings.
- Ran `git diff --check`; no whitespace errors found.
- Ran `pnpm release:ready` from `projects/crashout`; it blocked as expected on topic branch alignment because the release script is designed for production branch `main`.
- Verified GitHub Actions run `27462512488` for PR `#3`: protected `Lint, test, build` passed.
- Downloaded and verified the `cockpit-smoke` artifact from run `27462512488`: artifact is not expired, contains `measurements.json` plus 12 PNGs, and reports 20 states with 0 overflow findings.

## Key Decisions Made
- Treat the original `codex/cockpit-smoke-ci-gate` push/open/verify action as completed upstream, not as work to duplicate.
- Use a fresh branch from `origin/main` for Cycle 16 evidence because local `main` is ahead 1 and behind 2 with equivalent-but-divergent history.
- Keep generated `.wrangler/`, `projects/*/.codegraph/`, and `docs/qa/cockpit-smoke/` artifacts out of source control; CI artifact upload remains the evidence channel.
- Leave the primary checkout's unrelated dirty `.gitignore` and generated artifacts untouched to avoid reverting possible user-owned changes.
- Keep the cockpit smoke in the existing protected `Lint, test, build` job until runtime or ownership pressure justifies splitting branch-protection contexts.

## Active Projects
- CRASHOUT: Cockpit smoke CI gate is merged on `main`; Cycle 16 evidence PR `#3` is open as a draft with protected CI and artifact verification complete — next step is review/merge PR `#3`, then reconcile or retire the divergent local `main` safely.

## Next Action
Merge draft PR `#3` after review, then reconcile the primary checkout's divergent `main` without force-pushing: preserve a safety branch if needed, sync to `origin/main`, and restore `.gitignore` hygiene if the dirty removal was not intentional.

## Company State
- Product: CRASHOUT — 1v1 Crash PVP game with play-money economy, match history, leaderboard, analytics, share-your-cashout challenge links, cockpit layout, and public protected GitHub source.
- Tech Stack: React 19 + TS + Vite + GSAP + Playwright smoke, INSFORGE backend (events/rounds/balance/history/leaderboard edge fns), Cloudflare Pages production branch `main`, GitHub Actions CI with protected `main`.
- Revenue: $0
- Users: 0 known organic users; previous recorded traffic was likely internal.
- Brand: CRASHOUT — high-stakes crypto-terminal arcade with volt/ghost/crash/gold visual language.

## Open Questions
- Gambling license needed for real-money crypto (~$30-50K Curaçao). Blocks revenue. Play-money until resolved.
- Whether the public repo should remain the outer `crash-crypto` monorepo shape or eventually become a split `projects/crashout` repository. Current release tooling assumes the outer worktree.
- Whether Cloudflare Pages should stay on direct Wrangler uploads or later use Git integration / GitHub Actions deploy with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Whether to add deterministic gameplay test hooks so full match completion can become a separate non-flaky E2E gate.
- Whether to proactively update GitHub Actions JavaScript actions for the Node 20 deprecation warning before GitHub's June 16, 2026 default Node 24 switch.
