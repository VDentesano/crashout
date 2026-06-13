# Cycle 11 Fullstack Code Review - CI Push Readiness

Role simulation: Fullstack (`fullstack-dhh`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Verdict

Ready to commit. I found no blocking developer-experience or code-quality issue in the Playwright smoke changes.

## Findings

- No blocking findings.

## Notes

- `projects/crashout/package.json` keeps the smoke entry point simple: `pnpm run smoke:cockpit` now builds before running `scripts/cockpit-smoke.mjs`, which is a good local default for a production-preview smoke.
- `projects/crashout/pnpm-lock.yaml` matches the package change and only brings in the expected Playwright packages plus optional `fsevents`.
- `projects/crashout/scripts/cockpit-smoke.mjs` is a clear improvement over the previous raw CDP script. It self-starts Vite preview when no URL is supplied, uses a dynamic port, writes deterministic artifacts, and fails on missing core layout or horizontal/top overflow.
- `.github/workflows/crashout-ci.yml` installs Playwright Chromium before running the smoke and uploads the generated cockpit artifacts from the repo-level `docs/qa/cockpit-smoke/` path. The path matches the script default.
- `.gitignore` correctly ignores generated local outputs: `.wrangler/`, `projects/*/.codegraph/`, and `docs/qa/cockpit-smoke/`. Existing untracked generated folders should stay uncommitted.

## Minor Tradeoff

- CI currently runs `pnpm run check`, whose `check` script already builds, and then `pnpm run smoke:cockpit`, which builds again. That costs time but keeps the smoke command robust for local use. I would not block the commit on this.
