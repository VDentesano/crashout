# Cycle 35 Clean PR Runbook

Role simulation: DevOps/SRE - Kelsey Hightower
Engine/model: `gpt-5.5`, reasoning effort `medium`
Date: 2026-06-13

## Goal

Open a focused PR from a clean `origin/main` branch for the Cycle 34 cockpit smoke CI cleanup.

## Branch Strategy

The active local worktree is mixed and remains on an old branch. Do not stage from it.

Use a clean worktree from `origin/main`:

```bash
git worktree add -b codex/cycle35-ci-smoke-cleanup-pr ../crash-crypto-cycle35 origin/main
```

## Intended PR Scope

- `.github/workflows/crashout-ci.yml`
- `projects/crashout/package.json`
- `docs/devops/cycle34-ci-cleanup-plan.md`
- `docs/fullstack/cycle34-smoke-script-review.md`
- `docs/qa/cycle34-ci-cleanup-verification.md`
- Cycle 35 team docs
- `memories/consensus.md`

## Release Risk

Low, if the diff stays limited to package-script orchestration and docs. The protected job still runs `pnpm run check` before smoke, installs Chromium, runs the same smoke runner, and uploads the same artifact path.

## Rollback

Revert the package script and workflow changes. The previous CI path is slower but functionally valid because `pnpm run smoke:cockpit` builds before running the smoke.
