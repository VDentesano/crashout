# Cycle 7 CTO Decision — Crashout Release Pipeline

**Owner:** CTO Agent — Werner Vogels model  
**Date:** 2026-06-13  
**Scope:** `projects/crashout` release pipeline target  
**Decision:** **Add CI only. Do not add CI-driven Pages deploy yet. Do not settle for local smoke docs only.**

## Executive Decision

The next release-pipeline target for `projects/crashout` should be **CI only**:

- install dependencies
- run `pnpm lint`
- run `pnpm test`
- run `pnpm build`
- optionally archive no artifacts unless a later reviewer needs them

Do **not** add a Pages deploy workflow in this cycle. The current Cloudflare Pages project is still direct-upload based, the repo has no configured Git remote, and the worktree is dirty. A deploy workflow would create operational ceremony before the source-control and environment contract is clean.

Do **not** stop at local smoke docs only. Local smoke documentation is useful as release evidence, but it does not prevent a broken commit from becoming the next deploy candidate.

## Current State

`projects/crashout` is a static Vite/React SPA deployed to Cloudflare Pages.

Verified local gates from `projects/crashout` on 2026-06-13:

| Gate | Result |
|---|---:|
| `pnpm lint` | Pass |
| `pnpm test` | Pass |
| `pnpm build` | Pass |

Current deploy shape:

| Area | State |
|---|---|
| Hosting | Cloudflare Pages project `crashout` |
| Public URL | `https://crashout-euq.pages.dev` |
| Pages config | `wrangler.toml` sets `name = "crashout"` and `pages_build_output_dir = "dist"` |
| Deploy command | `pnpm deploy` runs `pnpm test && pnpm build && wrangler pages deploy dist --branch main` |
| Pages Git provider | `No` according to `wrangler pages project list` |
| Latest production deployment | `9d9540f0.crashout-euq.pages.dev`, branch `main`, source `77695ec`, direct upload |
| Repo remote | none from `git remote -v` |
| GitHub workflows | none found under `.github/workflows/` |
| Worktree | dirty before this document; do not treat current local bytes as a clean release source |

Supporting release assets already exist:

- `projects/crashout/public/_headers` sets immutable caching for `/assets/*` and revalidation for `/index.html`.
- `projects/crashout/scripts/cockpit-smoke.mjs` provides browser smoke coverage and writes measurements/screenshots under `docs/qa/cycle27-smoke/`.
- `docs/devops/cycle27-cockpit-smoke-devops.md` records the direct-upload caveat and recommends moving toward CI/Git integration.

## Architecture Rationale

Everything fails. The failure mode to remove first is not Cloudflare Pages availability; it is human-local release drift.

Today a production deploy can be produced from:

- a dirty worktree
- uncommitted local changes
- local `node_modules`
- a local Node/pnpm environment
- whatever direct-upload command a human runs

CI-only is the smallest managed-service step that improves the system without pretending the deploy path is already mature. It creates a repeatable quality signal before release while leaving the current working direct-upload deploy path intact.

CI + Pages deploy is the wrong target right now because it would require decisions that are not yet true in the repo:

- Which remote and default branch own production?
- Where are Cloudflare deploy credentials stored and rotated?
- Should deploys be GitHub Actions direct uploads or Cloudflare Pages Git integration?
- Should `main` or `master` be authoritative? Current local branch is `master`, while production direct uploads are forced to `--branch main`.
- How should dirty local release work be stopped rather than normalized?

Local smoke docs only are also the wrong target. They document what a careful operator did once. They do not run on every proposed change.

## Target CI Contract

When the repo is ready to add workflow code, the CI job should be narrow:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Keep the first CI workflow non-deploying. It should answer one question: "Can this commit produce a clean Crashout production bundle?"

Do not include:

- Wrangler deploy
- Cloudflare API tokens
- preview deployment uploads
- database migrations
- InsForge function deploys
- browser smoke as a required gate

Browser smoke is valuable, but it depends on Chromium/CDP setup and writes screenshots. Keep it as a documented manual or scheduled confidence check until the basic CI signal is stable.

## Future Deploy Target

The preferred production deploy target is **Cloudflare Pages Git integration**, not a custom GitHub Actions deploy script, once the source-control contract is fixed.

Required prerequisites:

1. Configure a Git remote.
2. Decide whether production branch is `main` or `master`; stop using a local `master` branch that deploys as `--branch main`.
3. Connect the Cloudflare Pages project `crashout` to the repo.
4. Set Pages build settings:
   - root directory: `projects/crashout`
   - build command: `pnpm build`
   - output directory: `dist`
   - production branch: the chosen canonical branch
5. Keep direct `wrangler pages deploy` as an emergency fallback, not the default path.

Use GitHub Actions deploy only if Cloudflare Pages Git integration cannot express a necessary release gate. At this stage it would be more moving parts for the same static asset upload.

## Operational Runbook

For the next cycle:

1. Add CI-only workflow when code edits are allowed.
2. Make `pnpm lint`, `pnpm test`, and `pnpm build` required for release readiness.
3. Continue direct Pages deploys only with explicit acknowledgement that they are local uploads.
4. Keep using `docs/qa/cycle27-smoke/` style smoke evidence for UI-heavy changes.
5. Revisit Pages Git integration after a remote and canonical production branch exist.

## Decision Record

**Chosen:** CI only.

**Rejected for now:** CI + Pages deploy workflow.

Reason: deploy automation before source-control and Pages Git-provider alignment would make an unreliable release contract faster, not safer.

**Rejected:** local smoke docs only.

Reason: smoke docs provide evidence, not enforcement. The project now has green lint/test/build gates; they should run automatically before release decisions.
