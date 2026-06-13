# Cycle 27 — Cockpit Smoke Deploy Readiness

**Owner:** devops-hightower  
**Date:** 2026-06-12  
**Scope:** `projects/crashout` Cloudflare Pages deploy readiness for cockpit smoke.  
**Instruction:** audit only. No deploy performed.

## Coordinator Update After Deploy

The coordinator fixed the release-blocking lint issues, reran local gates, and deployed the static build.

Final commands/results:

- `pnpm lint`: pass
- `pnpm test`: pass
- `pnpm build`: pass
- `pnpm deploy`: pass

Cloudflare Pages output:

- Deployment URL: `https://9d9540f0.crashout-euq.pages.dev`
- Stable URL checked: `https://crashout-euq.pages.dev`
- Both URLs returned `HTTP/2 200` after deploy.

Operational caveat still stands: Wrangler warned that the working directory had uncommitted changes. This was an intentional direct-upload cycle, not a clean CI release.

## Current Infrastructure State

- App: static Vite/React SPA in `projects/crashout`.
- Hosting target: Cloudflare Pages project `crashout`.
- Public domain: `https://crashout-euq.pages.dev`.
- Pages project status: exists; Git Provider = `No`; direct Wrangler uploads only.
- Latest production deployments: recent successful `main` deployments visible via `wrangler pages deployment list --project-name crashout`.
- Wrangler: `4.99.0` installed; update available `4.100.0`.
- Auth: `wrangler whoami` succeeds for `Dentesanovalentino@gmail.com's Account`; token includes `pages (write)`.
- Config: `projects/crashout/wrangler.toml` sets:

```toml
name = "crashout"
pages_build_output_dir = "dist"
```

No Workers, D1, KV, R2, Queues, or Pages Functions are part of this deploy. This release is static assets only.

## Git / CI State

- Current branch: `master`.
- Local HEAD: `77695ec fix(crashout): Cycle 25 — clipboard fallback for share-challenge copy (QA M-01), manual-copy input when clipboard API unavailable/rejects, LIVE`.
- `git remote -v`: no remotes configured.
- `.github/workflows/`: none found.
- Working tree: dirty before this audit. Deploying from this machine uploads local uncommitted bytes, not a clean remote-built commit.
- Crashout-specific dirty files observed before this document:
  - `projects/crashout/README.md`
  - `projects/crashout/src/App.css`
  - `projects/crashout/src/App.tsx`
  - `projects/crashout/.codegraph/` untracked

This is direct-upload infrastructure. It is acceptable for a controlled smoke release, but it is not a reproducible production pipeline.

## Package Scripts

From `projects/crashout/package.json`:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "node src/game/logic.test.ts && node src/audio/prefs.test.ts && node src/game/fairness.test.ts && node src/game/economy.test.ts && node src/game/history.test.ts && node src/game/leaderboard.test.ts",
  "deploy": "pnpm test && pnpm build && wrangler pages deploy dist --branch main"
}
```

Important: `pnpm deploy` does **not** run lint.

## Gate Results

Commands run from `projects/crashout`:

| Gate | Command | Result |
|---|---|---|
| Unit/domain tests | `pnpm test` | Pass |
| Production build | `pnpm build` | Pass |
| Lint | `pnpm lint` | Fail |
| Wrangler auth | `pnpm exec wrangler whoami` | Pass |
| Pages project lookup | `pnpm exec wrangler pages project list` | Pass; `crashout` found |
| Deployment listing | `pnpm exec wrangler pages deployment list --project-name crashout` | Pass |

Build output:

- `dist/` size: `424K`
- `dist/index.html`: `1.88 kB`
- JS bundle: `dist/assets/index-B8AIkKTN.js`, `298.16 kB` raw / `98.99 kB` gzip
- CSS bundle: `dist/assets/index-Ck-erO-i.css`, `23.80 kB` raw / `5.73 kB` gzip
- Headers: `public/_headers` gives immutable cache for `/assets/*` and revalidation for `/index.html`.

Lint failures:

- `src/audio/useGameAudio.ts:25` — React refs accessed/updated during render.
- `src/components/LeaderboardPanel.tsx:27` — synchronous `setState` in effect.
- `src/game/history.test.ts:42` — constant binary expression.
- `src/hooks/useHeatRamp.ts:54` — missing hook dependency warning.

These are not triggered by the current deploy script, but they block a clean CI policy.

## Exact Deploy Command

Do not run until coordinator approves and smoke passes:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm deploy
```

Equivalent expanded command:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm test && pnpm build && pnpm exec wrangler pages deploy dist --branch main
```

`--branch main` is intentional: Cloudflare Pages treats that as production even though the local Git branch is currently `master`.

## Smoke Test Before Deploy

Minimum local smoke before coordinator runs deploy:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm test
pnpm build
pnpm preview
```

Manual checks against the preview URL:

- Start a duel from idle.
- Cash out once; button locks after cashout.
- Advance through round end.
- Finish match; run it back resets state.
- Open leaderboard, history, settings; return to game.
- Open `/?c=4.32`; challenge banner appears.
- Mobile short-height viewport: verify cockpit can be used without critical clipping.

## Rollback Path

Fast human rollback:

1. Open Cloudflare dashboard.
2. Go to Workers & Pages -> `crashout` -> Deployments.
3. Select a previous successful **Production** deployment.
4. Use `Rollback to this deployment`.

Cloudflare Pages only allows rollback to successful production deployments; preview deployments are not rollback targets.

CLI visibility before rollback:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm exec wrangler pages deployment list --project-name crashout
```

API automation path, if dashboard is unavailable:

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/27d6756bbee88ab3150edd60ff52e664/pages/projects/crashout/deployments/<PRODUCTION_DEPLOYMENT_ID>/rollback" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Emergency redeploy fallback if rollback is not available:

```bash
git checkout <known-good-commit>
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm deploy
```

Do not use the fallback without coordinator approval; the current repo has no remote and a dirty worktree, so checkout operations can overwrite local work if mishandled.

## Deploy Decision

**Conditional GO after smoke tests pass.**

Deploy after manual smoke passes if the coordinator accepts these two waivers:

1. This is a direct local upload from a dirty worktree, not a commit-traceable CI deploy.
2. `pnpm lint` is failing, although `pnpm deploy` itself passes its required gates (`pnpm test` and `pnpm build`).

If lint is treated as a release gate, this is **NO-GO** until the lint errors are fixed.

For a controlled cockpit smoke push, the operational risk is acceptable: static assets only, no migrations, no stateful Cloudflare resources, and Pages rollback is available. For real production traffic, do not keep operating this way; wire GitHub remote + Cloudflare Pages Git integration or GitHub Actions so `main` builds from a clean commit.

## Automation Recommendation

Near-term:

- Add CI for `pnpm install`, `pnpm test`, `pnpm build`, and `pnpm lint`.
- Decide whether lint is a deploy gate. If yes, put it in `pnpm deploy` or CI.
- Connect a Git remote. Current `git remote -v` is empty.
- Move Pages to Git integration for `projects/crashout` with:
  - build command: `pnpm build`
  - output directory: `dist`
  - production branch: `main`
  - root directory: `projects/crashout`

Do not add Kubernetes, containers, or Jenkins. This project needs boring Pages deploys and fast rollback, not more infrastructure.
