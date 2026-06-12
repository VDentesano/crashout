# Cycle 4 — Deploy + Backend Prep (OAuth-blocked branch)

**Phase:** Building. **Branch taken:** still blocked on browser OAuth
(`wrangler whoami` → not authenticated; no `CLOUDFLARE_API_TOKEN`; no INSFORGE
login) → produce tangible, **verified** prep so launch is one command post-auth.

Did NOT fan out a workflow — single focused codebase task (fullstack-dhh inline).

## Shipped

### 1. Cloudflare Pages — deploy-ready
- `projects/crashout/wrangler.toml` — `name = "crashout"`, `pages_build_output_dir = "dist"`
  (no `compatibility_date` — pure static upload, no Pages Functions).
- `package.json` script: `deploy` = `pnpm build && wrangler pages deploy dist --branch main`.
- `DEPLOY.md` — non-interactive runbook. Key fix vs a naive `wrangler pages deploy`:
  first-time `wrangler pages project create crashout --production-branch main`
  (bare deploy on a non-existent project prompts interactively). Production
  branch = `main` (PR base), independent of local working branch.

### 2. INSFORGE backend — authored, ready to apply
- `backend/migrations/20260611120000_events.sql` — gate source of truth. Columns
  `name, player_id, session_id, arm, ts (bigint epoch ms), props (jsonb)` +
  `id`/`created_at`; `arm` CHECK ∈ (banked, drop-lowest); indexes on `name`,
  `(player_id, created_at)`, `arm` for the gate read paths.
- `backend/migrations/20260611120100_ghost_runs.sql` — shared async-opponent
  pool (`handle`, `intents` jsonb, `created_at`).
- `backend/functions/events/index.ts` — Deno edge function, **public keyless
  ingest**. Handles CORS preflight, accepts the single camelCase `TrackedEvent`,
  inserts via PostgREST (`POST /api/database/records/events`, array body, Bearer
  service key from env, `Prefer: return=minimal`). Never echoes upstream errors
  to the caller.
- `backend/functions/events/eventRow.ts` — **the one silent-failure seam**,
  extracted as a pure function: camelCase wire object → snake_case PostgREST
  array. Explicit construction (no pass-through), validates name allow-list /
  arm / ts / props, single source of truth for column names.
- `backend/README.md` — post-login apply runbook + the camelCase→snake_case
  contract + gate SQL.

## Verification (this is the point — prep that first runs at unblock time is untested prep)
- `node backend/functions/events/eventRow.test.ts` → **ALL PASS** (17 checks:
  wire-shape mapping, exactly-6-columns, hostile-input rejection, props default).
- **Migrations executed against a throwaway Postgres 16 (docker)** — not
  inspected, *run*: both tables + indexes created; a snake_case insert matching
  `eventRow` output succeeded; `arm` CHECK rejected a bad value; `ghost_runs`
  accepted a length-5 intents array.
- `pnpm build` clean (~65 kB gzip), `eslint .` clean (backend incl. the Deno
  function), `node src/game/logic.test.ts` still ALL PASS. Frontend untouched.

## Deliberately NOT done (scope discipline)
- **No `ghosts` GET/POST edge function** — speculative, no frontend caller,
  untestable. The `ghost_runs` *table* is the asked-for "pool, ready to apply".
- **No frontend wiring** — the app is verified-playable; rewiring `ghosts.ts` to
  the shared pool or setting `VITE_INSFORGE_EVENTS_URL` is a post-deploy step.
- **No N=3 vs 5 test** — deferred open question; a second experiment dimension
  before the first arm reads is scope creep.

## Runway
This is the **last autonomous prep possible before OAuth.** Deploy + backend are
now one-command-ready and verified. The loop is out of runway until a human runs
`wrangler login` (or sets CF token) and `npx @insforge/cli login`.
