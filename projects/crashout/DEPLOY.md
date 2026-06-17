# Deploy — Cloudflare Pages

The production bundle is a static SPA (`dist/`). Deploy is one command **once a
human has authenticated** — the autonomous loop cannot complete the browser
OAuth (`wrangler login`).

## One-time auth (human)

```bash
wrangler login                      # browser OAuth — the blocking step
# …or non-interactive, no browser:
export CLOUDFLARE_API_TOKEN=…       # token with "Cloudflare Pages: Edit"
export CLOUDFLARE_ACCOUNT_ID=…
```

## One-time project create (non-interactive)

`wrangler pages deploy` on a project that doesn't exist yet prompts
interactively. Create it first so every later deploy is hands-off:

```bash
wrangler pages project create crashout --production-branch main
```

Production branch is `main` (our PR base), independent of the local working
branch. Deploys flagged `--branch main` become the production deployment; any
other branch is a preview.

## Deploy (repeatable)

```bash
pnpm run check       # lint + unit checks + production build
pnpm deploy          # = pnpm run check && wrangler pages deploy dist --branch main
```

`wrangler.toml` pins `name = "crashout"` and `pages_build_output_dir = "dist"`,
so the bare `wrangler pages deploy` also works. After it prints the
`*.pages.dev` URL, open it and play one full match + rematch to confirm the
live build matches the local Playwright smoke test.

## Release gate

GitHub Actions runs the deterministic release gate on every PR and every push
that touches `projects/crashout/`:

```bash
pnpm run check       # pnpm lint && pnpm test && pnpm build
```

Check the repo wiring before pushing the workflow or enabling branch protection:

```bash
pnpm release:ready
```

The readiness check verifies that `projects/crashout` is being released from a
Git repo with an `origin`, that the local branch matches the Cloudflare Pages
production branch (`main` by default), and that `.github/workflows/crashout-ci.yml`
exists at the repository root. It exits non-zero while any release blocker is
still present.

The GitHub `main` branch is protected with admin enforcement, strict status
checks, and the required `Lint, test, build` check from the `Crashout CI`
workflow before merges.

Before a production upload, also run the Chromium cockpit smoke locally when
layout or interaction code changed:

```bash
pnpm run smoke:cockpit
```

The protected CI gate runs the same deterministic cockpit smoke against the
freshly built `dist/` bundle and uploads the `cockpit-smoke` artifact.

After a production upload, run the production smoke against the live Pages URL:

```bash
pnpm run smoke:production
```

By default this targets `https://crashout-euq.pages.dev/` and writes
`docs/qa/production-smoke/`. Override with either:

```bash
CRASHOUT_PRODUCTION_URL=https://example.pages.dev/ pnpm run smoke:production
pnpm run smoke:production https://example.pages.dev/
```

GitHub Actions also includes a manual `Crashout Production Smoke` workflow. Run
it after direct Cloudflare Pages uploads to preserve production screenshots and
measurements as downloadable `production-smoke` artifacts.

## Backend persistence smoke

After backend function or persistence-path changes, run the INSFORGE smoke:

```bash
pnpm run smoke:insforge
```

By default this targets `https://2zzc6u78.functions.insforge.app/events`, derives
the sibling `/rounds` and `/history` endpoints, creates a synthetic `smoke-*`
player and match, then checks server commit/reveal persistence plus match
history write/read persistence. It verifies committed rows are written with
hidden seeds, read back with matching revealed seed hashes, and that history
records return the persisted rows with aggregate stats.
Override the endpoint with either:

```bash
INSFORGE_EVENTS_URL=https://<project>.functions.insforge.app/events pnpm run smoke:insforge
pnpm run smoke:insforge https://<project>.functions.insforge.app/events
```

Local evidence is written to `docs/qa/insforge-persistence-smoke/`; keep the
durable release evidence in the terminal output or CI artifacts.

## Wiring the backend (after deploy)

The game runs fully client-side and logs to `localStorage` with **no** backend.
To aggregate the gate across players/days, set the INSFORGE ingest endpoint at
**build time**, then redeploy:

```bash
export VITE_INSFORGE_EVENTS_URL=https://<project>.insforge.dev/functions/events
pnpm deploy
```

See `backend/README.md` for standing up that endpoint.
