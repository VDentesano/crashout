-- Cycle 21: match history per player.
-- Each row is one completed match (best-of-5 duel).

create table if not exists public.matches (
  id                 uuid        primary key default gen_random_uuid(),
  player_id          text        not null check (char_length(player_id) between 1 and 64),
  bet                integer     not null check (bet in (50, 100, 250, 500)),
  outcome            text        not null check (outcome in ('win', 'loss', 'draw')),
  crash_point        numeric(10, 4) not null check (crash_point >= 1),
  cashout_multiplier numeric(10, 4) check (cashout_multiplier is null or cashout_multiplier >= 1),
  delta              integer     not null,
  created_at         timestamptz not null default now()
);

create index if not exists matches_player_created
  on public.matches (player_id, created_at desc);

-- RLS on; the history edge function uses the privileged API_KEY (bypasses RLS).
alter table public.matches enable row level security;
