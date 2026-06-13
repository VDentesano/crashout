# Cycle 36 DevOps Runbook — Production Smoke

Model: `gpt-5.5`, reasoning effort: `medium`

## Infrastructure State

- Repository: `VDentesano/crashout`
- Production host: Cloudflare Pages project `crashout`
- Canonical live URL: `https://crashout-euq.pages.dev/`
- Protected PR gate: `Crashout CI / Lint, test, build`

## Actions Taken

1. Verified PR #7 was non-draft, clean, and green.
2. Squash-merged PR #7 and deleted the head branch.
3. Fast-forwarded the clean Cycle 35 worktree to `origin/main`.
4. Added `pnpm run smoke:production`.
5. Added manual GitHub Actions workflow `Crashout Production Smoke`.
6. Fixed the shared cockpit smoke readiness probe so HTTPS URLs work.
7. Deployed production with:

```bash
pnpm deploy
```

Wrangler returned deployment:

```text
https://44e5de4f.crashout-euq.pages.dev
```

8. Verified the canonical URL with:

```bash
pnpm run smoke:production
```

## Rollback

If the production smoke fails after a deploy, use the Cloudflare Pages dashboard
to roll back to the previous known-good deployment, then rerun:

```bash
pnpm run smoke:production
```

## Operational Note

The production smoke workflow is manual because this repo still uses direct
Pages uploads. Running it automatically on every push would test whichever
deployment is live, not necessarily the pushed commit.
