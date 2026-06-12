-- Cycle 20: persistent player identity + play-money balance.
-- player_id is the stable anonymous ID already in localStorage (crashout.playerId).
-- balance is server-authoritative; localStorage is an optimistic cache.

create table if not exists public.players (
  player_id  text        primary key check (char_length(player_id) between 1 and 64),
  balance    integer     not null default 1000 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- Row-level security on; the balance edge function uses the privileged API_KEY
-- (bypasses RLS) so no anon policy is needed — same pattern as `rounds`.
alter table public.players enable row level security;
