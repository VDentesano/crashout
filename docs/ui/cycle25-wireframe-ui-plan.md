# Cycle 25 UI Plan — Wireframe Layout

Simulated teammate: `ui-duarte`
Model: `gpt-5.5`, reasoning effort: `medium`

## Frontend Design Note

The repo path `.claude/skills/frontend-design.md` is missing, so the installed `frontend-design` skill was used from `/home/valentinod/.agents/skills/frontend-design/SKILL.md`.

Design subject: CRASHOUT is a high-stakes play-money crypto duel cockpit. The single job of the interface is to make the current duel readable at a glance while keeping the cash-out action unmistakable.

## Current Visual Strengths

- Strong identity already exists in `index.css`: void background, volt green, crash red, ghost cyan, gold economy accent, Chakra Petch + JetBrains Mono.
- The ticker and curve stage are memorable and should remain the visual center.
- Score panel state colors are useful: volt for you/cashout, cyan for ghost, red for crash.
- Existing GSAP states have purpose and should survive the layout refactor.

## UI Gaps Against Wireframe

- Layout does not use wireframe grid areas. Current desktop grid is `rail/head/stage/ctl`, not `header/nav/aside/main/round/footer`.
- The app maxes at `1120px`, but the wireframe wants a wider cockpit with a 70px nav island and 240px info aside.
- Round progress is visually separated from the action. The user should read pips/status and click the next action in one scan.
- Header chips are useful but incomplete: header lacks visible bet and streak/readiness state from the wireframe.
- Nav uses emoji inside a hidden sheet, not a persistent icon rail. Replace emoji-first visible UI with concise icon buttons when an icon library is available; otherwise keep textless accessible buttons with labels.

## Recommended Token Direction

Keep existing tokens. Do not introduce a new palette.

- `--bg`, `--panel`, `--surface-hi`: cockpit surfaces.
- `--volt`: user/live/cashout action.
- `--ghost`: opponent identity.
- `--crash`: bust/loss only.
- `--gold`: balance, bet, reward.
- `--accent`: rare highlight only, not dominant.

Signature element: the central stage remains a "crash instrument" with the ticker floating above the curve. The new risk is structural: a persistent left nav island and side telemetry panel make it feel like a playable cockpit instead of a landing-page arcade card.

## Desktop Layout Specification

Use named grid areas:

```css
.app {
  min-height: 100%;
  max-width: 1220px;
  grid-template-columns: 72px 248px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  grid-template-areas:
    "header header header"
    "nav aside main"
    "nav aside round"
    "footer footer footer";
}
```

Component treatments:

- Header: restrained, one line, brand left, chips right. Allow wrapping only below tablet.
- Nav island: vertical floating control, 44px touch targets, active left edge or glow, accessible labels.
- Aside: two to three compact telemetry modules, not nested cards inside cards.
- Main: opponent panels, stage, verdict. Stage should own the largest vertical allocation.
- Round row: full-width action console with pips/status left and CTA/bet right.
- Footer: one quiet text row, no primary CTA.

## Responsive Plan

- `>=1024px`: exact cockpit grid.
- `720px-1023px`: header, main, round, aside, nav as horizontal tab strip.
- `<720px`: stack header, nav tabs, main, round, aside, footer. Keep action sticky enough to remain visible without covering the stage.

## Accessibility Risks

- Header chip text can overflow on small screens; use compact labels and allow wrapping.
- Icon nav needs `aria-label`, visible focus, and active state.
- Red cannot mean opponent; keep red reserved for bust/loss.
- Ticker font-size must not scale solely by viewport width. Current `clamp()` is acceptable but should be bounded inside the stage.
