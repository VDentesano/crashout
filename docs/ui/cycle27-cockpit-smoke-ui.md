# Cycle 27 UI Smoke Audit — Cockpit Shell

Simulated teammate: `ui-duarte`
Engine of record: Codex CLI, model `gpt-5.5`, reasoning effort `medium`

## Scope

Audited the current CRASHOUT cockpit shell for deployment fit without editing app code.

Read:

- `projects/crashout/src/App.tsx`
- `projects/crashout/src/App.css`
- `projects/crashout/src/index.css`
- `docs/ui/cycle26-cockpit-shell-ui.md`

Smoke signal: `pnpm build` in `projects/crashout` passes.

## Visual Fit

The shell is directionally deployable and no longer reads as a generic Vite arcade card. Cycle 26's structural move is present: the app has a left command island, a telemetry aside, a central crash instrument, and a round console. The locked CRASHOUT language also holds: void background, scan-grid atmosphere, volt player state, cyan ghost identity, crash red failure, and gold economy.

The strongest visual fit is desktop at `>=1024px`, where `App.css` switches to the intended cockpit grid:

```css
grid-template-columns: 72px 248px minmax(0, 1fr);
grid-template-areas:
  "header header header"
  "nav aside main"
  "nav aside round"
  "footer footer footer";
```

This is the correct deployment identity: command rail, telemetry rail, instrument bay, action console.

## Desktop Risk

Risk level: low.

The desktop shell is the best-fitting viewport. The nav island becomes a real vertical control strip, the aside has enough width for readable telemetry, and the stage keeps the ticker as the primary object. This is the visual target.

Small risk: the header carries four status chips plus the menu button in `App.tsx` lines 218-249. It wraps by design through `.hud-right { flex-wrap: wrap; }`, but on narrower desktop widths around the `1024px` breakpoint it may create a taller header and steal vertical room from the stage. That is acceptable for launch, but should be watched because `body` is locked with `overflow: hidden` in `index.css`.

## Tablet Risk

Risk level: medium.

From `720px` to `1023px`, the app is still a single-column shell with max width `720px`. The round console gets a two-column internal layout, but the larger cockpit structure does not appear until `1024px`. This creates the weakest fit: tablet users get a polished arcade stack, not the full cockpit.

This is not a blocking bug, but it is the main brand-fit compromise. If the product promise is "terminal cockpit", tablet should not feel like a stretched phone. A future pass should consider an intermediate tablet grid, probably:

```css
@media (min-width: 840px) and (max-width: 1023px) {
  .app {
    max-width: 920px;
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-areas:
      "header header"
      "nav main"
      "nav round"
      "aside aside"
      "footer footer";
  }
}
```

## Mobile Risk

Risk level: medium-high.

The mobile layout has good ordering: header, nav, stage, console, aside, footer. The cash-out action stays near the stage, and nav labels are visually hidden below `560px`, which helps preserve button fit.

The main risk is vertical fit. `body` uses `overflow: hidden`, and `.app` uses `height: 100%` with six stacked grid rows. On short mobile screens, the shell can run out of height because header chips, nav, opponent panels, stage, verdict/share state, console, aside, and footer all compete inside one fixed viewport.

The second mobile risk is the aside. At `max-width: 719px`, `.game-aside` becomes two equal columns and hides the rule card. That keeps the page shorter, but each card can be narrow. Labels like "Best cashout" and values like a comma-formatted balance can pinch or collide because `.aside-row` is a single flex row with no wrapping rules.

## Small CSS Must-Fixes

These are small enough to fix before deploy if there is one more CSS-only pass. I did not apply them.

1. Allow the app to scroll on short screens.

Current risk source: `projects/crashout/src/index.css` has `body { overflow: hidden; }`. That makes vertical clipping a real deployment risk.

Suggested CSS:

```css
body {
  overflow-x: hidden;
  overflow-y: auto;
}

@media (min-width: 1024px) and (min-height: 720px) {
  body {
    overflow: hidden;
  }
}
```

2. Collapse the mobile aside to one column on very narrow screens.

Current risk source: `.game-aside` is two columns for every viewport below `719px`.

Suggested CSS:

```css
@media (max-width: 380px) {
  .game-aside {
    grid-template-columns: 1fr;
  }
}
```

3. Protect aside label/value rows from collision.

Current risk source: `.aside-row` uses flex with `justify-content: space-between`, but neither side has truncation or wrap handling.

Suggested CSS:

```css
.aside-row span {
  min-width: 0;
}

.aside-row b {
  flex-shrink: 0;
}
```

4. Reduce header chip pressure on phones.

Current risk source: four chips plus the menu button remain visible on mobile. The code comment says "brand + 2 status chips + a single menu affordance", but the current DOM renders fair/RNG, live/local, balance, and bet.

Suggested CSS-only fallback:

```css
@media (max-width: 430px) {
  .hud-right .chip-gold {
    display: none;
  }
}
```

The more semantically correct future fix is to move balance and bet into the menu or console on phone, but that requires app code.

## Accessibility And Motion

Contrast and semantic color roles are mostly sound. The ghost lead is cyan, not crash red, so danger remains reserved for bust/failure. Touch targets are generally at or above 44px for nav and primary actions.

Reduced motion is respected globally through `@media (prefers-reduced-motion: reduce)`, and the app comments indicate the GSAP effects no-op under reduced motion. That is acceptable for deployment.

One accessibility note for a later pass: the nav island uses symbol glyphs instead of icon components. The buttons have `aria-label`, so this is not a blocker, but the visual language would be more polished with a consistent icon set.

## Deploy Recommendation

Recommendation: deployable with caution.

Ship if the goal is to validate the CRASHOUT loop and the desktop cockpit identity. The build passes, the visual system is distinctive, and the desktop shell fits the Cycle 26 intent.

Do not call it fully smoke-clean for mobile until vertical clipping is addressed. The one must-fix I would prioritize before a public push is changing the fixed `overflow: hidden` behavior so short screens can scroll. The remaining issues are fit polish, not launch blockers.
