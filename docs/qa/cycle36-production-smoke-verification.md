# Cycle 36 QA Verification — Production Smoke

Model: `gpt-5.5`, reasoning effort: `medium`

## Checks

Run from `projects/crashout`.

| Check | Result |
| --- | --- |
| `pnpm run check` | PASS |
| Initial `pnpm run smoke:production` before deploy | FAIL, live build lacked deterministic E2E hook |
| `pnpm deploy` | PASS |
| Post-deploy `pnpm run smoke:production` | PASS |

## Production Smoke Evidence

Generated local evidence directory:

```text
docs/qa/production-smoke/
```

Summary:

```json
{
  "measurements": 24,
  "matchEnds": 4,
  "overflow": 0,
  "pngs": 16,
  "matchEndRounds": [5, 5, 5, 5]
}
```

The generated screenshots and measurements are ignored by git. The manual
GitHub Actions workflow uploads the same evidence as a retained
`production-smoke` artifact when run after future production uploads.

## Residual Risk

This proves the deployed frontend cockpit path. It does not prove INSFORGE
event, balance, history, or leaderboard persistence. That should be the next
release-evidence gap.
