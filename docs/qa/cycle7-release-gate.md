# CRASHOUT — Cycle 7 Release Gate Recommendation

**Role:** QA / James Bach  
**Scope:** Existing `projects/crashout` test scripts and `projects/crashout/scripts/cockpit-smoke.mjs`  
**Date:** 2026-06-13

## Gate Decision

**Recommendation: CONDITIONAL GO for this cycle, with `pnpm lint`, `pnpm test`, and `pnpm build` mandatory before release.**

The current fast checks are good enough to gate a controlled release: they are cheap, deterministic, and cover the highest-risk pure logic surfaces: match scoring, fairness verification, audio preference resolution, balance math, history validation, and leaderboard validation. I verified locally:

| Check | Result | Notes |
|---|---:|---|
| `pnpm test` | PASS | Runs six plain-Node suites: logic, audio prefs, fairness, economy, history, leaderboard. |
| `pnpm lint` | PASS | Static React/TypeScript lint gate is currently clean. |
| `pnpm build` | PASS | TypeScript project build plus Vite production build. |

The cockpit smoke is valuable, but it is not ready to be a mandatory every-commit CI gate without a browser/server harness. Keep it as a local pre-release release-manager check for this cycle.

## Mandatory in CI

Run these on every PR and before any deploy from `projects/crashout`:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Why these are mandatory:

- `pnpm test` is a strong checking layer for the core game contract. It catches score-rule regressions, fairness reveal tampering, economy deltas, and backend-facing validation drift.
- `pnpm lint` should be mandatory because this is a React app with hook-heavy code. Earlier cycle evidence showed lint can catch real release-relevant problems that `pnpm deploy` would otherwise ignore.
- `pnpm build` is the release artifact check. A green test suite without a production build is not a deployable product.

These are checks, not exploratory testing. They answer "did known important contracts regress?" They do not answer "does the player experience feel coherent across real devices?"

## Local Pre-Release

Run the cockpit smoke locally before a tagged/manual release, after the CI checks pass:

```bash
pnpm preview --host 127.0.0.1 --port 4175
chromium --headless=new --disable-gpu --no-sandbox --remote-debugging-port=9222 --user-data-dir=/tmp/crashout-qa-chrome-9222 'http://127.0.0.1:4175/?c=4.32'
CDP_PORT=9222 node scripts/cockpit-smoke.mjs http://127.0.0.1:4175/?c=4.32
```

Release manager should inspect:

- Console output: every measured viewport should report `overflowCount: 0`.
- `docs/qa/cycle27-smoke/measurements.json`: no unexpected overflow, phase, or verdict anomalies.
- Screenshots in `docs/qa/cycle27-smoke/`: desktop, tablet, mobile, and short-mobile states should be visually coherent for idle, running, round-end, and match-end.

Why this stays local this cycle:

- `cockpit-smoke.mjs` assumes an already-running DevTools endpoint on `127.0.0.1:9222`.
- It assumes an already-running preview server and defaults to `http://127.0.0.1:5175/`, while Vite preview commonly serves on a different port when ports are occupied.
- It writes screenshots and JSON into `docs/qa/cycle27-smoke/`, which is useful evidence but noisy for routine CI unless artifacts are handled explicitly.
- It drives selectors and timing directly through CDP. That is useful exploratory automation, but too brittle to block every PR until the harness owns browser launch, server launch, artifacts, and cleanup.

## Command Changes Recommended

Do not add Vitest, Jest, or Playwright just to satisfy ceremony. The current Node checks are working.

Recommended package script changes for the next code-editing cycle:

```json
{
  "scripts": {
    "ci": "pnpm lint && pnpm test && pnpm build",
    "deploy": "pnpm ci && wrangler pages deploy dist --branch main",
    "smoke:cockpit": "node scripts/cockpit-smoke.mjs"
  }
}
```

The important change is that deploy must include lint. Today `deploy` runs `pnpm test && pnpm build && wrangler pages deploy dist --branch main`, which means a known lint regression can ship if a human uses the deploy script. Since lint is now green, make it a real gate.

`smoke:cockpit` is optional convenience only. It should not be interpreted as self-contained CI until the command also starts Vite preview, launches Chromium with CDP, captures artifacts, and exits cleanly.

## Future CI Promotion Criteria for Cockpit Smoke

Promote cockpit smoke from local pre-release to mandatory CI only after these are true:

1. CI starts the preview server on a reserved port and fails if it cannot bind.
2. CI launches Chromium/Chrome itself with an isolated `--user-data-dir`.
3. The smoke command accepts `SMOKE_OUT_DIR` or an equivalent artifact directory instead of always writing under `docs/qa/cycle27-smoke`.
4. The script fails non-zero on overflow, missing match verdict, failed selector clicks, CDP exceptions, and browser console errors.
5. Artifacts are uploaded by CI rather than committed as normal repo churn.

Until then, the cockpit smoke remains high-value testing support, not a mandatory CI check.

## Final Gate

For this cycle:

- **Mandatory CI:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`.
- **Mandatory before manual deploy:** same CI checks plus one local cockpit smoke run and screenshot review.
- **Not mandatory in CI yet:** `scripts/cockpit-smoke.mjs`.
- **Command fix needed:** add a `ci` script and make `deploy` call it so lint cannot be bypassed.

