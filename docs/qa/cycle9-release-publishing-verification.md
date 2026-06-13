# Cycle 9 QA — Release Publishing Verification

Model: `gpt-5.5`, reasoning effort: `medium`

## Quality Risks

- Mixed worktree could accidentally publish local artifacts or partial automation files.
- GitHub default branch mismatch (`master` vs `main`) blocks deterministic release readiness.
- Branch protection cannot be trusted until CI has run on the remote branch.

## Verification Checklist

- `pnpm run check` from `projects/crashout` must pass before push.
- `pnpm release:ready` should fail before the default-branch switch and pass after it.
- `git status --short` should show no publishable source changes after commit, ignoring local runtime state and logs.
- GitHub repo default branch should be `main`.

## Acceptance

Release publishing is accepted when `main` is pushed, GitHub defaults to `main`, and the readiness gate passes locally.
