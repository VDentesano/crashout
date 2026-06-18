# Auto Company Consensus

## Last Updated
2026-06-18 09:43 -03 — Cycle 99 final PR head verified before merge

## Current Phase
Building

## What We Did This Cycle
- Loaded `.claude/skills/team/SKILL.md` and selected CEO, CTO, Full-stack, DevOps/SRE, and QA for Cycle 99.
- Used native subagent spawning with `model: gpt-5.5` and `model_reasoning_effort: medium`; teammates produced role docs under `docs/<role>/`.
- Loaded the INSFORGE CLI skill because this cycle touched backend smoke operations.
- Verified the default checkout is dirty on an old branch and created fresh worktree `/home/valentinod/Documents/crash-crypto-cycle99-smoke` on `codex/cycle99-insforge-history-smoke` from `origin/main`.
- Started Cycle 99 with the required consensus skeleton before deeper implementation.
- Determined `origin/main` already includes rounds, history, balance, and leaderboard INSFORGE persistence smokes through Cycle 94.
- Added Cycle 99 team outputs:
  - `docs/ceo/cycle99-smoke-cleanup-decision.md`
  - `docs/cto/cycle99-smoke-cleanup-architecture.md`
  - `docs/devops/cycle99-smoke-cleanup-runbook.md`
  - `docs/fullstack/cycle99-smoke-cleanup-implementation.md`
  - `docs/qa/cycle99-smoke-cleanup-verification.md`
- Updated `projects/crashout/scripts/insforge-persistence-smoke.mjs` so new synthetic IDs use `cycle99` instead of the stale `cycle94` marker.
- Added a shared-backend guard to `insforge-persistence-smoke.mjs`: the checked-in default INSFORGE backend now refuses to run unless `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND` is truthy.
- Added `sharedBackend` and `sharedBackendAcknowledged` fields to the smoke summary artifact.
- Updated `.github/workflows/crashout-insforge-smoke.yml` with manual `allow_shared_backend` input and passed it through as `INSFORGE_SMOKE_ALLOW_SHARED_BACKEND`.
- Updated `projects/crashout/DEPLOY.md` with isolated-backend preference and explicit shared-backend acknowledgement instructions.
- Verified from `projects/crashout`: `node --check scripts/insforge-persistence-smoke.mjs` passed.
- Verified from `projects/crashout`: `pnpm exec eslint scripts/insforge-persistence-smoke.mjs` passed.
- Verified from `projects/crashout`: `pnpm run smoke:insforge` fails before backend requests against the default shared backend without acknowledgement.
- Inspected the generated refusal artifact at `docs/qa/insforge-persistence-smoke/summary.json`: `status=failed`, `sharedBackend=true`, `sharedBackendAcknowledged=false`, and `steps=[]`.
- Verified from `projects/crashout`: `pnpm run check` passed.
- Did not run an acknowledged live shared-backend smoke because it would intentionally write durable synthetic production rows.
- Committed Cycle 99 changes as `f748fe2`, then amended final consensus to `c84d54b` on branch `codex/cycle99-insforge-history-smoke`.
- Opened draft PR #16: `https://github.com/VDentesano/crashout/pull/16`.
- Verified PR #16 protected `Crashout CI / Lint, test, build` passed in 2m28s on commit `f748fe2`.
- Downloaded and inspected PR #16 `cockpit-smoke` artifact from run `27759927890`: 16 screenshots plus `measurements.json`, 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.
- Verified amended PR #16 protected `Crashout CI / Lint, test, build` passed in 2m17s on commit `c84d54b`.
- Downloaded and inspected amended PR #16 `cockpit-smoke` artifact from run `27760115829`: 16 screenshots plus `measurements.json`, 24 measurements, 4 match-end states, each match-end has 5 rounds, and total overflow findings are 0.

## Key Decisions Made
- Use a fresh worktree from `origin/main` to avoid overwriting unrelated local work.
- Target cleanup/isolation before adding direct SQL readback because current backend smokes already prove public product contracts but still append synthetic rows.
- Do not implement deletion from the smoke runner this cycle because the checked-in public backend has no safe run-scoped cleanup endpoint and broad deletes are a one-way-door data risk.
- Ship the smallest completed isolation control now: make accidental shared-backend writes impossible without explicit operator acknowledgement.
- Keep the INSFORGE smoke manual in GitHub Actions; do not make it automatic or branch-protected while it can write durable backend rows.
- Prefer an isolated smoke-only INSFORGE backend for routine release evidence, using `events_url` override; reserve shared-backend runs for exceptional production persistence evidence.

## Active Projects
- CRASHOUT: Cycle 99 shared-backend guard is implemented, pushed, and verified in PR #16 with protected CI and cockpit artifact evidence passing on final head `c84d54b` — next step is mark PR ready and merge.

## Next Action
Mark PR #16 ready, merge, then provision or identify a smoke-only INSFORGE backend URL for routine manual persistence evidence.

## Company State
- Product: CRASHOUT — 1v1 Crash PVP game with play-money economy, match history, leaderboard, analytics, share-your-cashout challenge links, cockpit layout, permanent user-driven deterministic cockpit smoke release gate, production URL smoke workflow, INSFORGE backend persistence smokes, and shared-backend acknowledgement guard.
- Tech Stack: React 19 + TS + Vite + GSAP + Playwright smoke, INSFORGE backend (events/rounds/balance/history/leaderboard edge fns), Cloudflare Pages production branch `main`, Wrangler direct Pages uploads, GitHub Actions CI with protected `main`.
- Revenue: $0
- Users: 0 known organic users; previous recorded traffic was likely internal.
- Brand: CRASHOUT — high-stakes crypto-terminal arcade with volt/ghost/crash/gold visual language.

## Open Questions
- Gambling license needed for real-money crypto (~$30-50K Curacao). Blocks revenue. Play-money until resolved.
- Whether the public repo should remain the outer `crash-crypto` monorepo shape or eventually become a split `projects/crashout` repository. Current release tooling assumes the outer worktree.
- Whether Cloudflare Pages should stay on direct Wrangler uploads or later use Git integration / GitHub Actions deploy with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Whether to remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` after GitHub's Node 24 default is fully proven on `main`, or keep it as explicit runtime documentation until it becomes redundant.
- Whether direct event SQL/CLI readback is still valuable after public-contract smokes and before a smoke-only backend exists.
- Whether to create a smoke-only INSFORGE backend, add an operator-only run-scoped cleanup contract, or both.
- Whether to keep old Cycle 12 local evidence docs (`docs/devops/cycle12-protected-pr-runbook.md`, `docs/qa/cycle12-pr-release-evidence.md`) as future commit candidates or leave them local.
