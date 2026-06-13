# Cycle 9 DevOps — Release Publishing

Model: `gpt-5.5`, reasoning effort: `medium`

## Infrastructure State

- GitHub CLI is installed and authenticated as `VDentesano`.
- `origin` points to `git@github.com:VDentesano/crashout.git`.
- Local branch is `main`.
- Remote repository `VDentesano/crashout` is public and still defaults to `master`.
- Cloudflare Pages production branch remains `main`.
- CI workflow exists at `.github/workflows/crashout-ci.yml` and runs `pnpm run check` from `projects/crashout`.

## Publishing Plan

1. Exclude local tool artifacts from source control: `.wrangler/` and `projects/*/.codegraph/`.
2. Commit the release source on local `main`.
3. Push `main` to `origin`.
4. Switch GitHub default branch from `master` to `main`.
5. Run `pnpm release:ready`.
6. Configure branch protection for `main` requiring `Crashout CI / Lint, test, build` after GitHub has a successful check run to select.

## Risk

- Branch protection can fail if the required status context does not exist yet on GitHub.
- Pushing directly to `main` is acceptable for this bootstrap release because the remote currently contains only a placeholder branch.

## Rollback

- If push succeeds but default-branch change fails, keep `main` on the remote and rerun `gh repo edit VDentesano/crashout --default-branch main`.
- If CI fails, fix forward on `main` before enabling branch protection.
