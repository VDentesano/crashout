# Cycle 8 CTO Branch Architecture

Role: CTO (`model: gpt-5.5`, `model_reasoning_effort: medium`)

## Decision

Use `main` as the production branch for CRASHOUT.

## Rationale

- Cloudflare Pages project `crashout` is already configured with `production_branch: main`.
- The latest production deployment was an ad hoc deploy with branch metadata `main`.
- Keeping production on `main` avoids changing Cloudflare project behavior while release hygiene is still settling.
- The GitHub repo currently defaults to `master`, but it only contains a placeholder `README.md`; switching the default branch after pushing `main` is lower risk than reconfiguring the live Cloudflare project.

## Technical Shape

- Source control: outer `crash-crypto` worktree, local branch `main`.
- Remote: `git@github.com:VDentesano/crashout.git`.
- CI: root `.github/workflows/crashout-ci.yml`, scoped to `projects/crashout/**`.
- Release gate: `pnpm run check` from `projects/crashout`.
- Readiness gate: `pnpm release:ready` from `projects/crashout`.

## Failure Mode

If code is pushed only to `master`, GitHub Actions may run, but Cloudflare production branch semantics and branch protection will not match the documented deploy path. That creates a split-brain release process.

## Next Action

Push `main`, set GitHub default branch to `main`, then require the Crashout CI check on `main`.
