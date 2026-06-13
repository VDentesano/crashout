import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const suppliedUrl = process.argv[2] ?? process.env.SMOKE_BASE_URL;
const outDir = path.resolve(process.env.SMOKE_OUT_DIR ?? path.join(projectDir, '../../docs/qa/cockpit-smoke'));
const shouldStartPreview = !suppliedUrl;
const previewPort = shouldStartPreview ? Number(process.env.SMOKE_PORT ?? (await findFreePort())) : null;
const baseUrl = suppliedUrl ?? `http://127.0.0.1:${previewPort}/`;

fs.mkdirSync(outDir, { recursive: true });
for (const entry of fs.readdirSync(outDir)) {
  if (entry.endsWith('.png') || entry === 'measurements.json') {
    fs.rmSync(path.join(outDir, entry));
  }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Unable to allocate a preview port'));
        }
      });
    });
  });
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', reject);
    req.setTimeout(1_000, () => {
      req.destroy(new Error(`Timed out waiting for ${url}`));
    });
  });
}

async function waitForServer(url, timeout = 15_000) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeout) {
    try {
      const status = await request(url);
      if (status >= 200 && status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Preview server did not become ready at ${url}: ${lastError?.message ?? 'no response'}`);
}

function startPreview() {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(
    pnpm,
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'],
    {
      cwd: projectDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  child.on('exit', (code, signal) => {
    if (!stoppingPreview && (code || signal)) {
      console.error(`Vite preview exited early with ${code ?? signal}`);
      console.error(output.trim());
    }
  });

  return child;
}

async function capture(page, name) {
  const screenshot = await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
  });

  if (screenshot.length < 2_000) {
    throw new Error(`${name}.png looks too small to be a useful smoke artifact`);
  }
}

async function load(page) {
  const url = new URL(baseUrl);
  url.searchParams.set('crashoutE2E', '1');

  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('crashout_onboarded_v1', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__CRASHOUT_E2E__?.version === 1);
  await page.waitForTimeout(350);
}

async function measure(page, name) {
  return page.evaluate((measurementName) => {
    const selectors = [
      '.app',
      '.app-header',
      '.nav-island',
      '.game-aside',
      '.arena',
      '.round-console',
      '.app-footer',
      '.history-panel',
      '.sheet',
    ];
    const rects = {};

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      rects[selector] = {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }

    const inspected = [...document.querySelectorAll('button, .chip, .ticker, .panel, .verdict, .history-panel, .sheet')];
    const overflow = inspected
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1;
      })
      .slice(0, 24)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: String(element.className),
          text: element.textContent.trim().slice(0, 48),
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      });

    return {
      name: measurementName,
      phase: document.querySelector('.primary')?.textContent.trim() ?? null,
      innerWidth,
      innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      activeElement: document.activeElement?.className ?? null,
      rects,
      overflow,
    };
  }, name);
}

async function click(page, selector) {
  return page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if (!element) return false;
    element.click();
    return true;
  }, selector);
}

async function waitForPrimary(page, predicate, timeout = 5_000) {
  const started = Date.now();
  let label = '';

  while (Date.now() - started < timeout) {
    label = await page.evaluate(() => document.querySelector('.primary')?.textContent.trim() ?? '');
    if (predicate(label)) return label;
    await page.waitForTimeout(120);
  }

  return label;
}

async function completeMatch(page) {
  const state = await page.evaluate(() => window.__CRASHOUT_E2E__?.completeMatch());

  if (state?.phase !== 'matchEnd' || !state.matchResult || state.rounds.length !== 5) {
    throw new Error(`E2E hook did not complete a match: ${JSON.stringify(state)}`);
  }

  await page.waitForFunction(() => document.querySelector('.verdict.match') !== null);
  return state;
}

function assertSmoke(results) {
  const overflowFailures = results.filter((result) => result.overflow?.length);
  const matchEnds = results.filter((result) => result.name.endsWith('-match-end'));
  const matchEndFailures = matchEnds.filter((result) => {
    return result.phase !== 'RUN IT BACK ↻'
      || result.e2e?.rounds !== 5
      || !result.e2e?.outcome
      || typeof result.e2e?.playerScore !== 'number'
      || typeof result.e2e?.ghostScore !== 'number';
  });
  const missingCore = results.filter((result) => {
    if (!result.name.endsWith('-idle')) return false;
    return !result.rects['.app'] || !result.rects['.arena'] || !result.rects['.round-console'];
  });

  if (overflowFailures.length || missingCore.length || matchEnds.length !== viewports.length || matchEndFailures.length) {
    const summary = {
      overflowFailures: overflowFailures.map(({ name, overflow }) => ({ name, overflow })),
      missingCore: missingCore.map(({ name, rects }) => ({ name, rects })),
      matchEndCount: matchEnds.length,
      matchEndFailures: matchEndFailures.map(({ name, phase, e2e }) => ({ name, phase, e2e })),
    };
    throw new Error(`Cockpit smoke failed:\n${JSON.stringify(summary, null, 2)}`);
  }
}

const viewports = [
  ['desktop', 1440, 900],
  ['tablet', 820, 1180],
  ['mobile', 390, 844],
  ['short-mobile', 390, 640],
];

let preview = null;
let stoppingPreview = false;
const results = [];

try {
  if (shouldStartPreview) {
    if (!fs.existsSync(path.join(projectDir, 'dist', 'index.html'))) {
      execFileSync('pnpm', ['run', 'build'], { cwd: projectDir, stdio: 'inherit' });
    }
    preview = startPreview();
  }

  await waitForServer(baseUrl);

  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of viewports) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        isMobile: width < 600,
      });
      const page = await context.newPage();

      await load(page);
      results.push(await measure(page, `${name}-idle`));
      await capture(page, `${name}-idle`);

      await click(page, '.nav-item[aria-label="History"]');
      await page.waitForTimeout(250);
      results.push(await measure(page, `${name}-history`));

      await click(page, '.nav-item[aria-label="Settings"]');
      await page.waitForTimeout(250);
      results.push(await measure(page, `${name}-settings`));

      await click(page, '.nav-item[aria-label="Game"]');
      await page.waitForTimeout(250);
      await click(page, '.primary');
      await page.waitForTimeout(700);
      results.push(await measure(page, `${name}-running`));
      await capture(page, `${name}-running`);

      await click(page, '.primary');
      await waitForPrimary(page, (text) => !text.includes('LOCKED') && !text.includes('CASH OUT'), 5_000);
      results.push(await measure(page, `${name}-round-end`));
      await capture(page, `${name}-round-end`);

      const completed = await completeMatch(page);
      results.push({
        ...(await measure(page, `${name}-match-end`)),
        e2e: {
          outcome: completed.matchResult.outcome,
          rounds: completed.rounds.length,
          playerScore: completed.matchResult.playerScore,
          ghostScore: completed.matchResult.ghostScore,
        },
      });
      await capture(page, `${name}-match-end`);

      await context.close();
    }
  } finally {
    await browser.close();
  }

  assertSmoke(results);
} finally {
  fs.writeFileSync(path.join(outDir, 'measurements.json'), `${JSON.stringify(results, null, 2)}\n`);
  if (preview) {
    stoppingPreview = true;
    preview.kill();
  }
}

console.log(`Wrote smoke screenshots and measurements to ${outDir}`);
console.log(JSON.stringify(results.map(({ name, phase, innerWidth, innerHeight, documentHeight, bodyHeight, overflow }) => ({
  name,
  phase,
  innerWidth,
  innerHeight,
  documentHeight,
  bodyHeight,
  overflowCount: overflow.length,
})), null, 2));
