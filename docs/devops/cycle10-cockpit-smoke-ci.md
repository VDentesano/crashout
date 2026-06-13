# Cycle 10 DevOps Output — Cockpit Smoke CI

Role simulation: DevOps/SRE (`devops-hightower`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Infrastructure State
- `main` already has a protected `Lint, test, build` status context.
- The existing GitHub Actions job now owns the cockpit smoke gate inside that same required context.
- CI installs Playwright Chromium with `pnpm exec playwright install --with-deps chromium` before running the smoke.

## Implementation
- Added Playwright as a dev dependency in `projects/crashout`.
- Updated `.github/workflows/crashout-ci.yml` to run `pnpm run smoke:cockpit` after the existing release gate.
- Added a `cockpit-smoke` artifact upload from `docs/qa/cockpit-smoke/` with 14-day retention.
- Ignored `docs/qa/cockpit-smoke/` because it is generated CI/local evidence, not release source.

## Risk and Rollback
- Risk: Playwright browser install can add CI time. Acceptable for a visual smoke gate, and the job remains one protected context.
- Rollback: remove the Playwright install/smoke/upload steps and remove the Playwright dev dependency.
