# Cycle 7 Release Implementation Recommendation

**Role:** fullstack-dhh  
**Scope:** `projects/crashout` package scripts and release workflow  
**Mode:** recommendation only. No app/package/workflow code edited.

## Current State

`projects/crashout` is a static Vite/React app deployed to Cloudflare Pages project `crashout`.

At the start of inspection, `package.json` had no `check` script and `deploy` skipped lint. During this pass, `projects/crashout/package.json` became dirty with a partial release-script change that I did not edit. Current working-tree scripts now read:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "check": "pnpm lint && pnpm test && pnpm build",
  "lint": "eslint .",
  "preview": "vite preview",
  "smoke:cockpit": "node scripts/cockpit-smoke.mjs",
  "test": "node src/game/logic.test.ts && node src/audio/prefs.test.ts && node src/game/fairness.test.ts && node src/game/economy.test.ts && node src/game/history.test.ts && node src/game/leaderboard.test.ts",
  "deploy": "pnpm run check && wrangler pages deploy dist --branch main"
}
```

Observed release facts from the existing docs:

- `wrangler.toml` already sets `name = "crashout"` and `pages_build_output_dir = "dist"`.
- `public/_headers` already handles immutable caching for hashed assets and revalidation for `index.html`.
- Current deploys are direct local uploads via Wrangler, not commit-traceable remote builds.
- The working-tree `pnpm deploy` now runs `check`, so lint is included. The committed baseline did not.
- Cloudflare Pages Git Provider is documented as `No` in the cycle 27 deploy audit.
- The repo currently has no Git remote and no `.github/workflows/`.
- `scripts/cockpit-smoke.mjs` exists. The committed baseline did not wire it into `package.json`; the current dirty package adds `smoke:cockpit`.

Cloudflare Pages currently supports both Git integration and direct upload with Wrangler. For a clean release pipeline, use Git integration as the normal production path and keep Wrangler direct upload as an explicit fallback. Do not add a separate GitHub Actions CD pipeline unless Cloudflare Pages Git integration is unavailable.

## Recommendation

Make one package script, `pnpm check`, the release gate. Everything that can ship should pass that same command locally and in Cloudflare Pages.

Exact package end state to make later:

```json
{
  "packageManager": "pnpm@11.5.1",
  "engines": {
    "node": ">=22 <27"
  },
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b",
    "build": "pnpm typecheck && vite build",
    "lint": "eslint .",
    "preview": "vite preview --host 127.0.0.1 --port 5175",
    "test": "node src/game/logic.test.ts && node src/audio/prefs.test.ts && node src/game/fairness.test.ts && node src/game/economy.test.ts && node src/game/history.test.ts && node src/game/leaderboard.test.ts",
    "check": "pnpm lint && pnpm test && pnpm build",
    "smoke:cockpit": "node scripts/cockpit-smoke.mjs",
    "deploy": "pnpm check && pnpm exec wrangler pages deploy dist --branch main",
    "deploy:preview": "pnpm check && pnpm exec wrangler pages deploy dist --branch preview"
  }
}
```

Why this shape:

- `typecheck` names the TypeScript gate instead of hiding it inside `build`.
- `build` remains the one command that produces `dist`.
- `check` is the single pre-release contract: lint, tests, and production build.
- `deploy` becomes a guarded fallback instead of the primary release mechanism.
- `deploy:preview` gives a non-production direct upload path for manual verification.
- `smoke:cockpit` exposes the existing cockpit smoke script without adding Playwright or another test framework.
- `packageManager` pins the package manager used by Corepack/CI. The current local version is `pnpm 11.5.1`.
- `engines.node` keeps the app on modern Node without pinning to this machine's current `v26.2.0`.

## Cloudflare Pages Workflow

Use Cloudflare Pages Git integration as the default production release path.

One-time Pages settings:

```text
Project: crashout
Root directory: projects/crashout
Production branch: main
Build command: pnpm check
Build output directory: dist
Environment variable: NODE_VERSION=22
```

Release workflow after that:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm check
git push origin main
```

Cloudflare Pages then builds from a clean commit and deploys `dist`. That removes the two real risks in the current process: uploading uncommitted local bytes and uploading stale `dist`.

Preview workflow:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm check
git push origin <branch>
```

Let Pages create branch preview deployments from Git. Use `pnpm deploy:preview` only if Git integration is not wired yet.

## Local Smoke

For a cockpit release, use the existing smoke script as a manual post-build check:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm check
pnpm preview
```

In a second terminal, with Chrome already running with remote debugging on port `9222`:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm smoke:cockpit http://127.0.0.1:5175/
```

Do not put `pnpm smoke:cockpit` inside `pnpm check` yet. The script depends on an external browser/CDP session and writes QA screenshots under `docs/qa/cycle27-smoke`; making it a required release gate would add fragility without improving the basic static release path.

## Fallback Direct Deploy

Keep Wrangler deploy for emergencies and for the pre-Git-integration transition:

```bash
cd /home/valentinod/Documents/crash-crypto/projects/crashout
pnpm deploy
```

That expands to:

```bash
pnpm lint && pnpm test && pnpm build && pnpm exec wrangler pages deploy dist --branch main
```

The fallback still uploads local bytes, so it should be treated as an operator action, not the normal pipeline.

## What Not To Add

- Do not add a GitHub Actions deploy workflow if Cloudflare Pages Git integration is available. It duplicates the deploy system.
- Do not add Docker, Kubernetes, Jenkins, release branches, semantic-release, changelog automation, or a custom deploy orchestrator.
- Do not make bundle splitting, terser, or public sourcemaps part of this release cycle.
- Do not make the cockpit smoke script mandatory until it can launch/manage its own browser session.

## Minimal Implementation Order

1. Reconcile the current dirty `projects/crashout/package.json` with the exact script block above.
2. Connect a Git remote and normalize the production branch name to `main`.
3. Configure Cloudflare Pages Git integration with root `projects/crashout`, build command `pnpm check`, and output `dist`.
4. Keep `pnpm deploy` as the documented fallback for one cycle.
5. After one successful Git-built production release, update `DEPLOY.md` so `git push origin main` is the primary path and Wrangler direct upload is explicitly fallback-only.

## Decision

The clean release pipeline should be boring:

```text
pnpm check locally -> push clean commit -> Cloudflare Pages builds and deploys
```

That is enough for CRASHOUT now. It gives traceable production deploys, includes lint in the release gate, preserves the fast Wrangler escape hatch, and avoids YAML or infrastructure that the project does not yet need.
