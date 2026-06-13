# Cycle 16 Fullstack Source Diff Review — Cockpit Smoke CI Gate

Role: Full Stack Development Agent — DHH  
Scope: pending source diff and repository state before pushing

## Verdict

Do not push the current pending diff as-is.

The cockpit smoke CI gate source is already cohesive in `HEAD`: the workflow runs `pnpm run smoke:cockpit`, installs Playwright Chromium, and uploads the generated smoke output as a CI artifact. The only pending tracked source change now is a `.gitignore` deletion that makes generated/local artifacts visible again. That is not cohesive with the cockpit smoke gate design and creates staging risk without adding behavior.

## Repository State Reviewed

`git status --short` shows:

```text
 M .gitignore
?? .wrangler/
?? docs/cto/cycle16-release-architecture.md
?? docs/devops/cycle12-protected-pr-runbook.md
?? docs/qa/cockpit-smoke/
?? docs/qa/cycle12-pr-release-evidence.md
?? projects/crashout/.codegraph/
```

`git diff --stat` shows only:

```text
.gitignore | 3 ---
```

No staged changes are present.

## Findings

### P1 — `.gitignore` deletion should not be part of this PR

The pending `.gitignore` diff removes these ignores:

```diff
-projects/*/.codegraph/
-.wrangler/
-docs/qa/cockpit-smoke/
```

That change is backwards for this gate. The smoke script writes screenshots and `measurements.json` to `docs/qa/cockpit-smoke` by default, and the GitHub Actions workflow uploads that directory as an artifact. The prior Cycle 10 implementation notes also describe the smoke artifacts as generated CI/local evidence that should stay out of git.

Recommendation: restore those ignore entries before pushing. They protect the repo from local tool caches, Wrangler account cache, and generated smoke screenshots.

### P1 — Generated artifacts should remain unstaged

These untracked paths should remain out of the PR:

```text
.wrangler/cache/wrangler-account.json
projects/crashout/.codegraph/
docs/qa/cockpit-smoke/*.png
docs/qa/cockpit-smoke/measurements.json
```

The `.wrangler` cache may contain local account metadata. `.codegraph` contains local index databases. `docs/qa/cockpit-smoke` contains generated screenshots and measurements that CI already publishes as short-retention artifacts.

The generated cockpit evidence is useful for local review, but committing it would make PRs noisy and stale immediately after the next smoke run.

### P2 — Untracked documentation may be valid but is not part of the source gate

These untracked docs are not source risk for the cockpit smoke gate:

```text
docs/cto/cycle16-release-architecture.md
docs/devops/cycle12-protected-pr-runbook.md
docs/qa/cycle12-pr-release-evidence.md
```

They can be included in a documentation-only commit if intended, but they are not needed to ship or verify the smoke CI source change.

## Cohesion Check

The cockpit smoke gate itself is cohesive as a single PR when it includes the workflow, package/script dependency changes, smoke runner, lockfile, and ignore rules together. In the current working tree, those implementation files are already tracked in `HEAD`; the pending diff only weakens the ignore rules.

As a result, the current pending diff is not a good standalone PR. It does not change CI behavior and only exposes generated files to accidental staging.

## Source Risk Before Push

Low source/runtime risk from the current pending diff because no app, script, workflow, package, or lockfile source is modified.

Operational risk is moderate if pushed: future local smoke runs and Wrangler/CodeGraph usage will pollute `git status`, increasing the chance of committing generated evidence or local cache by mistake.

## Push Guidance

Before pushing:

1. Restore the three removed `.gitignore` entries.
2. Keep `.wrangler/`, `projects/crashout/.codegraph/`, and `docs/qa/cockpit-smoke/` unstaged.
3. Decide separately whether the untracked architecture/release docs belong in this branch.
4. Re-check `git status --short`; for a clean source push, it should not show generated cache or smoke output.

No source code changes are recommended for the cockpit smoke CI gate based on this pending diff review.
