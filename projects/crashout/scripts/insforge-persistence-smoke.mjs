import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const defaultEventsUrl = 'https://2zzc6u78.functions.insforge.app/events';
const eventsUrl = normalizeUrl(
  process.argv[2]
    ?? process.env.INSFORGE_EVENTS_URL
    ?? process.env.VITE_INSFORGE_EVENTS_URL
    ?? defaultEventsUrl,
);
const roundsUrl = siblingUrl(eventsUrl, 'rounds');
const historyUrl = siblingUrl(eventsUrl, 'history');
const outDir = process.env.SMOKE_OUT_DIR
  ? path.resolve(process.env.SMOKE_OUT_DIR)
  : path.join(projectDir, '../../docs/qa/insforge-persistence-smoke');

const runId = `cycle92-${Date.now()}-${randomUUID().slice(0, 8)}`;
const playerId = `smoke-${runId}`;
const matchToken = randomUUID();
const clientSeed = `smoke-client-${runId}`;
const startedAt = new Date().toISOString();
const steps = [];

function normalizeUrl(url) {
  try {
    return new URL(url).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid INSFORGE events URL: ${url}`);
  }
}

function siblingUrl(url, slug) {
  if (!/\/events\/?$/.test(url)) {
    throw new Error(`INSFORGE events URL must end in /events, got: ${url}`);
  }
  return url.replace(/\/events\/?$/, `/${slug}`);
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function check(condition, message, detail = undefined) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function postJson(url, label, body, expectedStatus = 200) {
  const response = await fetch(url, {
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

  steps.push({ label, url, status: response.status, body: data });
  check(
    response.status === expectedStatus,
    `${label} returned ${response.status}; expected ${expectedStatus}`,
    data,
  );
  return data;
}

async function writeSummary(status, extra = {}) {
  await mkdir(outDir, { recursive: true });
  const summary = {
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    runId,
    playerId,
    matchToken,
    eventsUrl,
    roundsUrl,
    historyUrl,
    steps,
    ...extra,
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  console.log(`INSFORGE persistence smoke: ${eventsUrl}`);
  console.log(`Synthetic player: ${playerId}`);

  const start = await postJson(roundsUrl, 'rounds start writes committed rows', {
    action: 'start',
    matchToken,
    playerId,
    clientSeed,
    count: 2,
  });

  check(Array.isArray(start?.rounds), 'rounds start did not return an array', start);
  check(start.rounds.length === 2, 'rounds start did not return exactly 2 rounds', start);

  for (const [index, round] of start.rounds.entries()) {
    check(typeof round.roundToken === 'string' && round.roundToken.length > 0, `start round ${index} missing roundToken`, round);
    check(typeof round.serverSeedHash === 'string' && round.serverSeedHash.length === 64, `start round ${index} missing serverSeedHash`, round);
    check(round.serverSeed === undefined, `start round ${index} leaked serverSeed`, round);
    check(typeof round.crashPoint === 'number' && round.crashPoint >= 1, `start round ${index} invalid crashPoint`, round);
    check(round.nonce === index + 1, `start round ${index} invalid nonce`, round);
  }

  const reveal = await postJson(roundsUrl, 'rounds reveal reads persisted rows', {
    action: 'reveal',
    matchToken,
  });

  check(Array.isArray(reveal?.rounds), 'rounds reveal did not return an array', reveal);
  check(reveal.rounds.length === start.rounds.length, 'rounds reveal count did not match committed count', { start, reveal });

  const committedByToken = new Map(start.rounds.map((round) => [round.roundToken, round]));
  for (const revealed of reveal.rounds) {
    const committed = committedByToken.get(revealed.roundToken);
    check(Boolean(committed), 'reveal returned an unknown round token', revealed);
    check(typeof revealed.serverSeed === 'string' && revealed.serverSeed.length > 0, 'reveal did not return serverSeed', revealed);
    check(
      sha256Hex(revealed.serverSeed) === committed.serverSeedHash,
      'revealed serverSeed does not match committed hash',
      { committed, revealed },
    );
    check(revealed.clientSeed === clientSeed, 'reveal did not preserve clientSeed', revealed);
    check(revealed.nonce === committed.nonce, 'reveal nonce did not match commit', { committed, revealed });
    check(Number(revealed.crashPoint) === committed.crashPoint, 'reveal crashPoint did not match commit', { committed, revealed });
  }

  const historyRows = [
    {
      action: 'record',
      playerId,
      bet: 100,
      outcome: 'win',
      crashPoint: 2.44,
      cashoutMultiplier: 2.12,
      delta: 100,
    },
    {
      action: 'record',
      playerId,
      bet: 50,
      outcome: 'loss',
      crashPoint: 1.33,
      cashoutMultiplier: null,
      delta: -50,
    },
  ];

  for (const [index, row] of historyRows.entries()) {
    const record = await postJson(
      historyUrl,
      `history record ${index + 1} writes match row`,
      row,
      201,
    );
    check(record?.ok === true, `history record ${index + 1} did not acknowledge write`, record);
  }

  const history = await postJson(historyUrl, 'history list reads persisted rows and stats', {
    action: 'list',
    playerId,
    limit: 10,
  });

  check(Array.isArray(history?.matches), 'history list did not return matches array', history);
  check(history.matches.length === historyRows.length, 'history list returned unexpected match count', history);
  check(history?.stats && typeof history.stats === 'object', 'history list did not return stats', history);

  const matchesByOutcome = new Map(history.matches.map((match) => [match.outcome, match]));
  const win = matchesByOutcome.get('win');
  const loss = matchesByOutcome.get('loss');

  check(win?.bet === 100, 'history win row did not preserve bet', win);
  check(Number(win?.delta) === 100, 'history win row did not preserve delta', win);
  check(Number(win?.cashout_multiplier) === 2.12, 'history win row did not preserve cashout multiplier', win);
  check(loss?.bet === 50, 'history loss row did not preserve bet', loss);
  check(Number(loss?.delta) === -50, 'history loss row did not preserve delta', loss);
  check(loss?.cashout_multiplier === null, 'history loss row did not preserve null cashout', loss);

  for (const [index, match] of history.matches.entries()) {
    check(typeof match.id === 'string' && match.id.length > 0, `history row ${index} missing id`, match);
    check(typeof match.created_at === 'string' && !Number.isNaN(Date.parse(match.created_at)), `history row ${index} missing valid created_at`, match);
    check(typeof match.crash_point === 'number' && match.crash_point >= 1, `history row ${index} invalid crash_point`, match);
  }

  check(history.stats.total === 2, 'history stats total did not include both synthetic rows', history.stats);
  check(history.stats.wins === 1, 'history stats wins mismatch', history.stats);
  check(history.stats.losses === 1, 'history stats losses mismatch', history.stats);
  check(history.stats.draws === 0, 'history stats draws mismatch', history.stats);
  check(history.stats.winRate === 0.5, 'history stats winRate mismatch', history.stats);
  check(history.stats.netDelta === 50, 'history stats netDelta mismatch', history.stats);
  check(Number(history.stats.bestCashout) === 2.12, 'history stats bestCashout mismatch', history.stats);

  const summary = await writeSummary('passed');
  console.log(`OK ${summary.steps.length} INSFORGE persistence checks passed`);
  console.log(`Evidence: ${path.relative(projectDir, path.join(outDir, 'summary.json'))}`);
}

main().catch(async (error) => {
  await writeSummary('failed', {
    error: {
      message: error.message,
      detail: error.detail,
      stack: error.stack,
    },
  }).catch(() => {});
  console.error(`FAILED ${error.message}`);
  if (error.detail) console.error(JSON.stringify(error.detail, null, 2));
  process.exitCode = 1;
});
