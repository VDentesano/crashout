# Cycle 37 QA Verification — INSFORGE Smoke

Runtime: `gpt-5.5`, `model_reasoning_effort: medium`.

## Risk Targeted

The main backend risk is not "does the frontend build"; it is whether the live INSFORGE function can persist committed rounds and read them back for fairness verification.

## Acceptance Criteria

- `rounds start` returns exactly two committed rounds.
- Each committed round has a token, 64-char server seed hash, valid crash point, and correct nonce.
- Commit response does not include `serverSeed`.
- `rounds reveal` returns the same number of rounds for the same match token.
- Every revealed `serverSeed` hashes to the committed `serverSeedHash`.
- Revealed nonce, client seed, and crash point match the committed response.
- Local evidence is generated but ignored by git.

## Evidence From This Cycle

Live command:

```bash
pnpm run smoke:insforge
```

Result:

- Endpoint: `https://2zzc6u78.functions.insforge.app/rounds`
- Synthetic player: `smoke-cycle37-1781389227249-bcd9d299`
- Status: passed
- Checks: 2 backend calls, with commit and reveal assertions
- Evidence: `docs/qa/insforge-persistence-smoke/summary.json` (ignored locally)

Release gate:

```bash
pnpm run check
```

Result: passed.

## Remaining Risk

This does not verify balance, history, leaderboard aggregation, or event analytics persistence. Those should be separate smokes with either a disposable backend branch or cleanup strategy.
