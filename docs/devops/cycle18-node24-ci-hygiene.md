# Cycle 18 Node 24 CI Hygiene

Date: 2026-06-13
Repo: `VDentesano/crashout`
Workflow audited: `.github/workflows/crashout-ci.yml`
Scope: audit and recommendation only. This task did not change workflow files.

## Shared Worktree Note

The local checkout is shared and dirty. During this audit, `.github/workflows/crashout-ci.yml` was observed with uncommitted edits that were not made by this task:

- Added `env.FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`.
- Changed `actions/checkout@v4` to `actions/checkout@v6`.
- Changed `actions/setup-node@v4` to `actions/setup-node@v6`.
- Changed `actions/upload-artifact@v4` to `actions/upload-artifact@v7`.

Because the instruction was "Do not change workflow files", this document records the committed baseline posture and the recommended YAML separately. Do not revert another agent's workflow edits from this checkout without coordinator approval.

## Current CI Posture

The committed Crashout workflow already runs the project on Node `24`, but most GitHub-owned JavaScript actions in the committed baseline are still pinned to Node 20-backed major releases.

| Step | Current pin | Current action runtime | Node 24 posture | Recommendation |
| --- | --- | --- | --- | --- |
| Checkout | `actions/checkout@v4` | `node20` | Needs migration | `actions/checkout@v6` |
| Setup pnpm | `pnpm/action-setup@v6` | `node24` | Already aligned | Keep `pnpm/action-setup@v6` |
| Setup Node | `actions/setup-node@v4` | `node20` | Needs migration | `actions/setup-node@v6` |
| Upload smoke artifact | `actions/upload-artifact@v4` | `node20` | Needs migration | `actions/upload-artifact@v7` |

The job itself is otherwise simple and healthy:

- Trigger scope is limited to workflow, `memories/consensus.md`, and `projects/crashout/**` changes.
- Single required job: `Lint, test, build`.
- Working directory defaults to `projects/crashout`.
- Package manager is pinned in `projects/crashout/package.json` as `pnpm@11.5.1`.
- Gate sequence is `pnpm install --frozen-lockfile`, `pnpm run check`, Chromium install, then `pnpm run smoke:cockpit`.

## Recommended Exact YAML Changes

Apply these edits in `.github/workflows/crashout-ci.yml` in a dedicated PR if they are not already present on the branch being reviewed. Do not change workflow behavior in the same PR.

```diff
       - name: Checkout
-        uses: actions/checkout@v4
+        uses: actions/checkout@v6

       - name: Setup pnpm
         uses: pnpm/action-setup@v6
         with:
           version: 11.5.1
           cache: true
           cache_dependency_path: projects/crashout/pnpm-lock.yaml
           package_json_file: projects/crashout/package.json

       - name: Setup Node
-        uses: actions/setup-node@v4
+        uses: actions/setup-node@v6
         with:
-          node-version: 24
+          node-version: "24"

       - name: Upload cockpit smoke artifacts
         if: ${{ !cancelled() }}
-        uses: actions/upload-artifact@v4
+        uses: actions/upload-artifact@v7
         with:
           name: cockpit-smoke
           path: docs/qa/cockpit-smoke/
           retention-days: 14
```

Keep `pnpm/action-setup@v6` unchanged. It is already Node 24-backed, and its current cache inputs preserve the existing lockfile-based cache behavior. Do not add `actions/setup-node` package-manager caching in this migration PR; changing the cache owner at the same time makes failures harder to attribute.

Do not rely on `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` as the long-term fix. It is useful as a pressure-test flag, but the durable migration is explicit Node 24-backed action majors. After the action pins are upgraded and green, remove the force flag unless GitHub documents it as required for the target runner fleet.

## Risks

- Node 24-backed JavaScript actions require runners new enough to execute `node24` actions. GitHub-hosted `ubuntu-latest` should be fine; self-hosted runners must be upgraded before this lands.
- `actions/checkout` major upgrades are usually low-risk for this workflow because no custom checkout inputs are used.
- `actions/setup-node` major upgrades are low-risk here because only `node-version` is configured. Keep caching on `pnpm/action-setup` to avoid accidental cache behavior changes.
- `actions/upload-artifact` major upgrades touch the smoke evidence path. The workflow should be considered failed if the gate passes but artifact upload breaks, because that artifact is release evidence.
- The workflow currently builds twice: once inside `pnpm run check`, then again inside `pnpm run smoke:cockpit`. This migration should not optimize that; keep the PR single-purpose.

## Rollback

Fast rollback is reverting only the action pins:

```diff
-        uses: actions/checkout@v6
+        uses: actions/checkout@v4

-        uses: actions/setup-node@v6
+        uses: actions/setup-node@v4

-          node-version: "24"
+          node-version: 24

-        uses: actions/upload-artifact@v7
+        uses: actions/upload-artifact@v4
```

Do not roll back the project runtime from Node `24` unless the app gate itself proves Node `24` is the failure source. The current issue being addressed is the JavaScript action runtime, not the Crashout runtime.

If the migration PR breaks CI after merge:

```bash
git fetch origin --prune
git switch main
git pull --ff-only origin main
git revert <node24-action-migration-merge-sha>
git push origin main
```

If only artifact upload fails and the app gate passed, prefer a small follow-up pin rollback for `actions/upload-artifact` over reverting unrelated source work.

## Release Gate Commands

Run local gates from the app directory before opening the PR:

```bash
cd projects/crashout
pnpm install --frozen-lockfile
pnpm release:ready
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit
```

Run the protected GitHub gate through a PR:

```bash
gh pr create \
  --base main \
  --head <branch-name> \
  --title "chore(ci): migrate actions to Node 24-backed majors" \
  --body "Updates GitHub Actions JavaScript action majors only. Keeps pnpm setup and Crashout gates unchanged."

gh pr checks --watch
```

Inspect the workflow run and smoke artifact:

```bash
gh run list --workflow crashout-ci.yml --limit 5
gh run view <run-id> --log-failed
gh run download <run-id> --name cockpit-smoke --dir /tmp/crashout-cockpit-smoke
find /tmp/crashout-cockpit-smoke -maxdepth 2 -type f | sort
```

Release gate for merge:

```bash
gh pr checks --watch
gh pr merge --squash --delete-branch
```

Do not add Cloudflare Pages deploy automation in this PR. The migration should be boring: action runtime hygiene only, then observe one green protected run before stacking any deploy pipeline work.
