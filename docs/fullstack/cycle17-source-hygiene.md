# Cycle 17 Source-Control Hygiene Review

## Snapshot

- Date: 2026-06-13
- Branch: `main`
- Tracking state: local `main` is aligned with `origin/main`
- Dirty tracked files:
  - `memories/consensus.md`
- Untracked paths:
  - `docs/cto/cycle17-merge-architecture.md`
  - `docs/devops/cycle12-protected-pr-runbook.md`
  - `docs/devops/cycle17-pr-merge-reconciliation.md`
  - `docs/fullstack/cycle17-source-hygiene.md`
  - `docs/qa/cycle12-pr-release-evidence.md`
  - `docs/qa/cycle17-release-verification.md`
- Ignored local/generated paths still present:
  - `.wrangler/`
  - `docs/qa/cockpit-smoke/`
  - `projects/crashout/.codegraph/`

## Findings

The local checkout is not clean, but the remaining visible untracked state is human-authored documentation plus one tracked project-memory edit. The generated tooling state is present but ignored, which is the right posture.

`.gitignore` is currently clean and includes the needed rules for `.wrangler/`, `projects/*/.codegraph/`, and `docs/qa/cockpit-smoke/`. Keep that posture. It prevents normal development output from looking like source work and reduces the chance of accidentally committing account metadata, generated SQLite indexes, and large smoke screenshots.

`memories/consensus.md` is a tracked project-memory change for Cycle 17. It is not application source. It can be committed if the team wants repository history to carry the cycle state, but it should travel intentionally with the cycle documentation, not mixed into an unrelated app change.

## Commit vs Leave Untracked

Commit, if these are intended team records:

- `docs/devops/cycle12-protected-pr-runbook.md`
- `docs/devops/cycle17-pr-merge-reconciliation.md`
- `docs/cto/cycle17-merge-architecture.md`
- `docs/qa/cycle12-pr-release-evidence.md`
- `docs/qa/cycle17-release-verification.md`
- `docs/fullstack/cycle17-source-hygiene.md`
- `memories/consensus.md`, only if the Cycle 17 consensus update is meant to be part of repo history

Already tracked after the Cycle 16 PR merge; no new action needed:

- `docs/cto/cycle16-release-architecture.md`
- `docs/devops/cycle16-protected-pr-execution.md`
- `docs/fullstack/cycle16-source-diff-review.md`
- `docs/qa/cycle16-pr-ci-evidence.md`

Keep untracked and ignored:

- `.wrangler/`
- `projects/crashout/.codegraph/`
- `docs/qa/cockpit-smoke/`

Do not commit:

- `.wrangler/cache/wrangler-account.json`: local Cloudflare/Wrangler account metadata belongs outside git.
- `projects/crashout/.codegraph/*`: generated code index state. The database files are already ignored by the nested `.codegraph/.gitignore`, but the directory itself should still be ignored at the repo root.
- `docs/qa/cockpit-smoke/*.png` and `docs/qa/cockpit-smoke/measurements.json`: generated smoke evidence. CI artifacts are the right channel for this. The directory is large enough to be annoying and volatile enough to create churn.
- Any `.gitignore` change that removes the current generated-output rules. That would be the wrong call.

## Recommended `.gitignore` Posture

Keep these root ignore rules:

```gitignore
projects/*/.codegraph/
.wrangler/
docs/qa/cockpit-smoke/
```

This is boring and correct. Tool caches, generated screenshots, and machine-local account files do not belong in source control. The repo already tracks durable documentation under `docs/`, so keep human-authored markdown and keep generated run artifacts out.

One caveat: `docs/qa/cycle27-smoke/` is already tracked and contains PNG smoke evidence. Do not use that as the pattern to repeat. For Cycle 17, prefer markdown summaries plus CI-uploaded artifacts.

## Simple Source Edits Needed

No application source edits are needed for Cycle 17 hygiene.

No repository-hygiene edit is needed right now because `.gitignore` already contains the required rules.

## Suggested Commit Shape

Use small, obvious commits:

1. Commit source-control hygiene docs:
   - `docs/fullstack/cycle17-source-hygiene.md`
2. Commit intended Cycle 12 and Cycle 17 evidence docs together, if they are final:
   - `docs/devops/cycle12-protected-pr-runbook.md`
   - `docs/devops/cycle17-pr-merge-reconciliation.md`
   - `docs/cto/cycle17-merge-architecture.md`
   - `docs/qa/cycle12-pr-release-evidence.md`
   - `docs/qa/cycle17-release-verification.md`
3. Leave generated state untracked and ignored:
   - `.wrangler/`
   - `projects/crashout/.codegraph/`
   - `docs/qa/cockpit-smoke/`

Do not commit generated state just because it exists locally. The current branch is aligned with `origin/main`; keep reconciliation boring and commit only intentional docs/memory updates.
