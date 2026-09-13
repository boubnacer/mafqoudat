const webpush = require('web-push');
const User = require('../models/User');

/**
 * Browser push notifications, over the Web Push protocol.
 *
 * The desktop/mobile-web twin of pushNotificationService's Expo transport. Both
 * exist because they are genuinely different channels: the app's subscribers
 * are Expo tokens delivered through Expo's service, a browser's are an endpoint
 * URL plus two encryption keys delivered by whatever push service that browser
 * belongs to (FCM, Mozilla, Apple), and a payload here is encrypted end to end
 * with the browser's own keys so the service in the middle cannot read it.
 *
 * `web-push` does that encryption and the VAPID signing; there is no vendor SDK
 * and no account with any of the three push services - VAPID is what identifies
 * this application to all of them.
 *
 * Same contract as every other alert transport in this codebase: it never
 * throws, and a failed send is "no push", never a failed anything else. The
 * in-app notification row is always written first and independently.
 */

const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

// How long a push service should hold a message for a browser that is offline.
// Matches the Expo side's reasoning: a lead nobody has seen in two days is
// better undelivered than surfaced long after the fact.
const DEFAULT_TTL_SECONDS = 2 * 24 * 60 * 60;

// What the push service answers for a subscription that no longer exists -
// the browser was uninstalled, its site data cleared, or permission revoked.
// Anything else (a 429, a 500, a timeout) is this delivery's problem, not the
// subscription's, and must never prune it.
const GONE_STATUS_CODES = new Set([404, 410]);

const resolveLanguage = (value) => (SUPPORTED_LANGUAGES.includes(value) ? value : 'en');

/**
 * VAPID identifies this server to every push service. Read lazily rather than
 * at require time so a deploy without the keys still boots - this is an
 * optional channel, exactly like the Expo one is without its own credentials.
 */
let configured = null;

const publicKey = () => (process.env.VAPID_PUBLIC_KEY || '').trim();

const privateKey = () => (process.env.VAPID_PRIVATE_KEY || '').trim();

const isConfigured = () => {
  if (process.env.WEB_PUSH_ENABLED === 'false') return false;
  return !!(publicKey() && privateKey());
};

/**
 * The subject must be a mailto: or https: URL naming whoever operates this
 * application; push services use it to reach a human about abusive sends.
 *
 * CLIENT_URL is the documented fallback, and it is an https: URL, so it is
 * accepted as-is - but only if it really is one. A CLIENT_URL of
 * `http://localhost:3000` (every developer's) is neither scheme, and
 * `setVapidDetails` rejects it outright, which used to turn a local
 * misconfiguration into "every browser push silently fails" with one line in
 * the log at the first send and nothing at boot.
 */
const resolveSubject = () => {
  const configuredSubject = (process.env.VAPID_SUBJECT || '').trim();
  const candidate = configuredSubject || (process.env.CLIENT_URL || '').trim();
  if (/^(mailto:|https:\/\/)/i.test(candidate)) return candidate;
  return 'mailto:contact@mafqoudat.com';
};

const configure = () => {
  if (configured) return true;
  if (!isConfigured()) return false;

  try {
    webpush.setVapidDetails(resolveSubject(), publicKey(), privateKey());
    configured = true;
    return true;
  } catch (error) {
    console.error('[web-push] VAPID configuration failed:', error?.message || error);
    return false;
  }
};

/**
 * What is and is not set up here, in a shape a human can read.
 *
 * Every failure in this file is deliberately silent at the call site - a push
 * that cannot be sent must never cost a match, a comment or a publish - and
 * that is exactly what made "the browser never buzzes" impossible to diagnose:
 * an unconfigured deployment behaves identically to a configured one with no
 * subscribers. So the state is stated once at boot (server.js) and on demand
 * (`npm run doctor-push`), rather than inferred from silence.
 *
 * @returns {{ok: boolean, reason: string|null, subject: string|null, publicKeyPreview: string|null}}
 */
const describeConfiguration = () => {
  if (process.env.WEB_PUSH_ENABLED === 'false') {
    return { ok: false, reason: 'WEB_PUSH_ENABLED is set to "false"', subject: null, publicKeyPreview: null };
  }

  const missing = [];
  if (!publicKey()) missing.push('VAPID_PUBLIC_KEY');
  if (!privateKey()) missing.push('VAPID_PRIVATE_KEY');
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `${missing.join(' and ')} not set - generate a pair with: node -e "console.log(require('web-push').generateVAPIDKeys())"`,
      subject: null,
      publicKeyPreview: null,
    };
  }

  // Ask web-push itself rather than pattern-matching the keys: a truncated or
  // standard-base64 key is accepted by every eyeball test and rejected here.
  if (!configure()) {
    return {
      ok: false,
      reason: 'the VAPID key pair was refused by web-push (malformed, truncated, or not a matching pair)',
      subject: resolveSubject(),
      publicKeyPreview: `${publicKey().slice(0, 12)}...`,
    };
  }

  return {
    ok: true,
    reason: null,
    subject: resolveSubject(),
    publicKeyPreview: `${publicKey().slice(0, 12)}...`,
  };
};

/** Drops one subscription from whatever account holds it. */
const removeSubscription = async (endpoint) => {
  try {
    await User.updateMany(
      { 'webPushSubscriptions.endpoint': endpoint },
      { $pull: { webPushSubscriptions: { endpoint } } }
    );
  } catch (error) {
    console.error('[web-push] failed to prune subscription:', error?.message || error);
  }
};

/**
 * Sends one notification to every browser in `subscriptions`.
 *
 * `copyFor(language)` returns `{ title, body }` for one subscription's own
 * language - the same shape the Expo sender builds per token, so one alert can
 * feed both transports without either owning the other's wording.
 *
 * @param {Array}    subscriptions Lean `user.webPushSubscriptions` entries.
 * @param {Function} copyFor       language => { title, body }.
 * @param {Object}   data          Payload the service worker reads on click.
 * @param {string}   data.url      Where clicking the notification should land.
 * @param {number}   [ttl]         Seconds the push service may hold it.
 * @returns {Promise<number>} how many were accepted for delivery.
 */
const sendToSubscriptions = async (subscriptions, copyFor, data, { ttl = DEFAULT_TTL_SECONDS } = {}) => {
  if (!configure()) return 0;
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) return 0;

  let accepted = 0;

  // Sequential rather than Promise.all: one account has at most a handful of
  // browsers, and a burst of parallel TLS handshakes to three different push
  // services buys nothing measurable here.
  for (const entry of subscriptions) {
    if (!entry?.endpoint || !entry?.p256dh || !entry?.auth) continue;

    const { title, body } = copyFor(resolveLanguage(entry.language)) || {};
    if (!title) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: entry.endpoint,
          keys: { p256dh: entry.p256dh, auth: entry.auth },
        },
        JSON.stringify({ title, body, data }),
        { TTL: ttl }
      );
      accepted += 1;
    } catch (error) {
      if (GONE_STATUS_CODES.has(error?.statusCode)) {
        // The browser is gone for good; an unpruned endpoint is a wasted send
        // on every future alert, forever.
        await removeSubscription(entry.endpoint);
        continue;
      }
      console.error(
        `[web-push] send failed (${error?.statusCode || 'no status'}):`,
        error?.body || error?.message || error
      );
    }
  }

  return accepted;
};

module.exports = {
  sendToSubscriptions,
  removeSubscription,
  isConfigured,
  describeConfiguration,
  publicKey,
};
