# Cycle 16 DevOps - Protected PR Execution

Role: DevOps/SRE, Kelsey Hightower posture: simplest safe path, no force pushes, branch protection stays in charge.

## Current State

Repository inspected from `/home/valentinod/Documents/crash-crypto` on 2026-06-13.

- Current local branch: `main`
- Remote: `origin git@github.com:VDentesano/crashout.git`
- Local status: `main...origin/main [ahead 1, behind 2]`
- Local ahead commit: `ad16686 gate cockpit smoke in CI`
- Remote commits not in local `main`:
  - `50502b0 gate cockpit smoke in CI`
  - `c21b0a3 record cycle 11 merge verification`
- Existing GitHub PR: `VDentesano/crashout#1`
  - Head: `codex/cockpit-smoke-ci-gate`
  - Base: `main`
  - State: merged
  - Merge commit: `50502b015f6cff4c60b7be51785529236a221449`
  - Merged at: `2026-06-13T04:46:45Z`
- Remote branch `codex/cockpit-smoke-ci-gate` is no longer present.
- `origin/main` is `c21b0a3a02e78a50303a52da1f4fa036b28c568c`.

Branch protection on `main` is active:

- Required status context: `Lint, test, build`
- Strict status checks: enabled
- Enforce admins: enabled
- Required PR reviews: not configured
- Direct pushes to `main` should be treated as blocked.

## Consensus Action

The consensus next action was:

1. Push branch `codex/cockpit-smoke-ci-gate`.
2. Open a draft PR to `main`.
3. Verify the GitHub Actions artifact.

That action has already completed remotely through PR `#1`. The remaining operational problem is local state hygiene: this checkout still has a divergent `main` and a dirty working tree. Do not repeat the old push from this local `main` without reconciling first.

## GitHub Actions Evidence

PR run:

```bash
gh pr view 1 --repo VDentesano/crashout \
  --json number,state,isDraft,title,headRefName,baseRefName,mergeCommit,mergedAt,url,statusCheckRollup
```

Observed result:

- PR `#1` merged.
- Check `Lint, test, build` completed successfully.
- Workflow: `Crashout CI`
- PR check run URL: `https://github.com/VDentesano/crashout/actions/runs/27456886277/job/81163009413`

Artifact verified on PR run `27456886277`:

```bash
gh api repos/VDentesano/crashout/actions/runs/27456886277/artifacts \
  --jq '.artifacts[] | {name, expired, size_in_bytes, created_at, archive_download_url}'
```

Observed artifact:

- `name`: `cockpit-smoke`
- `expired`: `false`
- `size_in_bytes`: `8913654`
- `created_at`: `2026-06-13T04:45:46Z`

Latest `main` push run:

```bash
gh run list --repo VDentesano/crashout \
  --workflow "Crashout CI" \
  --branch main \
  --limit 5 \
  --json databaseId,headSha,status,conclusion,displayTitle,createdAt,url,event
```

Observed latest `main` run:

- Run ID: `27457056851`
- Head SHA: `c21b0a3a02e78a50303a52da1f4fa036b28c568c`
- Event: `push`
- Conclusion: `success`
- URL: `https://github.com/VDentesano/crashout/actions/runs/27457056851`

Artifact verified on latest `main` run `27457056851`:

```bash
gh api repos/VDentesano/crashout/actions/runs/27457056851/artifacts \
  --jq '.artifacts[] | {name, expired, size_in_bytes, created_at}'
```

Observed artifact:

- `name`: `cockpit-smoke`
- `expired`: `false`
- `size_in_bytes`: `8946817`
- `created_at`: `2026-06-13T04:53:38Z`

## Operational Risks

### `main` Is Ahead And Behind

Local `main` has `ad16686`, while remote `main` has `50502b0` and `c21b0a3`.

Risk:

- `ad16686` and `50502b0` have the same subject and nearly the same cockpit-smoke gate content, but they are different commits.
- A direct push from local `main` is non-fast-forward and blocked.
- Recreating `codex/cockpit-smoke-ci-gate` from local `main` can duplicate already-merged work or omit `c21b0a3`.

Safe command:

```bash
git fetch origin
git log --left-right --cherry-pick --oneline main...origin/main
git switch main
git pull --ff-only origin main
```

If `git pull --ff-only` fails because of local divergence, stop and create a safety branch before any history work:

```bash
git branch backup/cycle16-diverged-main
```

Do not use `git reset --hard` unless the owner explicitly asks for it.

### Mixed Working Tree

Current unstaged/untracked paths:

```text
 M .gitignore
?? .wrangler/
?? docs/cto/cycle16-release-architecture.md
?? docs/devops/cycle12-protected-pr-runbook.md
?? docs/qa/cockpit-smoke/
?? docs/qa/cycle12-pr-release-evidence.md
?? docs/qa/cycle16-pr-ci-evidence.md
?? docs/fullstack/cycle16-source-diff-review.md
?? projects/crashout/.codegraph/
```

Risk:

- `.gitignore` currently removes ignore entries for generated paths:
  - `projects/*/.codegraph/`
  - `.wrangler/`
  - `docs/qa/cockpit-smoke/`
- Staging that `.gitignore` diff would make it easier to accidentally commit local generated state.
- `.wrangler/`, `projects/crashout/.codegraph/`, and `docs/qa/cockpit-smoke/` are generated local/CI artifacts and should not be committed.

Safe inspection:

```bash
git status --short --branch
git diff -- .gitignore
```

### Branch Protection

Risk:

- `main` requires `Lint, test, build`.
- Strict checks require the branch to be up to date with `main`.
- Admin enforcement is enabled, so bypassing protection should not be part of the plan.

Safe path:

- Push a topic branch.
- Open a draft PR.
- Let `Crashout CI` produce the required status.
- Verify the `cockpit-smoke` artifact before marking ready or merging.

### Artifact Verification

Risk:

- A green check without artifact inspection proves the job completed, but not that the expected smoke evidence was retained.
- Artifact expiration is time-bound, so evidence must be checked while it is still available.

Verification command:

```bash
RUN_ID=<run-id>
gh api "repos/VDentesano/crashout/actions/runs/$RUN_ID/artifacts" \
  --jq '.artifacts[] | select(.name == "cockpit-smoke") | {name, expired, size_in_bytes, created_at}'

rm -rf /tmp/crashout-cockpit-smoke
mkdir -p /tmp/crashout-cockpit-smoke
gh run download "$RUN_ID" \
  --repo VDentesano/crashout \
  --name cockpit-smoke \
  --dir /tmp/crashout-cockpit-smoke
find /tmp/crashout-cockpit-smoke -maxdepth 2 -type f | sort
```

Expected contents:

- `measurements.json`
- Desktop screenshots for idle, running, and round-end states
- Tablet screenshots for idle, running, and round-end states
- Mobile screenshots for idle, running, and round-end states
- Short-mobile screenshots for idle, running, and round-end states

## Staging Rules

For this Cycle 16 documentation task, stage only:

```bash
git add docs/devops/cycle16-protected-pr-execution.md
```

Do not stage:

```text
.gitignore
.wrangler/
docs/qa/cockpit-smoke/
projects/crashout/.codegraph/
```

Treat these as separate-owner or generated paths unless the team explicitly asks to include them:

```text
docs/cto/cycle16-release-architecture.md
docs/devops/cycle12-protected-pr-runbook.md
docs/fullstack/cycle16-source-diff-review.md
docs/qa/cycle12-pr-release-evidence.md
docs/qa/cycle16-pr-ci-evidence.md
```

For the original cockpit-smoke CI gate PR, the only appropriate staged source/config files were:

```text
.github/workflows/crashout-ci.yml
projects/crashout/package.json
projects/crashout/pnpm-lock.yaml
projects/crashout/scripts/cockpit-smoke.mjs
```

Appropriate staged documentation for that original PR was limited to intentional lane output, such as:

```text
docs/devops/cycle10-cockpit-smoke-ci.md
docs/devops/cycle11-ci-push-verification.md
docs/cto/cycle10-cockpit-smoke-ci-architecture.md
docs/cto/cycle11-ci-push-architecture.md
docs/fullstack/cycle10-cockpit-smoke-ci-implementation.md
docs/fullstack/cycle11-ci-push-code-review.md
docs/qa/cycle10-cockpit-smoke-ci-verification.md
docs/qa/cycle11-ci-push-qa.md
memories/consensus.md
```

Only stage `.gitignore` if the diff adds or preserves ignores for generated state. The current local `.gitignore` diff removes those ignores, so it should not be staged for this work.

## Safe PR Execution If Repeated

Use this only if the team intentionally needs to recreate a protected PR branch. Otherwise, the action is already done.

```bash
git fetch origin
git switch main
git status --short --branch
git branch backup/cycle16-before-pr-retry
```

Create the branch from current remote `main`, not the stale local divergent `main`:

```bash
git switch -c codex/cockpit-smoke-ci-gate origin/main
```

Apply only intentional changes. Do not bulk-add the working tree.

```bash
git status --short
git add <intentional-files-only>
git diff --cached --stat
git diff --cached --check
git commit -m "gate cockpit smoke through protected CI"
git push -u origin codex/cockpit-smoke-ci-gate
```

Open the draft PR:

```bash
gh pr create \
  --repo VDentesano/crashout \
  --draft \
  --base main \
  --head codex/cockpit-smoke-ci-gate \
  --title "Gate cockpit smoke through protected CI" \
  --body "Runs the cockpit smoke gate through the protected Crashout CI path. Required status: Lint, test, build. Expected artifact: cockpit-smoke."
```

Watch checks:

```bash
gh pr checks --repo VDentesano/crashout --watch
```

Find the run and verify artifact:

```bash
gh run list --repo VDentesano/crashout \
  --workflow "Crashout CI" \
  --branch codex/cockpit-smoke-ci-gate \
  --limit 5 \
  --json databaseId,headSha,status,conclusion,displayTitle,createdAt,url
```

Then run the artifact verification commands above.

## Rollback

If the recreated PR branch is wrong:

```bash
gh pr close <pr-number> --repo VDentesano/crashout --comment "Closing unsafe duplicate PR branch; preserving protected main."
git push origin --delete codex/cockpit-smoke-ci-gate
```

If a local branch was created incorrectly:

```bash
git switch main
git branch -D codex/cockpit-smoke-ci-gate
```

If local `main` remains divergent, preserve it until the owner confirms whether to keep `ad16686`:

```bash
git branch backup/cycle16-local-main-ad16686
```

Do not reset, force-push, or delete user work as a rollback shortcut.
