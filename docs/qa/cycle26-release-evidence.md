# Cycle 26 QA Release Evidence

Role simulation: `qa-bach`  
Model: `gpt-5.5`, `model_reasoning_effort: medium`  
Scope: release acceptance criteria and evidence plan for opening the protected PR after Cycle 25 deterministic cockpit smoke work. Source code was not edited.

## Release Question

The release question is not "did we add an E2E hook?" The question is: does the protected PR path now give enough repeatable evidence that Crashout can still build, pass its game checks, complete a deterministic five-round cockpit match, and publish inspectable match-end artifacts before merge?

This is checking evidence with a small amount of human review. It is not full exploratory release certification.

## Acceptance Criteria

1. The PR is opened against the protected release branch from the intended Cycle 26 head SHA.
2. The PR includes only intentional source, workflow, and documentation changes. Generated local evidence stays out of the PR, especially `docs/qa/cockpit-smoke/`, `.wrangler/`, and `projects/crashout/.codegraph/`.
3. The protected GitHub Actions workflow is `Crashout CI`, with job `Lint, test, build`.
4. The protected job uses Node 24 and pnpm, installs dependencies with `pnpm install --frozen-lockfile`, and runs the release gate before browser smoke.
5. `Run release gate` completes `pnpm run check` successfully.
6. `Install Playwright Chromium` completes in GitHub Actions.
7. `Run cockpit smoke` completes `pnpm run smoke:cockpit` successfully.
8. The workflow uploads a non-expired artifact named `cockpit-smoke`.
9. The artifact contains `measurements.json` plus 16 PNG screenshots: `idle`, `running`, `round-end`, and `match-end` for desktop, tablet, mobile, and short-mobile. `history` and `settings` are measured in JSON but not screenshot-captured.
10. `measurements.json` reports 24 measured states, 4 deterministic `*-match-end` states, 0 overflow findings, and match-end E2E metadata with `rounds === 5`.
11. A human downloads or inspects the artifact before merge and confirms the match-end screenshots are not blank, clipped, or visually inconsistent with a completed match.

## Local Checks To Rerun

Run from `projects/crashout` before opening or updating the PR:

```bash
pnpm run check
SMOKE_OUT_DIR=/tmp/crashout-cycle26-cockpit-smoke pnpm run smoke:cockpit
```

Verify the smoke output shape:

```bash
node -e "const fs=require('fs'); const dir='/tmp/crashout-cycle26-cockpit-smoke'; const d=JSON.parse(fs.readFileSync(dir+'/measurements.json','utf8')); const match=d.filter(x=>x.name.endsWith('-match-end')); const summary={measurements:d.length, matchEnds:match.length, overflow:d.reduce((n,x)=>n+(x.overflow?.length||0),0), pngs:fs.readdirSync(dir).filter(f=>f.endsWith('.png')).length, e2e:match.map(x=>x.e2e)}; console.log(JSON.stringify(summary,null,2)); if (summary.measurements!==24 || summary.matchEnds!==4 || summary.overflow!==0 || summary.pngs!==16 || match.some(x=>x.e2e?.rounds!==5)) process.exit(1);"
```

Optional repeatability check when the PR changes gameplay, scoring, or the E2E hook:

```bash
rm -rf /tmp/crashout-cycle26-a /tmp/crashout-cycle26-b
SMOKE_OUT_DIR=/tmp/crashout-cycle26-a pnpm run smoke:cockpit
SMOKE_OUT_DIR=/tmp/crashout-cycle26-b pnpm run smoke:cockpit
node -e "const fs=require('fs'); const pick=p=>JSON.parse(fs.readFileSync(p+'/measurements.json','utf8')).filter(x=>x.name.endsWith('-match-end')).map(x=>[x.name,x.e2e]); const a=JSON.stringify(pick('/tmp/crashout-cycle26-a')); const b=JSON.stringify(pick('/tmp/crashout-cycle26-b')); console.log(a); if (a!==b) process.exit(1);"
```

## Expected CI Evidence

In the PR checks, confirm:

- `Crashout CI / Lint, test, build` is green for the PR head SHA intended for merge.
- The run was not cancelled, superseded, or borrowed from an older commit.
- The log shows this sequence after checkout/setup: dependency install, `Run release gate`, `Install Playwright Chromium`, `Run cockpit smoke`, and `Upload cockpit smoke artifacts`.
- The artifact list includes `cockpit-smoke` with plausible nonzero size and 14-day retention.

After downloading the artifact:

```bash
rm -rf /tmp/crashout-cycle26-gh-smoke
gh run download <run-id> -n cockpit-smoke -D /tmp/crashout-cycle26-gh-smoke
find /tmp/crashout-cycle26-gh-smoke -maxdepth 1 -type f | sort
node -e "const fs=require('fs'); const dir='/tmp/crashout-cycle26-gh-smoke'; const d=JSON.parse(fs.readFileSync(dir+'/measurements.json','utf8')); const match=d.filter(x=>x.name.endsWith('-match-end')); console.log(JSON.stringify({measurements:d.length, matchEnds:match.length, overflow:d.reduce((n,x)=>n+(x.overflow?.length||0),0), pngs:fs.readdirSync(dir).filter(f=>f.endsWith('.png')).length, e2e:match.map(x=>x.e2e)}, null, 2));"
```

Expected artifact facts:

- `measurements.json` exists and parses.
- PNG count is 16.
- Measurement count is 24.
- Match-end count is 4.
- Total overflow finding count is 0.
- Match-end entries are `desktop-match-end`, `tablet-match-end`, `mobile-match-end`, and `short-mobile-match-end`.
- Each match-end entry has `e2e.rounds === 5`, a nonempty `e2e.outcome`, and numeric player and ghost scores.

## Remaining Risks

- The deterministic hook can prove a renderable match-end state, but it does not prove the normal five-round click journey through `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, and `RUN IT BACK`.
- The browser gate is Chromium-only. Safari, Firefox, mobile WebViews, reduced-motion behavior, and assistive technology behavior remain outside this evidence.
- The smoke script checks selected overflow conditions, not all visual quality problems. Human review of screenshots is still required.
- Backend persistence, wallet reconciliation, leaderboard ranking, history writes, and production deploy identity are not proven by the cockpit artifact.
- The artifact has short retention. Any release decision that depends on it should record the run ID and the observed summary before the artifact expires.
- A dirty local tree can create false confidence. Treat local checks as preflight only; protected GitHub Actions evidence is the merge gate.

## Go/No-Go

Conditional GO to open the PR and proceed to protected GitHub Actions verification.

Do not merge until `Crashout CI / Lint, test, build` is green on the intended PR head SHA and the `cockpit-smoke` artifact has been inspected for 24 measured states, 4 deterministic five-round match-end states, 16 screenshots, and 0 overflow findings. NO-GO if the artifact is missing, stale, incomplete, or shows a broken match-end screen, even if the status check is green.
