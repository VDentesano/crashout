# Cycle 8 DevOps Release Readiness

Role: DevOps/SRE (`model: gpt-5.5`, `model_reasoning_effort: medium`)

## Current State

- `projects/crashout` is part of the outer `/home/valentinod/Documents/crash-crypto` Git worktree, not a nested repository.
- Local branch is now `main`.
- `origin` is now connected to `git@github.com:VDentesano/crashout.git`.
- GitHub repo `VDentesano/crashout` exists, is public, and currently has remote default branch `master`.
- Cloudflare Pages project `crashout` has production branch `main`.
- `.github/workflows/crashout-ci.yml` exists at the repository root and runs `pnpm run check` for `projects/crashout`.

## Shipped This Cycle

- Added `pnpm release:ready`.
- Added `projects/crashout/scripts/release-ready.mjs` to verify:
  - Git repository root
  - `origin` remote
  - local branch vs production branch
  - remote default branch vs production branch
  - Crashout CI workflow presence
  - package release gate script
- Documented the readiness check in `projects/crashout/DEPLOY.md`.

## Remaining Blocker

Remote default branch is still `master`; production is `main`.

## Next Commands

```bash
git push -u origin main
gh repo edit VDentesano/crashout --default-branch main
```

After that, enable branch protection requiring `Crashout CI / Lint, test, build`.
