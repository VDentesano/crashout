-- rounds — server-authoritative seed commit/reveal (Issue 3, "provably fair").
-- The `rounds` edge function generates serverSeeds SERVER-SIDE, stores them here,
-- and returns only server_seed_hash + crash_point at match start (seed withheld);
-- it reveals server_seed afterward for client verification.
--
-- RLS is ENABLED with NO anon policy on purpose: server_seed must never be
-- readable via PostgREST. Only the `rounds` function (privileged API_KEY, which
-- bypasses RLS) can read/write — so the seed is reachable solely through the
-- controlled reveal path, never leaked during a live round.
create table if not exists public.rounds (
  round_token      uuid        primary key default gen_random_uuid(),
  match_token      uuid        not null,                  -- one match = N rounds
  player_id        text        not null,
  nonce            integer     not null,                  -- 1..N within the match
  client_seed      text        not null,
  server_seed      text        not null,                  -- WITHHELD until reveal
  server_seed_hash text        not null,                  -- committed, returned at start
  crash_point      numeric     not null,                  -- returned at start (client animates)
  created_at       timestamptz not null default now()     -- commit time (the audit anchor)
);

create index if not exists rounds_match_idx on public.rounds (match_token);

alter table public.rounds enable row level security;
-- (intentionally NO policies: anon is denied; the privileged function bypasses RLS)
