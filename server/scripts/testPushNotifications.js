/**
 * Offline check of the push notification sender.
 *
 *   node scripts/testPushNotifications.js
 *
 * Needs no database and no network: the Expo transport is stubbed by replacing
 * axios.post, and the only model call the service makes (pruning a dead token)
 * is stubbed on the User model. What it covers is the part that is silent when
 * it breaks - which message a recipient actually receives.
 *
 * A push is composed entirely server-side, in a language the sender never sees
 * confirmed, and delivered to a device nobody is looking at. If the wrong
 * direction's wording is picked, or a burst stops collapsing into one message,
 * nothing throws and no log line appears - the user simply gets a notification
 * that reads wrong, or ten that read right.
 *
 * Exits non-zero on the first failed assertion.
 */

const axios = require('axios');
const User = require('../models/User');
const pushService = require('../services/pushNotificationService');

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

// ---------------------------------------------------------------------------
// Stubs. The service reaches the outside world in exactly two places, and both
// are replaced here: Expo over HTTPS, and the User collection when a token
// turns out to be dead.
// ---------------------------------------------------------------------------

const sent = [];
let nextTickets = null;
const prunedTokens = [];

axios.post = async (url, body) => {
  sent.push({ url, body });
  const tickets = nextTickets || body.map(() => ({ status: 'ok', id: 'ticket' }));
  nextTickets = null;
  return { data: { data: tickets } };
};

User.updateMany = async (filter) => {
  prunedTokens.push(filter['pushTokens.token']);
  return { modifiedCount: 1 };
};

const reset = () => {
  sent.length = 0;
  prunedTokens.length = 0;
  nextTickets = null;
};

const token = (suffix, language = 'en') => ({
  token: `ExponentPushToken[${suffix}]`,
  platform: 'android',
  language,
});

const alert = (id) => ({ notificationId: id, matchedPostId: `post-${id}` });

const lastMessages = () => sent[sent.length - 1]?.body || [];

// ---------------------------------------------------------------------------
console.log('\n--- token validation ---');

checkThat('accepts an ExponentPushToken', pushService.isValidPushToken('ExponentPushToken[abc-123]'), '');
checkThat('accepts the newer ExpoPushToken form', pushService.isValidPushToken('ExpoPushToken[abc]'), '');
checkThat('rejects a raw FCM token', !pushService.isValidPushToken('fH7x:APA91bF...'), '');
checkThat('rejects an empty value', !pushService.isValidPushToken(''), '');
checkThat('rejects a non-string', !pushService.isValidPushToken(null), '');

// ---------------------------------------------------------------------------
const runSingle = async () => {
  console.log('\n--- a single match ---');
  reset();
  const delivered = await pushService.sendMatchAlert({
    user: { pushTokens: [token('a')] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });

  const [message] = lastMessages();
  checkThat('reports delivery', delivered === true, '');
  check('sends one message', lastMessages().length, 1);
  check('addresses the device token', message.to, 'ExponentPushToken[a]');
  check('names the channel the app creates', message.channelId, pushService.ANDROID_CHANNEL_ID);
  checkThat(
    "a lost item's owner is told someone found something",
    /found item/.test(message.body),
    message.body
  );
  check(
    'links straight to the counterpart listing',
    message.data,
    { type: 'match_found', notificationId: 'n1', postId: 'post-n1' }
  );
};

// ---------------------------------------------------------------------------
const runMirror = async () => {
  console.log('\n--- the mirror direction ---');
  reset();
  await pushService.sendMatchAlert({
    user: { pushTokens: [token('a')] },
    ownPostCode: 'FOUND',
    alerts: [alert('n1')],
  });

  const [message] = lastMessages();
  checkThat(
    "a found item's owner is told someone lost something",
    /reported losing/.test(message.body),
    message.body
  );
};

// ---------------------------------------------------------------------------
const runBurst = async () => {
  console.log('\n--- a burst collapses into one message ---');
  reset();
  await pushService.sendMatchAlert({
    user: { pushTokens: [token('a')] },
    ownPostCode: 'LOST',
    alerts: [alert('n1'), alert('n2'), alert('n3')],
  });

  const [message] = lastMessages();
  check('one message for three matches', lastMessages().length, 1);
  check('counts them in the title', message.title, '3 possible matches');
  check(
    'opens the inbox rather than one listing',
    message.data,
    { type: 'match_found', count: 3 }
  );
};

// ---------------------------------------------------------------------------
const runMultilingual = async () => {
  console.log('\n--- one account, two devices, two languages ---');
  reset();
  await pushService.sendMatchAlert({
    user: { pushTokens: [token('a', 'ar'), token('b', 'fr')] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });

  const [arabic, french] = lastMessages();
  check('one message per device', lastMessages().length, 2);
  check('the Arabic device reads Arabic', arabic.title, 'تطابق محتمل');
  check('the French device reads French', french.title, 'Correspondance possible');
};

// ---------------------------------------------------------------------------
const runEmpty = async () => {
  console.log('\n--- nothing to send ---');
  reset();
  const noTokens = await pushService.sendMatchAlert({
    user: { pushTokens: [] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });
  const noAlerts = await pushService.sendMatchAlert({
    user: { pushTokens: [token('a')] },
    ownPostCode: 'LOST',
    alerts: [],
  });
  const badToken = await pushService.sendMatchAlert({
    user: { pushTokens: [{ token: 'not-a-token', platform: 'android', language: 'en' }] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });

  checkThat('a user with no devices sends nothing', noTokens === false, '');
  checkThat('a run with no new matches sends nothing', noAlerts === false, '');
  checkThat('a malformed token is never sent to', badToken === false, '');
  check('no request was made at all', sent.length, 0);
};

// ---------------------------------------------------------------------------
const runDeadDevice = async () => {
  console.log('\n--- a device that is gone ---');
  reset();
  nextTickets = [{ status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } }];
  const delivered = await pushService.sendMatchAlert({
    user: { pushTokens: [token('gone')] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });

  checkThat('reports nothing delivered', delivered === false, '');
  check('drops the token so it is never used again', prunedTokens, ['ExponentPushToken[gone]']);
};

// ---------------------------------------------------------------------------
const runDisabled = async () => {
  console.log('\n--- the kill switch ---');
  reset();
  process.env.PUSH_NOTIFICATIONS_ENABLED = 'false';
  const delivered = await pushService.sendMatchAlert({
    user: { pushTokens: [token('a')] },
    ownPostCode: 'LOST',
    alerts: [alert('n1')],
  });
  delete process.env.PUSH_NOTIFICATIONS_ENABLED;

  checkThat('PUSH_NOTIFICATIONS_ENABLED=false stops every send', delivered === false, '');
  check('and makes no request', sent.length, 0);
};

(async () => {
  await runSingle();
  await runMirror();
  await runBurst();
  await runMultilingual();
  await runEmpty();
  await runDeadDevice();
  await runDisabled();

  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
})();
