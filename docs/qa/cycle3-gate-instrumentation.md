# QA — Gate instrumentation correctness (Cycle 3/4)

- **Author:** qa-bach (coordinator)
- **Scope:** Verify the MVP measures the pre-registered gate *correctly*. If the
  instrument is wrong, the entire experiment is worthless — this is the one thing
  QA must get right this cycle.

## The gate we must measure (pre-registered, both must pass)

- **Gate A:** median ≥3 rematches/session **AND** post-loss rematch rate ≥35%
- **Gate B:** D1 retention ≥18%

## Definitions locked (so the metric isn't ambiguous)

| Metric | Exact definition as implemented |
|---|---|
| rematch | A `rematch` event = player started another round **from a result screen**. Tagged with `prevOutcome` = the outcome of the round just shown. |
| post-loss rematch rate | `count(rematch where prevOutcome='loss') / count(round_result where outcome='loss')`. Every finished round shows a rematch button, so every loss round is a genuine *opportunity*; not clicking (incl. tab close) is a real non-rematch. |
| rematches/session | `count(rematch)` grouped by `sessionId` (one per page load). |
| D1 retention | distinct `playerId` seen on day N **and** day N+1. Requires a **persistent** playerId across days — implemented via `localStorage['crashout.playerId']`. |

## Win/loss semantics verified (the input to Gate A's numerator)

Post-loss rematch rate is garbage if wins/losses are computed wrong. Verified by
`src/game/logic.test.ts` (12/12 pass, `node src/game/logic.test.ts`):

- Highest **valid** cash-out wins; a bust **never** beats a cash-out.
- Ghost cashes **iff** `intent < crashPoint`, else busts ("crash beat them").
- Both bust → draw; equal multipliers → draw.
- Crash-point distribution: all ≥1.00, median 1.91× (≈2×, correct 1/x shape).

**Bug found & fixed during QA:** the distribution test's *fake hash generator*
front-loaded zeros (`padStart(13,'0')`), collapsing all samples to the low 52-bit
range → false median of 1.00. The **engine** was correct (it slices 13 hex from a
full HMAC-SHA256); the **test** was lying. Fixed the sampler to span the full
range — engine untouched. (Lesson: a green test that tests the wrong thing is more
dangerous than a red one.)

## End-to-end instrumentation check (live browser run)

Played rounds in-browser, then inspected the event buffer:

```
{ session_start:1, round_start:2, round_result:2 (both 'loss'),
  rematch:1 (prevOutcome:'loss'), playerId:'640ec35e…' persisted }
```

- ✅ `rematch` correctly carries the **preceding** round's outcome (`loss`).
- ✅ `round_result` carries `outcome` + player/ghost multipliers + crash point.
- ✅ persistent `playerId` present (D1 precondition) + per-load `sessionId`.
- ✅ Computed post-loss rematch rate = 1/2 = 50% (matches the displayed `∑` panel).

## Residual risks / not-yet-true

- 🔴 **Gate cannot actually be RUN yet.** localStorage is per-device; Gates A/B
  need cross-player + cross-day aggregation → **INSFORGE backend required**
  (blocked on OAuth, human escalation). The local `∑` panel proves the instrument
  is wired, **not** that we have experiment data.
- 🟡 **D1 retention untestable client-side** until the backend stores
  first-seen/last-seen per playerId server-side. The localStorage `firstSeen`
  stamp is a placeholder.
- 🟡 **rematch denominator edge:** the final round of a session counts as a
  non-rematch if the player leaves — this is *intended* (leaving after a loss is
  the churn signal we want to catch), but worth stating so it isn't "fixed" later.
- 🟡 Bot/duplicate playerId detection deferred to Phase 2 (not needed to read a
  directional retention signal).

## Verdict

Instrumentation is **correct and verified** for the metrics it can compute on one
device. The experiment is **not runnable** until the INSFORGE backend is connected.
Ship the playable MVP; flag the backend as the blocker, not as done.
