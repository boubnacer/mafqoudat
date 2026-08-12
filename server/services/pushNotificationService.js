const axios = require('axios');
const User = require('../models/User');

/**
 * Device push notifications for the mobile app.
 *
 * The third delivery channel for a lost/found match alert, after the in-app
 * inbox (always) and email (opt-in). It is the only one that reaches a user who
 * is not currently looking at the app, which is the whole point: the person who
 * found a wallet three weeks ago has no reason to open a lost-and-found app
 * today, and they are exactly who the alert needs to reach.
 *
 * Delivery goes through Expo's push service rather than FCM/APNs directly:
 * the app is an Expo (CNG) project, so its tokens are already Expo tokens, and
 * Expo owns the FCM credentials configured for the project. That keeps this
 * file to one HTTPS call with no vendor SDK, and means the same code path will
 * serve iOS the day APNs credentials exist - see PUSH_NOTIFICATIONS.md.
 *
 * Same contract as matchEmailService: it never throws, and a failed send is
 * "no push", never a failed match. The in-app notification row is written
 * first and independently, so nothing here can cost a user their alert.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

// Expo's documented per-request ceilings.
const MESSAGE_CHUNK_SIZE = 100;
const RECEIPT_CHUNK_SIZE = 300;

const REQUEST_TIMEOUT_MS = 10000;

const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

// Both prefixes are valid Expo tokens; the app hands us whichever the SDK
// minted. Anything else is rejected at registration rather than sent.
const TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

// Android notification channel id. Must match the channel the app creates in
// mobile/src/utils/pushNotifications.js - naming a channel that does not exist
// on the device makes Android fall back to a default channel the user cannot
// have configured, so the two names are a contract.
const ANDROID_CHANNEL_ID = 'match-alerts';

// Master kill switch, for turning the channel off without a deploy of the app.
const isEnabled = () => process.env.PUSH_NOTIFICATIONS_ENABLED !== 'false';

// Expo accepts unauthenticated sends, but an access token stops anyone who
// scrapes a push token from sending as this project. Optional so local dev and
// the first deploy work without one.
const authHeaders = () => (
  process.env.EXPO_ACCESS_TOKEN
    ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
    : {}
);

// How long to wait before asking Expo what actually happened to a batch. The
// tickets returned by the send call only confirm Expo accepted the message;
// the receipt is what reports that FCM rejected the device. Expo suggests
// waiting at least 15 minutes, but this process is a web dyno that idles out,
// so the default is short enough to usually still be alive. Missing a receipt
// costs nothing permanent: a token that is really dead comes back as an error
// on every subsequent send, and one of those checks eventually lands.
const RECEIPT_DELAY_MS = (() => {
  const parsed = Number.parseInt(process.env.PUSH_RECEIPT_CHECK_DELAY_MS, 10);
  if (Number.isNaN(parsed)) return 5 * 60 * 1000;
  return Math.min(15 * 60 * 1000, Math.max(1000, parsed));
})();

const isValidPushToken = (token) => typeof token === 'string' && TOKEN_PATTERN.test(token.trim());

const resolveLanguage = (value) => (SUPPORTED_LANGUAGES.includes(value) ? value : 'en');

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Tray copy, per language. Deliberately about the *situation* rather than the
 * item: rendering "a black leather wallet in Casablanca" here would need the
 * category and city labels resolved per recipient, and the notification is
 * legible without them. The listing itself is one tap away.
 *
 * `singleLost` is what the owner of a LOST post reads (someone found something
 * like it); `singleFound` is its mirror for the owner of a FOUND post.
 */
const COPY = {
  en: {
    singleTitle: 'Possible match found',
    singleLost: 'Someone posted a found item that looks like the one you reported lost.',
    singleFound: 'Someone reported losing an item that looks like the one you found.',
    multiTitle: (count) => `${count} possible matches`,
    multiBody: 'New listings look like ones you posted. Tap to review them.',
  },
  fr: {
    singleTitle: 'Correspondance possible',
    singleLost: "Quelqu'un a publié un objet trouvé qui ressemble à celui que vous avez perdu.",
    singleFound: "Quelqu'un a signalé la perte d'un objet qui ressemble à celui que vous avez trouvé.",
    multiTitle: (count) => `${count} correspondances possibles`,
    multiBody: 'De nouvelles annonces ressemblent aux vôtres. Appuyez pour les consulter.',
  },
  ar: {
    singleTitle: 'تطابق محتمل',
    singleLost: 'نشر أحدهم غرضًا وجده يشبه الغرض الذي أعلنت عن فقدانه.',
    singleFound: 'أعلن أحدهم عن فقدان غرض يشبه الغرض الذي عثرت عليه.',
    multiTitle: (count) => `${count} تطابقات محتملة`,
    multiBody: 'هناك إعلانات جديدة تشبه إعلاناتك. اضغط لمراجعتها.',
  },
};

// ---------------------------------------------------------------------------
// Token maintenance
// ---------------------------------------------------------------------------

/**
 * Drops a token from whatever account holds it. Called when Expo reports the
 * device is gone (app uninstalled, or the installation's token rotated) - an
 * unpruned dead token is a wasted send on every future match, forever.
 */
const removeToken = async (token) => {
  try {
    await User.updateMany(
      { 'pushTokens.token': token },
      { $pull: { pushTokens: { token } } }
    );
  } catch (error) {
    console.error('[push] failed to prune token:', error?.message || error);
  }
};

const isUnregisteredError = (details) => details?.error === 'DeviceNotRegistered';

// ---------------------------------------------------------------------------
// Expo transport
// ---------------------------------------------------------------------------

/**
 * Asks Expo what became of the tickets from a send. Best-effort: scheduled with
 * setTimeout, so a restart in between simply skips it.
 */
const checkReceipts = async (ticketIdsByToken) => {
  const ids = [...ticketIdsByToken.keys()];
  if (ids.length === 0) return;

  for (const ids_ of chunk(ids, RECEIPT_CHUNK_SIZE)) {
    try {
      const response = await axios.post(
        EXPO_RECEIPTS_URL,
        { ids: ids_ },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, timeout: REQUEST_TIMEOUT_MS }
      );

      const receipts = response.data?.data || {};
      for (const [ticketId, receipt] of Object.entries(receipts)) {
        if (receipt?.status !== 'error') continue;
        const token = ticketIdsByToken.get(ticketId);
        if (token && isUnregisteredError(receipt.details)) {
          await removeToken(token);
          continue;
        }
        console.error(`[push] receipt error for ${ticketId}:`, receipt.message || receipt.details?.error);
      }
    } catch (error) {
      // A failed receipt check is not a failed notification - the message was
      // already accepted. Nothing to retry, nothing to report to the user.
      console.error('[push] receipt check failed:', error?.message || error);
    }
  }
};

/**
 * Posts messages to Expo in chunks and reconciles the tickets that come back.
 * Returns the number of messages Expo accepted.
 *
 * Tickets are positional - `data[i]` answers `messages[i]` - which is what lets
 * an error be traced back to the exact token that caused it.
 */
const sendMessages = async (messages) => {
  let accepted = 0;
  const ticketIdsByToken = new Map();

  for (const batch of chunk(messages, MESSAGE_CHUNK_SIZE)) {
    try {
      const response = await axios.post(
        EXPO_PUSH_URL,
        batch,
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, timeout: REQUEST_TIMEOUT_MS }
      );

      const tickets = response.data?.data || [];
      for (let index = 0; index < tickets.length; index += 1) {
        const ticket = tickets[index];
        const token = batch[index]?.to;

        if (ticket?.status === 'ok') {
          accepted += 1;
          if (ticket.id && token) ticketIdsByToken.set(ticket.id, token);
          continue;
        }

        if (token && isUnregisteredError(ticket?.details)) {
          await removeToken(token);
          continue;
        }
        console.error('[push] ticket error:', ticket?.message || ticket?.details?.error || 'unknown');
      }
    } catch (error) {
      console.error('[push] send failed:', error?.response?.data?.errors?.[0]?.message || error?.message || error);
    }
  }

  if (ticketIdsByToken.size > 0) {
    setTimeout(() => {
      checkReceipts(ticketIdsByToken).catch(() => {});
    }, RECEIPT_DELAY_MS).unref?.();
  }

  return accepted;
};

// ---------------------------------------------------------------------------
// Match alerts
// ---------------------------------------------------------------------------

/**
 * One push per recipient per scan run, however many pairs that run produced.
 *
 * This aggregation is the feature's single most important design decision. The
 * engine floors every same-category, same-city pair onto the strong-match
 * boundary (see matchingService.applyCoreMatchFloor), so one new listing in a
 * dense city/category legitimately produces a burst of alerts at once. The
 * inbox absorbs that by grouping; a notification tray cannot, and ten buzzes in
 * one second is how an app gets its notifications turned off permanently.
 *
 * @param {Object}   params.user        Lean user doc, with pushTokens.
 * @param {string}   params.ownPostCode 'LOST'|'FOUND' - the side of the recipient's
 *                                      own post, which decides the wording.
 * @param {Array}    params.alerts      [{ notificationId, matchedPostId }] from this run.
 * @returns {Promise<boolean>} whether anything was accepted for delivery.
 */
const sendMatchAlert = async ({ user, ownPostCode, alerts }) => {
  if (!isEnabled()) return false;
  if (!Array.isArray(alerts) || alerts.length === 0) return false;

  const tokens = (user?.pushTokens || []).filter((entry) => isValidPushToken(entry?.token));
  if (tokens.length === 0) return false;

  const count = alerts.length;

  // A single match opens the counterpart listing directly - the same
  // destination tapping that row in the inbox reaches, and the actionable one.
  // Several open the inbox instead, which is the only screen that can show them
  // all. `notificationId` rides along so the app can mark the alert read on the
  // way through, keeping the tray and the bell badge in agreement.
  const data = count === 1
    ? {
      type: 'match_found',
      notificationId: String(alerts[0].notificationId),
      postId: String(alerts[0].matchedPostId),
    }
    : { type: 'match_found', count };

  // One message per (language, token): a user signed in on two devices set to
  // two languages must read each in its own.
  const messages = tokens.map((entry) => {
    const language = resolveLanguage(entry.language);
    const copy = COPY[language];

    return {
      to: entry.token,
      title: count === 1 ? copy.singleTitle : copy.multiTitle(count),
      body: count === 1
        ? (ownPostCode === 'LOST' ? copy.singleLost : copy.singleFound)
        : copy.multiBody,
      data,
      sound: 'default',
      // High priority, matching the channel importance the app registers. A
      // lost item that someone has just handed in is time-critical in a way
      // most app notifications are not - and because a whole run collapses into
      // this one message, a user gets at most one of these per scan, so it can
      // afford to arrive promptly rather than in Android's next batch.
      priority: 'high',
      channelId: ANDROID_CHANNEL_ID,
      // A match that has not been read in two days is stale; better that it
      // never arrives than that it arrives long after the user saw it in-app.
      ttl: 2 * 24 * 60 * 60,
    };
  });

  const accepted = await sendMessages(messages);
  return accepted > 0;
};

module.exports = {
  sendMatchAlert,
  isValidPushToken,
  removeToken,
  ANDROID_CHANNEL_ID,
};
