# Cycle 10 CTO Output — Cockpit Smoke CI Architecture

Role simulation: CTO (`cto-vogels`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Decision
- Promote cockpit visual smoke from a manual script to a required CI gate inside the existing protected check context.
- Use Playwright because it owns browser lifecycle and gives stable CI installation behavior.

## Architecture Notes
- The smoke runner remains a script instead of a broad E2E suite.
- CI blast radius is contained: one added browser install, one browser smoke command, one uploaded artifact directory.
- The release branch protection does not need a new required status context because the existing `Lint, test, build` job now includes the smoke gate.

## Follow-Up
- If gameplay-level E2E becomes necessary, add deterministic test hooks for match completion before making full-match assertions required.
