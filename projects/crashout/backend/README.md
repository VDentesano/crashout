# Backend — INSFORGE (✅ APPLIED & LIVE — Cycle 5)

**Status: LIVE.** Project `crashout` (`ca28ad6d-…`, appkey `2zzc6u78`, region `us-east`)
created; both migrations applied; the `events` edge function deployed and
verified end-to-end (curl from outside → 202 → row persisted with correct
snake_case mapping; bad input rejected 400). Frontend deployed to
`https://2zzc6u78.insforge.site` with the ingest URL baked into the live bundle.

- Public ingest endpoint: `https://2zzc6u78.functions.insforge.app/events`
- Dashboard: https://insforge.dev/dashboard/project/ca28ad6d-4b64-4513-81ac-8f7a11a575c8

Two deploy-time facts the original runbook didn't capture:
1. **Migration filenames** — the CLI rejects underscores in the *name* part
   (`<ts>_<name>.sql`, name must be hyphenated). `ghost_runs` → `ghost-runs`.
2. **Functions deploy ONE file** (no relative-import bundling), so the tested
   `eventRow.ts` seam is inlined verbatim into `events.bundled.ts` (the deploy
   artifact). Source of truth + test stay in `eventRow.ts`; keep them in sync.
   The deployed fn inserts via the InsForge SDK using the auto-injected reserved
   env `INSFORGE_BASE_URL` + `API_KEY` (privileged, bypasses RLS) — no manual
   secret-setting needed (supersedes the `INSFORGE_API_BASE_URL`/`SERVICE_KEY`
   names in the original draft below).

---

## Original runbook (kept for reference)

The gate can only aggregate across players/days with a real backend. Everything
here was authored ready-to-apply; applied in Cycle 5 via the steps below.

```
backend/
  migrations/
    20260611120000_events.sql       # gate source of truth
    20260611120100_ghost_runs.sql   # shared async-opponent pool
  functions/
    events/
      eventRow.ts        # pure camelCase→snake_case mapping (the tested seam)
      eventRow.test.ts   # node backend/functions/events/eventRow.test.ts
      index.ts           # Deno edge function: public keyless ingest
```

## Apply (human, after login)

```bash
npx @insforge/cli login
npx @insforge/cli link --project-id <your-project-id>

# 1. Schema — copy the two files into the CLI's migrations/ dir, then:
npx @insforge/cli db migrations up --all
npx @insforge/cli db migrations list          # confirm both applied

# 2. Edge function — deploy functions/events (handler = export default async (request)).
#    Set its secrets so it can insert with a privileged key:
#      INSFORGE_API_BASE_URL = https://<project>.insforge.dev
#      INSFORGE_SERVICE_KEY  = <service/insert-capable key>
#    Public URL becomes: https://<project>.insforge.dev/functions/events
```

> The migration filenames use this repo's convention (`<ts>_<name>.sql`). If
> `db migrations new` generates its own timestamped file, paste the SQL body in.

## Point the game at it

The frontend already POSTs each event to `VITE_INSFORGE_EVENTS_URL` and silently
no-ops when unset (see `src/analytics/logger.ts`). Set it at **build time** and
redeploy (see `../DEPLOY.md`):

```bash
export VITE_INSFORGE_EVENTS_URL=https://<project>.insforge.dev/functions/events
pnpm deploy
```

## Contract (the one thing that silently breaks)

- Browser posts **one** object: `{ name, playerId, sessionId, arm, ts, props }` (camelCase, no auth header).
- PostgREST wants an **array** of **snake_case** rows.
- `eventRow.ts` is the sole mapping point, pinned by `eventRow.test.ts`. If the
  `events` columns ever change, change them in BOTH the migration and
  `eventRow.ts`, and the test will catch drift.

## Gate queries (run against the live DB once data flows)

```sql
-- A1 post-(match)-loss rematch rate, per arm (make-or-break, ≥35%):
select arm,
       count(*) filter (where name='rematch' and props->>'prevOutcome'='loss')::float
       / nullif(count(*) filter (where name='match_result' and props->>'outcome'='loss'),0) as post_loss_rematch
from public.events group by arm;

-- B  D1 retention: players whose first day and next calendar day both have events.
```

## Not done here (deliberate, post-deploy)

- **Frontend wiring of `ghost_runs`** — the table is provisioned, but `ghosts.ts`
  still reads/writes localStorage. Swapping to the shared pool touches verified
  frontend code; do it after the build is live so the smoke-tested path is
  preserved. (No `ghosts` edge function was written — speculative until there's a
  caller; the table is the asked-for "pool, ready to apply.")
