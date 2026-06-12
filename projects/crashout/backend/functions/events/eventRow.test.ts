// Run: node backend/functions/events/eventRow.test.ts
// Pins the camelCase-in -> snake_case-array-out contract that the live ingest
// path depends on. This is the only part of the backend prep that executes
// before a human is in the loop, so it carries the verification weight.
import { buildEventRows } from './eventRow.ts';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

// A real event exactly as logger.ts `track()` serializes it onto the wire.
const wire = {
  name: 'match_result',
  playerId: 'p-123',
  sessionId: 's-456',
  arm: 'drop-lowest',
  ts: 1749600000000,
  props: { outcome: 'loss', playerScore: 4.2, ghostScore: 6.1 },
};

console.log('buildEventRows — maps the logger wire shape to a PostgREST array:');
const res = buildEventRows(wire);
check('accepts a well-formed event', res.ok === true);
if (res.ok) {
  const [row] = res.rows;
  check('body is a single-element array', Array.isArray(res.rows) && res.rows.length === 1);
  check('name passthrough', row.name === 'match_result');
  check('playerId -> player_id', row.player_id === 'p-123');
  check('sessionId -> session_id', row.session_id === 's-456');
  check('arm passthrough', row.arm === 'drop-lowest');
  check('ts passthrough', row.ts === 1749600000000);
  check('props passthrough (loss outcome preserved for the gate)', row.props.outcome === 'loss');
  // No stray camelCase keys leaked into the row — columns must be snake_case only.
  const keys = Object.keys(row).sort().join(',');
  check(`exactly the 6 table columns (${keys})`, keys === 'arm,name,player_id,props,session_id,ts');
}

console.log('\nbuildEventRows — rejects malformed / hostile input:');
check('rejects non-object', buildEventRows('nope').ok === false);
check('rejects null', buildEventRows(null).ok === false);
check('rejects unknown event name', buildEventRows({ ...wire, name: 'drop_table' }).ok === false);
check('rejects missing playerId', buildEventRows({ ...wire, playerId: '' }).ok === false);
check('rejects invalid arm', buildEventRows({ ...wire, arm: 'cheater' }).ok === false);
check('rejects non-numeric ts', buildEventRows({ ...wire, ts: 'soon' }).ok === false);
check('rejects array props', buildEventRows({ ...wire, props: [1, 2] }).ok === false);
check('defaults missing props to {}', (() => {
  const r = buildEventRows({ ...wire, props: undefined });
  return r.ok && JSON.stringify(r.rows[0].props) === '{}';
})());

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
