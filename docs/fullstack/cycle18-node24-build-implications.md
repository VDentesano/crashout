# Cycle 18 Node 24 Build Implications

Role simulation: Fullstack (`fullstack-dhh`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Scope

Reviewed the app/package side of the Node 24 CI migration for `projects/crashout`.

No workflow files were edited. This note intentionally stays on package scripts, runtime assumptions, local commands, and code/package risks from GitHub JavaScript actions moving to Node 24.

## Package Manager And Runtime Observations

- The app is a standalone pnpm package at `projects/crashout`.
- `package.json` pins the package manager with `"packageManager": "pnpm@11.5.1"`.
- `pnpm-lock.yaml` is present beside the app package and uses lockfile version `9.0`.
- Current CI install shape is compatible with this package layout: install from `projects/crashout` with `pnpm install --frozen-lockfile`.
- The app declares `"type": "module"`, so local `.mjs` scripts and package-local `.js` files are expected to run as ESM.
- App scripts already use plain `node`, `tsc`, `vite`, `eslint`, Playwright, and `wrangler`; there is no `npm`, `npx`, Yarn, or Bun app script to migrate.
- The dependency set is already Node 24-friendly by engine range:
  - `@types/node` resolves to the Node 24 type line.
  - `vite@8.0.16` accepts `^20.19.0 || >=22.12.0`, so Node 24 is inside range.
  - ESLint 10 packages in the lockfile accept `^20.19.0 || ^22.13.0 || >=24`, so Node 24 is inside range.
  - `playwright@1.60.0` requires `>=18`, so Node 24 is inside range.
  - `typescript-eslint@8.61.0` accepts `^18.18.0 || ^20.9.0 || >=21.1.0`, so Node 24 is inside range.
- The app test command runs `.ts` files directly with Node. That depends on Node's built-in TypeScript type stripping behavior and the tests keeping to erasable TypeScript syntax. The current test files are simple enough for that model, and `tsconfig.node.json` already enables `erasableSyntaxOnly`.

## Do App Scripts Need Changes?

No app/package script changes are required for the Node 24 CI migration.

The current `check` script remains the right CI release gate:

```sh
pnpm run check
```

It expands to:

```sh
pnpm lint && pnpm test && pnpm build
```

That is clear and sufficient: lint, direct Node tests, TypeScript project build, and Vite production bundle.

The smoke command also remains valid:

```sh
pnpm run smoke:cockpit
```

It rebuilds first, then runs `node scripts/cockpit-smoke.mjs`. That duplicates the build after `pnpm run check`, but it keeps the smoke command self-contained for local use and CI. I would not change that as part of the Node 24 migration.

One small consistency note: `deploy` currently uses bare `wrangler`:

```json
"deploy": "pnpm run check && wrangler pages deploy dist --branch main"
```

That is not a Node 24 blocker. If this project later wants stricter reproducibility, prefer invoking the local binary with `pnpm exec wrangler ...` and add `wrangler` as a dev dependency. That is outside this migration scope.

## Local Commands To Run

Run from `projects/crashout`:

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit
```

For a true local Node 24 rehearsal, run the same commands in a shell where `node --version` reports `v24.x`.

Commands executed during this review:

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run check
```

Observed locally:

- `node --version`: `v26.2.0`, so this was not an exact Node 24 runtime rehearsal.
- `pnpm --version`: `11.5.1`.
- `pnpm install --frozen-lockfile`: passed, already up to date.
- `pnpm run check`: passed lint, all direct Node test files, TypeScript build, and Vite build.

I did not run `pnpm run smoke:cockpit` because it writes generated smoke artifacts under `docs/qa/cockpit-smoke/`, and this task requested only this fullstack doc be created or updated.

## GitHub JavaScript Actions Moving To Node 24

There are two separate runtimes to keep straight:

1. `actions/setup-node` controls the Node version used by app commands like `pnpm install`, `pnpm run check`, and Playwright setup.
2. JavaScript actions such as checkout, setup-node, pnpm setup, and artifact upload execute on the GitHub Actions runner's internal JavaScript action runtime.

The app/package side is not materially affected by JavaScript actions moving from Node 20 to Node 24. The app is only affected after the setup step places Node 24 on `PATH` for shell commands, and the package scripts already pass under the local newer Node runtime.

The main risks from the JavaScript action runtime shift are workflow/runtime risks, not app code risks:

- Self-hosted runners must be new enough for Node 24-backed JavaScript actions. GitHub's published migration notes call out runner support requirements for Node 24 action execution.
- Old action major versions can keep emitting Node 20 deprecation warnings or fail once Node 20 is removed from runners.
- Official action upgrades can have behavior changes independent of app code. Example: checkout's newer Node 24 major changes credential storage behavior while keeping normal checkout/git usage working.
- Artifact upload behavior is action-owned; if upload changes fail, the app build can still be good while smoke evidence upload fails.

For this app package, the practical risk is low:

- No native production dependency is compiled during the app gate.
- Playwright is the only heavier tool in CI, and the installed version supports modern Node.
- Direct `node *.ts` tests are the one runtime-sensitive app pattern to watch. Keep those test files to erasable TypeScript, or introduce a deliberate TS runner later if tests need enums, parameter properties, decorators, JSX/TSX, or other non-erasable syntax.

## Recommendation

Keep the app scripts unchanged for Cycle 18. The package already lines up with pnpm 11 and Node 24-era tooling.

The release confidence command remains:

```sh
pnpm install --frozen-lockfile
pnpm run check
```

For full parity with CI, add:

```sh
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit
```

The Node 24 migration work should stay concentrated in workflow action versions and runner readiness. The app/package side does not need code or script churn.
