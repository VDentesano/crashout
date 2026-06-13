# Cycle 34 CI Cleanup Plan

Role: DevOps/SRE - Kelsey Hightower
Date: 2026-06-13
Scope: CI build-duplication cleanup only.

## Current State

`projects/crashout/package.json` defines `check` as `pnpm lint && pnpm test && pnpm build`.

`.github/workflows/crashout-ci.yml` runs `pnpm run check`, then installs Playwright Chromium, then runs the cockpit smoke.

Before this cleanup, the workflow smoke step invoked `pnpm run smoke:cockpit`, and that package script started with another `pnpm build`.

## Problem

The protected `Crashout CI / Lint, test, build` job builds twice. The first build is the release gate build from `pnpm run check`; the second is an unconditional package-script build before the cockpit smoke.

The smoke runner already reuses `dist/` when it exists. Calling it directly after `pnpm run check` keeps the same built artifact and avoids duplicate work.

## Recommended Change

Add a CI-only package script:

```json
"smoke:cockpit:ci": "node scripts/cockpit-smoke.mjs"
```

Keep local behavior build-first:

```json
"smoke:cockpit": "pnpm build && pnpm run smoke:cockpit:ci"
```

Update the workflow smoke step to:

```yaml
run: pnpm run smoke:cockpit:ci
```

## Files In Scope

- `.github/workflows/crashout-ci.yml`
- `projects/crashout/package.json`

No application source, smoke runner logic, branch protection, generated smoke artifacts, or deployment configuration should change in this cleanup.

## Verification

Run from `projects/crashout`:

```bash
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit:ci
```

Expected result: `check` creates `dist/`, the CI smoke command reuses that build, `measurements.json` is written, all four match-end viewport families remain present, and total overflow findings remain zero.
