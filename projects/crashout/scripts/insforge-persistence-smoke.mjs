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
const outDir = process.env.SMOKE_OUT_DIR
  ? path.resolve(process.env.SMOKE_OUT_DIR)
  : path.join(projectDir, '../../docs/qa/insforge-persistence-smoke');

const runId = `cycle37-${Date.now()}-${randomUUID().slice(0, 8)}`;
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

async function postJson(label, body) {
  const response = await fetch(roundsUrl, {
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

  steps.push({ label, url: roundsUrl, status: response.status, body: data });
  check(response.status === 200, `${label} returned ${response.status}; expected 200`, data);
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
    steps,
    ...extra,
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  console.log(`INSFORGE persistence smoke: ${roundsUrl}`);
  console.log(`Synthetic player: ${playerId}`);

  const start = await postJson('rounds start writes committed rows', {
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

  const reveal = await postJson('rounds reveal reads persisted rows', {
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

  const summary = await writeSummary('passed');
  console.log(`OK ${summary.steps.length} INSFORGE commit/reveal persistence checks passed`);
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
