# Cycle 9 Fullstack — Release Publishing Implementation

Model: `gpt-5.5`, reasoning effort: `medium`

## Implementation Scope

- Keep existing CRASHOUT app changes intact: cockpit layout, challenge link growth copy, leaderboard loading fix, audio hook cleanup, heat ramp dependency fix, and cockpit smoke script.
- Keep release tooling: `pnpm check`, `pnpm release:ready`, `.github/workflows/crashout-ci.yml`, and deploy documentation.
- Add ignore coverage for generated local release artifacts.

## Files To Publish

- `.github/workflows/crashout-ci.yml`
- `.gitignore`
- Auto Company runtime files used by the loop
- `docs/**` release/team outputs
- `memories/consensus.md`
- `projects/crashout/**` source, scripts, README, package metadata, and deploy docs

## Files To Exclude

- `.wrangler/`
- `projects/crashout/.codegraph/`
- logs and local runtime state files already ignored by root rules
