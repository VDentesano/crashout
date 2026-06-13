# Cycle 11 QA Output - CI Push Gate Assessment

Role simulation: QA (`qa-bach`) with Codex CLI, `gpt-5.5`, reasoning effort `medium`.

## Scope

Inspected the current Crashout cockpit smoke artifacts, Playwright-backed smoke script, package scripts, `.gitignore`, and GitHub Actions workflow enough to judge whether the next release step can be pushed and verified. I did not revert or modify existing implementation changes.

## Current Gate Signal

Release gate quality is acceptable for a push-and-verify step, with one important framing: this is an automated layout/regression smoke, not a full gameplay or release validation suite.

Evidence found:

- `projects/crashout/package.json` now gates local smoke through `pnpm build && node scripts/cockpit-smoke.mjs`.
- `.github/workflows/crashout-ci.yml` runs `pnpm run check`, installs Playwright Chromium, runs `pnpm run smoke:cockpit`, and uploads `docs/qa/cockpit-smoke/` as the `cockpit-smoke` artifact with 14-day retention.
- Action refs used by CI exist remotely as of this inspection: `actions/checkout@v4`, `pnpm/action-setup@v6`, `actions/setup-node@v4`, and `actions/upload-artifact@v4`.
- Current local smoke output has 20 measurements across desktop, tablet, mobile, and short-mobile profiles.
- Current `docs/qa/cockpit-smoke/measurements.json` reports zero overflow findings.
- Current screenshot artifacts are non-trivial image files: 12 PNGs, roughly 306 KB to 1.30 MB each, plus `measurements.json`.

## Artifact Commit Policy

Do not commit generated cockpit smoke output from `docs/qa/cockpit-smoke/`.

Reasoning:

- The CI workflow uploads this directory as an Actions artifact, which is the right release evidence path for generated screenshots and measurements.
- `.gitignore` now includes `docs/qa/cockpit-smoke/`, so local smoke output stays out of source control.
- `.wrangler/` and `projects/*/.codegraph/` are also ignored local/tool state and should not be committed.
- Existing tracked historical evidence such as `docs/qa/cycle27-smoke/` is different: it is a named QA evidence snapshot, not the rolling CI artifact directory.

Files that should be committed for Cycle 11 are the source/config/docs changes that define the gate, not generated runtime state: workflow updates, package/lockfile smoke dependency changes, the smoke script, `.gitignore`, relevant cycle docs, and consensus updates if intentional.

## Remaining Smoke Gaps

The cockpit smoke is useful, but it does not remove these release risks:

- No full 5-round match completion, match-end state, or `RUN IT BACK` assertion in Cycle 10 smoke.
- No assertion of wallet/balance accounting after cashout or loss.
- No backend persistence/API correctness check for rounds, events, history, or leaderboard.
- No accessibility tree, keyboard-only, focus order, or reduced-motion check.
- No cross-browser coverage; Chromium only.
- No real clipboard success path; headless/local smoke mainly proves fallback behavior.
- No audio/autoplay verification beyond not blocking the core flow.
- No visual approval threshold; screenshots are captured for human review, while automated assertions focus on presence and clipping.

These are not blockers for the CI push if the goal is to protect against cockpit layout regressions and broken production builds. They should remain explicit so the team does not confuse smoke coverage with exploratory release confidence.

## Post-Push QA Verification Checklist

1. Confirm the pushed commit includes the intended source/config changes and excludes `docs/qa/cockpit-smoke/`, `.wrangler/`, and `projects/crashout/.codegraph/`.
2. On GitHub Actions, open the `Crashout CI` run for the pushed branch.
3. Verify the protected job name is `Lint, test, build` and that it completes green.
4. In the job log, confirm these steps ran in order: dependency install, `pnpm run check`, Playwright Chromium install, `pnpm run smoke:cockpit`, and artifact upload.
5. Confirm the smoke log reports 20 measured states and `overflowCount: 0` for every state.
6. Download the `cockpit-smoke` artifact and verify it contains `measurements.json` plus 12 screenshots: idle, running, and round-end for desktop, tablet, mobile, and short-mobile.
7. Spot-check the screenshots for obvious blank render, modal/nav overlap, clipped primary action, unreadable console state, and short-mobile footer/console collision.
8. Confirm branch protection requires `Crashout CI / Lint, test, build` on the production branch before considering the push release-gated.

## QA Recommendation

Proceed with commit/push verification. Treat a green Actions run plus uploaded smoke artifact as the Cycle 11 gate result. Do not treat it as final product release signoff until the remaining smoke gaps above are either tested manually, covered by new automation, or explicitly waived.
