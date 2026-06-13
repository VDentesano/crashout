# CRASHOUT — Cycle 13 Visual System Proposal
**UI Design Director: Matías Duarte | Analysis-only cycle — no code shipped**

---

## 1. Diagnosis: Why It Reads as a Prototype

The current build is technically functional and has thoughtful semantics (volt green = you, cyan = ghost, red = crash). But six specific design failures collapse the premium read:

### 1.1 Chromatic Poverty
`--bg: #0a0a0f` paired with `--panel: #15151f` and `--line: #23232f` creates a near-zero contrast stack. The three surface levels differ by roughly 5–9 lightness points each. Result: everything appears to sit on a single flat plane. Compare Stake.com, which uses a richer surface ladder (10–14 points per step) and strong accent coloring on interactive elements. Volt green and crash red appear only in isolated semantic moments — the rest of the time is a grey-on-grey field.

### 1.2 No Background Depth or Atmosphere
The body uses a scan-grid (44px lines) at `--line` (#23232f) — invisible at this contrast ratio. The radial volt glow at 7% opacity is too subtle to register. Premium casino UIs use deep atmospheric gradients that are visible, not whispered. Roobet's background reads as a purposeful, luxurious space. CRASHOUT's background reads as a dark empty div.

### 1.3 Typography Scale is Too Flat
The product has one meaningful display moment — the ticker (`clamp(56px, 18vw, 116px)`) — and then everything collapses to 10–14px label-weight text. There is no mid-tier display size (28–48px) for the score panels, verdict text, or brand moment. The score panels show 26px — barely larger than body copy. Stake's player balance widget is 3x the size of its label copy. Hierarchy requires bold jumps, not gradual steps.

### 1.4 Panel Material is One-Dimensional
`.panel` is `background: var(--panel)` with a 1px `--line` border. There is no elevation gradient, no inner glow at rest, no glass effect. It reads as a flat box. Premium UIs use multi-layer panel surfaces: a subtle gradient from top to bottom, inner edge highlight on the top border, and a shadow that grounds the element. The distinction between "surface" and "floating" is absent.

### 1.5 Button Hierarchy Mismatch
The CASH OUT button (`--volt` background, pulsing) is well-designed. But the secondary state buttons (NEXT ROUND, ENTER DUEL) at `var(--ink)` background render as a bright white rectangle — it dominates the visual hierarchy in the wrong moments. Secondary CTAs should be understated (ghost-style, bordered), reserving the full background for the primary high-stakes action.

### 1.6 Mobile Header is a Cramped Status Bar
On narrow viewports, the `.hud-right` chips (PROVABLY FAIR + 8-char seed hash, LIVE/LOCAL chip, three icon buttons) compress into a single row that wraps or clips. The brand mark competes with system info. Casino apps solve this with a tab-bar model or a collapsible header — the trust signals live behind a discrete icon, not always in frame.

---

## 2. Color Palette Proposal: Dark Casino Base + Full Accent System

Philosophy: the background should feel like a premium material, not an empty void. Surfaces should float. Accents should be rich and intentional — each hue owns exactly one semantic role.

```css
:root {
  /* ── Base surfaces — richer, 3-tier separation ── */
  --bg:          #060609;   /* void — deepest, body background */
  --bg-deep:     #08080d;   /* subtle depth behind stage canvas */
  --bg-raise:    #0e0e18;   /* raised panels, first level */
  --bg-float:    #13132000; /* glass base — transparent, for blur panels */
  --surface:     #111120;   /* standard card/panel surface */
  --surface-hi:  #1a1a2e;   /* elevated surface — sidebar, modals */
  --surface-pop: #21213a;   /* top-level floating elements */

  /* ── Borders — three-tier, not one ── */
  --line-faint:  #1c1c2a;   /* barely-there structural divisions */
  --line:        #252537;   /* standard border */
  --line-bright: #343450;   /* highlighted/active border */
  --line-glow:   rgba(100, 90, 255, 0.25); /* purple accent border shimmer */

  /* ── Volt (YOU — primary win state) ── */
  --volt:        #00ff85;
  --volt-mid:    #00cc6a;   /* hover/pressed states */
  --volt-dim:    #004d28;   /* background tints */
  --volt-ghost:  rgba(0, 255, 133, 0.06); /* panel fills */

  /* ── Crash (bust, danger) ── */
  --crash:       #ff3b30;
  --crash-mid:   #d42f25;
  --crash-dim:   #4a1410;
  --crash-ghost: rgba(255, 59, 48, 0.06);

  /* ── Ghost / Opponent identity — cool blue-cyan ── */
  --ghost:       #32d6ff;
  --ghost-mid:   #1aa8cc;
  --ghost-dim:   #0d3d4d;
  --ghost-ghost: rgba(50, 214, 255, 0.06);

  /* ── Multiplier heat (5x → 10x → 15x+) ── */
  --heat-gold:   #ffd23f;   /* ≥5x — gold */
  --heat-amber:  #ff9500;   /* ≥10x — deep amber */
  --heat-red:    #ff6b00;   /* ≥15x — orange-red, near-danger */

  /* ── New: Accent purple — premium casino marker, wins/streaks/bounties ── */
  --accent:      #8b5cf6;   /* violet — cosmetic/achievement tier */
  --accent-mid:  #6d3fd6;
  --accent-dim:  #2d1a5c;
  --accent-ghost: rgba(139, 92, 246, 0.07);

  /* ── New: Gold — crypto value, ranked rewards ── */
  --gold:        #f5c842;
  --gold-mid:    #c8a030;
  --gold-dim:    #3a2c0a;

  /* ── Typography ── */
  --ink:         #f0f2f8;   /* primary text — slightly cooler, less pure white */
  --ink-2:       #c8ccd8;   /* secondary text — readable, not washed */
  --muted:       #7a7f96;   /* tertiary text */
  --muted-rd:    #9298b0;   /* readable body text, AA compliant */
  --disabled:    #4a4f62;   /* disabled state text */

  /* ── Fonts ── */
  --font-display: 'Chakra Petch', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* ── Motion ── */
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --dur-fast:    120ms;
  --dur-mid:     240ms;
  --dur-slow:    400ms;
  --dur-enter:   480ms;

  color-scheme: dark;
}
```

### Color Semantic Map

| State | Primary Hue | Use |
|---|---|---|
| Live / Active | `--volt` | Ticker while running, YOUR panel, CASH OUT button |
| Win (round) | `--volt` | Verdict, panel border |
| Win (match) | `--volt` + `--gold` | Larger celebration — gold shimmer on volt |
| Crash / Bust | `--crash` | Ticker on crash, panel bust state, redflash |
| Opponent | `--ghost` (cyan) | GHOST panel always, ghost roundline |
| Idle | `--muted` / `--line` | Pre-match neutral state |
| Achievement | `--accent` (violet) | Streak badges, bounties, leaderboard rank |
| Currency / Value | `--gold` | Match score highlights, reward amounts |
| Danger signal (heat) | gold → amber → orange | Multiplier as it climbs |

---

## 3. Typography Scale + Multiplier Ticker Treatment

### Scale

```css
/* Display — multiplier ticker only */
--type-ticker:  clamp(64px, 20vw, 128px);
--type-d1:      clamp(36px, 8vw, 56px);   /* match verdict YOU WIN/LOSE */
--type-d2:      clamp(26px, 5vw, 38px);   /* score panels, round verdict */

/* Labels — uppercase tracking */
--type-label-lg:  14px / 700 / 0.18em;   /* panel WHO label */
--type-label-md:  12px / 700 / 0.16em;   /* chips, status */
--type-label-sm:  10px / 600 / 0.22em;   /* ladder label, legend */
--type-label-xs:   9px / 600 / 0.28em;   /* footnotes */

/* Body */
--type-body-md:  14px / 400 / 1.55;
--type-body-sm:  12px / 400 / 1.5;

/* Mono — ticker, scores, multipliers */
--type-mono-xl: clamp(24px, 5vw, 32px);  /* score panels */
--type-mono-lg: 18px;
--type-mono-md: 14px;
--type-mono-sm: 12px;
```

### Multiplier Ticker — the Focal Object

The ticker must feel like a living organism, not a counter. Three layers working together:

**1. Typography:** `--type-ticker`, `font-weight: 900`, `--font-mono`, negative letter-spacing (`-0.04em`). The `×` suffix at `0.38em` size, vertically centered at `0.5em`, with `opacity: 0.5` at rest, rising to `1` during heat. This suffix matters — it anchors the number type.

**2. Color as temperature:** Not just a state class — a continuous range. The intent is a smooth transition property from volt to gold to amber. Reduced-motion fallback stays as state classes (which already exist and work).

**3. Scale pulse:** During live play, a subtle `scale(1.02)` → `scale(1)` pulse on each decimal tick (NOT a continuous loop). GSAP excels here. Each time the displayed value changes, a quick `gsap.fromTo` scale pop communicates "this number is counting." This is the key missing micro-interaction.

---

## 4. Depth and Material System

### Surface Elevation Model

```
Elevation 0 — void:     #060609
Elevation 1 — base:     #0e0e18 + no shadow
Elevation 2 — panel:    #111120 + inner-top highlight (rgba(255,255,255,0.04))
Elevation 3 — floating: #1a1a2e + border rgba(255,255,255,0.06) + shadow-md
Elevation 4 — modal:    #21213a + border rgba(255,255,255,0.08) + shadow-lg
Glass layer:            rgba(20, 20, 35, 0.72) + backdrop-filter: blur(20px) saturate(1.5)
```

### Panel Material (`.panel` upgrade)

```css
/* Panel at rest — Elevation 2 */
background: linear-gradient(
  160deg,
  #161628 0%,
  #111120 50%,
  #0e0e1c 100%
);
border: 1px solid var(--line);
border-top-color: rgba(255, 255, 255, 0.05); /* inner edge highlight */
box-shadow:
  0 1px 0 rgba(255, 255, 255, 0.03) inset,  /* top inner highlight */
  0 2px 8px rgba(0, 0, 0, 0.4);
border-radius: 14px;
```

### Stage Material

```css
/* Stage — the arena backdrop */
background:
  radial-gradient(80% 60% at 50% 100%, rgba(0, 255, 133, 0.08) 0%, transparent 70%),
  radial-gradient(60% 40% at 20% 30%, rgba(139, 92, 246, 0.04) 0%, transparent 60%),
  linear-gradient(180deg, #0d0d1a 0%, #060609 100%);
border: 1px solid var(--line);
border-top-color: rgba(100, 90, 255, 0.15);
```

### Dynamic Island Sidebar Material

The sidebar is a floating island — not a sidebar panel, but a pill/rounded-rect that anchors to the left edge of the desktop viewport, with breathing room from all edges.

```css
/* Dynamic Island material */
.sidebar {
  background: rgba(18, 18, 30, 0.82);
  backdrop-filter: blur(28px) saturate(1.8) brightness(0.95);
  -webkit-backdrop-filter: blur(28px) saturate(1.8) brightness(0.95);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom-color: rgba(0, 0, 0, 0.3);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5),          /* crisp outer edge */
    0 8px 32px rgba(0, 0, 0, 0.6),          /* elevation shadow */
    0 1px 0 rgba(255, 255, 255, 0.06) inset, /* top inner light */
    0 0 60px rgba(0, 255, 133, 0.04);       /* ambient volt bleed */
  border-radius: 20px;                       /* pill-ish but not full pill */
}
```

The sidebar has three visual states:
- **Idle:** pill at minimum width (~64px), shows only match status icons
- **Expanded:** slides out to 240px wide, reveals opponent stats, ladder, round info
- **Alert (ghost cashout / your lead):** border pulses with the relevant identity color (cyan or volt) via a GSAP timeline on the border-color/box-shadow

---

## 5. Motion Language: GSAP Specifications

### Installation and Setup Intent
```tsx
// Entry point — register gsap + plugins once
import { gsap } from 'gsap';
// No additional plugins needed for core interactions
// ScrollTrigger not needed (no scroll)
// MotionPathPlugin if curve path animation desired later
```

### 5.1 Sidebar Reveal (Dynamic Island expand/collapse)

```tsx
// Expand — island grows from pill to panel
const revealSidebar = (el: HTMLElement) => {
  gsap.fromTo(el,
    { width: 64, borderRadius: 32, opacity: 0.7 },
    {
      width: 240,
      borderRadius: 20,
      opacity: 1,
      duration: 0.38,
      ease: 'power3.out',
      // Stagger children content in after container opens
      onStart: () => {
        gsap.fromTo('.sidebar-content > *',
          { opacity: 0, x: -8 },
          { opacity: 1, x: 0, duration: 0.22, stagger: 0.04, ease: 'power2.out', delay: 0.15 }
        );
      }
    }
  );
};

// Collapse
const collapseSidebar = (el: HTMLElement) => {
  gsap.to('.sidebar-content > *', { opacity: 0, x: -6, duration: 0.1, ease: 'power2.in' });
  gsap.to(el, { width: 64, borderRadius: 32, opacity: 0.8, duration: 0.28, ease: 'power2.in', delay: 0.08 });
};
```

**prefers-reduced-motion:** use `gsap.matchMedia()` to skip dimension animation, only toggle `opacity` on content.

```tsx
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // full animation as above
});
mm.add('(prefers-reduced-motion: reduce)', () => {
  // instant width change, only opacity fade on children
  gsap.set(el, { width: expanded ? 240 : 64 });
  gsap.to('.sidebar-content > *', { opacity: expanded ? 1 : 0, duration: 0.15 });
});
```

### 5.2 Multiplier Ticker — Scale Pop on Each Tick

This is the key "alive" interaction. Every time the displayed multiplier string changes (from `2.34` to `2.35`), a micro pop fires.

```tsx
// Inside a useEffect watching `multiplier`
useEffect(() => {
  if (!running || !tickerRef.current) return;
  gsap.fromTo(tickerRef.current,
    { scale: 1.025 },
    { scale: 1, duration: 0.09, ease: 'power1.out' }
  );
}, [displayedMultiplier]); // fires on each display tick
```

**Heat ramp — color tween:** GSAP color interpolation is cleaner than CSS transitions for this.

```tsx
// Fires when crossing the 5x threshold
gsap.to(tickerRef.current, {
  color: '#ffd23f',   // --heat-gold
  textShadow: '0 0 40px rgba(255, 210, 63, 0.6)',
  duration: 0.6,
  ease: 'power2.out'
});
// At 10x:
gsap.to(tickerRef.current, {
  color: '#ff9500',
  textShadow: '0 0 48px rgba(255, 149, 0, 0.65)',
  duration: 0.4,
  ease: 'power2.out'
});
// At 15x:
gsap.to(tickerRef.current, {
  color: '#ff6b00',
  textShadow: '0 0 56px rgba(255, 107, 0, 0.7)',
  duration: 0.3,
  ease: 'power1.in' // snaps in — approaching danger
});
```

### 5.3 Cash-Out Burst

Replaces the current CSS keyframe. GSAP gives precise multi-step control.

```tsx
const cashOutBurst = (stageEl: HTMLElement) => {
  const ring = document.createElement('div');
  ring.className = 'cashburst-ring';
  stageEl.appendChild(ring);

  const tl = gsap.timeline({ onComplete: () => ring.remove() });
  tl.fromTo(ring,
    { opacity: 0.9, scale: 0.15, x: '-50%', y: '-50%' },
    { opacity: 0, scale: 1.2, x: '-50%', y: '-50%', duration: 0.45, ease: 'power2.out' }
  );

  // Secondary particles — 6 dots radiating outward
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('div');
    dot.className = 'cashburst-dot';
    stageEl.appendChild(dot);
    const angle = (i / 6) * Math.PI * 2;
    tl.fromTo(dot,
      { opacity: 1, x: '-50%', y: '-50%', scale: 1 },
      {
        opacity: 0,
        x: `calc(-50% + ${Math.cos(angle) * 80}px)`,
        y: `calc(-50% + ${Math.sin(angle) * 80}px)`,
        scale: 0,
        duration: 0.4,
        ease: 'power2.out'
      },
      0.05 // slight offset from ring
    );
  }
};
```

**prefers-reduced-motion:** skip the burst entirely, let the panel border state change carry the reward signal (already does this via `.panel.cashed`).

### 5.4 Crash Shake — GSAP replaces CSS shake

CSS `animation: shake` is a simple loop. GSAP gives a richer trauma feel:

```tsx
const crashShake = (appEl: HTMLElement) => {
  gsap.timeline()
    .to(appEl, { x: -10, y: 5, duration: 0.05, ease: 'power1.in' })
    .to(appEl, { x: 8, y: -6, duration: 0.05 })
    .to(appEl, { x: -7, y: 3, duration: 0.05 })
    .to(appEl, { x: 5, y: -4, duration: 0.05 })
    .to(appEl, { x: -3, y: 2, duration: 0.05 })
    .to(appEl, { x: 0, y: 0, duration: 0.08, ease: 'power1.out' });
};
```

**prefers-reduced-motion:** skip shake, flash overlay still fires (red flash is visual only, not motion). Guard with `gsap.matchMedia`.

### 5.5 Win Celebration — Match Win

A three-phase sequence. Phase 1: scale pop on the panel. Phase 2: particle shower (6–10 dots from panel edges). Phase 3: score number counts up via GSAP's `countTo` pattern.

```tsx
const matchWinCelebration = (panelEl: HTMLElement) => {
  const tl = gsap.timeline();

  // Phase 1 — panel pop
  tl.fromTo(panelEl,
    { scale: 1 },
    { scale: 1.06, duration: 0.18, ease: 'power2.out' }
  ).to(panelEl, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.6)' });

  // Phase 2 — border pulse (volt → bright volt → settle)
  tl.fromTo(panelEl,
    { boxShadow: '0 0 0 0 rgba(0, 255, 133, 0)' },
    { boxShadow: '0 0 0 6px rgba(0, 255, 133, 0.5), 0 0 60px rgba(0, 255, 133, 0.25)', duration: 0.25 },
    0
  ).to(panelEl,
    { boxShadow: '0 0 0 2px rgba(0, 255, 133, 0.3), 0 0 30px rgba(0, 255, 133, 0.15)', duration: 0.5, ease: 'power2.out' },
    0.25
  );

  // Phase 3 — volt flash overlay (reuse existing .voltflash via class add/remove)
  // handled by React state, GSAP only owns the panel
};
```

### 5.6 Sidebar Alert Pulse (opponent cashes out / lead change)

```tsx
const sidebarAlert = (sidebarEl: HTMLElement, color: string) => {
  gsap.timeline()
    .to(sidebarEl, {
      boxShadow: `0 0 0 2px ${color}, 0 0 30px ${color}40`,
      duration: 0.18,
      ease: 'power2.out'
    })
    .to(sidebarEl, {
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,133,0.04)',
      duration: 0.8,
      ease: 'power2.out'
    });
};
// Called with '--ghost' value when opponent cashes, '--volt' when you lead
```

### 5.7 Panel Transitions (round → roundEnd → next round)

```tsx
// Between round states — verdict panel enters from below
gsap.fromTo(verdictEl,
  { opacity: 0, y: 16, scale: 0.97 },
  { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: 'power3.out' }
);

// Score panels — score number update pop
gsap.fromTo(scoreEl,
  { scale: 1.08, color: '#fff' },
  { scale: 1, color: 'var(--ink)', duration: 0.4, ease: 'elastic.out(1, 0.8)' }
);
```

---

## 6. Layout: Mobile vs Desktop

### Mobile Layout (< 768px) — Single Column, Optimized

The current layout is already single-column. The key changes:
- **Header:** shrink to brand + two icon buttons only. PROVABLY FAIR moves to a bottom sheet triggered by tap.
- **Ladder:** increase pip height to 8px, make the whole bar taller.
- **Stage:** use `flex: 1` to fill available vertical space, not a fixed ratio.
- **Dynamic Island:** on mobile it becomes a **bottom drawer** — a slim pill above the CTA that expands upward when tapped.

```
┌─────────────────────────────┐
│  CRASH[OUT]         🔊 ?    │  ← header: brand + 2 icons (32px total height)
├─────────────────────────────┤
│  [==] [==] [==] [·] [·]     │  ← ladder pips (8px height, full width)
├─────────────────────────────┤
│                             │
│  GHOST         YOU          │  ← score panels side-by-side, 26px score
│  Phantom       you          │    panel height: auto, compact
│  8.40 pts      12.34 pts    │
│  riding…       in the air   │
│                             │
├─────────────────────────────┤
│                             │
│                             │
│          7.82×              │  ← stage: flex:1, ticker 18vw → clamp to 96px
│                             │
│                             │
├─────────────────────────────┤
│  [ROUND WON  +4.22 pts]     │  ← verdict strip (when present)
├─────────────────────────────┤
│  ──── YOU LEAD +3.94 ──── ▾ │  ← island pill, taps to expand
│                             │
│  ██████ CASH OUT  7.82× ██  │  ← primary CTA
│  space / tap — cash out...  │  ← hint
└─────────────────────────────┘
```

### Desktop Layout (>= 1024px) — Fundamentally Different

NOT a stretched column. The viewport splits into three zones: a persistent left sidebar (Dynamic Island), a central arena, and an optional right info panel.

```
┌─────────┬──────────────────────────────┬────────────┐
│         │  CRASH[OUT]    🔊 FAIR LOCAL  │            │
│         ├──────────────────────────────┤            │
│ DYNAMIC │                              │  SCOREBOARD│
│ ISLAND  │  GHOST         YOU           │  PANEL     │
│         │  Phantom       you           │  (optional)│
│ Round 3 │  8.40pts       12.34pts      │            │
│ of 5    │                              │  leaderboard
│         │  ┌───────────────────────┐   │  recent    │
│ YOU     │  │                       │   │  matches   │
│ LEAD    │  │        7.82×          │   │            │
│ +3.94   │  │                       │   │            │
│         │  │                       │   │            │
│ [pip×5] │  └───────────────────────┘   │            │
│         │  ROUND WON  +4.22 pts         │            │
│ GHOST   ├──────────────────────────────┤            │
│ riding… │  ██████ CASH OUT  7.82× ████  │            │
│         │  space / tap — cash out       │            │
└─────────┴──────────────────────────────┴────────────┘
  240px              ~560px max              240px
  glass float        centered stage          optional
```

**Key architectural shifts for desktop:**
- Left sidebar: Dynamic Island, 240px wide, glass/blur, always visible, shows: match ladder, live standing (YOU LEAD +X), opponent status, round number. Collapses to 64px pill when game is idle.
- Central arena: max-width 560px, centered, contains header strip + score panels + stage + verdict + controls.
- Stage fills most of center vertically — this is where the product lives. No shrinking it to fit the column.
- Right panel: optional (Cycle 14+) — reserved for leaderboard/history. For now: simply blank or hidden.

---

## 7. Implementation Priority (for next coding cycle)

Order of visual impact per engineering effort:

1. **Background atmosphere** — richer radial gradients, visible scan grid, surface separation. Pure CSS, 30 min effort, huge perceived lift.
2. **Panel material upgrade** — gradient background, inner highlight border, elevation shadow. Pure CSS, 45 min.
3. **Ticker tick pop with GSAP** — the single highest "feels alive" moment. 2 hours including GSAP install.
4. **Desktop layout split** — sidebar + central arena grid. 4–6 hours, requires layout refactor.
5. **Dynamic Island sidebar** — glass material + expand/collapse GSAP animation. 4 hours.
6. **Color system expansion** — add `--accent`, `--gold`, surface ladder to index.css. 1 hour.
7. **Button hierarchy fix** — NEXT ROUND as ghost/outlined button, not bright-ink background. 30 min.
8. **Mobile header collapse** — remove chips to bottom sheet. 2 hours.
9. **Crash shake via GSAP + win celebration** — replaces CSS keyframes, adds particle burst. 3 hours.
10. **Heat ramp via GSAP color tween** — replaces CSS transition, smoother. 1 hour.

Total estimated implementation effort: **18–20 hours** across two cycles (Cycle 14: foundation + desktop layout; Cycle 15: GSAP motion layer).

---

## References (inspiration tier)

- **Stake.com:** deep surface separation, purple/teal accent economy, bold score typography
- **Roobet:** atmospheric gradient backgrounds, neon accent on dark, generous white space
- **Rollbit:** aggressive use of animated borders and glow states on active elements
- **CS:GO Market:** chip/badge system for trust signals — compact but legible
