# Cycle 25 — Clipboard Fallback (QA M-01)

Fix for `docs/qa/cycle24-share-challenge-qa.md` M-01: share-challenge copy button had no
failure path for `navigator.clipboard.writeText`.

## Change
- `src/components/ShareChallenge.tsx`
  - Guard: `navigator.clipboard?.writeText` undefined → fallback immediately.
  - `.catch()` on the write promise → fallback.
  - Fallback UI: labeled read-only input with the full share text, auto-selects on focus.
- `src/App.css` — `.share-challenge-fallback*` styles matching the volt/ghost system
  (volt-dim border, volt text, ghost label, mono font, same rise animation).

## Verification
- All existing tests pass (logic, prefs, fairness, economy, history, leaderboard).
- `pnpm build` clean.
- Deployed `dist` to Cloudflare Pages (branch main); https://crashout-euq.pages.dev returns 200.
