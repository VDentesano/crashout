# Cycle 11 DevOps Output - CI Push Verification

Role simulation: DevOps/SRE (`devops-hightower`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Verdict

Safe to commit and push the Cycle 10 cockpit-smoke CI changes, with normal staging discipline.

The release wiring is aligned now: local branch is `main`, `origin` is `git@github.com:VDentesano/crashout.git`, and remote HEAD is `main`. Local release gates pass, the exact CI smoke command passes, and the GitHub Actions refs used by the workflow resolve remotely.

Do not commit generated state. Keep `.wrangler/`, `projects/crashout/.codegraph/`, and `docs/qa/cockpit-smoke/` out of the commit. Commit the source/config/docs changes that define the gate.

## Current Repo State

- `.github/workflows/crashout-ci.yml` runs the existing `pnpm run check` gate, installs Playwright Chromium, runs `pnpm run smoke:cockpit`, and uploads `docs/qa/cockpit-smoke/` as the `cockpit-smoke` artifact.
- `projects/crashout/package.json` makes `smoke:cockpit` self-contained for CI/local use by running `pnpm build && node scripts/cockpit-smoke.mjs`.
- `projects/crashout/scripts/cockpit-smoke.mjs` starts Vite preview on a free local port when no URL is supplied, drives Chromium through Playwright, captures screenshots, writes `measurements.json`, and fails on missing core cockpit elements or clipping.
- `.gitignore` includes generated local/tool outputs: `.wrangler/`, `projects/*/.codegraph/`, and `docs/qa/cockpit-smoke/`.
- Current untracked docs include Cycle 10/11 notes from multiple lanes. Include only the docs the team wants in this commit.

## Local Verification Run

Executed from `projects/crashout`:

```bash
pnpm release:ready
pnpm run check
pnpm run smoke:cockpit
```

Results:

- `pnpm release:ready` passed all repo/branch/origin/workflow/check-script checks.
- `pnpm run check` passed lint, unit checks, TypeScript build, and Vite production build.
- `pnpm run smoke:cockpit` passed across desktop, tablet, mobile, and short-mobile states with `overflowCount: 0` for all 20 measured states.
- Smoke artifacts were generated locally under ignored `docs/qa/cockpit-smoke/`: 12 PNG screenshots plus `measurements.json`.

The workflow action tags also resolve remotely:

- `actions/checkout@v4`
- `pnpm/action-setup@v6`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`

## Commit Scope

Recommended commit contents:

```bash
git add .github/workflows/crashout-ci.yml \
  .gitignore \
  projects/crashout/package.json \
  projects/crashout/pnpm-lock.yaml \
  projects/crashout/scripts/cockpit-smoke.mjs \
  docs/devops/cycle10-cockpit-smoke-ci.md \
  docs/devops/cycle11-ci-push-verification.md \
  docs/fullstack/cycle10-cockpit-smoke-ci-implementation.md \
  docs/qa/cycle10-cockpit-smoke-ci-verification.md \
  docs/cto/cycle10-cockpit-smoke-ci-architecture.md
```

Add `memories/consensus.md` and the Cycle 11 lane docs only if this commit is intended to carry consensus/doc updates as well.

Before committing, check:

```bash
git status --short
git diff --cached --stat
git diff --cached --check
```

## Post-Push GitHub Actions Verification

After commit and push:

```bash
git push origin main
```

Find the pushed run:

```bash
gh run list \
  --workflow "Crashout CI" \
  --branch main \
  --limit 5 \
  --json databaseId,headSha,status,conclusion,displayTitle,createdAt,url
```

Watch the run:

```bash
RUN_ID=<databaseId-from-list>
gh run watch "$RUN_ID" --compact
gh run view "$RUN_ID"
```

If it fails:

```bash
gh run view "$RUN_ID" --log-failed
```

Verify the artifact exists and download it:

```bash
gh api "repos/VDentesano/crashout/actions/runs/$RUN_ID/artifacts" \
  --jq '.artifacts[] | {name, expired, size_in_bytes}'

rm -rf /tmp/crashout-cockpit-smoke
mkdir -p /tmp/crashout-cockpit-smoke
gh run download "$RUN_ID" \
  --name cockpit-smoke \
  --dir /tmp/crashout-cockpit-smoke
find /tmp/crashout-cockpit-smoke -maxdepth 2 -type f | sort
```

Expected remote result:

- Workflow: `Crashout CI`
- Protected job: `Lint, test, build`
- Steps include `Run release gate`, `Install Playwright Chromium`, `Run cockpit smoke`, and `Upload cockpit smoke artifacts`.
- Artifact: `cockpit-smoke`
- Artifact contents: `measurements.json` plus idle/running/round-end screenshots for desktop, tablet, mobile, and short-mobile.

## Release Risks

- The CI gate proves the branch builds and the cockpit smoke passes. It does not deploy production.
- The direct Cloudflare Pages deploy path is still local Wrangler upload: `pnpm deploy` equals `pnpm run check && wrangler pages deploy dist --branch main`.
- `pnpm deploy` does not currently run `pnpm run smoke:cockpit`. That is acceptable if GitHub Actions is the protected release gate, but a human direct deploy should verify Actions is green first or run the smoke locally.
- `projects/crashout/DEPLOY.md` still describes the old manual CDP smoke flow and says cockpit smoke is not a CI requirement. That doc is stale after Cycle 10 and should be updated in a follow-up.
- CI now builds twice: once inside `pnpm run check`, then again inside `pnpm run smoke:cockpit`. This is a runtime cost, not a release blocker.
- The smoke is Chromium-only and layout-focused. It does not validate a full match, backend persistence, wallet accounting, accessibility tree, or cross-browser behavior.

## Rollback Path

If GitHub Actions fails because of the new browser gate rather than product code:

1. Inspect `gh run view "$RUN_ID" --log-failed`.
2. Download `cockpit-smoke` if upload completed.
3. For a fast revert, remove the Playwright install/smoke/upload steps from `.github/workflows/crashout-ci.yml`.
4. Revert `projects/crashout/package.json` and `projects/crashout/pnpm-lock.yaml` to remove the Playwright dependency if the smoke is fully backed out.
5. Keep `.gitignore` coverage for `docs/qa/cockpit-smoke/`; it is still a generated artifact path.

For production rollback after a bad direct Pages upload, use the Cloudflare Pages dashboard deployment rollback to promote the previous known-good deployment. Do not try to fix production by pushing another unverified local `dist/`; rebuild, rerun the release gate, and then upload.
