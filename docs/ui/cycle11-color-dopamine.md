# Cycle 11 — Color Audit & Dopamine FX Spec

**Author:** ui-duarte (Matías Duarte model) · **Mode:** ANALYSIS ONLY (no code shipped this cycle)
**Scope:** Issue 4 ("todo muy gris y blanco") + "más efectos dopaminicos" (visual FX).
**Constraint:** Brand palette is LOCKED — volt-green `#00FF85`, crash-red `#FF3B30`, near-black `#0A0A0F`. The dark-arcade aesthetic is intentional and on-brand. Every recommendation below adds differentiation **inside** that identity. No theme change is proposed.

---

## Verdict up front

The "gris y blanco" complaint is **partly valid, and measurably so** — not a taste argument. The grey isn't the *background* (that's correct, on-brand void); the grey is the **text and the panels**. Body copy uses a token that fails accessibility contrast, and the You-vs-Ghost duel — the literal core of the product — renders as two identical grey boxes until a state fires. Color in this UI is currently a *reward you only get after something happens*. It should also be a *map you can read before anything happens*.

Two fixes carry ~80% of the value: (1) retire `--muted-2` as text, (2) give Ghost its own hue so the opponent is never visually you. Everything else is polish.

---

## 1. Color audit — diagnosis

### 1a. The contrast defect (measured, WCAG 2.1 relative luminance)

| Token | Hex | on `--bg` | on `--panel` | AA normal (4.5) | AA large/UI (3.0) |
|---|---|---|---|---|---|
| `--ink` | `#f4f5f7` | 18.11 | 16.61 | PASS | PASS |
| `--volt` | `#00ff85` | 14.71 | 13.50 | PASS | PASS |
| `--crash` | `#ff3b30` | 5.57 | 5.11 | PASS | PASS |
| `--muted` | `#7c8092` | 5.04 | **4.62** | PASS (thin) | PASS |
| `--volt-dim` | `#0a8f54` | 4.77 | 4.37 | PASS (thin) | PASS |
| `--muted-2` | `#4b4f5e` | **2.43** | **2.23** | **FAIL** | **FAIL** |

`--muted-2` fails AA outright — even the relaxed 3.0 UI threshold. Yet it is used as **readable body text** in:

- `.rule` (App.css 225-229) — the plain-language match rule, an onboarding-critical sentence
- `.who` (274-278) — the "YOU" / "GHOST" panel labels
- `.hint` (497-501) and `.cryptosoon` (502-506) — control-area guidance
- `.ladder-label` (113-119) and `.legend span` (157-165) — best-of-5 rail labels
- `.left` (219-224) — rounds-remaining counter
- `.score i` (305-312), `.vscore em` (434-440), `.chip code` (70-74), `.gate-note` (549-554)
- `.step-n` (620-626, via `--volt-dim` at 4.37) — onboarding step numbers, also thin

This is the technical root of "todo muy gris": the eye is being asked to read text that is physically too dim against the void. It reads as fog, not type.

### 1b. The differentiation defect — Ghost ≡ You

`.panel` (App.css 243-253) is the shared base for both duelists. The **only** thing distinguishing the opponent panel is `.panel.right` (254-257) — which sets `text-align: right`. Same `background: var(--panel)`, same `border: 1px solid var(--line)`, same everything else. At idle (the state players sit in before every round) the two combatants are indistinguishable except by reading the label. In a 1v1 duel, that is the single most important visual relationship in the product, and it is currently invisible. State classes (`.cashed`, `.bust`, `.won`) only differentiate *after* the round resolves.

### 1c. Color-as-reward, not color-as-map

Color (volt / crash) appears almost exclusively on **state change**: `.pip.win/.loss`, `.ticker.live/.crash`, `.panel.cashed/.bust/.won`, `.verdict.win/.loss`, `.lead.you/.ghost`. At rest, the 720px column is grey terminal. The ticker (`.ticker.live`, 362-365) is **flat volt at every multiplier** — 1.2x and 14.0x are the exact same green, so the climb that should feel like rising heat feels like a static number changing. The screen has no temperature.

### 1d. Honest counter-point (do not over-correct)

The near-black void, the grain, the scan-grid, the monospace ticker — these are the brand and they are working. The fix is **not** more saturation everywhere; that would dilute the moments that should pop. The fix is: make text readable, give the opponent an identity, and let the ticker run hot as it climbs. Restraint elsewhere is what makes volt-green mean "GO."

---

## 2. Palette expansion within the locked identity

Anchors stay: volt = **you / win / go**, crash = **bust / loss / danger**, near-black = void. We add exactly **two** semantic hues and **one** corrected text tier. No more — that's the discipline that keeps it on-brand instead of a rainbow.

The constraint that forces these exact choices: the Ghost hue **cannot** be green-ish (collides with volt = you) or red-ish (collides with crash = bust). It must live in the unused cool quadrant. Heat **cannot** be red (collides with crash) — amber/gold is the one warm hue that reads "hot" without meaning "dead."

### New tokens (all contrast-verified)

| New token | Hex | on `--bg` | on `--panel` | Role |
|---|---|---|---|---|
| `--ghost` | `#32d6ff` | 11.47 | 10.53 | Opponent identity — cyan, cool quadrant, never you, never bust |
| `--ghost-dim` | `#1a6f8c` | 3.48 | 3.19 | Ghost idle borders / framing (UI-tier only, ≥3.0 — not for text) |
| `--ghost-ink` | `#cfe8f5` | 15.53 | 14.25 | Ghost-side score/name text when opponent is active |
| `--heat` | `#ffd23f` | 13.68 | 12.55 | Multiplier heat ≥5x (gold) — "white-hot" climb |
| `--heat-amber` | `#ffb020` | 10.80 | 9.91 | Multiplier heat ≥10x (deep amber, last stop before crash-red) |
| `--muted-rd` | `#9aa0b4` | 7.58 | 6.96 | **Readable** body-text tier replacing `--muted-2` as text |

`--muted-2` (`#4b4f5e`) is **not deleted** — it is demoted to **decoration only**: `.ldot` base, `.pip` base track, `.dot` idle, hairline separators. As a 1px non-text element it is fine; as type it is not.

### Where each goes (mapping, no code)

- **`--muted-rd` replaces `--muted-2`** in every text rule listed in §1a. Single highest-ROI change. Instantly lifts the whole column out of fog and fixes the AA failure in one pass.
- **`--ghost` + `--ghost-dim`** drive the opponent panel: idle border becomes `--ghost-dim`, the `.who` "GHOST" label and the `.dot` for ghost-status become `--ghost`, active ghost score uses `--ghost-ink`. Your panel keeps volt framing. Now the duel is legible at a glance, pre-round. Note: `.panel.bust` (crash-red) still overrides on a ghost crash — bust semantics win over identity, which is correct.
- **`--heat` / `--heat-amber`** drive ticker temperature (see §3, FX-2). The ticker glow ramps volt → gold → amber as the multiplier climbs, then snaps to crash-red on bust. This makes "the longer you ride, the hotter it gets" a thing you can *see*.
- The `.lead.ghost` standing indicator (App.css 203-205) currently borrows `--crash` — **re-point to `--ghost`** so "ghost is leading" stops looking like "you are losing/danger." Leading ≠ danger; that's a current semantic bug the new hue fixes for free.

---

## 3. Dopamine FX spec

Format per effect: **trigger → visual → duration/easing → reduced-motion fallback.**

**Reduced-motion law (index.css 120-124):** the global `* { animation: none !important }` nukes any FX delivered *only* as a keyframe — it would vanish entirely. Therefore every effect below has a **static state fallback**: the color/scale END-STATE is delivered by a class (a CSS `transition` or a held value), and only the *easing/motion* is what reduced-motion strips. Reduced-motion users still get the heat color, the burst color, the rank — they just don't get the travel. No effect is allowed to degrade to "nothing."

### FX-1 — Cash-out micro-burst (HIGHEST ROI · build first)

The single most important dopamine beat: the instant the player locks in a cash-out, *before* the round even resolves, the act of cashing must feel physically rewarding at the point of action.

- **Trigger:** player taps `.primary.cash` and the cash-out commits.
- **Visual:** a volt-green radial micro-burst (8-12 short particle spokes or a single expanding ring) emitted **from the cash button AND the player score**, plus a one-frame brightness punch on the locked score number. The score does a tight `win-pop`-style scale (reuse existing `win-pop`, 1.0→1.06→1.0). Button transitions to its `.done` state in the same beat.
- **Duration/easing:** burst 320ms `cubic-bezier(0.22,1,0.36,1)` (decelerate-out, "thrown" feel); score punch 180ms.
- **Reduced-motion fallback:** no particles, no scale. Instead: score color snaps to volt and button snaps to `.done` instantly. The *confirmation* survives; only the celebration motion is dropped.
- **Why first:** it rewards the **action** (cash-out), which is the loop's core verb. Today there is zero feedback at the exact moment of the most important decision — the reward is deferred to verdict. Closing that gap is the biggest felt-quality jump available.

### FX-2 — Multiplier heat (HIGH ROI · build second)

- **Trigger:** live multiplier value crossing thresholds — 2x, 5x, 10x.
- **Visual:** ticker color + glow ramp as a **state**, not a loop:
  - `< 2x` → `--volt` (current).
  - `≥ 2x` → volt with intensified glow.
  - `≥ 5x` → `--heat` (gold), gold text-shadow.
  - `≥ 10x` → `--heat-amber` (deep amber), the "you're playing with fire" stop before crash-red.
  Each crossing fires a tiny one-shot glow-flare (radius pulse) on the threshold tick. The transition between colors uses the existing `.ticker { transition: color 0.1s }` hook — extend to include glow.
- **Duration/easing:** color cross-fade 220ms ease; threshold flare 260ms ease-out.
- **Reduced-motion fallback:** the **color tier still applies** (it's a class-driven state, not a keyframe) — gold at 5x, amber at 10x persist. Only the flare pulse is suppressed. This is the key reason heat is engineered as a state and not an animation.
- **Why:** turns a flat climbing number into rising temperature. Directly answers "todo muy gris" at the literal focal point of the screen, and it makes greed legible — the hotter the color, the more you're risking.

### FX-3 — Near-miss "almost crashed" feedback

- **Trigger:** player cashes out within a small margin (e.g. ≤0.15x) of the actual crash point.
- **Visual:** brief amber-edged vignette flash + a one-line `.crashword`-style stamp "CLUTCH" / "JUSTO" in `--heat`. Distinct from the win-volt and bust-red so the *narrowness* of the escape registers as its own emotion.
- **Duration/easing:** vignette 400ms ease-out; stamp reuses `rise` (0.3s).
- **Reduced-motion fallback:** static amber border-flash on the player panel for 1 render + the stamp text (no rise). Emotion preserved as a held color, not motion.
- **Why:** near-misses are the highest-arousal moment in crash games; surfacing them manufactures "one more round."

### FX-4 — Streak counter (visual treatment only)

> Lane note: **norman owns layout/placement**, **cooper owns when it animates across rounds.** I spec only the *look*.

- **Trigger:** consecutive round wins ≥ 2.
- **Visual:** a compact chip near the HUD (`.chip` family), number in `--volt`, with a heat-tinted flame/spark glyph that shifts volt → `--heat` as the streak climbs (2-3 volt, 4-5 gold, 6+ amber) — reusing the heat ramp for cohesion. At rest it's quiet; on increment, a single volt ring-pulse (reuse `pulse-volt`).
- **Duration/easing:** increment pulse 600ms (existing `pulse-volt` cadence).
- **Reduced-motion fallback:** number + color tier update instantly, no pulse.
- **Why:** loss-aversion engine — a visible streak is a thing you're afraid to break.

### FX-5 — Rank / leaderboard preview + rank-up moment (visual treatment only)

> Lane note: norman owns whether this surfaces and where; cooper owns the rank-up timing within the round-end sequence. I spec hue + treatment only.

- **Trigger (preview):** ambient — a small rank readout (e.g. "#142 · DIAMOND TIER").
- **Visual (preview):** tier word carries a tier hue drawn **only** from the locked set + the two new accents (no new tier colors invented): e.g. volt for top tier, gold `--heat` for mid, `--ghost` cyan for entry — reusing the established palette so ranks feel native, not bolted-on. Numerals in `--muted-rd` (readable), tier word in its accent.
- **Trigger (rank-up):** rank improves at match end.
- **Visual (rank-up):** the tier word does a `win-pop` scale + a single sweep of its accent glow left-to-right; old rank number count-flips down to new (reuse existing `useCountUp`).
- **Duration/easing:** sweep 500ms ease-out; count-flip ~600ms.
- **Reduced-motion fallback:** new rank value + new tier color appear instantly; no sweep, no count-flip (show final number directly).
- **Why:** progression spine. Even a *mock* rank preview gives the grind a destination and makes each match feel like it moves a needle.

### Priority order

1. **FX-1 cash-out micro-burst** — rewards the core verb, biggest felt jump.
2. **FX-2 multiplier heat** — fixes "grey" at the focal point + makes greed visible.
3. FX-3 near-miss — cheap, high arousal.
4. FX-4 streak / FX-5 rank — depend on norman/cooper; treatment-ready, build when their lanes land.

---

## 4. Estimated scope

| Change | Files | Approx lines | Risk |
|---|---|---|---|
| Add 6 tokens to `:root` | `src/index.css` (5-22) | +6 | None — additive |
| Swap `--muted-2`→`--muted-rd` in text rules | `src/App.css` (~10 selectors) | ~10 edits | Low — find/replace, visual-only |
| Demote `--muted-2` to decoration | `src/App.css` (`.ldot`,`.pip`,`.dot` already use it) | 0-2 | None |
| Ghost identity (border/label/dot/ghost-ink) | `src/App.css` (`.panel.right`,`.who`,`.lead.ghost`,`.dot`) | ~12 | Low — additive classes; verify `.bust` still overrides |
| Ticker heat states (5x/10x classes + glow) | `src/App.css` (`.ticker`) + game state hook to emit threshold class | ~18 CSS + small TS | Medium — needs multiplier-threshold class wiring in the ticker component |
| FX-1 cash-burst | new keyframes + emit on cash commit | ~25 CSS + small TS | Medium — particle/ring element + trigger point |
| FX-3 near-miss | crash-distance check + stamp/vignette | ~15 CSS + small TS | Low-Med |
| FX-4/5 streak & rank | depends on norman/cooper data | TBD | Deferred |

**Total core (FX-1 + FX-2 + color fixes + ghost identity):** ~1 build cycle, mostly CSS. The only real engineering is two small triggers (cash-commit emit, multiplier-threshold class). No architectural change. All keyframes respect the existing reduced-motion guard.

---

## 5. Dependencies

- **vs interaction-cooper (transitions/temporal):** I own the *visual treatment* of each effect (hue, glow, particle, duration of the single beat). Cooper owns the **round-to-round choreography** — the sequence and timing of how verdict → streak → rank → next-round chain together over time. FX-4 (streak) and FX-5 (rank-up) specifically hand the *when-it-fires-across-rounds* decision to him; I deliver only the look. No overlap on FX-1/2/3, which are single in-the-moment beats inside one round.
- **vs product-norman (layout):** the **placement** of the streak chip and the rank/leaderboard readout is norman's call — whether they surface, where in the 720px column, and at what information density. I've specified treatment that drops into the existing `.chip`/HUD family so it fits whatever layout he chooses. The ticker-heat and ghost-identity changes are in-place (no new layout) and don't need him.
- **No conflict with the locked palette / brand (consensus):** all six new tokens are anchored to volt/crash/near-black and contrast-verified; nothing competes with the brand's two hero colors.

---

## 6. Before / after (described)

**Before.** A near-black 720px column. Two grey panels, left and right, identical except text alignment — you cannot tell the duel apart at rest. Body text (the rule, the labels, the hints) sits at 2.2–2.4:1 contrast: legible-ish if you squint, fog if you don't. The ticker climbs in one unchanging green; 1.3x and 12x look the same. Color only arrives *after* a round ends — a win flashes volt, a bust flashes red — then the screen returns to grey. Cashing out, the most important act in the game, produces no feedback at the moment you do it. The screen has no temperature and the opponent has no face.

**After.** Same on-brand void, same grain, same restraint — but now legible. Body text lifts to a readable slate (`--muted-rd`, ~7:1) so the column reads as *type*, not haze. The opponent panel wears a cool cyan identity (`--ghost`): at a glance, before a single round, you see YOU (volt) vs GHOST (cyan) — a real duel. As you ride a multiplier, the ticker runs **hot** — volt at the start, gold past 5x, amber past 10x — so greed is something you watch rise. The instant you cash out, a volt micro-burst fires from the button and your score punches: the action rewards itself. Near-misses earn their own gold "CLUTCH" beat. The dark-arcade identity is untouched; it's now *readable and alive* instead of grey and inert. Reduced-motion users keep every color and every state — they just don't get the travel.

---

## Verdict (3 lines)

1. The "gris y blanco" complaint is **measurably real**: `--muted-2` body text fails WCAG AA at 2.2–2.4:1, and the You-vs-Ghost duel renders as two identical grey boxes at idle — but the dark-arcade brand is correct and stays locked; we differentiate *within* it, not away from it.
2. **Highest-ROI color fix:** retire `--muted-2` as text → promote all body copy to `--muted-rd` (`#9aa0b4`, ~7:1). One find/replace pass lifts the entire column out of fog and fixes the accessibility failure simultaneously.
3. **Highest-ROI FX:** the **cash-out micro-burst (FX-1)** — a volt burst from the button + score the instant you lock in — because it finally rewards the loop's core verb at the moment of action; pair it with **multiplier heat (FX-2)** so the ticker runs gold-then-amber as you climb, making greed visible at the screen's focal point.
