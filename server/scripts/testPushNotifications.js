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
const webpush = require('web-push');
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

// The browser transport reaches a push service through the web-push library
// rather than axios, so it needs its own stub - and its own record of what a
// browser would have received.
const webPushSends = [];
const prunedEndpoints = [];
let nextWebPushError = null;

webpush.sendNotification = async (subscription, payload, options) => {
  if (nextWebPushError) {
    const error = nextWebPushError;
    nextWebPushError = null;
    throw error;
  }
  webPushSends.push({
    endpoint: subscription.endpoint,
    payload: JSON.parse(payload),
    options,
  });
  return { statusCode: 201 };
};

User.updateMany = async (filter) => {
  if (filter['pushTokens.token']) prunedTokens.push(filter['pushTokens.token']);
  if (filter['webPushSubscriptions.endpoint']) prunedEndpoints.push(filter['webPushSubscriptions.endpoint']);
  return { modifiedCount: 1 };
};

const reset = () => {
  sent.length = 0;
  prunedTokens.length = 0;
  prunedEndpoints.length = 0;
  nextWebPushError = null;
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

// ---------------------------------------------------------------------------
const runComment = async () => {
  console.log('\n--- a comment alert ---');
  reset();
  const delivered = await pushService.sendCommentAlert({
    user: { pushTokens: [token('a')] },
    postId: 'post-1',
    commentId: 'comment-1',
    notificationId: 'n1',
    text: 'Is this still available? I think I lost this exact bag last week near the market.',
    commenterName: 'Yasmine',
  });

  const [message] = lastMessages();
  checkThat('reports delivery', delivered === true, '');
  check('sends one message', lastMessages().length, 1);
  check('names the commenter', message.title, 'New comment on your post');
  checkThat('includes the commenter name in the body', message.body.startsWith('Yasmine commented:'), message.body);
  checkThat('truncates a long comment', message.body.includes('…'), message.body);
  check(
    'links straight to the post that was commented on',
    message.data,
    { type: 'new_comment', notificationId: 'n1', postId: 'post-1', commentId: 'comment-1' }
  );

  reset();
  await pushService.sendCommentAlert({
    user: { pushTokens: [token('b')] },
    postId: 'post-1',
    commentId: 'comment-2',
    notificationId: 'n2',
    text: 'Contact me',
    commenterName: null,
  });
  const [anonMessage] = lastMessages();
  checkThat('falls back to generic wording without a username', anonMessage.body.startsWith('Someone commented:'), anonMessage.body);
};

// ---------------------------------------------------------------------------
const runSocialPublish = async () => {
  console.log('\n--- a social publish alert ---');
  reset();
  const delivered = await pushService.sendSocialPublishAlert({
    user: { pushTokens: [token('a'), token('b', 'ar')] },
    postId: 'post-1',
    notificationId: 'n1',
    platform: 'facebook',
    status: 'published',
  });

  const [english, arabic] = lastMessages();
  checkThat('reports delivery', delivered === true, '');
  check('one message per device', lastMessages().length, 2);
  check('names the platform rather than "social media"', english.title, 'Your listing is live on Facebook');
  checkThat('the Arabic device reads Arabic', arabic.title.includes('Facebook') && arabic.title.startsWith('إعلانك'), arabic.title);
  check(
    'carries the listing and the section of it the alert is about',
    english.data,
    {
      type: 'social_published',
      notificationId: 'n1',
      postId: 'post-1',
      platform: 'facebook',
      status: 'published',
      section: 'social-reach',
    }
  );
  checkThat(
    'rides at normal priority - the listing is already live, nothing here is urgent',
    english.priority === 'normal',
    english.priority
  );

  reset();
  await pushService.sendSocialPublishAlert({
    user: { pushTokens: [token('a')] },
    postId: 'post-1',
    notificationId: 'n2',
    platform: 'instagram',
    status: 'failed',
  });
  const [failure] = lastMessages();
  check('a failure says so, and names the platform that refused', failure.title, "We couldn't share your listing on Instagram");
  checkThat(
    'and says the listing itself is fine, which is the part that matters',
    failure.body.includes('live on Mafqoudat'),
    failure.body
  );
  check('the failed status travels with it', failure.data.status, 'failed');

  reset();
  const unknownPlatform = await pushService.sendSocialPublishAlert({
    user: { pushTokens: [token('a')] },
    postId: 'post-1',
    notificationId: 'n3',
    platform: 'threads',
    status: 'published',
  });
  checkThat('a platform this build has no wording for sends nothing', unknownPlatform === false, '');
  check('and makes no request', sent.length, 0);
};

// ---------------------------------------------------------------------------
// Browser transport (Web Push)
// ---------------------------------------------------------------------------

/**
 * Configuration diagnostics.
 *
 * Worth asserting because every failure in this transport is swallowed on
 * purpose: a deployment with no VAPID keys behaves exactly like a working one
 * that simply has no subscribers. describeConfiguration is the only thing that
 * tells those two apart - at boot (server.js) and on demand (npm run
 * doctor-push) - so if it ever starts answering "ok" for a misconfigured
 * deployment, the channel is silently un-debuggable again.
 *
 * Runs before runWebPush because configure() memoizes its first success: once a
 * valid pair has been accepted, "no keys" can never be exercised again in this
 * process.
 */
const runWebPushConfiguration = async () => {
  console.log('\n--- browser push configuration ---');

  // A fresh copy, because configure() memoizes its first success and accepting
  // a valid pair here would leave the real instance configured for the rest of
  // the process - which is exactly what runWebPush's "no keys" case needs not
  // to be. pushNotificationService captured the original at require time, so
  // this copy is this function's alone; the cache entry is restored after.
  const modulePath = require.resolve('../services/webPushService');
  const original = require.cache[modulePath];
  delete require.cache[modulePath];
  const webPushService = require('../services/webPushService');

  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_SUBJECT;
  delete process.env.WEB_PUSH_ENABLED;

  let status = webPushService.describeConfiguration();
  check('with no keys at all, the channel reports itself off', status.ok, false);
  checkThat(
    'and names both variables, so the fix does not need the source',
    status.reason.includes('VAPID_PUBLIC_KEY') && status.reason.includes('VAPID_PRIVATE_KEY'),
    status.reason
  );

  // A key that looks plausible but is not one. This is the failure that used to
  // surface only as a single line in the log at the first send, hours later.
  process.env.VAPID_PUBLIC_KEY = 'not-a-real-key';
  process.env.VAPID_PRIVATE_KEY = 'not-a-real-key-either';
  status = webPushService.describeConfiguration();
  check('a malformed key pair is caught up front, not at the first send', status.ok, false);
  checkThat('and says so in those terms', status.reason.includes('refused by web-push'), status.reason);

  const keys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;

  // No VAPID_SUBJECT, and a CLIENT_URL that is neither mailto: nor https: -
  // every developer's localhost. setVapidDetails rejects it outright, which
  // would take the whole channel down over a value that is only a contact
  // address.
  process.env.CLIENT_URL = 'http://localhost:3000';
  status = webPushService.describeConfiguration();
  check('a non-https CLIENT_URL does not take the channel down with it', status.ok, true);
  check('it falls back to a mailto: subject', status.subject, 'mailto:contact@mafqoudat.com');

  // WEB_PUSH_ENABLED is the kill switch, and has to win over a valid pair.
  process.env.WEB_PUSH_ENABLED = 'false';
  status = webPushService.describeConfiguration();
  check('the kill switch outranks a perfectly good key pair', status.ok, false);
  delete process.env.WEB_PUSH_ENABLED;

  // Leave the process exactly as runWebPush expects to find it: no keys, and
  // the real, still-unconfigured instance back in the module cache.
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.CLIENT_URL;
  require.cache[modulePath] = original;
};

/**
 * The same three alerts, to a browser instead of a phone.
 *
 * What this pins is the part that has no counterpart on the Expo side and no
 * way to fail loudly: a browser notification carries a URL rather than a
 * screen name, so a wrong or missing `url` produces a notification that looks
 * right and does nothing when clicked.
 */
const runWebPush = async () => {
  console.log('\n--- browser push ---');

  const subscription = (suffix, language = 'en') => ({
    endpoint: `https://push.example.com/${suffix}`,
    p256dh: 'BJ_p256dh_key',
    auth: 'auth_secret',
    language,
  });

  // Unconfigured first: the VAPID memo inside webPushService is set on the
  // first successful configure, so "no keys" can only be exercised before the
  // keys exist.
  reset();
  webPushSends.length = 0;
  await pushService.sendMatchAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('a')] },
    ownPostCode: 'LOST',
    alerts: [alert('1')],
  });
  check('without VAPID keys, nothing is sent to a browser', webPushSends.length, 0);

  const keys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.VAPID_SUBJECT = 'mailto:contact@mafqoudat.com';
  process.env.CLIENT_URL = 'https://mafqoudat.com';

  reset();
  webPushSends.length = 0;
  const delivered = await pushService.sendMatchAlert({
    user: {
      pushTokens: [],
      webPushSubscriptions: [subscription('a'), subscription('b', 'ar')],
    },
    ownPostCode: 'LOST',
    alerts: [alert('1')],
  });

  checkThat('reports delivery with no device tokens at all', delivered === true, '');
  check('one message per browser', webPushSends.length, 2);
  check('the English browser reads English', webPushSends[0].payload.title, 'Possible match found');
  check('the Arabic browser reads Arabic', webPushSends[1].payload.title, 'تطابق محتمل');
  check(
    'a single match links straight to the counterpart listing',
    webPushSends[0].payload.data.url,
    'https://mafqoudat.com/dash/posts/post-1'
  );

  reset();
  webPushSends.length = 0;
  await pushService.sendMatchAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('a')] },
    ownPostCode: 'LOST',
    alerts: [alert('1'), alert('2'), alert('3')],
  });
  check(
    'a burst opens the inbox, which is the only screen that can show them all',
    webPushSends[0].payload.data.url,
    'https://mafqoudat.com/dash/notifications'
  );

  reset();
  webPushSends.length = 0;
  await pushService.sendCommentAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('a')] },
    postId: 'post-9',
    commentId: 'comment-1',
    notificationId: 'n1',
    text: 'Is this still available?',
    commenterName: 'Yasmine',
  });
  check('a comment opens the post it is on', webPushSends[0].payload.data.url, 'https://mafqoudat.com/dash/posts/post-9');

  reset();
  webPushSends.length = 0;
  await pushService.sendSocialPublishAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('a')] },
    postId: 'post-9',
    notificationId: 'n2',
    platform: 'facebook',
    status: 'published',
  });
  check(
    'a social publish alert deep-links to the reach section',
    webPushSends[0].payload.data.url,
    'https://mafqoudat.com/dash/posts/post-9?section=social-reach'
  );
  check('and is held a week rather than two days', webPushSends[0].options.TTL, 7 * 24 * 60 * 60);

  // A push service answering 410 means the browser is gone for good - an
  // unpruned endpoint is a wasted send on every future alert, forever.
  reset();
  webPushSends.length = 0;
  nextWebPushError = Object.assign(new Error('Gone'), { statusCode: 410 });
  await pushService.sendCommentAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('dead')] },
    postId: 'post-9',
    commentId: 'comment-2',
    notificationId: 'n3',
    text: 'Hello',
    commenterName: null,
  });
  check('a subscription reported gone is pruned', prunedEndpoints, ['https://push.example.com/dead']);

  // Anything else is this delivery's problem, not the subscription's.
  reset();
  webPushSends.length = 0;
  nextWebPushError = Object.assign(new Error('Too Many Requests'), { statusCode: 429 });
  await pushService.sendCommentAlert({
    user: { pushTokens: [], webPushSubscriptions: [subscription('busy')] },
    postId: 'post-9',
    commentId: 'comment-3',
    notificationId: 'n4',
    text: 'Hello',
    commenterName: null,
  });
  check('a throttled delivery keeps the subscription', prunedEndpoints, []);
};

(async () => {
  await runSingle();
  await runMirror();
  await runBurst();
  await runMultilingual();
  await runEmpty();
  await runDeadDevice();
  await runDisabled();
  await runComment();
  await runSocialPublish();
  await runWebPushConfiguration();
  await runWebPush();

  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
})();
