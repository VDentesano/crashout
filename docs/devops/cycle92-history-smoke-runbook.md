# Cycle 92 DevOps Runbook: INSFORGE History Smoke

## Command

```bash
cd projects/crashout
pnpm run smoke:insforge
```

The command defaults to:

```text
https://2zzc6u78.functions.insforge.app/events
```

It derives:

```text
https://2zzc6u78.functions.insforge.app/rounds
https://2zzc6u78.functions.insforge.app/history
```

## Evidence

Local evidence is written to:

```text
docs/qa/insforge-persistence-smoke/summary.json
```

The manual GitHub Actions workflow uploads the same directory as the `insforge-persistence-smoke` artifact.

## Rollback

If the smoke is flaky or the history endpoint changes, revert the script extension and keep the existing `/rounds` checks. No infrastructure rollback is required because this cycle does not deploy backend code.
