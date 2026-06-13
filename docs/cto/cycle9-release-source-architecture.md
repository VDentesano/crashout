# Cycle 9 CTO — Release Source Architecture

Model: `gpt-5.5`, reasoning effort: `medium`

## Decision

Keep the outer `crash-crypto` worktree as the source of record for this release.

## Rationale

- The GitHub Actions workflow is already rooted at `.github/workflows/` and scoped to `projects/crashout/**`.
- Cloudflare Pages production is aligned to branch `main`.
- Splitting `projects/crashout` into a standalone repository before the first public source push would add repository surgery without improving the shipped product.

## Constraints

- Local generated folders must stay out of Git: `.wrangler/` and `.codegraph/`.
- The public repo should contain enough operational context to reproduce the deployed app: CI, release readiness script, deploy notes, and product docs.

## Next Architecture Step

After the release branch is protected, decide whether the public repo remains a monorepo-shaped source tree or becomes a split `projects/crashout` repository. Do not split before branch protection is active.
