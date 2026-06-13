# Cycle 7 — Release Pipeline Gate

**Owner:** devops-hightower  
**Date:** 2026-06-13  
**Scope:** `projects/crashout` release pipeline, GitHub Actions readiness, Cloudflare Pages deploy readiness, and cockpit smoke placement.  
**Instruction:** audit and recommendation only. No code changes outside this document.

## Executive Recommendation

Ship the smallest CI/CD gate as a required GitHub Actions check that runs from `projects/crashout`:

```bash
pnpm run check
```

`check` currently expands to `pnpm lint && pnpm test && pnpm build`. Do not put Cloudflare deploy or `scripts/cockpit-smoke.mjs` into the required CI gate yet. The CI gate should prove the app is lint-clean, domain tests pass, and the production bundle builds. Cloudflare deploy should remain a separate protected/manual job until repository secrets, production branch naming, and Pages project ownership are deliberately wired. The cockpit smoke should stay a local pre-release check for now.

## Current State

- Initial scan found no workflow files. During the audit an untracked `.github/workflows/crashout-ci.yml` appeared; I did not create or edit it.
- The untracked workflow is directionally correct: it runs on PRs and pushes touching Crashout, uses `projects/crashout` as `working-directory`, installs pnpm `11.5.1`, uses Node `24`, and runs `pnpm run check`.
- Because that workflow is untracked, it is not yet part of the release pipeline. Commit it intentionally, then make its `Lint, test, build` job a required branch protection check.
- Current git branch is `master`; existing Crashout deploy docs and package scripts treat `main` as the Cloudflare production branch.
- `projects/crashout/package.json` has the needed scripts:
  - `lint`: `eslint .`
  - `test`: node-based test chain for game, audio prefs, fairness, economy, history, and leaderboard.
  - `build`: `tsc -b && vite build`
  - `check`: `pnpm lint && pnpm test && pnpm build`
  - `smoke:cockpit`: `node scripts/cockpit-smoke.mjs`
  - `deploy`: `pnpm run check && wrangler pages deploy dist --branch main`
- `pnpm deploy` now runs the same release gate before uploading. That is better than the earlier state where deploy skipped lint.
- `projects/crashout/wrangler.toml` is ready for static Pages direct upload:

```toml
name = "crashout"
pages_build_output_dir = "dist"
```

- `projects/crashout/public/_headers` already applies immutable caching to `/assets/*` and revalidation to `/index.html`.
- `dist/` and `node_modules/` are ignored. Build artifacts are generated locally but should not be treated as source.
- Working tree was dirty before this audit; I did not revert or edit those files.

## Local Gate Result

Commands run from `/home/valentinod/Documents/crash-crypto/projects/crashout` on 2026-06-13:

| Gate | Result | Notes |
|---|---:|---|
| `pnpm lint` | Pass | ESLint completed with no reported findings. |
| `pnpm test` | Pass | All current node test files passed. |
| `pnpm build` | Pass | TypeScript build and Vite production build completed. |
| `pnpm run check` | Pass | Verified after `check` appeared in `package.json`; expands to lint, test, build. |

Observed toolchain:

- Node: `v26.2.0`
- pnpm: `11.5.1`

For CI, pin Node to an LTS line unless the project explicitly standardizes on Node 26. The smallest conservative choice is Node 24 LTS or Node 22 LTS, then adjust if dependency engines require otherwise. Also add a `packageManager` field later if the team wants exact pnpm reproducibility; not required for the first gate.

## Smallest Shippable GitHub Actions Gate

Recommended workflow shape. The untracked `.github/workflows/crashout-ci.yml` is close to this already:

```yaml
name: crashout-ci

on:
  pull_request:
    paths:
      - "projects/crashout/**"
      - ".github/workflows/crashout-ci.yml"
  push:
    branches:
      - main
      - master
    paths:
      - "projects/crashout/**"
      - ".github/workflows/crashout-ci.yml"

jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: projects/crashout
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
        with:
          version: 11.5.1
          cache: true
          cache_dependency_path: projects/crashout/pnpm-lock.yaml
          package_json_file: projects/crashout/package.json
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: pnpm install --frozen-lockfile
      - run: pnpm run check
```

Make this a required branch protection check before merging Crashout changes. This is enough to prevent the most common bad releases: lint regressions, broken domain logic, TypeScript errors, and failed production bundling.

## Cloudflare Pages Deploy Readiness

Cloudflare Pages is deploy-ready for direct upload, but not yet CI/CD-ready.

Ready:

- Static Vite app builds to `dist/`.
- `wrangler.toml` names the Pages project `crashout` and sets `pages_build_output_dir = "dist"`.
- Existing deploy command uploads `dist` to Pages with `--branch main`.
- No Workers, Pages Functions, KV, D1, R2, or Queues are required for the static frontend deploy.

Not yet ready for unattended deploy:

- The GitHub Actions workflow is currently untracked, so it is not yet a durable pipeline asset.
- Required Cloudflare secrets are not represented in repo configuration.
- Branch naming is inconsistent: local branch is `master`, deploy docs/scripts use production branch `main`.
- The current direct-upload model can publish uncommitted local bytes. That is acceptable for controlled smoke releases, but it is not a reproducible production pipeline.

Required GitHub repository secrets for an Actions deploy job:

| Secret / variable | Required for | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages deploy | Token should have Cloudflare Pages edit permission scoped as narrowly as practical. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Pages deploy | Needed for noninteractive Wrangler deploys. |
| `VITE_INSFORGE_EVENTS_URL` | Optional build-time frontend wiring | Use a repo/environment variable or secret only when backend ingest is intentionally enabled. The app degrades without it. |

Before adding deploy to CI, create/verify the Pages project noninteractively and decide the production branch name:

```bash
wrangler pages project create crashout --production-branch main
```

If the repo remains on `master`, either change Cloudflare production branch to `master` or change the repository default branch to `main`. Do not leave the release path ambiguous.

## Deploy Job Recommendation

Phase 1, now: CI only.

- Required check: `pnpm run check`.
- No Cloudflare secrets needed.
- No deploy from Actions.

Phase 2, after secrets and branch naming are settled: add a separate deploy job.

- Trigger only on the production branch and optionally `workflow_dispatch`.
- Depend on the `verify` job.
- Run `pnpm build` from a clean checkout.
- Deploy with `pnpm exec wrangler pages deploy dist --project-name crashout --branch main`.
- Use a GitHub Environment named `production` if manual approval is wanted.

This keeps rollback and failure handling simple: if CI fails, nothing deploys; if deploy fails, the previous Pages deployment remains live.

## Cockpit Smoke Placement

Keep `projects/crashout/scripts/cockpit-smoke.mjs` as a local pre-release smoke test for now.

Reasons:

- It assumes a running app URL, defaulting to `http://127.0.0.1:5175/`.
- It assumes a Chrome DevTools Protocol endpoint on `127.0.0.1:${CDP_PORT:-9222}`.
- It drives browser state and writes screenshots plus `measurements.json` under `docs/qa/cycle27-smoke`.
- It is a visual/regression smoke, not a deterministic unit/build gate.
- Putting it into CI now would require additional orchestration: start preview server, launch Chrome with remote debugging, manage ports, upload artifacts, and tune flake tolerance.

Use it before manual deploys or after preview deploys when validating cockpit UI readiness. Promote it to CI later only when the team is ready to own browser automation reliability. At that point, convert it into an explicit Playwright-style job or wrap its Chrome startup/server startup inside the workflow instead of relying on ambient local state.

## Final Gate

The smallest shippable release gate is:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
pnpm run check
```

That should be the first required GitHub Actions check. Cloudflare deployment and cockpit smoke are valuable, but they are second-stage release operations, not blockers for the first CI gate.
