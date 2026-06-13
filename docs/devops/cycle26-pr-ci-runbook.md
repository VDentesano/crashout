# Cycle 26 DevOps Runbook - Narrow PR and Protected CI Evidence

Role: DevOps/SRE (`devops-hightower`).  
Date: 2026-06-13.  
Scope: release execution for the local deterministic gameplay E2E smoke changes. Do not edit app code while following this runbook.

## Release Goal

Open a narrow PR for the Cycle 25 deterministic cockpit smoke work, then verify the protected GitHub Actions check and retained smoke evidence before merge.

Required protected check:

```text
Crashout CI / Lint, test, build
```

Required uploaded artifact:

```text
cockpit-smoke
```

The workflow is `.github/workflows/crashout-ci.yml`. It runs on PRs touching `.github/workflows/crashout-ci.yml`, `memories/consensus.md`, or `projects/crashout/**`. A docs-only PR will not prove this release gate.

## Local Preflight

Run from repo root:

```bash
git status --short --branch
git fetch origin
git log --oneline --decorate --left-right --cherry-pick HEAD...origin/main
```

Confirm generated local state is ignored and uncommitted:

```bash
git check-ignore -v .wrangler projects/crashout/.codegraph docs/qa/cockpit-smoke docs/qa/cockpit-smoke/measurements.json
git status --ignored --short
```

Expected generated paths must stay out of the PR:

```text
.wrangler/
projects/*/.codegraph/
docs/qa/cockpit-smoke/
```

Run the release checks with pnpm:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit
cd ../..
```

Verify the local smoke output shape without staging it:

```bash
node -e "const fs=require('fs'); const dir='docs/qa/cockpit-smoke'; const d=JSON.parse(fs.readFileSync(dir+'/measurements.json','utf8')); const pngs=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort(); const match=d.filter(x=>x.name.endsWith('-match-end')); const overflow=d.reduce((n,x)=>n+(x.overflow?.length||0),0); console.log(JSON.stringify({measurements:d.length,pngs:pngs.length,matchEnds:match.length,overflow,e2e:match.map(x=>x.e2e)},null,2)); if (d.length!==24 || pngs.length!==16 || match.length!==4 || overflow!==0 || match.some(x=>x.e2e?.rounds!==5)) process.exit(1);"
git status --short --ignored
```

## PR Branch

Create a branch from the current work, keeping `main` protected:

```bash
git switch -c codex/cycle26-deterministic-e2e-smoke
```

Stage explicitly. Do not use `git add .`.

```bash
git add \
  memories/consensus.md \
  projects/crashout/src/game/useMatch.ts \
  projects/crashout/scripts/cockpit-smoke.mjs \
  docs/ceo/cycle26-pr-scope-decision.md \
  docs/critic/cycle26-release-premortem.md \
  docs/cto/cycle25-deterministic-e2e-architecture.md \
  docs/fullstack/cycle25-deterministic-e2e-implementation.md \
  docs/product/cycle25-deterministic-e2e-product.md \
  docs/qa/cycle25-deterministic-e2e-acceptance.md \
  docs/qa/cycle26-release-evidence.md \
  docs/devops/cycle26-pr-ci-runbook.md

git diff --cached --stat
git diff --cached --name-only
```

Commit and push:

```bash
git commit -m "Add deterministic cockpit smoke release gate"
git push -u origin codex/cycle26-deterministic-e2e-smoke
```

Open a draft PR:

```bash
gh pr create \
  --draft \
  --base main \
  --head codex/cycle26-deterministic-e2e-smoke \
  --title "Add deterministic cockpit smoke release gate" \
  --body "Adds gated deterministic full-match E2E support to the cockpit smoke, keeps generated smoke output ignored, and verifies the protected Crashout CI / Lint, test, build check plus cockpit-smoke artifact before merge."
```

## GitHub CI Verification

Watch the protected check:

```bash
PR_URL=$(gh pr view --json url --jq .url)
gh pr checks "$PR_URL" --watch
```

Find the workflow run for the branch:

```bash
gh run list \
  --workflow "Crashout CI" \
  --branch codex/cycle26-deterministic-e2e-smoke \
  --limit 5 \
  --json databaseId,headSha,status,conclusion,displayTitle,event,createdAt,url
```

Watch and inspect the run:

```bash
RUN_ID=<databaseId>
gh run watch "$RUN_ID" --compact
gh run view "$RUN_ID"
```

If the run fails:

```bash
gh run view "$RUN_ID" --log-failed
```

## Artifact Verification

Confirm the artifact exists, is not expired, and has non-zero size:

```bash
gh api "repos/VDentesano/crashout/actions/runs/$RUN_ID/artifacts" \
  --jq '.artifacts[] | select(.name == "cockpit-smoke") | {name, expired, size_in_bytes, created_at, archive_download_url}'
```

Download and inspect it:

```bash
rm -rf /tmp/crashout-cycle26-cockpit-smoke
mkdir -p /tmp/crashout-cycle26-cockpit-smoke
gh run download "$RUN_ID" \
  --repo VDentesano/crashout \
  --name cockpit-smoke \
  --dir /tmp/crashout-cycle26-cockpit-smoke
find /tmp/crashout-cycle26-cockpit-smoke -maxdepth 2 -type f | sort
```

Acceptance criteria:

- `measurements.json` is present.
- There are 16 PNG screenshots: four viewports times `idle`, `running`, `round-end`, and `match-end`; `history` and `settings` are measured in JSON but not screenshot-captured.
- `measurements.json` has 24 measurements: six measured states for each viewport.
- Exactly four measurements end in `-match-end`.
- Every match-end measurement has `e2e.rounds === 5`.
- Every match-end measurement has numeric `e2e.playerScore` and `e2e.ghostScore`.
- Every match-end measurement has a non-empty `e2e.outcome`.
- No measurement reports overflow findings.

Machine-check the downloaded artifact:

```bash
node -e "const fs=require('fs'); const dir='/tmp/crashout-cycle26-cockpit-smoke'; const d=JSON.parse(fs.readFileSync(dir+'/measurements.json','utf8')); const pngs=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort(); const match=d.filter(x=>x.name.endsWith('-match-end')); const overflow=d.reduce((n,x)=>n+(x.overflow?.length||0),0); console.log(JSON.stringify({measurements:d.length,pngs:pngs.length,matchEnds:match.length,overflow,e2e:match.map(x=>x.e2e)},null,2)); if (d.length!==24 || pngs.length!==16 || match.length!==4 || overflow!==0 || match.some(x=>x.e2e?.rounds!==5 || typeof x.e2e?.playerScore!=='number' || typeof x.e2e?.ghostScore!=='number' || !x.e2e?.outcome)) process.exit(1);"
```

## Merge Criteria

Mark the draft PR ready only after:

- `gh pr checks` reports `Crashout CI / Lint, test, build` passing.
- The matching `Crashout CI` run conclusion is `success`.
- The `cockpit-smoke` artifact exists, is not expired, and downloads successfully.
- The artifact passes the machine-check above.
- `git status --short --ignored` confirms generated evidence remains uncommitted.

## Rollback And Fallback

If local preflight fails, do not push. Fix only the failing intentional files, rerun `pnpm run check` and `pnpm run smoke:cockpit`, then restage explicitly.

If `pnpm install --frozen-lockfile` fails, the lockfile and package metadata are out of sync. Stop and either include the intentional `projects/crashout/pnpm-lock.yaml` update or remove the dependency/package change that caused drift.

If `pnpm run check` fails, treat it as a source defect. Keep the PR draft, push a focused fix commit, and rerun the full protected check.

If `pnpm run smoke:cockpit` fails locally or in CI, inspect `measurements.json` and screenshots first. If the failure is deterministic-hook behavior, fix `projects/crashout/src/game/useMatch.ts`. If the failure is artifact capture or assertions, fix `projects/crashout/scripts/cockpit-smoke.mjs`. Do not weaken the artifact assertions to make CI green.

If GitHub Actions fails before smoke runs, use:

```bash
gh run view "$RUN_ID" --log-failed
```

Then classify the failure:

- Dependency or Node/pnpm setup failure: fix package metadata or workflow setup in a follow-up commit.
- Lint/test/build failure: fix app source and rerun `pnpm run check`.
- Playwright install failure: rerun once if the failure is infrastructure-only; otherwise inspect the runner log before changing code.
- Artifact upload failure: keep the protected check failed until `cockpit-smoke` is uploaded and verified.

If the PR branch is wrong, close the PR and delete only the topic branch:

```bash
gh pr close codex/cycle26-deterministic-e2e-smoke
git push origin --delete codex/cycle26-deterministic-e2e-smoke
```

Do not reset or force-push `main`. Branch protection and the required check stay in place.

## PR File Scope

Expected files in the narrow PR:

```text
memories/consensus.md
projects/crashout/src/game/useMatch.ts
projects/crashout/scripts/cockpit-smoke.mjs
docs/ceo/cycle26-pr-scope-decision.md
docs/critic/cycle26-release-premortem.md
docs/cto/cycle25-deterministic-e2e-architecture.md
docs/fullstack/cycle25-deterministic-e2e-implementation.md
docs/product/cycle25-deterministic-e2e-product.md
docs/qa/cycle25-deterministic-e2e-acceptance.md
docs/qa/cycle26-release-evidence.md
docs/devops/cycle26-pr-ci-runbook.md
```

Include `projects/crashout/package.json`, `projects/crashout/pnpm-lock.yaml`, or `.github/workflows/crashout-ci.yml` only if their diffs are intentional and directly required by the release. The current Cycle 26 runbook does not require editing them.

Never include:

```text
.wrangler/
projects/*/.codegraph/
docs/qa/cockpit-smoke/
projects/crashout/dist/
projects/crashout/node_modules/
```
