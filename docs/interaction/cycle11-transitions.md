# Cycle 11 — Round-Transition Choreography

**Issue 2** — "al pasar de ronda estaria bueno que haya alguna animacion."
Author: interaction-cooper (Alan Cooper) · Scope: TEMPORAL handoff between game
states. Standalone dopamine FX & color = ui-duarte's lane; this doc owns only the
*beat* that carries the player from one round into the next.

Primary persona: **Leo, the streak-chaser.** His End Goal is to feel the match
*progress* — to sense "round 2 of 5, I'm up." His complaint is real: right now the
match has no rhythm. It teleports.

---

## 1. Diagnosis — is the complaint valid?

**Valid. Verified against source.** Here is exactly what exists and what is missing.

### What ALREADY animates (do not rebuild these)
- `verdict` block fades up on roundEnd — `rise 0.3s ease-out` (App.css 392).
- `crashword` ("CRASHED @ / CASHED") fades up — `rise 0.3s` (App.css 378).
- Crash shake, redflash, voltflash, win-pop — all fire *within* a round
  (index.css 70–103). These are end-of-round punctuation, already good.
- Current pip pulses while the round is live — `pip-pulse 1.1s infinite`
  (App.css 145–150).
- `MatchVerdict` card + per-round overlays animate in (`card-in`, `overlay-in`).

### The GAP — the handoff itself has ZERO motion
The transition is driven by `advance()` (useMatch.ts 285–296). On a click:
- `roundEnd` → `startRound(i+1)` flips phase to `running` **synchronously**.
- React unmounts the `verdict`/`crashword` block (App.tsx 215–240) and mounts the
  idle/running ticker in the **same frame**. The won verdict does not leave — it
  *vanishes*. There is no exit animation anywhere in the codebase (every keyframe
  is an enter/idle; nothing animates *out*).
- **Pips snap.** When `rounds` grows, the just-played pip jumps win→/loss-color and
  the next pip jumps to `current`. Only a 0.25s `background` tween softens it
  (App.css 130) — there is no fill sweep, no "tick forward" feel.
- **The round number does not announce itself.** The ladder label silently
  re-renders `ROUND 2/5 → ROUND 3/5` (App.tsx 137). No reveal, no acknowledgement
  that a new round began.
- **The ticker resets cold.** It drops from the crash value back toward 1.00× /
  idle with no settle or wipe (App.tsx 211).

Net: the player clicks NEXT ROUND and is *already* in the next round before their
eye can register the boundary. There is no "between." That missing beat is the
entire complaint.

**One thing to preserve:** the current instantaneous response is *honest* — the
button click feels direct. New motion must sit on top of that directness, never
gate it. Cooper's rule: never make the user wait on an animation to act. All
specs below are non-blocking — input stays live throughout.

---

## 2. Animation specs

Trigger model: `advance()` already flips phase. We add a short transient class on
the arena keyed off `state.nonce` (which increments per round — useMatch.ts 233)
so each entry re-fires the animation. No new game state required; CSS + one
className toggle carries all of it.

### T1 — Round handoff wipe (roundEnd → next round) · MUST-HAVE
The signature beat. The arena acknowledges the boundary.
- **Trigger:** phase enters `running` from `roundEnd` (nonce change while a prior
  round exists).
- **Property / motion:** `.stage` (App.tsx 209) scales `0.94 → 1` and the ticker
  opacity goes `0 → 1`. A thin volt sweep line crosses left→right behind it.
- **Duration / easing:** `0.42s` `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-back-ish
  settle — lands with a tiny overshoot, reads as "snap into place").
- **Why:** gives the eye one clean frame of "new round" without delaying input.

### T2 — Round-number reveal · MUST-HAVE
Names the new round so progress is *felt*, not just shown.
- **Trigger:** same as T1, on the `.ladder-label` (App.tsx 136).
- **Property / motion:** new label slides in — `translateX(-10px) → 0`, opacity
  `0 → 1` (reuse existing `step-in`, index.css 115). Optionally a brief scale-pop
  `1 → 1.06 → 1` on the number.
- **Duration / easing:** `0.30s` `ease-out`, started ~`60ms` after T1 so it reads
  as a consequence of the wipe, not simultaneous noise.
- **Why:** "ROUND 3" arriving *as a result of* the wipe is the progression signal
  Leo is missing.

### T3 — Pip tick-forward (ladder fill) · MUST-HAVE
Turns the silent pip snap into a satisfying advance.
- **Trigger:** when a pip changes to `win`/`loss`/`draw`, AND when the next pip
  becomes `current`.
- **Property / motion:** resolved pip does a quick fill-pop — `scaleX(0.6 → 1)`
  from its leading edge + the existing box-shadow glow ramps in over the fill.
  The newly-current pip starts its `pip-pulse` *after* a `~120ms` delay so the
  hand-off reads as sequential: "this one locks → that one wakes up."
- **Duration / easing:** fill `0.35s` `cubic-bezier(0.22,1,0.36,1)`; glow rides the
  same curve. Replaces the flat 0.25s background tween on `.pip` (App.css 130) for
  the *result* state only; idle pips keep the cheap tween.
- **Why:** the ladder is the only persistent progress UI. Making it *tick* is the
  highest-leverage, lowest-risk win.

### T4 — matchEnd → rematch reset · NICE-TO-HAVE
- **Trigger:** `advance()` from `matchEnd` (rematch → enterMatch, useMatch.ts 294).
- **Property / motion:** `MatchVerdict` card fades + lifts out
  (`opacity 1→0, translateY 0→-12px`), then the full ladder of 5 pips resets
  left→right with a `40ms` stagger back to empty, label snaps to "BEST OF 5".
- **Duration / easing:** card-out `0.28s ease-in`; pip-reset stagger total `~0.35s`
  `ease-out`. Ladder reset begins after card-out completes.
- **Why:** a rematch is a *fresh* best-of-5; the ladder clearing left→right makes
  that legible. Lower priority — rematch is rarer than round-advance.

### Audio sync (note only — do NOT modify src/audio/)
The existing audio layer is done. If a future cycle wires it: T1 wipe → a short
"whoosh/transition" cue; T3 pip-lock → a "tick" on the fill landing. These are
natural sync points; flag for devops/fullstack, no audio edits here.

---

## 3. prefers-reduced-motion fallbacks

`index.css 120–124` already nukes *all* animation under reduced-motion. New work
MUST stay inside that guarantee. Per transition:

- **T1 wipe:** no scale, no sweep. Ticker appears via opacity crossfade only
  (`0 → 1`, ≤0.15s) — or instant. No transform.
- **T2 round number:** no slide, no pop. Label changes instantly; rely on the
  existing static contrast to read the new number.
- **T3 pips:** no scaleX fill, no delayed pulse. Keep the current flat 0.25s
  `background` tween (App.css 130) — already reduced-motion-safe and acceptable.
- **T4 rematch:** no card lift, no staggered reset. Card swaps instantly; pips
  reset together in one frame.

Implementation rule: gate every new transform/keyframe behind
`@media (prefers-reduced-motion: no-preference)`, OR ensure the blanket
`* { animation: none !important }` at index.css 121 already covers keyframe-based
ones. Transition-based props (the pip `transition`) are NOT caught by that rule —
so any *transition*-driven motion must be explicitly disabled in the
reduced-motion block. **This is the one real trap.**

---

## 4. Estimated scope

| Item | Files | ~Lines | Risk |
|------|-------|--------|------|
| T1 wipe class + keyframe | App.tsx (1 className on `.stage`), index.css | ~20 | Low |
| T2 round reveal | App.tsx (className on `.ladder-label`), App.css | ~10 | Low |
| T3 pip tick-forward | App.css (`.pip` states + keyframe) | ~25 | Low–Med |
| T4 rematch reset | App.tsx, App.css | ~30 | Med |
| reduced-motion guards | index.css / App.css | ~10 | Low (but mandatory) |

- **No game-logic changes.** `useMatch.ts` is untouched; `state.nonce` already
  gives the per-round re-fire key. This is purely presentational.
- **Main risk:** stage/ticker transform interacting with `CurveCanvas` layout
  (App.tsx 210) — scale the wrapper, not the canvas, to avoid reflow/jank. Keep
  transforms on `transform`/`opacity` only (compositor-friendly, no layout
  thrash).
- T1–T3 are a single small PR. T4 is a separable follow-up.

---

## 5. Dependencies & ordering

- **product-norman (layout):** if Norman repositions the ladder, ticker, or
  verdict block, T1–T3 anchor to those elements — wait for his layout to land, or
  build against current positions and re-anchor. **Resolve layout first.**
- **ui-duarte (FX & color):** clear lane split. Duarte owns *what a win looks like*
  (glow color, particle/flash intensity, palette). This doc owns *when and how the
  state changes hand off in time*. Overlap risk = the volt sweep in T1 and the pip
  glow in T3 — those colors/intensities are Duarte's call; I specify timing &
  motion, she specifies the look. **Coordinate on: sweep color, pip glow ramp.**
- **Build order:** Norman layout → (Cooper timing ∥ Duarte look, in parallel) →
  fullstack implements → qa checks reduced-motion + no input-blocking.

---

## 6. Priority ranking

**MUST-HAVE (ship together, one PR):**
1. **T3 — Pip tick-forward.** Highest leverage / lowest risk. The ladder is the
   permanent progress UI; making it tick *is* the felt-progression fix.
2. **T2 — Round-number reveal.** Cheap, directly answers "what round am I in now."
3. **T1 — Handoff wipe.** The signature beat that creates a "between." Slightly
   higher risk (stage transform) — do after T2/T3 land.

**NICE-TO-HAVE (follow-up):**
4. **T4 — Rematch reset.** Rarer moment; defer.

Guard work (reduced-motion) is **non-negotiable and ships with whatever lands** —
it is not optional and is the only real correctness trap in the set.
