# Cycle 36 Full-stack Implementation — Production Smoke

Model: `gpt-5.5`, reasoning effort: `medium`

## Changed Files

- `.github/workflows/crashout-production-smoke.yml`
- `.gitignore`
- `projects/crashout/DEPLOY.md`
- `projects/crashout/package.json`
- `projects/crashout/scripts/cockpit-smoke.mjs`
- `projects/crashout/scripts/production-smoke.mjs`

## Implementation

`scripts/production-smoke.mjs` is a thin wrapper around the existing cockpit
smoke. It sets:

- `SMOKE_BASE_URL` to `CRASHOUT_PRODUCTION_URL` or
  `https://crashout-euq.pages.dev/`
- `SMOKE_OUT_DIR` to `docs/qa/production-smoke/`

The shared cockpit smoke runner now supports HTTPS in its readiness probe by
selecting `node:https` for `https:` URLs and `node:http` for local previews.

## Why This Shape

No second browser test was added. The production check reuses the exact same
deterministic match driver that protects PRs, which keeps the release evidence
consistent across local, CI, and live URL checks.
