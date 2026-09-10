/**
 * Offline check of the admin panel's server half.
 *
 *   node scripts/testAdminPanel.js
 *
 * Needs no database and no network. Three things are worth pinning here, and
 * all three are things that fail silently rather than loudly:
 *
 *   1. The day skeleton. Every chart on the panel is drawn straight off
 *      `series`, and an aggregation only answers for days that have documents.
 *      A missing quiet Tuesday does not draw a gap - it draws a straight line
 *      between the days either side of it, which is a different claim about
 *      the data than the one the data makes.
 *   2. The period-over-period delta. "Up 100%" from a previous period of zero
 *      is arithmetic, not information; the panel has to say "no comparison"
 *      instead, and that depends on percentChange answering null.
 *   3. The listing label. A Post has never had a `title` field, and the
 *      reports and promotions queues both read one - so every row in both
 *      queues rendered "No title" for as long as they have existed.
 *
 * Exits non-zero if any assertion failed.
 */

const {
  buildDaySkeleton,
  percentChange,
  utcDayStart,
} = require('../controllers/adminInsightsController');
const { postLabel } = require('../controllers/adminController');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

console.log('\n--- day skeleton ---');

const days = buildDaySkeleton(30);
check('thirty days requested, thirty returned', days.length, 30);
checkThat(
  'every entry is an ISO day',
  days.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)),
  days[0]
);
checkThat(
  'days are consecutive with no gaps',
  days.every((day, i) => {
    if (i === 0) return true;
    const prev = Date.parse(`${days[i - 1]}T00:00:00Z`);
    return Date.parse(`${day}T00:00:00Z`) - prev === 86400000;
  })
);
checkThat('the last entry is today (UTC)', days[days.length - 1] === utcDayStart(0).toISOString().slice(0, 10));
checkThat('the first entry is 29 days back', days[0] === utcDayStart(29).toISOString().slice(0, 10));

// A one-day window is the degenerate case a "today" range would ask for.
check('a one-day window is one day', buildDaySkeleton(1).length, 1);

console.log('\n--- period-over-period delta ---');

check('growth is a whole percentage', percentChange(120, 100), 20);
check('decline is signed', percentChange(80, 100), -20);
check('flat is zero, not null', percentChange(100, 100), 0);
check('no previous period means no comparison', percentChange(12, 0), null);
check('no previous period, and none now, is still no comparison', percentChange(0, 0), null);
check('a period that emptied out is -100%', percentChange(0, 40), -100);

console.log('\n--- listing label ---');

check('a listing is named by its description', postLabel({ description: 'Black leather wallet' }), 'Black leather wallet');
check(
  'a listing with no description falls back to where it was lost',
  postLabel({ description: '', exactLocation: 'Gare de Casa Voyageurs' }),
  'Gare de Casa Voyageurs'
);
check('a listing with neither is empty, not "undefined"', postLabel({}), '');
check('a missing listing is empty, not a crash', postLabel(null), '');
checkThat(
  'a long description is truncated with an ellipsis',
  (() => {
    const label = postLabel({ description: 'x'.repeat(400) });
    return label.length === 90 && label.endsWith('…');
  })()
);
checkThat(
  'Arabic text survives the round trip',
  postLabel({ description: 'محفظة جلدية سوداء' }) === 'محفظة جلدية سوداء'
);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
}
// Forced: the controllers pull in the cache layer, which keeps a timer alive.
process.exit(failures ? 1 : 0);
