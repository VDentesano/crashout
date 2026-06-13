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

Before a production upload, also run the Chromium cockpit smoke locally when
layout or interaction code changed. The script expects a Vite preview server and
a Chromium instance with CDP enabled:

```bash
pnpm preview --host 127.0.0.1 --port 5175
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/crashout-cdp --headless=new
SMOKE_OUT_DIR=../../docs/qa/cockpit-smoke pnpm smoke:cockpit http://127.0.0.1:5175/
```

The cockpit smoke is intentionally not a CI requirement yet: it depends on an
external browser process and creates screenshot artifacts. Promote it once the
project adds a browser-test runner or a managed CI browser setup.

## Wiring the backend (after deploy)

The game runs fully client-side and logs to `localStorage` with **no** backend.
To aggregate the gate across players/days, set the INSFORGE ingest endpoint at
**build time**, then redeploy:

```bash
export VITE_INSFORGE_EVENTS_URL=https://<project>.insforge.dev/functions/events
pnpm deploy
```

See `backend/README.md` for standing up that endpoint.
