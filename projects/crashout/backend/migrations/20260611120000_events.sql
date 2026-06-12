-- events — the gate's source of truth. One row per TrackedEvent (logger.ts).
-- The atomic unit is the MATCH; gate queries read `match_result` / `rematch`
-- rows, sliced by `arm`, keyed on `player_id` for D1 retention.
create table if not exists public.events (
  id          bigint primary key generated always as identity,
  name        text        not null,
  player_id   text        not null,
  session_id  text        not null,
  arm         text        not null check (arm in ('banked', 'drop-lowest')),
  ts          bigint      not null,                         -- client epoch ms
  props       jsonb       not null default '{}'::jsonb,     -- outcome, prevOutcome, scores…
  created_at  timestamptz not null default now()            -- server receive time
);

-- Gate read paths:
create index if not exists events_name_idx           on public.events (name);
create index if not exists events_player_created_idx  on public.events (player_id, created_at);
create index if not exists events_arm_idx             on public.events (arm);
