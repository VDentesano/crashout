# Cycle 17 QA - PR #3 Release Verification

Role: QA Agent - James Bach
Date: 2026-06-13
Scope: independently verify release-quality evidence for PR #3 and post-merge readiness. Application source was not edited.

## Decision

Recommendation: **GO for post-merge readiness, with residual risks noted below.**

PR #3 was open when verification started and was merged during this QA pass. I therefore verified both the pre-merge PR evidence and the post-merge `main` evidence. The protected GitHub Actions check passed before merge, the post-merge `main` run passed after merge, and both runs produced downloadable `cockpit-smoke` artifacts with the expected shape.

This is a checking result, not a full product quality claim. It tells us the documented protected PR evidence and cockpit smoke gate are intact. It does not prove all gameplay, persistence, accessibility, browser compatibility, or production deployment behavior.

## PR #3 Facts

- PR: `https://github.com/VDentesano/crashout/pull/3`
- Title: `[codex] record cycle 16 protected PR evidence`
- State observed initially: `OPEN`, draft, `MERGEABLE`, `CLEAN`
- Final state observed: `MERGED`
- Merged at: `2026-06-13T09:23:02Z`
- Base: `main` at `c21b0a3a02e78a50303a52da1f4fa036b28c568c`
- Head: `codex/cycle16-pr-evidence` at `ce4099043338489d52f5dab4d3146063dddb0df3`
- Merge commit: `e64717e5a1aee14c12c97a6b3f84272a923fb626`

Changed files in PR #3:

- `docs/cto/cycle16-release-architecture.md`
- `docs/devops/cycle16-protected-pr-execution.md`
- `docs/fullstack/cycle16-source-diff-review.md`
- `docs/qa/cycle16-pr-ci-evidence.md`
- `memories/consensus.md`

QA observation: PR #3 did not change application source files under `projects/crashout`.

## Checks Run

| Check | Command / source | Status | Evidence |
|---|---|---:|---|
| PR metadata | `gh pr view 3 --json ...` | PASS | PR #3 merged; merge commit `e64717e5...`; changed files are docs plus `memories/consensus.md`. |
| PR check status | `gh pr checks 3 --repo VDentesano/crashout` | PASS | `Lint, test, build` passed in `1m26s`. |
| PR Actions run | `gh run view 27462576464 --json ...` | PASS | Workflow `Crashout CI`, event `pull_request`, head SHA `ce409904...`, job `Lint, test, build` success. |
| PR artifact metadata | `gh api repos/VDentesano/crashout/actions/runs/27462576464/artifacts` | PASS | Artifact `cockpit-smoke`, `expired=false`, `size_in_bytes=9009853`, created `2026-06-13T09:14:03Z`. |
| PR artifact download | `gh run download 27462576464 -n cockpit-smoke -D /tmp/cycle17-pr3-cockpit-smoke` | PASS | Downloaded `measurements.json` plus 12 PNG screenshots. |
| PR artifact JSON | Node parse of `/tmp/cycle17-pr3-cockpit-smoke/measurements.json` | PASS | 20 measured states, 0 overflow entries, 12 PNGs. |
| Local release gate | `pnpm run check` from `projects/crashout` | PASS | ESLint, Node game/audio/fairness/economy/history/leaderboard checks, TypeScript build, and Vite build passed. |
| Local whitespace check | `git diff --check` | PASS | No whitespace errors reported. |
| Local cockpit smoke | `pnpm run smoke:cockpit` from `projects/crashout` | PASS | Wrote `docs/qa/cockpit-smoke`; 20 measured states, 0 overflow entries. |
| Local readiness script | `pnpm run release:ready` from `projects/crashout` | PASS | Repository, origin, `main` branch alignment, workflow, and package release gate checks passed. |
| Post-merge `main` CI | `gh run watch 27462804469 --exit-status` | PASS | Push run for merge commit `e64717e5...`; `Lint, test, build` passed in `1m31s`. |
| Post-merge artifact metadata | `gh api repos/VDentesano/crashout/actions/runs/27462804469/artifacts` | PASS | Artifact `cockpit-smoke`, `expired=false`, `size_in_bytes=8979292`, created `2026-06-13T09:24:36Z`. |
| Post-merge artifact download | `gh run download 27462804469 -n cockpit-smoke -D /tmp/cycle17-pr3-main-smoke` | PASS | Downloaded `measurements.json` plus 12 PNG screenshots. |
| Post-merge artifact JSON | Node parse of `/tmp/cycle17-pr3-main-smoke/measurements.json` | PASS | 20 measured states, 0 overflow entries, 12 PNGs. |

Expected artifact files observed in both PR and post-merge runs:

- `measurements.json`
- `desktop-idle.png`
- `desktop-running.png`
- `desktop-round-end.png`
- `tablet-idle.png`
- `tablet-running.png`
- `tablet-round-end.png`
- `mobile-idle.png`
- `mobile-running.png`
- `mobile-round-end.png`
- `short-mobile-idle.png`
- `short-mobile-running.png`
- `short-mobile-round-end.png`

Measured states observed in both artifact JSON files:

- `desktop-idle`, `desktop-history`, `desktop-settings`, `desktop-running`, `desktop-round-end`
- `tablet-idle`, `tablet-history`, `tablet-settings`, `tablet-running`, `tablet-round-end`
- `mobile-idle`, `mobile-history`, `mobile-settings`, `mobile-running`, `mobile-round-end`
- `short-mobile-idle`, `short-mobile-history`, `short-mobile-settings`, `short-mobile-running`, `short-mobile-round-end`

## CI Observations

PR run `27462576464`:

- `Run release gate`: success
- `Install Playwright Chromium`: success
- `Run cockpit smoke`: success
- `Upload cockpit smoke artifacts`: success

Post-merge `main` run `27462804469`:

- `Run release gate`: success
- `Install Playwright Chromium`: success
- `Run cockpit smoke`: success
- `Upload cockpit smoke artifacts`: success

GitHub Actions annotation observed on the post-merge run:

- `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` are reported as running on Node.js 20.
- GitHub says actions will be forced to run with Node.js 24 by default starting `2026-06-16`, with Node.js 20 removed from the runner on `2026-09-16`.

This is not a release blocker for PR #3 because the current post-merge run passed, but it is a near-term CI maintenance risk.

## Residual Risks

### QA-17-01 - Smoke evidence is Chromium-only

Severity: Moderate.
Risk: The cockpit smoke verifies selected Chromium viewport behavior. It does not prove Safari, Firefox, mobile WebView, or device-specific behavior.

### QA-17-02 - Smoke is not full gameplay certification

Severity: Moderate.
Risk: The smoke checks selected layout and state transitions. It does not prove complete match scoring, persistence, leaderboard/history correctness, wallet reconciliation, accessibility, clipboard behavior, or audio policy behavior.

### QA-17-03 - CI JavaScript action runtime change is near

Severity: Moderate.
Risk: The post-merge run passed but emitted the Node.js 20 actions deprecation annotation. The forced Node.js 24 default begins `2026-06-16`, which is close enough to treat as release maintenance work.

### QA-17-04 - Local checkout has unrelated pending work

Severity: Low for PR #3, moderate for future release operations.
Risk: After fetch, local `main` is aligned with `origin/main`, but the worktree still has unrelated modified/untracked files, including `memories/consensus.md` and several Cycle 17/Cycle 12 docs. Do not use broad staging commands for future release work.

Observed local status after verification:

```text
## main...origin/main
 M memories/consensus.md
?? docs/cto/cycle17-merge-architecture.md
?? docs/devops/cycle12-protected-pr-runbook.md
?? docs/devops/cycle17-pr-merge-reconciliation.md
?? docs/fullstack/cycle17-source-hygiene.md
?? docs/qa/cycle12-pr-release-evidence.md
```

### QA-17-05 - Artifact retention is short

Severity: Low.
Risk: The `cockpit-smoke` artifacts are useful release evidence but time-limited. The workflow retention is 14 days, so long-term audit evidence must live in committed QA notes rather than only in Actions artifacts.

## QA Recommendation

**GO.** PR #3 has adequate release-quality evidence for its scope, and post-merge readiness is confirmed by the successful `main` CI run on merge commit `e64717e5...` plus a verified post-merge `cockpit-smoke` artifact.

Do not expand this conclusion beyond the evidence. This verifies the PR documentation/evidence path, the protected `Lint, test, build` job, and the cockpit smoke artifact chain. It does not certify full product behavior or production deployment.

Recommended follow-up: address the GitHub Actions Node.js 20 deprecation before or during the next release cycle, then keep future release changes staged narrowly because this checkout still contains unrelated pending work.
