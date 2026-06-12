-- Cycle 22: supporting index for leaderboard GROUP BY aggregation.
-- Covers the WHERE created_at >= now()-interval'7 days' window scan
-- and helps the netDelta / winRate aggregates group by player_id.

create index if not exists matches_leaderboard
  on public.matches (player_id, outcome, delta, created_at);
