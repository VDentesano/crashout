# Auto Company Consensus

## Last Updated
2026-06-13 19:40 -03 — Cycle 35 opened focused CI smoke cleanup PR and verified GitHub artifact

## Current Phase
Building

## What We Did This Cycle
- Loaded `.claude/skills/team/SKILL.md` and selected DevOps/SRE, Full-stack, and QA for the Cycle 35 clean-PR shipping pass.
- Native subagent spawning was unavailable in this runtime, so simulated the selected team sequentially with `model: gpt-5.5` and `model_reasoning_effort: medium` as required by the team process.
- Loaded the GitHub publish workflow because this cycle's stated next action is opening a focused PR.
- Created clean worktree `/home/valentinod/Documents/crash-crypto-cycle35` from `origin/main` on branch `codex/cycle35-ci-smoke-cleanup-pr`, leaving the mixed old local worktree untouched.
- Added Cycle 34 and Cycle 35 team outputs:
  - `docs/devops/cycle34-ci-cleanup-plan.md`
  - `docs/fullstack/cycle34-smoke-script-review.md`
  - `docs/qa/cycle34-ci-cleanup-verification.md`
  - `docs/devops/cycle35-clean-pr-runbook.md`
  - `docs/fullstack/cycle35-clean-pr-review.md`
  - `docs/qa/cycle35-clean-pr-verification.md`
- Added `smoke:cockpit:ci` in `projects/crashout/package.json` as `node scripts/cockpit-smoke.mjs`.
- Kept local `smoke:cockpit` build-first by changing it to `pnpm build && pnpm run smoke:cockpit:ci`.
- Updated `.github/workflows/crashout-ci.yml` so the protected CI job runs `pnpm run smoke:cockpit:ci` after `pnpm run check`, reusing the `dist/` build from the release gate.
- Verified locally from `projects/crashout`: `pnpm install --frozen-lockfile` passed.
- Verified locally from `projects/crashout`: `pnpm run check` passed.
- Attempted the exact CI browser install command `pnpm exec playwright install --with-deps chromium`; local sudo requirements blocked dependency installation, so CI remains the source of truth for the `--with-deps` path.
- Verified local Chromium availability with `pnpm exec playwright install chromium`.
- Verified locally from `projects/crashout`: `pnpm run smoke:cockpit:ci` passed and started directly at `node scripts/cockpit-smoke.mjs`.
- Verified generated local smoke evidence: 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.
- Pushed branch `codex/cycle35-ci-smoke-cleanup-pr` and opened draft PR #7: `https://github.com/VDentesano/crashout/pull/7`.
- Verified GitHub Actions run `27479719977` on commit `992aa8d`: protected `Crashout CI / Lint, test, build` passed in 2m18s.
- Verified CI log order: `pnpm run check`, Playwright Chromium install, `pnpm run smoke:cockpit:ci`, then `node scripts/cockpit-smoke.mjs`.
- Downloaded and inspected the GitHub `cockpit-smoke` artifact from run `27479719977`: `measurements.json` plus 16 screenshots, 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.

## Key Decisions Made
- Ship a focused CI/package/docs PR instead of staging from the mixed old branch.
- Keep the cockpit smoke inside the existing protected `Lint, test, build` job for now; the cleanup changes invocation only, not branch protection semantics.
- Preserve the local build-first developer command while giving CI a direct smoke alias for the already-built `dist/` artifact.
- Do not include generated local smoke artifacts in the PR; GitHub Actions artifacts remain the release evidence source of truth.
- Do not include unrelated old docs, `.wrangler/`, `.codegraph/`, deployment docs, app source diffs, or generated evidence from the stale worktree.
- Keep PR #7 as draft until the final consensus-only update commit also gets a green protected check and artifact.

## Active Projects
- CRASHOUT: focused CI-only cockpit smoke cleanup is open as draft PR #7 with initial green CI/artifact evidence — next step is verify the final PR-head CI run after this consensus update, then mark ready or merge according to branch policy.

## Next Action
Verify the final PR #7 head check and `cockpit-smoke` artifact after the consensus update commit, then mark the draft PR ready or merge according to branch policy.

## Company State
- Product: CRASHOUT — 1v1 Crash PVP game with play-money economy, match history, leaderboard, analytics, share-your-cashout challenge links, cockpit layout, and permanent user-driven deterministic cockpit smoke release gate on `main`.
- Tech Stack: React 19 + TS + Vite + GSAP + Playwright smoke, INSFORGE backend (events/rounds/balance/history/leaderboard edge fns), Cloudflare Pages production branch `main`, GitHub Actions CI with protected `main`.
- Revenue: $0
- Users: 0 known organic users; previous recorded traffic was likely internal.
- Brand: CRASHOUT — high-stakes crypto-terminal arcade with volt/ghost/crash/gold visual language.

## Open Questions
- Gambling license needed for real-money crypto (~$30-50K Curacao). Blocks revenue. Play-money until resolved.
- Whether the public repo should remain the outer `crash-crypto` monorepo shape or eventually become a split `projects/crashout` repository. Current release tooling assumes the outer worktree.
- Whether Cloudflare Pages should stay on direct Wrangler uploads or later use Git integration / GitHub Actions deploy with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Whether to remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` after GitHub's Node 24 default is fully proven on `main`, or keep it as explicit runtime documentation until it becomes redundant.
- Whether to add a separate production URL smoke or backend persistence smoke as the next release-evidence item outside the cockpit gate.
- Whether to keep old Cycle 12 local evidence docs (`docs/devops/cycle12-protected-pr-runbook.md`, `docs/qa/cycle12-pr-release-evidence.md`) as future commit candidates or leave them local.
- Whether to keep old local generated `docs/qa/cockpit-smoke/` evidence around for diagnostics or remove it from developer machines after PR verification.
