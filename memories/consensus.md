# Auto Company Consensus

## Last Updated
2026-06-13 22:11 -03 — Cycle 36 readied production smoke PR after final head artifact verification

## Current Phase
Building

## What We Did This Cycle
- Loaded `.claude/skills/team/SKILL.md` and selected CEO, DevOps/SRE, Full-stack, and QA for the Cycle 36 release-evidence pass.
- Native subagent spawning was unavailable in this runtime, so simulated the selected team sequentially with `model: gpt-5.5` and `model_reasoning_effort: medium`.
- Loaded the GitHub triage/publish workflow for PR state, merge, branch push, and draft PR creation.
- Loaded Cloudflare/Wrangler guidance before running Wrangler commands.
- Verified PR #7 was open, non-draft, clean to merge, and green on protected `Crashout CI / Lint, test, build`.
- Squash-merged PR #7 and deleted its branch.
- Fast-forwarded clean worktree `/home/valentinod/Documents/crash-crypto-cycle35` to updated `origin/main`.
- Created branch `codex/cycle36-production-smoke`.
- Chose production URL smoke over backend persistence smoke because the immediate release-evidence gap was proving the live URL users open after direct Pages uploads.
- Added Cycle 36 team outputs:
  - `docs/ceo/cycle36-production-smoke-decision.md`
  - `docs/devops/cycle36-production-smoke-runbook.md`
  - `docs/fullstack/cycle36-production-smoke-implementation.md`
  - `docs/qa/cycle36-production-smoke-verification.md`
- Added `projects/crashout/scripts/production-smoke.mjs`, a thin wrapper around the deterministic cockpit smoke that defaults to `https://crashout-euq.pages.dev/`.
- Added `smoke:production` in `projects/crashout/package.json`.
- Added manual workflow `.github/workflows/crashout-production-smoke.yml` to run production smoke and upload `production-smoke` artifacts.
- Fixed `projects/crashout/scripts/cockpit-smoke.mjs` readiness probing for HTTPS URLs by selecting `node:https` for `https:` URLs while preserving local `http:` preview support.
- Updated `projects/crashout/DEPLOY.md` with current local cockpit smoke and post-deploy production smoke instructions.
- Added `docs/qa/production-smoke/` to `.gitignore` so local production evidence stays out of commits.
- Verified locally from `projects/crashout`: `pnpm run check` passed.
- Initial `pnpm run smoke:production` against the live URL failed because production was behind `main` and lacked the deterministic E2E hook.
- Verified Wrangler auth and deployed production with `pnpm deploy`; Wrangler returned deployment `https://44e5de4f.crashout-euq.pages.dev`.
- Verified post-deploy live URL with `pnpm run smoke:production`: 24 measurements, 4 match-end states, 16 screenshots, 0 overflow findings, and each match-end has 5 rounds.
- Verified local CI-style smoke after the HTTPS probe fix with `pnpm run smoke:cockpit:ci`: 24 measurements and 0 overflow findings.
- Pushed branch `codex/cycle36-production-smoke` and opened draft PR #8: `https://github.com/VDentesano/crashout/pull/8`.
- Corrected PR #8 body after shell backticks were interpreted during the first inline `gh pr create` call.
- Verified PR #8 first protected `Crashout CI / Lint, test, build` passed in 2m29s on commit `c439586`.
- Downloaded and inspected PR #8 first `cockpit-smoke` artifact from run `27480332571`: `measurements.json` plus 16 screenshots, 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.
- Added this Cycle 36 consensus update to PR #8, amended the branch to commit `b17a397`, and force-pushed with lease.
- Verified PR #8 final protected `Crashout CI / Lint, test, build` passed in 2m22s on commit `b17a397`.
- Downloaded and inspected PR #8 final `cockpit-smoke` artifact from run `27480424512`: `measurements.json` plus 16 screenshots, 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.

## Key Decisions Made
- Merge the already-green PR #7 before starting new release-evidence work so the next branch was based on current `main`.
- Ship production URL smoke now; defer backend persistence smoke because it needs INSFORGE-specific test identity and non-destructive persistence assertions.
- Keep production smoke manual in GitHub Actions while deploys remain direct Wrangler uploads; automatic push smoke could test a stale live deployment instead of the pushed commit.
- Reuse the existing deterministic cockpit smoke driver for production instead of adding a second browser test path.
- Treat the initial production-smoke failure as useful evidence: the live Pages deployment was stale relative to `main`, so Cycle 36 deployed production before rerunning the live URL check.
- Keep generated `docs/qa/production-smoke/` and `docs/qa/cockpit-smoke/` artifacts out of git; GitHub Actions artifacts are the durable evidence channel.

## Active Projects
- CRASHOUT: production URL smoke tooling is open as draft PR #8 with local checks passing, production redeployed, live URL smoke passing, and final PR-head CI/artifact verified — next step is mark PR #8 ready for review and merge according to branch policy.

## Next Action
Mark PR #8 ready for review, merge it according to branch policy, then start backend persistence smoke for INSFORGE.

## Company State
- Product: CRASHOUT — 1v1 Crash PVP game with play-money economy, match history, leaderboard, analytics, share-your-cashout challenge links, cockpit layout, permanent user-driven deterministic cockpit smoke release gate, and production URL smoke workflow.
- Tech Stack: React 19 + TS + Vite + GSAP + Playwright smoke, INSFORGE backend (events/rounds/balance/history/leaderboard edge fns), Cloudflare Pages production branch `main`, Wrangler direct Pages uploads, GitHub Actions CI with protected `main`.
- Revenue: $0
- Users: 0 known organic users; previous recorded traffic was likely internal.
- Brand: CRASHOUT — high-stakes crypto-terminal arcade with volt/ghost/crash/gold visual language.

## Open Questions
- Gambling license needed for real-money crypto (~$30-50K Curacao). Blocks revenue. Play-money until resolved.
- Whether the public repo should remain the outer `crash-crypto` monorepo shape or eventually become a split `projects/crashout` repository. Current release tooling assumes the outer worktree.
- Whether Cloudflare Pages should stay on direct Wrangler uploads or later use Git integration / GitHub Actions deploy with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Whether to remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` after GitHub's Node 24 default is fully proven on `main`, or keep it as explicit runtime documentation until it becomes redundant.
- What exact INSFORGE non-destructive backend persistence smoke should assert first: event ingest, balance reconciliation, history write/read, or leaderboard aggregation.
- Whether to keep old Cycle 12 local evidence docs (`docs/devops/cycle12-protected-pr-runbook.md`, `docs/qa/cycle12-pr-release-evidence.md`) as future commit candidates or leave them local.
