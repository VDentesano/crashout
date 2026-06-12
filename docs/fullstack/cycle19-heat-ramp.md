# Cycle 19 — Heat Ramp Integration (Milestone 1 #10)

## What Changed

Replaced the two-step CSS heat class system (`.live.warm` at 5x, `.live.hot` at 10x) with
the already-written `useHeatRamp` hook, which maps the live multiplier value to a continuous
volt→gold→amber color ramp on every render frame.

## Files Touched

- `src/App.tsx`
  - Added import: `useHeatRamp` from `./hooks/useHeatRamp`
  - Removed: `const heat = running ? (multiplier >= 10 ? 'hot' : multiplier >= 5 ? 'warm' : '') : ''`
  - Added: `useHeatRamp(tickerRef, multiplier, running)` after `useTickPop` — shares the same ref
  - Removed: `${heat}` interpolation from ticker className (no more stepped class injection)

- `src/App.css`
  - Removed: `.ticker.live.warm` and `.ticker.live.hot` rule blocks (9 lines) — fully superseded
  - Kept intact: `.ticker.live` (volt baseline), `.ticker.idle`, `.ticker.crash`

## Contract Respected

- Hook clears inline `color` and `textShadow` when `active=false`, so `.idle`/`.crash` CSS owns
  color during non-live states — no regression on crash-red or idle styling.
- Color is mapped from value, not tweened over time — no conflict with GSAP game loop.
- Stays active under `prefers-reduced-motion` (color is temperature, not travel).

## Verification

- `pnpm test`: all 24 tests pass (logic, audio-pref, fairness)
- `pnpm build`: clean TypeScript + Vite build, 286 kB JS bundle
- `pnpm deploy`: deployed to https://62f86b33.crashout-euq.pages.dev
