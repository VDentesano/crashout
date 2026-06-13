# Cycle 17 PR #3 Merge and Local Reconciliation Runbook

Date: 2026-06-13
Repo: `VDentesano/crashout`
Local checkout: `/home/valentinod/Documents/crash-crypto`

## Current Infrastructure State

- App surface: `projects/crashout`, a Vite/React static SPA.
- Deployment target: Cloudflare Pages project `crashout`.
- Cloudflare config: `projects/crashout/wrangler.toml` sets `pages_build_output_dir = "dist"` and does not define Workers, D1, KV, R2, Queues, or Pages Functions.
- Release command in app package: `pnpm run deploy`, which runs `pnpm run check` and then `wrangler pages deploy dist --branch main`.
- CI: `.github/workflows/crashout-ci.yml` runs on PRs and pushes touching `.github/workflows/crashout-ci.yml`, `memories/consensus.md`, or `projects/crashout/**`.
- CI gate: `pnpm install --frozen-lockfile`, `pnpm run check`, Playwright Chromium install, and `pnpm run smoke:cockpit`.
- Main branch protection: strict required status check `Lint, test, build`; admin enforcement enabled; force pushes disabled; branch deletion disabled.

## Current Branch and PR State

- Local branch: `main`.
- Current local commit: `e64717e`, matching `origin/main`.
- Current local tracking state after fetch: `main...origin/main` with no ahead/behind count.
- Previously local-only commit: `ad16686 gate cockpit smoke in CI`, now preserved on local branch `backup/cycle17-divergent-main-ad16686`.
- Recent remote commits now present on local `main`: `50502b0 gate cockpit smoke in CI`, `c21b0a3 record cycle 11 merge verification`, then `e64717e record cycle 16 protected PR evidence`.
- `ad16686` and `50502b0` are similar CI/cockpit-smoke commits with different object IDs; the remaining committed diff between them is in `memories/consensus.md`.
- Working tree is not clean. Current local changes are modified `memories/consensus.md` plus untracked docs/evidence files: `docs/cto/cycle17-merge-architecture.md`, `docs/devops/cycle12-protected-pr-runbook.md`, this runbook, `docs/fullstack/cycle17-source-hygiene.md`, and `docs/qa/cycle12-pr-release-evidence.md`.
- PR #3: `[codex] record cycle 16 protected PR evidence`.
- PR URL: `https://github.com/VDentesano/crashout/pull/3`.
- PR state: marked ready and merged by the coordinator during this cycle at `2026-06-13T09:23:02Z`.
- PR merge commit: `e64717e5a1aee14c12c97a6b3f84272a923fb626`.
- Pre-merge state observed before merge: open draft, `MERGEABLE`, merge state `CLEAN`.
- PR base/head: `main` at `c21b0a3`, head `codex/cycle16-pr-evidence` at `ce40990`.
- PR CI: `Lint, test, build` passed in 1m26s.
- PR diff scope: docs-only plus `memories/consensus.md`; no app, CI, or Cloudflare config changes.

## Merge Command Recommendation

No merge command should be run now. PR #3 has already been merged to `origin/main`.

The recommendation before merge was: do not merge while PR #3 is draft. The merge gate was technically green, but draft state was an explicit process hold.

For recordkeeping, the safe command sequence would have been:

```bash
gh pr ready 3
gh pr checks 3 --watch
gh pr merge 3 --squash --delete-branch
```

Why squash: PR #3 was evidence/documentation work split across two commits. A single squash commit gives the easiest rollback path and keeps `main` readable. Branch protection already blocks force-push shortcuts, so use the PR merge path rather than a local push to `main`.

Expected deploy impact: no Cloudflare Pages deployment by this repository's current automation. PR #3 touched `memories/consensus.md`, so it did trigger the protected GitHub Actions CI path, but this repository does not currently have an automatic Pages deployment workflow on merge.

## Local Main Safety Branch and Reconcile Plan

Risk first: local `main` is no longer diverged by commit, but it is still dirty. Do not run `git reset --hard`, `git clean`, or broad checkout commands from the current checkout until the local working-tree state is preserved.

Recommended preservation step:

```bash
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
git branch "safety/cycle17-local-main-${stamp}" main
git status --short --branch > "docs/devops/cycle17-local-status-${stamp}.txt"
git diff > "docs/devops/cycle17-local-working-tree-${stamp}.patch"
git ls-files --others --exclude-standard > "docs/devops/cycle17-local-untracked-${stamp}.txt"
```

Then reconcile with a clean worktree:

```bash
git fetch origin --prune
git worktree add -b "reconcile/cycle17-origin-main-${stamp}" ../crash-crypto-origin-main origin/main
cd ../crash-crypto-origin-main
gh pr view 3 --json state,isDraft,mergeable,mergeStateStatus,statusCheckRollup
```

Because PR #3 is now merged on GitHub, update the clean worktree branch first:

```bash
git fetch origin --prune
git reset --hard origin/main
```

For the original dirty checkout, prefer one of these two paths:

```bash
# Safest for active collaboration: leave it on the safety branch and continue there.
git switch "safety/cycle17-local-main-${stamp}"

# Only after confirming all local-only work is preserved elsewhere:
git switch main
git fetch origin --prune
git reset --hard origin/main
```

If the preserved `ad16686` contains a consensus edit that should survive, cherry-pick only that intentional delta from `backup/cycle17-divergent-main-ad16686` or the safety branch instead of replaying the whole duplicate commit:

```bash
git diff origin/main backup/cycle17-divergent-main-ad16686 -- memories/consensus.md
git checkout backup/cycle17-divergent-main-ad16686 -- memories/consensus.md
git add memories/consensus.md
git commit -m "reconcile local consensus notes"
```

Do not blindly commit or remove untracked docs/evidence files. They may belong to another agent's cycle work and should be reviewed by their owners.

## Rollback Plan

If PR #3 is squash-merged and needs rollback:

```bash
git fetch origin --prune
git switch main
git pull --ff-only origin main
git revert e64717e5a1aee14c12c97a6b3f84272a923fb626
git push origin main
```

If GitHub creates a merge commit instead of a squash commit:

```bash
git revert -m 1 <merge_commit_sha>
git push origin main
```

Cloudflare rollback: no Pages deployment is expected from PR #3. If a deployment is triggered externally, use the Cloudflare Pages dashboard rollback to the previous successful deployment for project `crashout`, then keep the Git revert above as the source-of-truth rollback.

## Risk Notes

- PR #3 was draft when first audited, then was marked ready and merged by the coordinator during the cycle. Treat `e64717e` as the deployed source-control state.
- The local checkout is not safe for destructive cleanup because it still has uncommitted and untracked work.
- The formerly local-only `ad16686` appears to duplicate a remote commit but is not identical; it is preserved on `backup/cycle17-divergent-main-ad16686`.
- `memories/consensus.md` is modified both locally and in PR #3. Expect conflict or semantic overwrite risk if multiple agents continue editing it without coordination.
- Main protection is doing the right thing: required CI is strict and force pushes are disabled. Keep using PR merges.
- Current CI verifies build and cockpit smoke, but CD is still manual through `pnpm run deploy`; if main merges should publish automatically, add a separate Pages deploy workflow with a smoke test after deploy.
