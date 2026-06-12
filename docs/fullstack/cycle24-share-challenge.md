# Cycle 24 — Share-Your-Cashout Challenge Links

## What was built

Minimal viral loop: a player who cashes out can share a challenge link in one click. Anyone opening that link sees a banner naming the target multiplier.

## Files changed

- `src/components/ShareChallenge.tsx` — new. Button shown after a round/match resolves when the player cashed out (not busted). One-click clipboard copy.
- `src/components/ChallengeBanner.tsx` — new. Slim banner shown on load when `?c=<multiplier>` is present in the URL. Dismissable.
- `src/App.tsx` — import both components; read `?c=` param on mount (validated: 1–1000); render `<ChallengeBanner>` at top of app (dismissable); render `<ShareChallenge>` in the arena below the verdict when `!lastBust && state.playerCashed !== null`.
- `src/analytics/logger.ts` — `trackVisit()` now captures `challenge_multiplier: params.get('c')` alongside existing UTM params.
- `src/App.css` — added `.share-challenge`, `.challenge-banner`, `.challenge-text`, `.challenge-dismiss` using existing design tokens (volt/ghost palette, `--font-display`, `--font-mono`, `rise` animation).

## Link format

```
https://crashout-euq.pages.dev/?c=4.32
```

Share text copied to clipboard:

```
I cashed out at 4.32× on CRASHOUT — beat me: https://crashout-euq.pages.dev/?c=4.32
```

## Analytics

The `visit` event now carries `challenge_multiplier` — enables a future funnel query:
`visit with challenge_multiplier` → `play_start` → `cashout` to measure conversion from challenged visitors.

## Constraints respected

- No new backend tables or edge functions.
- No auth changes.
- Frontend-only.
- Design matches existing visual identity (volt glow for share, cyan/ghost palette for banner — mirrors the ghost opponent identity already in the system).
