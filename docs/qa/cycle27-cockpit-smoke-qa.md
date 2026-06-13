# Cycle 27 QA Pass - Cockpit Smoke

Simulated teammate: `qa-bach`  
Engine/model: Codex CLI, `gpt-5.5`, reasoning effort `medium`  
Date: 2026-06-12  
Scope: current local `projects/crashout` production build. App code was not edited.

## Coordinator Update After Fixes

After this QA pass, the coordinator fixed the lint gate and reran the release checks.

Final gate results from `projects/crashout`:

- `pnpm lint`: pass
- `pnpm test`: pass
- `pnpm build`: pass
- `node scripts/cockpit-smoke.mjs http://127.0.0.1:5175/`: pass for viewport overflow checks across `1440x900`, `820x1180`, `390x844`, and `390x640`; screenshots and measurements written to `docs/qa/cycle27-smoke/`
- `pnpm deploy`: pass; Cloudflare Pages deployment completed at `https://9d9540f0.crashout-euq.pages.dev`
- HTTP checks: `https://9d9540f0.crashout-euq.pages.dev` and `https://crashout-euq.pages.dev` both returned `HTTP/2 200`

Final recommendation: GO shipped. Remaining risks are polish/automation gaps, not current deploy blockers.

## Quality Risk Read

This pass focused on fast information about the highest-risk cockpit paths: first-run comprehension, entering a paid duel, cashing out, round resolution, challenge/share loop, mobile navigation overlays, and deploy readiness. I treated automation as checking, not as full testing; the exploratory question was: "Can a first-time mobile user reach a real duel, understand the state, and recover/navigate without breaking the cockpit?"

Current quality signal is mixed:

- Core game logic checks pass.
- Production build passes.
- Real browser smoke on mobile viewport exercised onboarding, challenge URL, bet selection, round start, cashout lock, round result, share fallback, nav overlays, and settings.
- `pnpm lint` fails. That is a deploy gate blocker because `pnpm deploy` does not run lint, so the repo can ship while known static-quality checks are red.
- Browser logs repeated `AudioContext was not allowed to start` warnings during gameplay, which creates risk that audio feedback is unreliable under autoplay policy.

## Commands Run

From `/home/valentinod/Documents/crash-crypto`:

```bash
pwd && rg --files -g '!*node_modules*' -g '!*.png' -g '!*.jpg' -g '!*.jpeg' -g '!*.gif' -g '!*.webp' | sed -n '1,160p'
git status --short
ls -la && find . -maxdepth 2 -name 'package.json' -o -name 'vite.config.*' -o -name 'next.config.*' -o -name 'playwright.config.*' -o -name 'vitest.config.*'
sed -n '1,220p' docs/qa/cycle26-cockpit-shell-qa.md
git diff -- docs/qa/cycle27-cockpit-smoke-qa.md --stat -- docs/qa/cycle27-cockpit-smoke-qa.md
```

From `/home/valentinod/Documents/crash-crypto/projects/crashout`:

```bash
sed -n '1,220p' package.json
sed -n '1,260p' src/App.tsx
sed -n '261,620p' src/App.tsx
sed -n '1,260p' src/game/useMatch.ts && sed -n '1,220p' src/game/economy.ts
sed -n '220,520p' src/game/useMatch.ts
sed -n '1,240p' src/components/Onboarding.tsx && sed -n '1,220p' src/components/ChallengeBanner.tsx && sed -n '1,220p' src/components/ShareChallenge.tsx
sed -n '1,220p' src/game/server.ts && sed -n '1,220p' src/analytics/logger.ts
pnpm test
pnpm build
pnpm lint
pnpm exec playwright --version
node -e "for (const m of ['playwright','@playwright/test','puppeteer','selenium-webdriver','jsdom']) { try { console.log(m, require.resolve(m)); } catch { console.log(m, 'not installed'); } }"
command -v chromium || command -v chromium-browser || command -v google-chrome || command -v firefox || true
find node_modules -maxdepth 3 -iname '*playwright*' -o -iname '*puppeteer*' 2>/dev/null | sed -n '1,80p'
pnpm preview --host 127.0.0.1 --port 4173
chromium --headless=new --disable-gpu --no-sandbox --remote-debugging-port=9222 --user-data-dir=/tmp/crashout-qa-chrome-9222 http://127.0.0.1:4175/?c=4.32
chromium --headless=new --disable-gpu --no-sandbox --remote-debugging-port=9222 --user-data-dir=/tmp/crashout-qa-chrome-9222 'http://127.0.0.1:4175/?c=4.32'
node -e "console.log(typeof WebSocket, process.version)"
node <<'NODE'
// Transient Chrome DevTools Protocol smoke script:
// clear localStorage, navigate to http://127.0.0.1:4175/?c=4.32,
// set 390x844 mobile viewport, assert first render, dismiss onboarding,
// select 250 bet, enter duel, cash out, wait for round resolution,
// click share, visit leaderboard/history/settings/game nav.
NODE
node <<'NODE'
// Follow-up CDP probe for leaderboard/history selectors.
NODE
sed -n '1,220p' src/components/LeaderboardPanel.tsx && sed -n '1,220p' src/components/HistoryPanel.tsx
curl -I http://127.0.0.1:4175/ && curl -s http://127.0.0.1:4175/ | sed -n '1,80p'
nl -ba src/audio/useGameAudio.ts | sed -n '1,90p'; nl -ba src/components/LeaderboardPanel.tsx | sed -n '1,70p'; nl -ba src/game/history.test.ts | sed -n '35,48p'; nl -ba src/hooks/useHeatRamp.ts | sed -n '45,60p'
```

Notes:

- Vite preview requested port `4173`, found `4173` and `4174` occupied, and served on `http://127.0.0.1:4175/`.
- First Chromium launch failed because zsh expanded the unquoted `?c=4.32` URL. Retried with quotes successfully.
- Playwright, Puppeteer, Selenium, and jsdom were not installed. Browser automation used installed `/usr/bin/chromium` plus DevTools Protocol from Node `v26.2.0`.

## Check Results

| Check | Result | Evidence |
|---|---:|---|
| `pnpm test` | Pass | Logic, audio prefs, fairness, economy, history, leaderboard checks all passed. |
| `pnpm build` | Pass | `tsc -b && vite build`; built `dist/index.html`, CSS, JS. |
| `pnpm lint` | Fail | 3 errors, 1 warning. Details below. |
| HTTP preview | Pass | `HTTP/1.1 200 OK`; title `CRASHOUT - 1v1 Crash Duel` in served HTML. |
| Browser smoke, mobile 390x844 | Pass with risks | No runtime exceptions captured; core round path completed. Repeated AudioContext warnings captured. |

## States Covered

- First visit with clean `localStorage`.
- Challenge link state: `/?c=4.32` rendered `Someone cashed out at 4.32x - beat them.`
- Onboarding modal present on first visit and dismissed through `ENTER THE DUEL`.
- Header/status chips rendered. In this environment the build showed `PROVABLY FAIR` and `LIVE`, not local demo mode.
- Idle state with balance `1,000`, default bet `100`, and enter action visible.
- Bet selection changed to `250`; primary action changed to `ENTER DUEL - 250`.
- Running state showed `CASH OUT`.
- Cashout action locked the player at about `1.02x`; button changed to locked state.
- Round resolution reached `ROUND WON`, `CASHED 1.02x`, and `NEXT ROUND`.
- Share challenge rendered after a successful cashout. In headless Chromium, clipboard write fell back to manual-copy UI, which is acceptable for unsupported clipboard contexts.
- Advanced to second round after `NEXT ROUND`.
- Bottom nav/settings: settings sheet opened, had sound/history/leaderboard/help rows, backdrop closed it, and Game nav returned active.
- History panel route reached and showed history semantics.
- Leaderboard nav reached text-level leaderboard state, but my generic class-based assertion underreported visibility because `LeaderboardPanel` reuses `.history-panel`.

## Defects / Risks Found

### QA-27-01 - Lint is red before deploy

Severity: Major  
Risk: static-quality gate is failing, and `pnpm deploy` does not include lint, so known React Compiler / ESLint issues can ship unnoticed.

Evidence from `pnpm lint`:

- `src/audio/useGameAudio.ts:25` - `react-hooks/refs`: writes `multRef.current` during render.
- `src/components/LeaderboardPanel.tsx:27` - `react-hooks/set-state-in-effect`: synchronous state updates in effect.
- `src/game/history.test.ts:42` - `no-constant-binary-expression`: `null == null` constant assertion.
- `src/hooks/useHeatRamp.ts:54` - warning: missing `ref` dependency.

### QA-27-02 - Audio feedback may be unreliable under browser autoplay policy

Severity: Major if sound feedback is considered part of the cockpit feel; Minor if audio is optional.  
Risk: browser repeatedly warned that `AudioContext` could not start until a user gesture. The warnings appeared during round start/cashout/tick attempts in the production build. A user may miss tick/cashout/crash feedback, especially on first interaction or mobile.

Evidence:

- Browser log repeated: `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`

### QA-27-03 - Leaderboard panel is testability/semantics ambiguous

Severity: Minor  
Risk: `LeaderboardPanel` renders inside `.history-panel`. User-visible text still identifies `LEADERBOARD`, and `aria-label="Global leaderboard"` is present, but class reuse makes automated checks and future styling changes easier to confuse.

Evidence:

- `src/components/LeaderboardPanel.tsx:50` uses `<div className="history-panel" role="dialog" aria-label="Global leaderboard">`.
- My first class-based assertion reported `boardVisible: false` while text-level wait had passed.

## Exploratory Notes

Using SFDPOT:

- Structure: cockpit is dense but critical affordances were discoverable on mobile: onboarding, primary action, bottom nav, settings sheet.
- Function: the core loop from idle to running to locked cashout to round result works in a browser.
- Data: challenge param accepted `4.32` and normalized display; bet `250` was selectable with sufficient balance.
- Platform: mobile Chromium headless passed the flow; clipboard fell back gracefully.
- Operations: build serves correctly from Vite preview; lint gate remains operationally unresolved.
- Time: smoke covered one resolved round plus entry into a second round, not a full 5-round match.

## Not Covered

- Full 5-round match completion and `RUN IT BACK`.
- Desktop viewport visual inspection.
- Real backend data correctness beyond the browser showing `LIVE` / `PROVABLY FAIR`.
- Cross-browser checks.
- Real clipboard success path; headless context covered fallback only.
- Accessibility tree audit.

## Deploy Gate Recommendation

Recommendation: **NO-GO until lint is fixed or explicitly waived by the release owner.**

Reasoning: the product build and core smoke are good enough for continued internal playtesting, but a release gate should not ignore failing static checks in React hook/audio and leaderboard code. If this is an emergency demo, I would allow a time-boxed internal preview only with a written waiver for `pnpm lint` and the audio warning risk. For public deploy, fix `QA-27-01` first, then rerun:

```bash
pnpm test
pnpm lint
pnpm build
```

After lint is green, run one browser smoke that completes all five rounds and verifies `RUN IT BACK`.
