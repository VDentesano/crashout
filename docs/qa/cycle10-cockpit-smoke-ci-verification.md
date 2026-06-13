# Cycle 10 QA Output — Cockpit Smoke CI Verification

Role simulation: QA (`qa-bach`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Quality Gate
- The smoke verifies desktop, tablet, mobile, and short-mobile viewport profiles.
- States covered: idle, history tab, settings tab, running round, and round end.
- Blocking assertions:
  - core cockpit elements exist in idle state,
  - screenshots are non-trivial image artifacts,
  - no inspected button/panel/chip/verdict is clipped off the left/right edge or above the viewport.

## Deliberate Scope
- Full match completion was removed from the CI smoke because it made the gate slow and probabilistic without dedicated test hooks.
- Vertical scrolling below the fold is recorded in measurements but is not treated as clipping failure.

## Verification
- `pnpm run check` passed.
- `pnpm run smoke:cockpit` passed.
- Latest local smoke produced zero clipping failures across 20 measured states.
