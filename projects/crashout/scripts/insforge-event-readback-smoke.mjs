import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const defaultEventsUrl = 'https://2zzc6u78.functions.insforge.app/events';
const eventsUrl = normalizeUrl(
  process.argv[2]
    ?? process.env.INSFORGE_EVENTS_URL
    ?? process.env.VITE_INSFORGE_EVENTS_URL
    ?? defaultEventsUrl,
);
const outDir = process.env.SMOKE_OUT_DIR
  ? path.resolve(process.env.SMOKE_OUT_DIR)
  : path.join(projectDir, '../../docs/qa/insforge-event-readback-smoke');
const smokeCycle = Number(process.env.SMOKE_CYCLE ?? 107);

check(Number.isInteger(smokeCycle) && smokeCycle > 0, 'SMOKE_CYCLE must be a positive integer');

const runId = `smoke-c${smokeCycle}-${Date.now()}-${randomUUID().slice(0, 8)}`;
const playerId = runId;
const sessionId = runId;
const marker = randomUUID();
const ts = Date.now();
const startedAt = new Date().toISOString();
const steps = [];
let projectLinked = false;

function normalizeUrl(url) {
  try {
    return new URL(url).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid INSFORGE events URL: ${url}`);
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

async function postEvent() {
  const body = {
    name: 'experiment_arm',
    playerId,
    sessionId,
    arm: 'banked',
    ts,
    props: {
      smoke: true,
      cycle: smokeCycle,
      kind: 'insforge-persistence',
      runId,
      marker,
    },
  };

  const response = await fetch(eventsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  steps.push({
    label: 'events ingest writes synthetic analytics row',
    url: eventsUrl,
    status: response.status,
    body: data,
  });

  check(response.status === 202, `events ingest returned ${response.status}; expected 202`, data);
  check(data?.ok === true, 'events ingest did not acknowledge write', data);
}

async function queryEventRows() {
  await ensureInsforgeProjectLink();

  const sql = [
    'select id, name, player_id, session_id, arm, ts, props, created_at',
    'from public.events',
    `where player_id = ${sqlString(playerId)}`,
    `and session_id = ${sqlString(sessionId)}`,
    `and name = ${sqlString('experiment_arm')}`,
    `and ts = ${ts}`,
    'order by created_at desc',
    'limit 5',
  ].join(' ');

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
      label: 'insforge cli sql reads persisted analytics row',
      command: 'pnpm dlx @insforge/cli db query <event-readback-sql> --json',
      status: 'ok',
      stderr: stderr.trim() || undefined,
      body: parsed,
    });
    return parsed;
  } catch (error) {
    steps.push({
      label: 'insforge cli sql reads persisted analytics row',
      command: 'pnpm dlx @insforge/cli db query <event-readback-sql> --json',
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

async function writeSummary(status, extra = {}) {
  await mkdir(outDir, { recursive: true });
  const summary = {
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    runId,
    playerId,
    sessionId,
    marker,
    eventsUrl,
    steps,
    ...extra,
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  console.log(`INSFORGE event readback smoke: ${eventsUrl}`);
  console.log(`Synthetic event player: ${playerId}`);

  await postEvent();
  const queryResult = await queryEventRows();
  const rows = rowsFromQueryResult(queryResult);

  check(rows.length === 1, 'SQL readback did not return exactly one synthetic event row', queryResult);

  const row = rows[0];
  check(row.name === 'experiment_arm', 'readback row did not preserve event name', row);
  check(row.player_id === playerId, 'readback row did not preserve player_id', row);
  check(row.session_id === sessionId, 'readback row did not preserve session_id', row);
  check(row.arm === 'banked', 'readback row did not preserve arm', row);
  check(Number(row.ts) === ts, 'readback row did not preserve timestamp', row);
  check(row.props?.smoke === true, 'readback row did not preserve smoke marker', row);
  check(Number(row.props?.cycle) === smokeCycle, 'readback row did not preserve smoke cycle', row);
  check(row.props?.kind === 'insforge-persistence', 'readback row did not preserve smoke kind', row);
  check(row.props?.runId === runId, 'readback row did not preserve run id', row);
  check(row.props?.marker === marker, 'readback row did not preserve unique marker', row);
  check(typeof row.created_at === 'string' && !Number.isNaN(Date.parse(row.created_at)), 'readback row missing valid created_at', row);

  await writeSummary('passed', { rowsRead: rows.length, eventId: row.id });
  console.log(`INSFORGE event readback smoke passed: ${path.relative(projectDir, outDir)}/summary.json`);
}

main().catch(async (error) => {
  const detail = {
    message: error.message,
    detail: error.detail,
    exitCode: error.code,
  };
  await writeSummary('failed', { error: detail });
  console.error('INSFORGE event readback smoke failed:', detail);
  process.exitCode = 1;
});
