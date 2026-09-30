/**
 * WhatsApp messaging service via Baileys (WhatsApp Web multi-device API).
 *
 * Session persistence strategy
 * ─────────────────────────────
 * Baileys' built-in `useMultiFileAuthState` writes credentials to the local
 * filesystem. That works on a local machine or a VPS, but is incompatible with
 * platforms that have ephemeral filesystems (Render free tier, Heroku, any
 * container that starts fresh on each deploy) – the session folder is wiped on
 * every restart, which forces a new QR scan every time.
 *
 * This service uses a custom MongoDB-backed auth state instead. Credentials are
 * stored in the `whatsapp_sessions` collection (models/WhatsAppSession.js) and
 * survive restarts, re-deploys, and free-tier spin-downs indefinitely.
 *
 * One-time QR scan workflow
 * ──────────────────────────
 * 1. Start the server (locally or in production).
 * 2. The QR code is printed in the terminal / logs.
 * 3. On the business phone (0711621132):
 *      WhatsApp → Linked Devices → Link a Device → scan the QR.
 * 4. The session is immediately written to MongoDB.
 * 5. Every subsequent restart reconnects automatically – no re-scan needed.
 *
 * Public API
 * ──────────
 *   init()                                  – call once at server start
 *   sendSocialPublishMessage({ post, platform, permalink })
 *   sendMatchAlertMessage({ post, matchedPost, score })
 *   isConnected()                            – boolean
 *
 * Both send helpers are fire-and-forget: they never throw and a WA failure can
 * never delay or fail a post write, social publish, or match scan.
 */

'use strict';

const pino = require('pino');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WA_BUSINESS_NUMBER   = process.env.WA_BUSINESS_NUMBER  || '0711621132';
const SESSION_ID           = process.env.WA_SESSION_ID       || 'mafqoudat';
const MIN_SEND_INTERVAL_MS = Number(process.env.WA_MIN_INTERVAL_MS) || 4000;
const MAX_JITTER_MS        = Number(process.env.WA_MAX_JITTER_MS)   || 3000;

// ---------------------------------------------------------------------------
// Lazy-load Baileys
// ---------------------------------------------------------------------------

let makeWASocket, DisconnectReason, fetchLatestBaileysVersion, BufferJSON, proto, initAuthCreds, isLatestBaileysVersion, Browsers;

const loadBaileys = async () => {
  if (makeWASocket) return true;
  try {
    let baileys;
    try {
      baileys = require('@whiskeysockets/baileys');
    } catch (e) {
      if (e.code === 'ERR_REQUIRE_ESM' || (e.message && e.message.includes('ERR_REQUIRE_ESM'))) {
        baileys = await import('@whiskeysockets/baileys');
      } else {
        throw e;
      }
    }
    makeWASocket               = baileys.default || baileys.makeWASocket || baileys;
    DisconnectReason           = baileys.DisconnectReason;
    fetchLatestBaileysVersion  = baileys.fetchLatestBaileysVersion;
    BufferJSON                 = baileys.BufferJSON;
    proto                      = baileys.proto;
    initAuthCreds              = baileys.initAuthCreds;
    isLatestBaileysVersion     = baileys.isLatestBaileysVersion;
    Browsers                   = baileys.Browsers;
    return true;
  } catch (err) {
    console.warn('[WhatsApp] Baileys not available:', err?.message);
    return false;
  }
};

// ---------------------------------------------------------------------------
// MongoDB auth state
// ---------------------------------------------------------------------------

/**
 * Builds a Baileys-compatible auth state that reads/writes credentials from
 * the `whatsapp_sessions` MongoDB collection instead of the filesystem.
 *
 * The interface matches what useMultiFileAuthState returns: { state, saveCreds }.
 */
const useMongoDBAuthState = async (sessionId) => {
  // Require lazily so the module can be loaded before the DB is connected.
  const WhatsAppSession = require('../models/WhatsAppSession');

  const KEY  = 'creds';
  const KEYS = 'keys';

  // Read one document by its credential key.
  const read = async (key) => {
    const doc = await WhatsAppSession.findOne({ session: sessionId, key }).lean();
    if (!doc) return null;
    // Baileys serialises Buffers via BufferJSON; deserialise them back.
    return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
  };

  // Upsert one document.
  const write = async (key, value) => {
    await WhatsAppSession.findOneAndUpdate(
      { session: sessionId, key },
      { value: JSON.parse(JSON.stringify(value, BufferJSON.replacer)) },
      { upsert: true, new: true }
    );
  };

  // Remove a set of keys (used when WhatsApp rotates session keys).
  const remove = async (keys) => {
    await WhatsAppSession.deleteMany({ session: sessionId, key: { $in: keys } });
  };

  // ---- creds (the main auth identity) ------------------------------------

  const storedCreds = await read(KEY);
  const creds       = storedCreds || initAuthCreds();

  const saveCreds = async () => {
    await write(KEY, creds);
  };

  // ---- signal keys (pre-keys, sessions, sender-key records, etc.) --------

  const keys = {
    get: async (type, ids) => {
      const data = {};
      for (const id of ids) {
        const val = await read(`${KEYS}.${type}.${id}`);
        if (val) {
          // Signal keys for pre-keys need a special Buffer decode.
          if (type === 'app-state-sync-key' && val) {
            data[id] = proto.Message.AppStateSyncKeyData.fromObject(val);
          } else {
            data[id] = val;
          }
        }
      }
      return data;
    },
    set: async (data) => {
      const promises = [];
      for (const [type, ids] of Object.entries(data)) {
        for (const [id, value] of Object.entries(ids || {})) {
          const key = `${KEYS}.${type}.${id}`;
          if (value) {
            promises.push(write(key, value));
          } else {
            promises.push(remove([key]));
          }
        }
      }
      await Promise.all(promises);
    },
  };

  return { state: { creds, keys }, saveCreds };
};

// ---------------------------------------------------------------------------
// Internal socket state
// ---------------------------------------------------------------------------

let sock              = null;
let isConnected       = false;
let connectingPromise = null;
let sendQueue         = [];
let queueRunning      = false;
let latestQR          = null;
let lastQRTimestamp   = null;

const logger = pino({ level: 'silent' });

// ---------------------------------------------------------------------------
// Phone number → Baileys JID
// ---------------------------------------------------------------------------

/**
 * Converts a raw phone number to a Baileys JID.
 *
 * Supported formats:
 *   0612345678   → 212612345678@s.whatsapp.net   (Moroccan 06/07)
 *   +212612…     → 212612…@s.whatsapp.net
 *   00212612…    → 212612…@s.whatsapp.net
 *   212612…      → 212612…@s.whatsapp.net  (already international)
 */
const toJid = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s\-.()+]/g, '').replace(/^00/, '');
  // Moroccan local → international
  if (/^0[5-7]\d{8}$/.test(digits)) {
    digits = '212' + digits.slice(1);
  }
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `${digits}@s.whatsapp.net`;
};

// ---------------------------------------------------------------------------
// Socket connection & lifecycle
// ---------------------------------------------------------------------------

const connect = async () => {
  const loaded = await loadBaileys();
  if (!loaded) return;
  if (isConnected || connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    try {
      const { state, saveCreds } = await useMongoDBAuthState(SESSION_ID);
      const { version }          = await fetchLatestBaileysVersion();

      const browserInfo = Browsers && typeof Browsers.ubuntu === 'function'
        ? Browsers.ubuntu('Chrome')
        : ['Ubuntu', 'Chrome', '22.04.4'];

      sock = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: false,
        browser: browserInfo,
        connectTimeoutMs:    30_000,
        keepAliveIntervalMs: 25_000,
        retryRequestDelayMs:  2_000,
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          latestQR = qr;
          lastQRTimestamp = Date.now();
        }

        if (connection === 'open') {
          console.log('[WhatsApp] ✅ Connected and ready to send messages.');
          isConnected = true;
          latestQR = null;
          drainQueue();
        }

        if (connection === 'close') {
          isConnected       = false;
          connectingPromise = null;
          const statusCode  = lastDisconnect?.error?.output?.statusCode;
          const wasLoggedOut = statusCode === DisconnectReason?.loggedOut;

          if (wasLoggedOut) {
            console.warn('[WhatsApp] Device unlinked by phone. Clearing stale session…');
            try {
              await require('../models/WhatsAppSession').deleteMany({ session: SESSION_ID });
            } catch (e) {
              console.error('[WhatsApp] Failed to clear session:', e?.message);
            }
            setTimeout(connect, 3000);
          } else if (statusCode === 515 || statusCode === DisconnectReason?.restartRequired) {
            // Normal post-pairing handshake — reconnect immediately
            setTimeout(connect, 1000);
          } else {
            console.warn(`[WhatsApp] Connection closed (${statusCode}), reconnecting in 5 s…`);
            setTimeout(connect, 5000);
          }
        }
      });
    } catch (err) {
      connectingPromise = null;
      console.error('[WhatsApp] Connection error:', err?.message || err);
      setTimeout(connect, 30_000);
    }
  })();

  return connectingPromise;
};

// ---------------------------------------------------------------------------
// Send queue with jitter (anti-spam)
// ---------------------------------------------------------------------------

const drainQueue = async () => {
  if (queueRunning) return;
  queueRunning = true;

  while (sendQueue.length > 0) {
    if (!isConnected) break;

    const item = sendQueue.shift();
    try {
      await sock.sendMessage(item.jid, item.message);
      item.resolve(true);
    } catch (err) {
      console.error(`[WhatsApp] Failed to send to ${item.jid}:`, err?.message || err);
      item.reject(err);
    }

    if (sendQueue.length > 0) {
      const delay = MIN_SEND_INTERVAL_MS + Math.floor(Math.random() * MAX_JITTER_MS);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  queueRunning = false;
};

const queueMessage = (jid, text) =>
  new Promise((resolve, reject) => {
    if (!jid) { resolve(false); return; }
    sendQueue.push({ jid, message: { text }, resolve, reject });
    if (isConnected && !queueRunning) drainQueue();
  });

// ---------------------------------------------------------------------------
// Message templates
// ---------------------------------------------------------------------------

/**
 * Sent when a listing is successfully published to Facebook or Instagram.
 *
 * @param {{ post: Object, platform: string, permalink: string|null }} opts
 */
const sendSocialPublishMessage = async ({ post, platform, permalink }) => {
  try {
    const jid = toJid(post?.contact);
    if (!jid) return false;

    const platformLabel = platform === 'facebook' ? 'فيسبوك 🟦' : 'إنستغرام 📸';
    const siteLink      = `https://mafqoudat.ma/posts/${post._id}`;

    const lines = [
      'مرحبًا! 👋',
      '',
      `نبشرك بأن إعلانك على موقع *مفقودات* قد تم نشره رسميًا على صفحتنا في ${platformLabel}`,
      '',
      '🔗 رابط الإعلان على الموقع:',
      siteLink,
    ];

    if (permalink) {
      const pLabel = platform === 'facebook' ? 'فيسبوك' : 'إنستغرام';
      lines.push('', `📲 رابط المنشور على ${pLabel}:`, permalink);
    }

    lines.push(
      '',
      'نتمنى أن يساعدك ذلك في إيجاد ما تبحث عنه بأسرع وقت ممكن 🤲',
      '— فريق مفقودات'
    );

    return await queueMessage(jid, lines.join('\n'));
  } catch (err) {
    console.error('[WhatsApp] sendSocialPublishMessage error:', err?.message || err);
    return false;
  }
};

/**
 * Sent when the matching engine finds a potential counterpart for a listing.
 *
 * @param {{ post: Object, matchedPost: Object, score: number }} opts
 */
const sendMatchAlertMessage = async ({ post, matchedPost, score }) => {
  try {
    const jid = toJid(post?.contact);
    if (!jid) return false;

    const matchLink  = `https://mafqoudat.ma/posts/${matchedPost._id}`;
    const ownLink    = `https://mafqoudat.ma/posts/${post._id}`;
    const scoreLabel = score >= 75 ? 'تطابق قوي 🟢'
      : score >= 55 ? 'تطابق محتمل 🟡'
      : 'تطابق ممكن 🔵';

    const text = [
      'مرحبًا! 👋',
      '',
      'لدينا خبر مشجع! وجدنا إعلانًا قد يتطابق مع إعلانك على *مفقودات*.',
      '',
      `📊 نسبة التطابق: *${score}%* — ${scoreLabel}`,
      '',
      '🔗 الإعلان المطابق:',
      matchLink,
      '',
      '📄 إعلانك:',
      ownLink,
      '',
      'إذا كنت تعتقد أن هذا هو ما تبحث عنه، يمكنك التواصل مع صاحب الإعلان مباشرة عبر الموقع.',
      '— فريق مفقودات',
    ].join('\n');

    return await queueMessage(jid, text);
  } catch (err) {
    console.error('[WhatsApp] sendMatchAlertMessage error:', err?.message || err);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const getStatus = () => ({
  isConnected,
  hasQR: !!latestQR,
  qr: latestQR,
  lastQRTimestamp,
  businessNumber: WA_BUSINESS_NUMBER,
});

const clearSession = async () => {
  try {
    const WhatsAppSession = require('../models/WhatsAppSession');
    await WhatsAppSession.deleteMany({ session: SESSION_ID });
    latestQR = null;
    isConnected = false;
    if (sock) {
      try { sock.end(); } catch (_) {}
      sock = null;
    }
    connectingPromise = null;
    console.log('[WhatsApp] Session reset manually. Reconnecting in 2 s…');
    setTimeout(connect, 2000);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Failed to clear session:', err?.message || err);
    throw err;
  }
};

/**
 * Initialises the WhatsApp socket. Call once at server start (after the DB
 * is connected – the MongoDB auth state requires it).
 *
 * Safe to call multiple times: only one connection is ever created.
 */
const init = async () => {
  const loaded = await loadBaileys();
  if (!loaded) {
    console.warn('[WhatsApp] Skipping init – Baileys not installed.');
    return;
  }
  connect().catch((err) => {
    console.error('[WhatsApp] init error:', err?.message || err);
  });
};

module.exports = {
  init,
  sendSocialPublishMessage,
  sendMatchAlertMessage,
  isConnected: () => isConnected,
  getStatus,
  clearSession,
  toJid,
};
