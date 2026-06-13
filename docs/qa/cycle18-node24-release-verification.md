# Cycle 18 QA - Node 24 CI Hygiene Release Verification

Role: QA Agent - James Bach
Date: 2026-06-13
Scope: release verification plan and local evidence for GitHub Actions Node 24 CI hygiene. Workflow files were not edited by this QA pass.

## Decision

Recommendation: **CONDITIONAL GO after one fresh GitHub PR run proves the Node 24 action migration and smoke artifact upload end to end.**

Local release checks are green, with two caveats: local `node` is `v26.2.0` rather than Node 24, and the exact CI command `pnpm exec playwright install --with-deps chromium` could not complete locally because the host requires interactive `sudo` for OS package installation. The app gate, readiness script, and browser smoke itself passed with pnpm.

Testing here is information, not certification. This verifies the release gate and smoke contract are still healthy from the app side. It does not prove the GitHub JavaScript action runtime migration until Actions runs the workflow.

## Shared Worktree Note

This checkout is shared and dirty. During QA, `.github/workflows/crashout-ci.yml` already had uncommitted edits made by other work:

- Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`.
- Changed `actions/checkout@v4` to `actions/checkout@v6`.
- Changed `actions/setup-node@v4` to `actions/setup-node@v6`.
- Changed `actions/upload-artifact@v4` to `actions/upload-artifact@v7`.

I did not edit or revert workflow files. This QA pass created only this document.

## What Should Be Tested

Critical quality attributes for this Cycle 18 change:

- CI runtime hygiene: GitHub JavaScript actions should no longer depend on Node 20-backed action majors.
- Existing protected gate stability: `Crashout CI / Lint, test, build` should keep the same job name and pass.
- Package manager discipline: all install/check/smoke commands use pnpm, never npm.
- App runtime compatibility: dependency install, lint, Node test files, TypeScript build, and Vite build pass under the configured Node 24 job runtime.
- Smoke evidence continuity: cockpit smoke still runs after the action upgrades and uploads a downloadable artifact.
- Artifact integrity: `cockpit-smoke` contains `measurements.json` plus the expected screenshots, not just a green job.
- Rollback readiness: if an upgraded action breaks checkout/setup/upload, the fix should be a narrow workflow action rollback, not app churn.

## Exact Commands

Run local checks from the repo root unless a command changes directory:

```bash
git status --short
git diff -- .github/workflows/crashout-ci.yml
cd projects/crashout
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm exec playwright install chromium
SMOKE_OUT_DIR=/tmp/cycle18-cockpit-smoke pnpm run smoke:cockpit
pnpm run release:ready
cd ../..
git diff --check
gh run list --repo VDentesano/crashout --workflow "Crashout CI" --limit 5
find /tmp/cycle18-cockpit-smoke -maxdepth 1 -type f -printf '%f %s\n' | sort
node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/cycle18-cockpit-smoke/measurements.json','utf8')); console.log(JSON.stringify({measurements:d.length, overflow:d.reduce((n,x)=>n+(x.overflow?.length||0),0), pngs:fs.readdirSync('/tmp/cycle18-cockpit-smoke').filter(f=>f.endsWith('.png')).length}, null, 2));"
```

After the Cycle 18 workflow PR exists, run these GitHub checks:

```bash
gh pr checks --watch
gh run list --repo VDentesano/crashout --workflow "Crashout CI" --limit 5
gh run view <run-id> --repo VDentesano/crashout --json status,conclusion,event,headBranch,headSha,workflowName,jobs
gh run view <run-id> --repo VDentesano/crashout --log
gh api repos/VDentesano/crashout/actions/runs/<run-id>/artifacts
rm -rf /tmp/cycle18-gh-cockpit-smoke
gh run download <run-id> --repo VDentesano/crashout -n cockpit-smoke -D /tmp/cycle18-gh-cockpit-smoke
find /tmp/cycle18-gh-cockpit-smoke -maxdepth 1 -type f -printf '%f %s\n' | sort
node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/cycle18-gh-cockpit-smoke/measurements.json','utf8')); console.log(JSON.stringify({measurements:d.length, overflow:d.reduce((n,x)=>n+(x.overflow?.length||0),0), pngs:fs.readdirSync('/tmp/cycle18-gh-cockpit-smoke').filter(f=>f.endsWith('.png')).length}, null, 2));"
```

## Local Results

| Check | Status | Result |
| --- | ---: | --- |
| Local Node version | WARN | `node --version` returned `v26.2.0`, so this was not an exact Node 24 local rehearsal. |
| Local pnpm version | PASS | `pnpm --version` returned `11.5.1`, matching `packageManager`. |
| Frozen install | PASS | `pnpm install --frozen-lockfile` reported already up to date. |
| Release gate | PASS | `pnpm run check` passed `eslint .`, all direct Node test files, `tsc -b`, and `vite build`. |
| Playwright CI dependency install | BLOCKED LOCALLY | `pnpm exec playwright install --with-deps chromium` failed because `sudo` required an interactive password. This should pass on GitHub-hosted Ubuntu. |
| Playwright browser install | PASS | `pnpm exec playwright install chromium` completed using Playwright's Ubuntu fallback build warning for the local OS. |
| Cockpit smoke | PASS | `SMOKE_OUT_DIR=/tmp/cycle18-cockpit-smoke pnpm run smoke:cockpit` passed. |
| Smoke artifact shape | PASS | Temp output had 12 PNGs plus `measurements.json`; JSON had 20 measurements and 0 overflow entries. |
| Release readiness script | PASS | `pnpm run release:ready` passed repository, origin, branch, workflow, and package gate checks. |
| Whitespace check | PASS | `git diff --check` produced no output. |
| GitHub run availability | NOT YET OBSERVED | `gh run list` showed only prior Cycle 16/17 runs; no fresh Cycle 18 run was available during this QA pass. |

Expected temp smoke files observed:

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

## Expected GitHub Evidence

Before merging the Cycle 18 workflow hygiene PR, the Actions run should show:

- Workflow: `Crashout CI`.
- Required job name unchanged: `Lint, test, build`.
- Event: `pull_request` for the Cycle 18 branch.
- Conclusion: `success`.
- The job uses pnpm commands only: `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm exec playwright install --with-deps chromium`, and `pnpm run smoke:cockpit`.
- Action pins visible in the workflow/logs match the migration intent: `actions/checkout@v6`, `pnpm/action-setup@v6`, `actions/setup-node@v6`, and `actions/upload-artifact@v7`.
- `Setup Node` provisions Node 24 for shell commands.
- No Node 20 JavaScript action deprecation annotation remains for checkout, setup-node, or upload-artifact.
- Artifact metadata contains a non-expired artifact named `cockpit-smoke`, retention 14 days, nonzero size.
- Downloaded artifact contains `measurements.json` and the 12 PNG files listed above.
- Artifact JSON parse reports 20 measured states, 0 overflow entries, and 12 PNGs.

After merge, repeat the same evidence check on the `push` run for `main`. The release claim should not rely only on the PR run because the protected branch path is part of the CI contract.

## Residual Risks

### QA-18-01 - GitHub runtime proof is still missing

Severity: High until a fresh Cycle 18 Actions run passes.
Risk: Local checks cannot prove JavaScript actions execute correctly on GitHub's Node 24 action runtime. Merge only after the PR run and post-merge run prove checkout, setup, install, smoke, and artifact upload.

### QA-18-02 - Local runtime was Node 26, not Node 24

Severity: Moderate.
Risk: The local app gate passed on a newer runtime. This is useful compatibility evidence but not exact parity with CI. The GitHub run must be treated as the source of truth for Node 24.

### QA-18-03 - `--with-deps` could not be locally rehearsed

Severity: Moderate.
Risk: The browser smoke passed locally after installing Chromium, but the exact GitHub command that installs OS dependencies was blocked by interactive sudo on this machine. GitHub-hosted Ubuntu should cover this, but the Actions log must confirm it.

### QA-18-04 - Artifact upload is part of the release gate

Severity: Moderate.
Risk: The app can pass while `actions/upload-artifact` fails or packages the wrong directory. For this CI hygiene change, a green app gate without a downloadable `cockpit-smoke` artifact is not enough.

### QA-18-05 - Shared dirty worktree increases staging risk

Severity: Moderate.
Risk: There are unrelated modified/untracked files in this checkout. Use explicit path staging only. Do not run broad reset, checkout, clean, or staging commands.

### QA-18-06 - Force flag may mask incomplete migration

Severity: Low if used only as a probe, moderate if left as the long-term fix.
Risk: `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` can pressure-test runtime compatibility, but the durable evidence should be upgraded action majors plus clean GitHub logs.

## QA Recommendation

Proceed with Cycle 18 only as a narrow CI hygiene release: no app code, no package script churn, no deploy changes. Local app-side release verification passed with the limitations above.

Final merge gate: one fresh PR run and one post-merge `main` run must pass `Crashout CI / Lint, test, build`, show the intended Node 24 action posture, and produce a verified downloadable `cockpit-smoke` artifact.
