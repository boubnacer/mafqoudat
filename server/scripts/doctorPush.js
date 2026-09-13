#!/usr/bin/env node
/**
 * Push channel doctor - answers "why has nobody received a notification?"
 * without sending one, and optionally by sending one.
 *
 *   npm run doctor-push                       -- configuration only, no DB
 *   npm run doctor-push -- --db               -- and what the database holds
 *   npm run doctor-push -- --user=a@b.com     -- one account's devices/browsers
 *   npm run doctor-push -- --user=a@b.com --send
 *                                             -- really deliver a test alert
 *
 * The reason this exists: every failure in both transports is swallowed by
 * design (pushNotificationService and webPushService never throw, because a
 * push that cannot be sent must never cost a match, a comment or a publish).
 * That contract is right, and it makes an unconfigured deployment behave
 * exactly like a working one with no subscribers - so the only way to tell
 * them apart is to ask.
 *
 * `--send` is the end-to-end check: it goes through the real transports to the
 * real push services, so a notification really appears on the account's
 * devices and browsers. Nothing is written to the Notification collection -
 * this is a delivery test, not a fake alert in someone's inbox.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const webPushService = require('../services/webPushService');

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const valueOf = (name) => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const userQuery = valueOf('user');
const wantsSend = hasFlag('send');
const wantsDb = hasFlag('db') || !!userQuery || wantsSend;

const ok = (message) => console.log(`  ✅ ${message}`);
const bad = (message) => console.log(`  ❌ ${message}`);
const warn = (message) => console.log(`  ⚠️  ${message}`);
const info = (message) => console.log(`     ${message}`);

const section = (title) => console.log(`\n${title}\n${'-'.repeat(title.length)}`);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const checkConfiguration = () => {
  let healthy = true;

  section('Browser push (Web Push)');
  const webPush = webPushService.describeConfiguration();
  if (webPush.ok) {
    ok('VAPID keys configured and accepted by web-push');
    info(`public key ${webPush.publicKeyPreview}`);
    info(`subject    ${webPush.subject}`);
  } else {
    healthy = false;
    bad(webPush.reason);
    info('Browsers cannot receive anything until this is set. See docs/web-push.md.');
  }

  // Every browser notification carries a URL to open, built from CLIENT_URL.
  // Without it the payload's `url` is a bare path, the service worker's
  // `notificationclick` cannot resolve an origin, and the notification appears
  // but does nothing when clicked - which reads as "push is broken" too.
  const clientUrl = (process.env.CLIENT_URL || '').trim();
  if (!clientUrl) {
    healthy = false;
    bad('CLIENT_URL is not set - every browser notification would open a broken link');
  } else if (!/^https?:\/\//i.test(clientUrl)) {
    healthy = false;
    bad(`CLIENT_URL is not an absolute URL (${clientUrl})`);
  } else {
    ok(`notifications will open ${clientUrl}/dash/posts/...`);
    if (clientUrl.startsWith('http://') && !clientUrl.includes('localhost')) {
      warn('CLIENT_URL is plain http - service workers only run on https (or localhost)');
    }
  }

  section('Device push (Expo)');
  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'false') {
    warn('PUSH_NOTIFICATIONS_ENABLED=false - the app channel is switched off');
  } else {
    ok('enabled');
    info(process.env.EXPO_ACCESS_TOKEN
      ? 'EXPO_ACCESS_TOKEN set (sends are authenticated)'
      : 'EXPO_ACCESS_TOKEN not set - sends work, but anyone holding a scraped token could send as this project');
  }

  return healthy;
};

// ---------------------------------------------------------------------------
// What the database holds
// ---------------------------------------------------------------------------

const checkDatabase = async () => {
  const User = require('../models/User');

  section('Subscribers');

  const [browsers, devices] = await Promise.all([
    User.countDocuments({ 'webPushSubscriptions.0': { $exists: true } }),
    User.countDocuments({ 'pushTokens.0': { $exists: true } }),
  ]);

  console.log(`  ${browsers} account(s) with at least one browser subscription`);
  console.log(`  ${devices} account(s) with at least one device token`);
  if (browsers === 0) {
    warn('No browser has ever subscribed. Either the VAPID keys were missing when');
    info('visitors were asked, or nobody has accepted the offer yet.');
  }

  // A subscribed browser whose account has pushAlerts off receives nothing,
  // and neither the browser nor the settings row says so - this is the one
  // state that looks completely healthy from the client side.
  const mutedWithBrowser = await User.countDocuments({
    'webPushSubscriptions.0': { $exists: true },
    'notificationPreferences.pushAlerts': false,
  });
  if (mutedWithBrowser > 0) {
    warn(`${mutedWithBrowser} subscribed account(s) have pushAlerts turned off - they receive nothing`);
  }

  if (!userQuery) return;

  section(`Account: ${userQuery}`);
  const user = await User.findOne({
    $or: [{ email: userQuery }, { username: userQuery }],
  }).select('username email notificationPreferences isActive pushTokens webPushSubscriptions').lean();

  if (!user) {
    bad('no account with that email or username');
    return;
  }

  console.log(`  ${user.username}${user.email ? ` <${user.email}>` : ''}`);
  if (user.isActive === false) bad('account is deactivated - every alert path returns early');

  const preferences = user.notificationPreferences || {};
  const gate = (name, value) => (value === false ? bad(`${name}: off`) : ok(`${name}: on`));
  gate('matchAlerts', preferences.matchAlerts);
  gate('commentAlerts', preferences.commentAlerts);
  gate('socialAlerts', preferences.socialAlerts);
  gate('pushAlerts (devices AND browsers)', preferences.pushAlerts);

  const subscriptions = user.webPushSubscriptions || [];
  const tokens = user.pushTokens || [];
  console.log(`  ${subscriptions.length} browser subscription(s), ${tokens.length} device token(s)`);
  subscriptions.forEach((entry, index) => {
    let host = entry.endpoint;
    try { host = new URL(entry.endpoint).host; } catch (error) { /* show it raw */ }
    info(`browser ${index + 1}: ${host} (${entry.language || 'en'}, last seen ${entry.lastSeenAt || 'unknown'})`);
  });
  tokens.forEach((entry, index) => {
    info(`device ${index + 1}: ${entry.platform} (${entry.language || 'en'})`);
  });

  if (!wantsSend) return;

  section('Test delivery');
  if (subscriptions.length === 0 && tokens.length === 0) {
    bad('nothing to send to');
    return;
  }

  // Deliberately through the real sender, so this exercises exactly what a
  // genuine alert does: the same copy builder, the same per-subscription
  // language, the same encryption, the same push services.
  const pushNotificationService = require('../services/pushNotificationService');
  const delivered = await pushNotificationService.sendSocialPublishAlert({
    user,
    postId: new mongoose.Types.ObjectId(),
    notificationId: new mongoose.Types.ObjectId(),
    platform: 'facebook',
    status: 'published',
  });

  if (delivered) {
    ok('accepted for delivery - it should appear within seconds');
    info('(the listing it links to is a throwaway id, so the tap will 404 - that is expected)');
  } else {
    bad('nothing was accepted. The specific reason is logged above by the transport.');
  }
};

// ---------------------------------------------------------------------------

const main = async () => {
  console.log('Mafqoudat push doctor');

  const healthy = checkConfiguration();

  if (wantsDb) {
    if (!process.env.MONGODB_URI) {
      section('Subscribers');
      bad('MONGODB_URI is not set, so the database checks cannot run');
    } else {
      await mongoose.connect(process.env.MONGODB_URI);
      try {
        await checkDatabase();
      } finally {
        await mongoose.disconnect();
      }
    }
  } else {
    console.log('\n(pass --db, --user=<email> or --send to also check the database)');
  }

  console.log('');
  process.exit(healthy ? 0 : 1);
};

main().catch((error) => {
  console.error('doctor-push failed:', error);
  process.exit(1);
});
