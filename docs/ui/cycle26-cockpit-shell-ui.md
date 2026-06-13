# Cycle 26 UI Pass — Cockpit Shell

Simulated teammate: `ui-duarte`
Model: `gpt-5.5`, reasoning effort: `medium`

## Frontend Design Basis

Used `/home/valentinod/.agents/skills/frontend-design/SKILL.md` because `.claude/skills/frontend-design.md` is not present in this repo.

Subject: CRASHOUT play-money crypto duel cockpit.
Single job: make the duel readable and cash-out action unmistakable.

## Design Plan

Keep the locked CRASHOUT palette: void, panel, volt, ghost, crash, gold. The distinguishing move this cycle is structural, not a new look: a left command island and telemetry aside convert the narrow arcade column into a cockpit.

## Layout

Desktop grid:

```text
header header header
nav    aside  main
nav    aside  round
footer footer footer
```

Mobile grid:

```text
header
nav
main
round
aside
footer
```

## Component Direction

- Header: brand plus compact status chips, including balance and current bet.
- Nav island: four square icon controls with labels available to assistive tech.
- Aside: telemetry modules for match info, player readout, and scoring rule.
- Round console: pips/status on the left, bet/action controls on the right.
- Footer: quiet secondary copy only.
