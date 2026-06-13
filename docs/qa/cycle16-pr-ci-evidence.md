# Cycle 16 QA - PR CI Evidence For Cockpit Smoke

Role: QA Agent - James Bach  
Date: 2026-06-13  
Scope: merge evidence needed before accepting the cockpit smoke CI PR. Source code was not edited.

## Decision Frame

Testing is information. For this PR, the question is not "did a browser screenshot script run once?" The merge question is: does the protected PR path now provide useful, repeatable information about whether the cockpit can still render and move through its critical states across the riskiest viewports?

My recommendation is **GO only after the GitHub PR run proves the artifact path is downloadable from the `Lint, test, build` job**. Local checks are green, and the workflow shape is correct, but the PR should not merge on local evidence alone because the feature being changed is CI behavior.

## Current Test And CI Inventory

Application project: `projects/crashout`

Package scripts inspected:

- `pnpm run check`: `pnpm lint && pnpm test && pnpm build`
- `pnpm lint`: `eslint .`
- `pnpm test`: script-based Node checks for game logic, audio prefs, fairness, economy, history, and leaderboard behavior.
- `pnpm build`: `tsc -b && vite build`
- `pnpm run smoke:cockpit`: `pnpm build && node scripts/cockpit-smoke.mjs`
- `pnpm deploy`: `pnpm run check && wrangler pages deploy dist --branch main`

Workflow inspected: `.github/workflows/crashout-ci.yml`

- Triggers on PRs and pushes touching `.github/workflows/crashout-ci.yml` or `projects/crashout/**`.
- Single protected job name: `Lint, test, build`.
- Runs on Ubuntu with Node 24 and pnpm 11.5.1.
- Installs dependencies with `pnpm install --frozen-lockfile`.
- Runs `pnpm run check`.
- Installs Chromium with `pnpm exec playwright install --with-deps chromium`.
- Runs `pnpm run smoke:cockpit`.
- Uploads `docs/qa/cockpit-smoke/` as artifact `cockpit-smoke`, retention 14 days.

Smoke script inspected: `projects/crashout/scripts/cockpit-smoke.mjs`

- Builds if needed, starts Vite preview when no `SMOKE_BASE_URL` is supplied, and writes artifacts to `docs/qa/cockpit-smoke` by default.
- Covers desktop `1440x900`, tablet `820x1180`, mobile `390x844`, and short mobile `390x640`.
- Measures idle, history, settings, running, and round-end states.
- Captures screenshots for idle, running, and round-end states.
- Fails on missing core idle surfaces or inspected horizontal/top overflow.
- Writes `measurements.json` even when failing, which is useful triage evidence.

## Evidence Observed Locally

Commands run from `projects/crashout`:

```bash
pnpm run check
pnpm run smoke:cockpit
```

Observed result:

- `pnpm run check`: pass.
- `pnpm lint`: pass.
- `pnpm test`: pass.
- `pnpm build`: pass.
- `pnpm run smoke:cockpit`: pass.
- Fresh smoke output written to `docs/qa/cockpit-smoke`.

Current generated smoke evidence:

- `docs/qa/cockpit-smoke/measurements.json`: 20 measured states, 0 overflow findings.
- `docs/qa/cockpit-smoke/`: 12 screenshot artifacts: idle, running, and round-end for desktop, tablet, mobile, and short mobile.
- Prior expanded exploratory artifact set also exists at `docs/qa/cycle27-smoke/`: 24 measured states, 0 overflow findings, including match-end screenshots.

## Required Evidence Before Merge

The PR should show all of the following before merge:

1. GitHub Actions check `Lint, test, build` is green on the PR head commit.
2. The `Run release gate` step completed `pnpm run check`, not just a partial lint/build subset.
3. The `Install Playwright Chromium` step completed successfully on GitHub-hosted Ubuntu.
4. The `Run cockpit smoke` step completed successfully after the release gate.
5. The Actions run contains a downloadable artifact named `cockpit-smoke`.
6. The downloaded artifact contains `measurements.json` and the 12 expected PNGs:
   `desktop-idle`, `desktop-running`, `desktop-round-end`,
   `tablet-idle`, `tablet-running`, `tablet-round-end`,
   `mobile-idle`, `mobile-running`, `mobile-round-end`,
   `short-mobile-idle`, `short-mobile-running`, `short-mobile-round-end`.
7. `measurements.json` reports 20 expected states and zero overflow entries.
8. At least one reviewer opens the downloaded screenshots, not only the JSON. The JSON tells us about selected geometry; the screenshots tell us whether the image is actually meaningful to a human.

## Artifact Download Check

Minimum manual verification after the PR Actions run:

```bash
gh run download <run-id> -n cockpit-smoke -D /tmp/cockpit-smoke
node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/cockpit-smoke/measurements.json','utf8')); console.log(d.length, d.reduce((n,x)=>n+(x.overflow?.length||0),0));"
ls /tmp/cockpit-smoke/*.png | wc -l
```

Expected:

- measurement count: `20`
- overflow count: `0`
- PNG count: `12`

## Bug Classification / Risks

### QA-16-01 - CI artifact path must be proven on GitHub

Severity: Major for this PR.  
Risk: Local smoke output proves the script works, but not that `actions/upload-artifact` resolves and packages the intended repo-root path in the actual PR job. A green job without a usable artifact would weaken the purpose of adding smoke evidence to CI.

Merge condition: artifact is visible and downloadable from the PR run.

### QA-16-02 - Smoke is a layout/checking gate, not a full gameplay oracle

Severity: Moderate residual risk.  
Risk: The smoke catches missing core surfaces, trivial screenshots, and selected overflow. It does not prove complete match scoring, backend persistence, cross-browser behavior, clipboard success, audio policy behavior, accessibility, or visual design quality.

Mitigation: keep unit checks for business logic, preserve exploratory QA notes for match-end coverage, and do not describe this PR as end-to-end release certification.

### QA-16-03 - Full match completion remains outside the CI smoke

Severity: Moderate residual risk.  
Risk: Current CI smoke stops at round-end, not match-end. Prior `cycle27-smoke` artifacts include match-end evidence, but the current CI gate intentionally favors stable, fast cockpit coverage over longer probabilistic flows.

Mitigation: use manual/exploratory match-end evidence before release milestones; only add match-end to CI if the app gets deterministic test hooks.

### QA-16-04 - Artifact retention is short-lived evidence

Severity: Low.  
Risk: 14-day retention is enough for PR review, but not for long-term release traceability.

Mitigation: keep material release evidence in `docs/qa/` when a release decision depends on it.

## Merge Recommendation

**Conditional GO.** The local release gate and cockpit smoke are green, and the workflow contains the right protected-job sequence. Merge after the PR's GitHub Actions `Lint, test, build` job is green and the `cockpit-smoke` artifact has been downloaded and checked for the expected JSON and PNG contents.

Do not merge if the smoke passes but artifact upload/download is missing or empty; for this PR, artifact availability is part of the tested behavior.
