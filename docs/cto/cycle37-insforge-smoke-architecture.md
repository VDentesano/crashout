# Cycle 37 CTO Note — INSFORGE Persistence Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Inspected Surface

- `projects/crashout/backend/functions/rounds/index.ts`
- `projects/crashout/src/game/server.ts`
- `projects/crashout/backend/functions/events/events.bundled.ts`
- `projects/crashout/backend/functions/balance/balance.bundled.ts`
- `projects/crashout/backend/functions/history/history.bundled.ts`
- `projects/crashout/backend/functions/leaderboard/leaderboard.bundled.ts`
- `projects/crashout/backend/README.md`

## Architecture Decision

Use `rounds` as the first backend persistence smoke target.

Data flow:

1. POST `/rounds` with `{action:"start", matchToken, playerId, clientSeed, count}`.
2. Assert response contains committed rounds without `serverSeed`.
3. POST `/rounds` with `{action:"reveal", matchToken}`.
4. Assert revealed rows match the committed tokens, nonces, crash points, client seed, and `sha256(serverSeed) === serverSeedHash`.

This tests the exact backend property that matters for the FAIR chip: commit rows are persisted and later revealed unchanged.

## Tradeoffs

- Avoid `balance` and `history` for the first smoke because they mutate user-facing product state and can affect downstream leaderboard/history behavior.
- Avoid `events` as the first public-only smoke because public stats readback is aggregate and cannot prove the exact sentinel row without SQL access.
- `rounds` still writes backend rows, but the rows are inert synthetic matches and do not surface in the product UI.

## Operational Shape

Run locally with `pnpm run smoke:insforge`; run manually in GitHub Actions when backend persistence evidence is needed.
