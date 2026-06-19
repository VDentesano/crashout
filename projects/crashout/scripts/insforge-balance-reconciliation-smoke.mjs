import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const defaultBalanceUrl = 'https://2zzc6u78.functions.insforge.app/balance';
const balanceUrl = normalizeUrl(
  process.argv[2]
    ?? process.env.INSFORGE_BALANCE_URL
    ?? deriveBalanceUrl(process.env.INSFORGE_EVENTS_URL ?? process.env.VITE_INSFORGE_EVENTS_URL)
    ?? defaultBalanceUrl,
);
const outDir = process.env.SMOKE_OUT_DIR
  ? path.resolve(process.env.SMOKE_OUT_DIR)
  : path.join(projectDir, '../../docs/qa/insforge-balance-reconciliation-smoke');
const smokeCycle = Number(process.env.SMOKE_CYCLE ?? 107);
const keepPlayer = process.env.SMOKE_KEEP_PLAYER === 'true';

check(Number.isInteger(smokeCycle) && smokeCycle > 0, 'SMOKE_CYCLE must be a positive integer');

const runId = `smoke-c${smokeCycle}-${Date.now()}-${randomUUID().slice(0, 8)}`;
const playerId = runId;
const startedAt = new Date().toISOString();
const steps = [];
let cleanupResult = null;
let projectLinked = false;

function deriveBalanceUrl(url) {
  if (!url) return undefined;
  return normalizeUrl(url).replace(/\/events$/, '/balance');
}

function normalizeUrl(url) {
  try {
    return new URL(url).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid INSFORGE balance URL: ${url}`);
  }
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function check(condition, message, detail = undefined) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function postBalance(body, label, expectedStatus = 200) {
  const response = await fetch(balanceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, ...body }),
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  steps.push({ label, url: balanceUrl, status: response.status, body: data });
  check(response.status === expectedStatus, `${label} returned ${response.status}; expected ${expectedStatus}`, data);
  return data;
}

async function queryRows(label) {
  const sql = [
    'select player_id, balance, updated_at',
    'from public.players',
    `where player_id = ${sqlString(playerId)}`,
    'limit 5',
  ].join(' ');

  return runQuery(sql, label, 'pnpm dlx @insforge/cli db query <player-readback-sql> --json');
}

async function cleanupPlayer() {
  if (keepPlayer) {
    cleanupResult = { skipped: true, reason: 'SMOKE_KEEP_PLAYER=true' };
    return;
  }

  const deleteSql = `delete from public.players where player_id = ${sqlString(playerId)}`;
  const deleteResult = await runQuery(deleteSql, 'insforge cli deletes synthetic player row', 'pnpm dlx @insforge/cli db query <player-cleanup-sql> --json');
  const verifyResult = await queryRows('insforge cli verifies synthetic player cleanup');
  const rows = rowsFromQueryResult(verifyResult);
  cleanupResult = { skipped: false, deleteResult, rowsAfterCleanup: rows.length };
  check(rows.length === 0, 'Synthetic player cleanup left rows behind', verifyResult);
}

async function runQuery(sql, label, command) {
  await ensureInsforgeProjectLink();

  try {
    const { stdout, stderr } = await execFileAsync(
      'pnpm',
      ['dlx', '@insforge/cli', 'db', 'query', sql, '--json'],
      {
        cwd: projectDir,
        maxBuffer: 1024 * 1024,
        env: process.env,
      },
    );

    const output = stdout.trim();
    const parsed = output ? JSON.parse(output) : {};
    steps.push({
      label,
      command,
      status: 'ok',
      stderr: stderr.trim() || undefined,
      body: parsed,
    });
    return parsed;
  } catch (error) {
    steps.push({
      label,
      command,
      status: 'failed',
      exitCode: error.code,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
    });
    throw error;
  }
}

async function ensureInsforgeProjectLink() {
  if (projectLinked || !process.env.INSFORGE_PROJECT_ID) return;

  try {
    const { stderr } = await execFileAsync(
      'pnpm',
      ['dlx', '@insforge/cli', 'link', '--project-id', process.env.INSFORGE_PROJECT_ID],
      {
        cwd: projectDir,
        maxBuffer: 1024 * 1024,
        env: process.env,
      },
    );

    steps.push({
      label: 'insforge cli links project from INSFORGE_PROJECT_ID',
      command: 'pnpm dlx @insforge/cli link --project-id <redacted>',
      status: 'ok',
      stderr: stderr.trim() || undefined,
    });
    projectLinked = true;
  } catch (error) {
    steps.push({
      label: 'insforge cli links project from INSFORGE_PROJECT_ID',
      command: 'pnpm dlx @insforge/cli link --project-id <redacted>',
      status: 'failed',
      exitCode: error.code,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
    });
    throw error;
  }
}

function rowsFromQueryResult(result) {
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

async function expectSinglePlayerRow(expectedBalance, label) {
  const queryResult = await queryRows(label);
  const rows = rowsFromQueryResult(queryResult);
  check(rows.length === 1, `${label} did not return exactly one synthetic player row`, queryResult);

  const row = rows[0];
  check(row.player_id === playerId, `${label} did not preserve player_id`, row);
  check(Number(row.balance) === expectedBalance, `${label} did not persist expected balance`, row);
  check(typeof row.updated_at === 'string' && !Number.isNaN(Date.parse(row.updated_at)), `${label} missing valid updated_at`, row);
  return row;
}

async function writeSummary(status, extra = {}) {
  await mkdir(outDir, { recursive: true });
  const summary = {
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    runId,
    playerId,
    balanceUrl,
    keepPlayer,
    steps,
    cleanup: cleanupResult,
    ...extra,
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  console.log(`INSFORGE balance reconciliation smoke: ${balanceUrl}`);
  console.log(`Synthetic balance player: ${playerId}`);

  const initial = await postBalance({ action: 'get' }, 'balance get creates synthetic player');
  check(initial?.balance === 1000, 'initial balance response was not 1000', initial);
  await expectSinglePlayerRow(1000, 'insforge cli reads initial player balance');

  const loss = await postBalance(
    { action: 'apply', bet: 500, outcome: 'loss' },
    'balance apply loss persists debit',
  );
  check(loss?.balance === 500, 'loss response did not return balance 500', loss);
  check(loss?.delta === -500, 'loss response did not return delta -500', loss);
  await expectSinglePlayerRow(500, 'insforge cli reads post-loss player balance');

  const win = await postBalance(
    { action: 'apply', bet: 250, outcome: 'win' },
    'balance apply win persists credit',
  );
  check(win?.balance === 750, 'win response did not return balance 750', win);
  check(win?.delta === 250, 'win response did not return delta 250', win);
  await expectSinglePlayerRow(750, 'insforge cli reads post-win player balance');

  const rebuy = await postBalance({ action: 'rebuy' }, 'balance rejects rebuy while solvent', 400);
  check(rebuy?.error === 'rebuy not allowed: balance is sufficient', 'rebuy rejection message changed', rebuy);
  await expectSinglePlayerRow(750, 'insforge cli confirms rejected rebuy did not mutate balance');

  await cleanupPlayer();
  await writeSummary('passed', { finalVerifiedBalance: 750 });
  console.log(`INSFORGE balance reconciliation smoke passed: ${path.relative(projectDir, outDir)}/summary.json`);
}

main().catch(async (error) => {
  const detail = {
    message: error.message,
    detail: error.detail,
    exitCode: error.code,
  };

  try {
    await cleanupPlayer();
  } catch (cleanupError) {
    cleanupResult = {
      status: 'failed',
      message: cleanupError.message,
      detail: cleanupError.detail,
      exitCode: cleanupError.code,
    };
  }

  await writeSummary('failed', { error: detail });
  console.error('INSFORGE balance reconciliation smoke failed:', detail);
  process.exitCode = 1;
});
