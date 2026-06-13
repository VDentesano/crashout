# Cycle 8 QA Release Readiness Verification

Role: QA (`model: gpt-5.5`, `model_reasoning_effort: medium`)

## Checks Run

```bash
pnpm release:ready
pnpm run check
```

## Results

- `pnpm run check` passed:
  - ESLint
  - game/audio/fairness/economy/history/leaderboard checks
  - TypeScript build
  - Vite production build
- `pnpm release:ready` intentionally failed because the remote default branch is still `master` while production is `main`.

## Quality Risk

The remaining risk is not product behavior; it is release control. GitHub branch protection cannot be confidently enabled until the protected branch, Cloudflare production branch, and pushed branch all point to `main`.

## Acceptance Criteria For Next Cycle

- `git push -u origin main` succeeds.
- `gh repo edit VDentesano/crashout --default-branch main` succeeds.
- `pnpm release:ready` passes.
- Branch protection requires `Crashout CI / Lint, test, build`.
