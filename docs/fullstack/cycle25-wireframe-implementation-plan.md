# Cycle 25 Fullstack Plan — Implementation Sequence

Simulated teammate: `fullstack-dhh`
Model: `gpt-5.5`, reasoning effort: `medium`

## Decision

Next cycle should code the wireframe shell directly. No more discussion needed. Keep the game mechanics untouched.

## Files To Touch

- `projects/crashout/src/App.tsx`
- `projects/crashout/src/App.css`
- optionally `projects/crashout/src/components/*` if extracting layout components becomes cleaner

No backend files. No INSFORGE changes.

## Concrete Refactor

1. Change root layout from:

```tsx
<div className="app">
  <header className="hud" />
  <aside className="rail" />
  <main className="arena" />
  <footer className="controls" />
</div>
```

to:

```tsx
<div className="app">
  <header className="hud app-header" />
  <nav className="nav-island" />
  <aside className="game-aside" />
  <main className="arena" />
  <section className="round-console" />
  <footer className="app-footer" />
</div>
```

2. Move ladder pips and match status into `round-console`.
3. Move all primary controls from `.controls` into `round-console`.
4. Replace `.rail` with `game-aside` cards:
   - Match Info: round, bet, scoring arm.
   - Player Stats: balance, best, net, or placeholders.
5. Add `nav-island` buttons:
   - Game: closes overlays.
   - Leaderboard: `setShowLeaderboard(true)`.
   - History: `setShowHistory(true)`.
   - Settings/help: `setShowMenu(true)` or `setShowHelp(true)`.
6. Keep challenge banner at top of app flow, but ensure it does not break grid layout.

## Do Not Do

- Do not rewrite `useMatch`.
- Do not change scoring rules.
- Do not add React Router.
- Do not create new backend tables.
- Do not replace the visual identity.

## Implementation Order

1. CSS grid scaffolding first.
2. JSX movement second.
3. Nav island behavior third.
4. Responsive fixes fourth.
5. Only then extract components if `App.tsx` becomes unreadable.

## Verification

Run from `projects/crashout`:

```bash
pnpm test
pnpm build
```

Manual smoke:

- Desktop: `1440x900`
- Tablet: `900x900`
- Mobile: `390x844`

Core actions:

- Enter duel.
- Cash out.
- Advance next round.
- Finish match.
- Open/close history and leaderboard from nav.
- Open challenge URL `/?c=4.32`.
