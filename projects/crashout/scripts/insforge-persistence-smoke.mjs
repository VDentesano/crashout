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
const allowSharedBackend = ['1', 'true', 'yes'].includes(
  String(process.env.INSFORGE_SMOKE_ALLOW_SHARED_BACKEND ?? '').toLowerCase(),
);
const roundsUrl = siblingUrl(eventsUrl, 'rounds');
const historyUrl = siblingUrl(eventsUrl, 'history');
const balanceUrl = siblingUrl(eventsUrl, 'balance');
const leaderboardUrl = siblingUrl(eventsUrl, 'leaderboard');
const outDir = process.env.SMOKE_OUT_DIR
  ? path.resolve(process.env.SMOKE_OUT_DIR)
  : path.join(projectDir, '../../docs/qa/insforge-persistence-smoke');

const smokeCycle = 'cycle99';
const runId = `${smokeCycle}-${Date.now()}-${randomUUID().slice(0, 8)}`;
const playerId = `smoke-${runId}`;
const leaderboardPlayerId = `smoke-leaderboard-${runId}`;
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

function checkTargetIsolation() {
  if (eventsUrl !== defaultEventsUrl || allowSharedBackend) return;

  throw new Error(
    [
      'Refusing to run INSFORGE persistence smoke against the shared default backend without acknowledgement.',
      'This smoke writes durable synthetic rounds, history, balance, and leaderboard rows.',
      'Use an isolated INSFORGE backend URL, or set INSFORGE_SMOKE_ALLOW_SHARED_BACKEND=true for an intentional shared-backend run.',
    ].join(' '),
  );
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

function almostEqual(actual, expected, epsilon = 0.000001) {
  return Math.abs(Number(actual) - expected) <= epsilon;
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
    leaderboardPlayerId,
    matchToken,
    eventsUrl,
    roundsUrl,
    historyUrl,
    balanceUrl,
    leaderboardUrl,
    sharedBackend: eventsUrl === defaultEventsUrl,
    sharedBackendAcknowledged: allowSharedBackend,
    steps,
    ...extra,
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  checkTargetIsolation();

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

  const leaderboardRows = [
    { cashoutMultiplier: 9999.9999, crashPoint: 9999.9999 },
    { cashoutMultiplier: 8.75, crashPoint: 9.25 },
    { cashoutMultiplier: 4.5, crashPoint: 5.12 },
    { cashoutMultiplier: 3.25, crashPoint: 3.9 },
    { cashoutMultiplier: 2.5, crashPoint: 2.95 },
  ];

  for (const [index, row] of leaderboardRows.entries()) {
    const record = await postJson(
      historyUrl,
      `leaderboard seed ${index + 1} writes qualifying match row`,
      {
        action: 'record',
        playerId: leaderboardPlayerId,
        bet: 500,
        outcome: 'win',
        crashPoint: row.crashPoint,
        cashoutMultiplier: row.cashoutMultiplier,
        delta: 500,
      },
      201,
    );
    check(record?.ok === true, `leaderboard seed ${index + 1} did not acknowledge write`, record);
  }

  const leaderboardHistory = await postJson(historyUrl, 'leaderboard seed history reads qualification rows', {
    action: 'list',
    playerId: leaderboardPlayerId,
    limit: 10,
  });

  check(Array.isArray(leaderboardHistory?.matches), 'leaderboard seed history did not return matches array', leaderboardHistory);
  check(leaderboardHistory.matches.length === leaderboardRows.length, 'leaderboard seed history returned unexpected match count', leaderboardHistory);
  check(leaderboardHistory.stats.total === 5, 'leaderboard seed history stats total mismatch', leaderboardHistory.stats);
  check(leaderboardHistory.stats.wins === 5, 'leaderboard seed history stats wins mismatch', leaderboardHistory.stats);
  check(leaderboardHistory.stats.losses === 0, 'leaderboard seed history stats losses mismatch', leaderboardHistory.stats);
  check(leaderboardHistory.stats.draws === 0, 'leaderboard seed history stats draws mismatch', leaderboardHistory.stats);
  check(leaderboardHistory.stats.winRate === 1, 'leaderboard seed history stats winRate mismatch', leaderboardHistory.stats);
  check(leaderboardHistory.stats.netDelta === 2500, 'leaderboard seed history stats netDelta mismatch', leaderboardHistory.stats);
  check(
    almostEqual(leaderboardHistory.stats.bestCashout, 9999.9999),
    'leaderboard seed history stats bestCashout mismatch',
    leaderboardHistory.stats,
  );

  const invalidLeaderboardLimit = await postJson(
    leaderboardUrl,
    'leaderboard rejects invalid limit',
    {
      action: 'list',
      metric: 'netDelta',
      limit: 51,
    },
    400,
  );

  check(
    typeof invalidLeaderboardLimit?.error === 'string' && invalidLeaderboardLimit.error.includes('limit'),
    'leaderboard invalid limit did not return expected error',
    invalidLeaderboardLimit,
  );

  const assertLeaderboardEntry = (response, metric, expectedValue, expectedMatches) => {
    check(Array.isArray(response?.leaderboard), `leaderboard ${metric} did not return leaderboard array`, response);
    const entry = response.leaderboard.find((candidate) => candidate.playerId === leaderboardPlayerId);
    check(Boolean(entry), `leaderboard ${metric} did not include synthetic player`, response);
    check(Number.isInteger(entry.rank) && entry.rank >= 1, `leaderboard ${metric} returned invalid rank`, entry);
    check(
      almostEqual(entry.value, expectedValue),
      `leaderboard ${metric} returned unexpected value`,
      entry,
    );
    check(
      entry.matchesPlayed === expectedMatches,
      `leaderboard ${metric} returned unexpected matchesPlayed`,
      entry,
    );
  };

  const netDeltaLeaderboard = await postJson(leaderboardUrl, 'leaderboard netDelta aggregates persisted matches', {
    action: 'list',
    metric: 'netDelta',
    window: 'all',
    limit: 50,
  });
  assertLeaderboardEntry(netDeltaLeaderboard, 'netDelta', 2500, 5);

  const bestCashoutLeaderboard = await postJson(leaderboardUrl, 'leaderboard bestCashout aggregates persisted matches', {
    action: 'list',
    metric: 'bestCashout',
    window: 'all',
    limit: 50,
  });
  assertLeaderboardEntry(bestCashoutLeaderboard, 'bestCashout', 9999.9999, 5);

  const winRateLeaderboard = await postJson(leaderboardUrl, 'leaderboard winRate qualifies persisted matches', {
    action: 'list',
    metric: 'winRate',
    window: 'all',
    limit: 50,
  });
  assertLeaderboardEntry(winRateLeaderboard, 'winRate', 1, 5);

  const initialBalance = await postJson(balanceUrl, 'balance get creates persisted player row', {
    action: 'get',
    playerId,
  });

  check(initialBalance?.balance === 1000, 'balance get did not create default balance', initialBalance);

  const prematureRebuy = await postJson(
    balanceUrl,
    'balance rebuy rejects sufficient bankroll',
    {
      action: 'rebuy',
      playerId,
    },
    400,
  );

  check(
    typeof prematureRebuy?.error === 'string' && prematureRebuy.error.includes('balance is sufficient'),
    'balance rebuy did not reject sufficient bankroll with expected error',
    prematureRebuy,
  );

  const winBalance = await postJson(balanceUrl, 'balance apply win persists positive delta', {
    action: 'apply',
    playerId,
    bet: 100,
    outcome: 'win',
  });

  check(winBalance?.delta === 100, 'balance win did not return expected delta', winBalance);
  check(winBalance?.balance === 1100, 'balance win did not persist expected balance', winBalance);

  const afterWin = await postJson(balanceUrl, 'balance get reads win reconciliation', {
    action: 'get',
    playerId,
  });

  check(afterWin?.balance === 1100, 'balance get did not read persisted win balance', afterWin);

  const lossBalance = await postJson(balanceUrl, 'balance apply loss persists negative delta', {
    action: 'apply',
    playerId,
    bet: 500,
    outcome: 'loss',
  });

  check(lossBalance?.delta === -500, 'balance loss did not return expected delta', lossBalance);
  check(lossBalance?.balance === 600, 'balance loss did not persist expected balance', lossBalance);

  const afterLoss = await postJson(balanceUrl, 'balance get reads loss reconciliation', {
    action: 'get',
    playerId,
  });

  check(afterLoss?.balance === 600, 'balance get did not read persisted loss balance', afterLoss);

  const drawBalance = await postJson(balanceUrl, 'balance apply draw persists zero delta', {
    action: 'apply',
    playerId,
    bet: 250,
    outcome: 'draw',
  });

  check(drawBalance?.delta === 0, 'balance draw did not return zero delta', drawBalance);
  check(drawBalance?.balance === 600, 'balance draw changed balance unexpectedly', drawBalance);

  const afterDraw = await postJson(balanceUrl, 'balance get reads draw reconciliation', {
    action: 'get',
    playerId,
  });

  check(afterDraw?.balance === 600, 'balance get did not read persisted draw balance', afterDraw);

  const nearBroke = await postJson(balanceUrl, 'balance apply loss moves player near broke', {
    action: 'apply',
    playerId,
    bet: 500,
    outcome: 'loss',
  });

  check(nearBroke?.balance === 100, 'balance near-broke loss did not persist expected balance', nearBroke);

  const broke = await postJson(balanceUrl, 'balance apply loss clamps at zero', {
    action: 'apply',
    playerId,
    bet: 100,
    outcome: 'loss',
  });

  check(broke?.delta === -100, 'balance zeroing loss did not return expected delta', broke);
  check(broke?.balance === 0, 'balance zeroing loss did not clamp to zero', broke);

  const rebuy = await postJson(balanceUrl, 'balance rebuy restores persisted bankroll', {
    action: 'rebuy',
    playerId,
  });

  check(rebuy?.balance === 1000, 'balance rebuy did not restore default bankroll', rebuy);

  const afterRebuy = await postJson(balanceUrl, 'balance get reads rebuy reconciliation', {
    action: 'get',
    playerId,
  });

  check(afterRebuy?.balance === 1000, 'balance get did not read persisted rebuy balance', afterRebuy);

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
