-- ghost_runs — shared async-opponent pool (cross-device, replaces per-device
-- localStorage in ghosts.ts). Each run is one recorded best-of-N match:
-- `intents` is a JSON array of (number | null), length === ROUNDS_PER_MATCH.
-- Frontend wiring is a deliberate post-deploy step (see backend/README.md); the
-- table is provisioned here so it's ready the moment we point the game at it.
create table if not exists public.ghost_runs (
  id          bigint primary key generated always as identity,
  handle      text        not null,                         -- display name
  intents     jsonb       not null,                         -- (number|null)[] length N
  created_at  timestamptz not null default now()
);

create index if not exists ghost_runs_created_idx on public.ghost_runs (created_at desc);
