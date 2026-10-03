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

const isWhatsAppDisabled = () =>
  process.env.WA_ENABLED === 'false' ||
  process.env.DISABLE_WHATSAPP === 'true' ||
  process.env.ENABLE_WHATSAPP === 'false';

const connect = async () => {
  if (isWhatsAppDisabled()) return;
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
          } else if (statusCode === 440 || statusCode === DisconnectReason?.connectionReplaced) {
            console.warn('[WhatsApp] ⚠️ Connection replaced (440): Another server instance (e.g., Railway deployment vs local dev, or duplicate process) connected with this session. Waiting 30s before retrying to prevent connection conflict...');
            setTimeout(connect, 30_000);
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

const queueMessage = (jid, content) =>
  new Promise((resolve, reject) => {
    if (!jid) { resolve(false); return; }
    const message = typeof content === 'string' ? { text: content } : content;
    sendQueue.push({ jid, message, resolve, reject });
    if (isConnected && !queueRunning) drainQueue();
  });

// ---------------------------------------------------------------------------
// vCard / Contact Card Builder
// ---------------------------------------------------------------------------

const VCARD_DISPLAY_NAME = 'mafqoudat.com | مفقودات';

const getBusinessPhoneDigits = () => {
  if (sock?.user?.id) {
    const raw = String(sock.user.id).split(':')[0].split('@')[0];
    if (raw && /^\d+$/.test(raw)) return raw;
  }
  let digits = WA_BUSINESS_NUMBER.replace(/[\s\-.()+]/g, '').replace(/^00/, '');
  if (/^0[5-7]\d{8}$/.test(digits)) {
    digits = '212' + digits.slice(1);
  }
  return digits;
};

const buildMafqoudatVCard = () => {
  const digits = getBusinessPhoneDigits();
  const siteUrl = getSiteBaseUrl();
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${VCARD_DISPLAY_NAME};;;`,
    `FN:${VCARD_DISPLAY_NAME}`,
    'ORG:mafqoudat.com',
    'TITLE:Mafqoudat Platform',
    `TEL;type=CELL;type=VOICE;waid=${digits}:+${digits}`,
    `URL;type=WORK:${siteUrl}`,
    'NOTE:خدمة الإشعارات الرسمية لموقع مفقودات / Service de notifications Mafqoudat',
    'END:VCARD'
  ].join('\n');
};

const buildContactMessagePayload = () => ({
  contacts: {
    displayName: VCARD_DISPLAY_NAME,
    contacts: [
      {
        displayName: VCARD_DISPLAY_NAME,
        vcard: buildMafqoudatVCard(),
      },
    ],
  },
});

// ---------------------------------------------------------------------------
// Message templates (Arabic, French, English)
// ---------------------------------------------------------------------------

const { detectLanguage } = require('../utils/languageUtils');

const getSiteBaseUrl = () => (process.env.CLIENT_URL || 'https://www.mafqoudat.com').replace(/\/$/, '');

/**
 * Resolves the message language in order of priority:
 * 1. Explicit override passed in options
 * 2. `post.language` set during post creation
 * 3. Language detected from `post.description`
 * 4. Fallback to Arabic ('ar')
 */
const resolveLanguage = (post, explicitLang) => {
  if (explicitLang && ['ar', 'fr', 'en'].includes(explicitLang)) return explicitLang;
  if (post?.language && ['ar', 'fr', 'en'].includes(post.language)) return post.language;
  if (post?.description) {
    const detected = detectLanguage(post.description);
    if (['ar', 'fr', 'en'].includes(detected)) return detected;
  }
  return 'ar';
};

const SOCIAL_PUBLISH_TEMPLATES = {
  ar: ({ siteLink }) => [
    'مرحبًا! 👋',
    '',
    'نبشرك بأن إعلانك على موقع *مفقودات* قد تم نشره رسميًا على صفحتينا في فيسبوك وإنستغرام 🟦📸.',
    '',
    'يمكنك مشاهدة المنشور وتفاعلاته مباشرة من خلال صفحة إعلانك:',
    '🔗 رابط الإعلان:',
    siteLink,
    '',
    'نتمنى أن يساعدك ذلك في إيجاد ما تبحث عنه بأسرع وقت ممكن 🤲',
    '— فريق مفقودات',
  ].join('\n'),

  fr: ({ siteLink }) => [
    'Bonjour ! 👋',
    '',
    'Bonne nouvelle ! Votre annonce sur *Mafqoudat* a été officiellement publiée sur nos pages Facebook et Instagram 🟦📸.',
    '',
    'Vous pouvez consulter les publications et suivre leurs interactions directement depuis les cartes réseaux sociaux de votre annonce :',
    '🔗 Lien de votre annonce :',
    siteLink,
    '',
    'Nous espérons que cela vous aidera à retrouver ce que vous cherchez au plus vite 🤲',
    "— L'équipe Mafqoudat",
  ].join('\n'),

  en: ({ siteLink }) => [
    'Hello! 👋',
    '',
    'Great news! Your listing on *Mafqoudat* has been officially published on our Facebook and Instagram pages 🟦📸.',
    '',
    'You can view the posts and their interactions directly via the social media cards on your listing page:',
    '🔗 Listing link:',
    siteLink,
    '',
    'We hope this helps you find what you are looking for as soon as possible 🤲',
    '— The Mafqoudat Team',
  ].join('\n'),
};

const MATCH_ALERT_TEMPLATES = {
  ar: ({ score, scoreLabel, matchLink, ownLink }) => [
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
    '',
    '💾 احفظ بطاقة جهة الاتصال المرفقة (mafqoudat.com | مفقودات) للتعرف الفوري على تنبيهاتنا القادمة.',
  ].join('\n'),

  fr: ({ score, scoreLabel, matchLink, ownLink }) => [
    'Bonjour ! 👋',
    '',
    'Nous avons une bonne nouvelle ! Nous avons trouvé une annonce qui pourrait correspondre à la vôtre sur *Mafqoudat*.',
    '',
    `📊 Niveau de correspondance : *${score}%* — ${scoreLabel}`,
    '',
    '🔗 Annonce correspondante :',
    matchLink,
    '',
    '📄 Votre annonce :',
    ownLink,
    '',
    "Si vous pensez qu'il s'agit de ce que vous recherchez, vous pouvez contacter directement l'auteur sur le site.",
    "— L'équipe Mafqoudat",
    '',
    '💾 Enregistrez la fiche contact ci-jointe (mafqoudat.com | مفقودات) pour identifier instantanément nos alertes.',
  ].join('\n'),

  en: ({ score, scoreLabel, matchLink, ownLink }) => [
    'Hello! 👋',
    '',
    'We have encouraging news! We found a listing that might match yours on *Mafqoudat*.',
    '',
    `📊 Match confidence: *${score}%* — ${scoreLabel}`,
    '',
    '🔗 Matching listing:',
    matchLink,
    '',
    '📄 Your listing:',
    ownLink,
    '',
    'If you think this is what you are looking for, you can contact the author directly on the website.',
    '— The Mafqoudat Team',
    '',
    '💾 Save the attached contact card (mafqoudat.com | مفقودات) to recognize our future alerts instantly.',
  ].join('\n'),
};

/**
 * Sent when a listing is successfully published to Facebook or Instagram (or both).
 * Supports Arabic ('ar'), French ('fr'), and English ('en').
 *
 * @param {{ post: Object, platform: string, permalink?: string|null, facebookPermalink?: string|null, instagramPermalink?: string|null, language?: string }} opts
 */
const sendSocialPublishMessage = async ({
  post,
  platform,
  permalink,
  facebookPermalink,
  instagramPermalink,
  language,
}) => {
  try {
    const jid = toJid(post?.contact);
    if (!jid) return false;

    const lang = resolveLanguage(post, language);
    const siteBase = getSiteBaseUrl();
    const siteLink = `${siteBase}/dash/posts/${post._id}?section=social-reach`;

    let platformLabel;
    let pLabel;
    if (platform === 'both') {
      platformLabel = lang === 'ar' ? 'فيسبوك وإنستغرام 🟦📸' : 'Facebook & Instagram 🟦📸';
      pLabel = lang === 'ar' ? 'فيسبوك وإنستغرام' : 'Facebook & Instagram';
    } else if (lang === 'ar') {
      platformLabel = platform === 'facebook' ? 'فيسبوك 🟦' : 'إنستغرام 📸';
      pLabel = platform === 'facebook' ? 'فيسبوك' : 'إنستغرام';
    } else {
      platformLabel = platform === 'facebook' ? 'Facebook 🟦' : 'Instagram 📸';
      pLabel = platform === 'facebook' ? 'Facebook' : 'Instagram';
    }

    const templateFn = SOCIAL_PUBLISH_TEMPLATES[lang] || SOCIAL_PUBLISH_TEMPLATES.ar;
    const text = templateFn({
      platform,
      platformLabel,
      pLabel,
      siteLink,
    });

    const textSent = await queueMessage(jid, text);
    return textSent;
  } catch (err) {
    console.error('[WhatsApp] sendSocialPublishMessage error:', err?.message || err);
    return false;
  }
};

/**
 * Sent when the matching engine finds a potential counterpart for a listing.
 * Supports Arabic ('ar'), French ('fr'), and English ('en').
 *
 * @param {{ post: Object, matchedPost: Object, score: number, language?: string }} opts
 */
const sendMatchAlertMessage = async ({ post, matchedPost, score, language }) => {
  try {
    const jid = toJid(post?.contact);
    if (!jid) return false;

    const lang = resolveLanguage(post, language);
    const siteBase = getSiteBaseUrl();
    const matchLink = `${siteBase}/dash/posts/${matchedPost._id}`;
    const ownLink   = `${siteBase}/dash/posts/${post._id}`;

    let scoreLabel;
    if (lang === 'fr') {
      scoreLabel = score >= 75 ? 'Forte correspondance 🟢'
        : score >= 55 ? 'Correspondance probable 🟡'
        : 'Correspondance possible 🔵';
    } else if (lang === 'en') {
      scoreLabel = score >= 75 ? 'Strong match 🟢'
        : score >= 55 ? 'Likely match 🟡'
        : 'Possible match 🔵';
    } else {
      scoreLabel = score >= 75 ? 'تطابق قوي 🟢'
        : score >= 55 ? 'تطابق محتمل 🟡'
        : 'تطابق ممكن 🔵';
    }

    const templateFn = MATCH_ALERT_TEMPLATES[lang] || MATCH_ALERT_TEMPLATES.ar;
    const text = templateFn({ score, scoreLabel, matchLink, ownLink });

    const textSent = await queueMessage(jid, text);
    const cardSent = await queueMessage(jid, buildContactMessagePayload());
    return textSent || cardSent;
  } catch (err) {
    console.error('[WhatsApp] sendMatchAlertMessage error:', err?.message || err);
    return false;
  }
};

/**
 * Sends a standalone Mafqoudat contact card (vCard) to a user so they can
 * save it in 1 tap, instantly displaying "mafqoudat.com | مفقودات" on WhatsApp.
 *
 * @param {string} to - Raw phone number or JID
 */
const sendContactCard = async (to) => {
  try {
    const jid = toJid(to);
    if (!jid) return false;
    return await queueMessage(jid, buildContactMessagePayload());
  } catch (err) {
    console.error('[WhatsApp] sendContactCard error:', err?.message || err);
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
  if (isWhatsAppDisabled()) {
    console.log('[WhatsApp] Service disabled locally via environment variable (WA_ENABLED=false / DISABLE_WHATSAPP=true).');
    return;
  }
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
  sendContactCard,
  buildContactMessagePayload,
  isConnected: () => isConnected,
  getStatus,
  clearSession,
  toJid,
};
