# Cycle 27 Fullstack Smoke — Cockpit Shell Risks

Simulated teammate: `fullstack-dhh`  
Engine: Codex CLI, model `gpt-5.5`, reasoning effort `medium`

## Scope

Reviewed:

- `projects/crashout/src/App.tsx`
- `projects/crashout/src/App.css`

I did not edit app code. The current code passes `pnpm test` and `pnpm build`, so there is no trivial build-blocking typo to patch.

## Must Fix

### P0 — Keyboard shortcuts act through overlays

`App.tsx:188-195` only special-cases `showHelp`. If history, leaderboard, or the settings sheet is open, Space/Enter still drives the board underneath: cash out while running or advance/start/rematch while not running.

That is the wrong default. An overlay means the user is not playing the live cockpit. Hidden game progression through a modal is not clever; it is a bug.

Fix:

- Derive `const blockingOverlayOpen = showHelp || showHistory || showLeaderboard || showMenu;`.
- In the key handler, close help on Space/Enter as today, but return early for history/leaderboard/settings.
- Keep `Esc` as the overlay close key if adding a small cleanup is acceptable.

Suggested shape:

```tsx
if (showHelp) {
  e.preventDefault();
  closeHelp();
  return;
}
if (showHistory || showLeaderboard || showMenu) return;
```

### P0 — Overlay state is four booleans instead of one mode

`App.tsx:140-144` stores `showGate`, `showMenu`, `showHelp`, `showHistory`, and `showLeaderboard` independently. The nav handlers mostly enforce exclusivity (`App.tsx:160-179`), but the header sheet handlers do not consistently clear sibling overlays (`App.tsx:263-290`). The rendered overlays also share `sheet-backdrop` and nearby z-index layers (`App.tsx:251-309`, `App.tsx:563-566`, `App.css:134-146`, `App.css:852-858`).

This is exactly where cockpit shells get brittle: every new panel needs to remember every other panel. It should be one active overlay, not a handful of flags.

Fix:

- Replace the public UI overlay booleans with `activeOverlay: 'none' | 'menu' | 'help' | 'history' | 'leaderboard'`.
- Keep `showGate` separate only because it is a dev instrument and can reasonably coexist if desired.
- Render only one public overlay from `activeOverlay`.
- Make `Game` set `activeOverlay` to `'none'`.

No Redux, no state machine library. One string is enough.

### P1 — Selected bet can exceed available balance

The cockpit now surfaces `balance` and `bet` in the header, aside, and round console (`App.tsx:232-238`, `App.tsx:356-369`, `App.tsx:524-538`). But the selected `bet` is never clamped when `balance` changes from a loss or server reconciliation (`App.tsx:55-70`, `App.tsx:518-538`). If the player has `bet = 500` and balance reconciles or falls to `100`, the `500` option is disabled, but it can remain selected and `ENTER DUEL · 500` stays enabled.

The match engine does not know about the bet (`useMatch.ts:286-297`), so the next match can start with an unaffordable wager and only settle afterward through the economy clamp. That makes the cockpit lie.

Fix:

- On balance changes while idle, downgrade `bet` to the highest affordable `BET_OPTIONS` value.
- Disable `ENTER DUEL` when `balance < bet`, even if the clamping effect is present.
- Add a tiny economy/UI test for "selected bet above balance cannot start".

### P1 — The overlay backdrop class is overloaded

The same `.sheet-backdrop` class backs the settings sheet and the history/leaderboard dialogs (`App.css:134-141`, `HistoryPanel.tsx:31`, `LeaderboardPanel.tsx:157`). It is transparent and fixed at `z-index: 70`; panels use `z-index: 71`. This happens to work today, but the name now encodes the wrong abstraction and encourages accidental reuse.

Fix:

- Keep settings as `.menu-backdrop`.
- Give history/leaderboard a `.dialog-backdrop` that can become dimmed later without changing menu behavior.
- Keep z-index tokens boring and explicit: flash < panels < onboarding.

### P1 — Responsive layout assumes height that mobile browsers may not give

`.app` uses `height: 100%` plus grid rows with arena as `minmax(0, 1fr)` (`App.css:1-16`). The cockpit adds nav, aside, and round console above/below the arena on mobile (`App.css:1223-1258`). That stacks a lot of fixed-ish content into a 100% height container. If the root height is tied to the visual viewport, shorter phones can squeeze the stage or push the primary CTA below the fold.

Fix:

- Smoke test at 360x640, 390x844, 768x1024, 1024x768, and 1440x900.
- Verify the running `CASH OUT` button remains visible without scrolling.
- If it fails, prefer `min-height: 100dvh` on the app/root path and let the page scroll on small screens. Do not hide the console to save the layout; that is the product.

### P2 — Stale shell naming in sidebar reveal hook

`useSidebarReveal.ts:4-9` still describes `.rail`, while `App.tsx:349` now uses `.game-aside` and `App.css:238-285` styles the new aside. Runtime is fine because the hook animates `el.children`, but stale comments are how future contributors reintroduce the old rail model.

Fix:

- Rename the local variable `railRef` to `asideRef`.
- Update the hook comment from `.rail` to `.game-aside`.

## Build Break Risk

Current build risk is low. `pnpm build` completed successfully:

```text
tsc -b && vite build
✓ built
```

The bigger risk is not TypeScript. It is cockpit state wiring: actions leaking through overlays and UI showing a bet the player cannot afford.

## Verification Run

```bash
pnpm test
pnpm build
```

Both passed from `projects/crashout`.

## Recommendation

Do the simple thing next:

1. Convert public overlays to one `activeOverlay` string.
2. Gate keyboard gameplay controls behind "no blocking overlay open".
3. Clamp or disable unaffordable selected bets.
4. Run the viewport smoke listed above.

No app-wide architecture change is needed. No new UI framework. No global store. This is local cockpit state, so keep it local and make it impossible to represent invalid combinations.
