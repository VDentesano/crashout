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
pnpm deploy          # = pnpm build && wrangler pages deploy dist --branch main
```

`wrangler.toml` pins `name = "crashout"` and `pages_build_output_dir = "dist"`,
so the bare `wrangler pages deploy` also works. After it prints the
`*.pages.dev` URL, open it and play one full match + rematch to confirm the
live build matches the local Playwright smoke test.

## Wiring the backend (after deploy)

The game runs fully client-side and logs to `localStorage` with **no** backend.
To aggregate the gate across players/days, set the INSFORGE ingest endpoint at
**build time**, then redeploy:

```bash
export VITE_INSFORGE_EVENTS_URL=https://<project>.insforge.dev/functions/events
pnpm deploy
```

See `backend/README.md` for standing up that endpoint.
