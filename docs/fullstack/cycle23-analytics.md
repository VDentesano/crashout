# Cycle 23 — Visits→Plays Funnel Analytics

**Status: LIVE** — deployed 2026-06-12.

## Events schema

Three new event names added to the existing `events` table (no migration needed — the `name` column is an unconstrained `text`; validation lives in the edge function):

| name | fires when | key props |
|---|---|---|
| `visit` | first page load per session (main.tsx, before React render) | `referrer`, `utm_source`, `utm_medium`, `utm_campaign` |
| `play_start` | player starts a new match (`enterMatch` in useMatch.ts) | `matchToken` |
| `play_cashout` | player cashes out a round | `multiplier`, `matchRound` |

All events share the common envelope: `playerId`, `sessionId`, `arm`, `ts`.

`visit` fires once per page load via `trackVisit()` in `src/analytics/logger.ts`, which is guarded by a module-level flag to prevent duplicate fires.

## How to query the funnel

### Option A — stats endpoint (simplest)

```bash
curl "https://2zzc6u78.functions.insforge.app/events?action=stats"
```

Returns last 14 days, unique sessions per day:

```json
{
  "ok": true,
  "funnel": [
    { "day": "2026-06-12", "visits": 1, "plays": 1, "cashouts": 1 }
  ]
}
```

Conversion = `plays / visits` and `cashouts / plays` per day.

### Option B — direct SQL (via INSFORGE dashboard query editor)

```sql
-- Daily funnel: visits → plays → cashouts (unique sessions)
select
  date_trunc('day', created_at) as day,
  count(distinct session_id) filter (where name = 'visit')        as visits,
  count(distinct session_id) filter (where name = 'play_start')   as plays,
  count(distinct session_id) filter (where name = 'play_cashout') as cashouts
from public.events
where name in ('visit', 'play_start', 'play_cashout')
  and created_at >= now() - interval '14 days'
group by 1
order by 1 desc;
```

```sql
-- Overall conversion rates
select
  round(100.0 * count(*) filter (where name='play_start')   / nullif(count(*) filter (where name='visit'),   0), 1) as visit_to_play_pct,
  round(100.0 * count(*) filter (where name='play_cashout') / nullif(count(*) filter (where name='play_start'),0), 1) as play_to_cashout_pct
from public.events
where name in ('visit', 'play_start', 'play_cashout');
```

## Files changed

- `src/analytics/logger.ts` — added `visit`, `play_start`, `play_cashout` to `EventName`; added `trackVisit()` export
- `src/main.tsx` — calls `trackVisit()` before React root render
- `src/game/useMatch.ts` — fires `play_start` in `enterMatch`, `play_cashout` alongside `cashout`
- `backend/functions/events/eventRow.ts` — new names added to `EVENT_NAMES`
- `backend/functions/events/events.bundled.ts` — same + `GET ?action=stats` handler
- `backend/functions/events/eventRow.test.ts` — 3 new acceptance tests

## Verification (live, 2026-06-12)

```
POST /events {name:"visit",...}        → {"ok":true}  (HTTP 202)
POST /events {name:"play_start",...}   → {"ok":true}  (HTTP 202)
POST /events {name:"play_cashout",...} → {"ok":true}  (HTTP 202)
GET  /events?action=stats              → {"ok":true,"funnel":[{"day":"2026-06-12","visits":1,"plays":1,"cashouts":1}]}
```

All existing tests pass. TypeScript build clean (no errors).
