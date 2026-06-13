# Cycle 37 DevOps Runbook — Merge and INSFORGE Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Merge Result

PR #8 was merged on GitHub:

- PR: `https://github.com/VDentesano/crashout/pull/8`
- Merge commit: `840ac2077c0c835ac3beee35fb45ca0329ade010`
- Note: local deletion of `codex/cycle36-production-smoke` failed because another worktree owns that branch. The branch was left intact.

## Worktree Choice

The default checkout was dirty and on an older branch, so Cycle 37 implementation moved to:

- Worktree: `/home/valentinod/Documents/crash-crypto-cycle37-smoke`
- Branch: `codex/cycle37-insforge-persistence-smoke`
- Base: `origin/main` after PR #8 merge

This avoids resetting or overwriting pre-existing local work.

## Smoke Commands

From `projects/crashout`:

```bash
pnpm run smoke:insforge
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events pnpm run smoke:insforge
```

The manual GitHub workflow is `.github/workflows/crashout-insforge-smoke.yml`.

## Verification

- `node --check scripts/insforge-persistence-smoke.mjs`
- `pnpm exec eslint scripts/insforge-persistence-smoke.mjs`
- `pnpm run smoke:insforge`
- `pnpm run check`

## Rollback

Revert the branch commit. The smoke writes only synthetic `smoke-*` rounds rows and has no production deployment side effects.
