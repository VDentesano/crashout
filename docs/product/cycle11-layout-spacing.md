# Cycle 11 — Layout & Spacing Analysis

**Author:** product-norman (Don Norman)
**Scope:** ANALYSIS ONLY. Owns Issue 1 (compact UI / info hierarchy) and Issue 6 (separate mobile/desktop layout).
**Source of truth:** `projects/crashout/src/App.tsx` (359 LOC), `projects/crashout/src/App.css` (668 LOC). Read in full.

---

## 1. Diagnosis

### The single load-bearing fact

`App.css` contains **zero `@media` queries** across all 668 lines. The `.app` grid is locked to `max-width: 720px` centered (`App.css:5-6`) for every viewport. There is no mobile vs desktop layout — there is *one* layout, and it was tuned for a phone. This makes Issue 6 unambiguously valid: there is nothing to "separate" because desktop adaptation was never built.

Issue 1 ("too compact on mobile AND desktop") must be split by viewport. The two complaints have opposite root causes; treating them as one verdict would lead to the wrong fix.

### Issue 1 — Desktop: VALID

On a wide screen the 720px column is a narrow vertical strip floating in a sea of unused horizontal whitespace. The user's eyes have to travel top-to-bottom through 5 stacked rows while 60%+ of the screen sits empty. This is a real cognitive cost: a duel — two opponents facing off — is rendered as a single vertical list, which fights the mental model. The space exists to show GHOST and YOU side-by-side flanking the action; the layout throws it away.

- `.app { max-width: 720px; margin: 0 auto }` (`App.css:5-6`) — the cause.
- `.opponents { display:flex; justify-content:space-between }` (`App.css:238-242`) — already a horizontal row, but trapped at 720px so the panels sit shoulder-to-shoulder instead of flanking the stage.

### Issue 1 — Mobile: MOSTLY OVERSTATED (on spacing)

The spacing tokens are reasonable, not cramped. Before recommending any bump, the actual values:

- `.app { padding: clamp(12px,3vw,22px); gap: 12px }` (`App.css:7-8`)
- `.panel { padding: 10px 14px }` (`App.css:248`)
- `.arena { gap:10px }`, `.opponents { gap:10px }` (`App.css:235, 241`)

These are healthy touch-friendly values. **The mobile defect is not padding — it is vertical budget.** Too many always-visible rows compete for a short phone screen:

1. `.hud` (brand + 5 chips/buttons)
2. `.ladder` (label + pips + 3-item legend)
3. `.matchinfo` (standing line **+** a full-sentence `.rule` paragraph, `App.tsx:169`)
4. `.opponents` (two panels)
5. `.stage` (the curve — the thing players actually watch, `1fr`)
6. `.verdict`
7. `.controls` (button **+ two** hint paragraphs, `App.tsx:265-274`)

Every secondary text element (the legend labels, the plain-language `.rule` sentence, the second `.hint` line, the `.cryptosoon` line) steals pixels from `.stage`, which is the one element the game is about. The fix is **hierarchy and progressive disclosure**, not larger gaps.

> **Constraint note:** the consensus says the mobile column must NOT regress. Inflating mobile padding would *cause* a regression. We explicitly do not recommend it.

---

## 2. Specific recommendations

### A. Mobile (≤899px) — reclaim vertical budget, do NOT touch spacing

Recommend conservative trims only. Each is reversible and none changes the column structure:

1. **Demote the scoring `.rule` sentence** (`App.tsx:169`). It is a 1–2 line paragraph shown on every screen. Show it inside the onboarding/`?` overlay (already shipped) and on the `idle`/pre-match state only — hide it once `inMatch` is true. The standing line ("YOU LEAD +1.20 · 2 rounds left") already carries the live info; the rule is reference material, not live state.
2. **Drop the `.legend`** ("won / lost / drawn") on mobile (`App.tsx:144-148`). The pip colors are already explained in onboarding; three tiny labels on every frame is redundant once learned. Keep it for first session if cheap, otherwise overlay-only.
3. **Collapse the footer to one hint line.** `.controls` renders both `.hint` and `.cryptosoon` (`App.tsx:265-274`). Keep the contextual `.hint`; move `.cryptosoon` ("crypto coming soon") to the idle screen only — it is a marketing line, not gameplay guidance, and does not belong under a live CASH OUT button.

Net effect: 2–3 text rows reclaimed for `.stage` with **zero spacing-token changes**. Mobile column structure is untouched → no regression.

### B. Desktop (≥900px) — reflow, build last

Add a single media query block. No DOM changes, no new components — re-grid the existing tree:

1. Raise the cap: `@media (min-width:900px) { .app { max-width: 1100px } }`.
2. **Flank the stage with the opponents.** Restructure `.arena` at ≥900px from its 3-row stack into a 3-column grid: `grid-template-columns: minmax(180px, 240px) 1fr minmax(180px, 240px)`, placing GHOST panel left, `.stage` center (taking the freed width), YOU panel right. The `.opponents` flex wrapper can be unwrapped via grid placement or the two `ScorePanel`s repositioned with `grid-column`. This directly converts wasted whitespace into the duel metaphor: two fighters facing across the arena.
3. Let `.matchinfo` + `.ladder` span the top full-width as a status bar above the arena (they already read as a header band).
4. Keep `.controls` full-width-but-capped and centered under the stage column so the primary action stays where the eye already is.

> Build order: ship A (mobile trims) and the breakpoint scaffold first; build B's 3-column flank LAST, because it is the riskiest visual change and is fully gated behind `min-width:900px` — it cannot touch the working mobile view.

---

## 3. Layout strategy decision (Issue 6)

**Decision: RESPONSIVE (one DOM, CSS breakpoints). Reject adaptive (separate components).**

Justification:

- **The source forces it.** `App.tsx` wires all game state once — `useMatch`, `useGameAudio`, scoring, FX flags, the keyboard handler (`App.tsx:25-87`). An adaptive split would duplicate that wiring into a `<MobileApp>` / `<DesktopApp>` pair, doubling the surface for state bugs. That duplication *is* the regression the consensus forbids.
- **Norman principle: reuse, don't reinvent.** Both viewports show the identical conceptual model (duel, ladder, stage, verdict). Same content, same affordances, only the *spatial arrangement* differs. That is the textbook definition of a responsive reflow, not two separate products.
- **Lower risk.** One DOM means one tab order, one set of ARIA semantics, one place to fix a bug. The mobile column stays literally the same nodes — the desktop rules only activate above the breakpoint.

**Breakpoints:** exactly ONE, at `min-width: 900px`.

- Below 900px: current column, untouched (plus the section-2A trims).
- At/above 900px: raise `max-width` to ~1100px and reflow `.arena` to the 3-column flank.
- One breakpoint — not a ladder. 900px is where a tablet/laptop gains enough width to flank panels at a comfortable ~200px each beside a real stage. A second tier can be added later if telemetry shows ultrawide need; do not speculate now.

---

## 4. Estimated scope

| Work | Files | ~Lines | Risk |
|---|---|---|---|
| 2A — mobile trims (conditional render of `.rule`, `.legend`, `.cryptosoon`) | `src/App.tsx` | ~10–15 (wrap 3 elements in existing `inMatch`/`phase` guards) | **Low** — uses state flags that already exist |
| 2B scaffold — breakpoint + `max-width` bump | `src/App.css` | ~5 | **Low** |
| 2B flank — `.arena` 3-col reflow at ≥900px | `src/App.css` (+ maybe 1–2 `grid-column` hints) | ~25–40 inside one `@media` block | **Med** — visual restructure, but fully gated above 900px so mobile cannot regress |

Total: ~2 files, ~40–60 lines, no new components, no state changes. Mobile risk is the only true regression risk and section 2A is designed to avoid it (no spacing changes, only demoting reference text behind existing guards).

---

## 5. Dependencies

- **ui-duarte (color/token work): PARALLEL, no collision.** Duarte touches CSS custom properties (`--volt`, `--panel`, etc.) and visual fills. This work touches grid layout, `max-width`, and `@media` reflow. No shared properties. Either can land first.
- **interaction-cooper (layout transition animation): MUST land AFTER this decision.** Cooper cannot animate the mobile↔desktop transition until both layout states exist. This doc defines the target states and the 900px breakpoint; Cooper's transition is downstream and consumes them. State this ordering explicitly in the cycle plan: **Norman layout → Cooper transition.**
- **Internal ordering:** ship 2A (mobile) + breakpoint scaffold first; ship 2B flank LAST (riskiest, gated).

---

## 6. Before / after sketch

### Mobile (≤899px) — structure unchanged, vertical budget reclaimed

```
BEFORE (every frame)            AFTER (in-match frame)
┌──────────────────────┐       ┌──────────────────────┐
│ CRASHOUT   [chips ▸▸] │       │ CRASHOUT   [chips ▸▸] │
│ R3/5  ▮▮▯▯▯  won/lost…│       │ R3/5  ▮▮▯▯▯           │ ← legend hidden
│ YOU LEAD +1.20 · 2 lft│       │ YOU LEAD +1.20 · 2 lft│
│ "Most points wins —   │       │                       │ ← rule moved to
│  your best 4 of 5…"   │       │                       │   ? overlay / idle
│ ┌GHOST─┐ ┌──YOU──┐    │       │ ┌GHOST─┐ ┌──YOU──┐    │
│ │ 4.20 │ │ 5.40  │    │       │ │ 4.20 │ │ 5.40  │    │
│ ┌──────────────────┐  │       │ ┌──────────────────┐  │
│ │      STAGE       │  │       │ │                  │  │
│ │    2.41×  curve  │  │       │ │      STAGE       │  │ ← taller
│ └──────────────────┘  │       │ │    2.41×  curve  │  │
│ [   CASH OUT 2.41×  ] │       │ └──────────────────┘  │
│ space/tap — cash out… │       │ [   CASH OUT 2.41×  ] │
│ crypto coming soon ▸  │       │ space/tap — cash out… │ ← single hint
└──────────────────────┘       └──────────────────────┘
   spacing tokens IDENTICAL — only secondary text demoted
```

### Desktop (≥900px) — reflow into a duel, whitespace becomes the arena

```
BEFORE (720px island in empty screen)        AFTER (≥900px, max-width 1100px)
┌···········┬──────────┬···········┐         ┌────────────────────────────────────────┐
│  (empty)  │ CRASHOUT │  (empty)  │         │ CRASHOUT      R3/5 ▮▮▯▯▯   chips ▸▸     │
│           │ R3/5 ▮▮▯ │           │         │ YOU LEAD +1.20 · 2 rounds left          │
│           │ YOU LEAD │           │         ├──────────┬──────────────────┬──────────┤
│           │ GHOST│YOU│           │         │  GHOST   │                  │   YOU    │
│           │ ┌STAGE─┐ │           │         │  4.20pts │      STAGE       │  5.40pts │
│           │ │2.41× │ │           │         │  riding… │     2.41×        │ in the   │
│           │ └──────┘ │           │         │          │      curve       │  air     │
│           │ [CASH ↑] │           │         ├──────────┴──────────────────┴──────────┤
│           │ hint…    │           │         │       [      CASH OUT 2.41×       ]    │
└···········┴──────────┴···········┘         └────────────────────────────────────────┘
  ~60% screen wasted, duel reads as a list    opponents FLANK the stage = duel spatially
```

---

## Verdict summary

- **Issue 6 (mobile/desktop separation): VALID and the headline finding** — there are zero media queries; the 720px column is the only layout. Fix with a **responsive** reflow (one DOM, one breakpoint at 900px), never adaptive — the source's single-file state wiring makes duplication the real regression risk.
- **Issue 1 desktop: VALID** — wasted whitespace; flank the stage with the opponent panels to turn empty space into the duel metaphor.
- **Issue 1 mobile: spacing is OVERSTATED** — tokens are fine (`gap:12px`, `panel 10/14`); the real pressure is vertical budget. Fix by demoting reference text (`.rule`, `.legend`, `.cryptosoon`) behind existing state guards. Do NOT add mobile padding — that would regress the working column.
