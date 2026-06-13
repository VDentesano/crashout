# Cycle 26 Fullstack Pass — Implementation

Simulated teammate: `fullstack-dhh`
Model: `gpt-5.5`, reasoning effort: `medium`

## Scope

Touch only:

- `projects/crashout/src/App.tsx`
- `projects/crashout/src/App.css`

No backend work. No INSFORGE change. No match engine change.

## Implementation Notes

- Replace `.rail` with `.nav-island` and `.game-aside`.
- Introduce `.round-console` and move pips, standing, bet selector, primary CTA, hint, and pre-match play-money note into it.
- Keep the header menu as overflow settings.
- Use derived local state for aside stats in this pass.
- Keep existing components and modals.

## Verification

Run:

```bash
pnpm test
pnpm build
```
