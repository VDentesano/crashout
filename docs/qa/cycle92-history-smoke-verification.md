# Cycle 92 QA Verification Plan: History Persistence

## Risk

The UI can show match history only if the backend can write completed matches and read them back for the same player. A silent failure here would make the history panel look empty or stale even though matches completed successfully.

## Automated Checking Added

Run from `projects/crashout`:

```bash
node --check scripts/insforge-persistence-smoke.mjs
pnpm exec eslint scripts/insforge-persistence-smoke.mjs
pnpm run smoke:insforge
pnpm run check
```

Expected live smoke result:

- `/rounds` start returns two committed rows without `serverSeed`.
- `/rounds` reveal returns seeds matching the committed hashes.
- `/history` record returns `201` twice.
- `/history` list returns both synthetic rows and aggregate stats.

## Residual Risk

The smoke appends production synthetic rows and does not clean them up because the public history function has no delete action. Keep it manual until backend branch or cleanup support exists.
