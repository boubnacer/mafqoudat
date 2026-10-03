'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const pino = require('pino');
const Post = require('../models/Post');
const WhatsAppSession = require('../models/WhatsAppSession');

const logger = pino({ level: 'silent' });

async function main() {
  const postId = process.argv[2] || '6ac1667d1bdaf5446c3163e6';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGODB_URI);

  const post = await Post.findById(postId).lean();
  if (!post) {
    console.error(`Post not found: ${postId}`);
    process.exit(1);
  }

  console.log(`Found post: "${post.title}" (contact: ${post.contact})`);

  let digits = post.contact.replace(/[\s\-.()+]/g, '').replace(/^00/, '');
  if (/^0[5-7]\d{8}$/.test(digits)) {
    digits = '212' + digits.slice(1);
  }
  const jid = `${digits}@s.whatsapp.net`;
  console.log(`Target WhatsApp JID: ${jid}`);

  const siteLink = `https://www.mafqoudat.com/dash/posts/${post._id}?section=social-reach`;
  const text = [
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
  ].join('\n');

  console.log(`Message to send:\n---\n${text}\n---`);

  let baileys;
  try {
    baileys = require('@whiskeysockets/baileys');
  } catch (_) {
    baileys = await import('@whiskeysockets/baileys');
  }

  const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    BufferJSON,
    initAuthCreds,
    Browsers,
  } = baileys;

  const SESSION_ID = process.env.WA_SESSION_ID || 'mafqoudat';

  // MongoDB auth state
  const KEY = 'creds';
  const KEYS = 'keys';

  const read = async (key) => {
    const doc = await WhatsAppSession.findOne({ session: SESSION_ID, key }).lean();
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
  };

  const write = async (key, value) => {
    await WhatsAppSession.findOneAndUpdate(
      { session: SESSION_ID, key },
      { value: JSON.parse(JSON.stringify(value, BufferJSON.replacer)) },
      { upsert: true, new: true }
    );
  };

  const remove = async (keys) => {
    await WhatsAppSession.deleteMany({ session: SESSION_ID, key: { $in: keys } });
  };

  const storedCreds = await read(KEY);
  const creds = storedCreds || initAuthCreds();
  const saveCreds = async () => {
    await write(KEY, creds);
  };

  const keys = {
    get: async (type, ids) => {
      const data = {};
      for (const id of ids) {
        const val = await read(`${KEYS}.${type}.${id}`);
        if (val) data[id] = val;
      }
      return data;
    },
    set: async (data) => {
      const promises = [];
      for (const [type, ids] of Object.entries(data)) {
        for (const [id, value] of Object.entries(ids || {})) {
          const key = `${KEYS}.${type}.${id}`;
          if (value) promises.push(write(key, value));
          else promises.push(remove([key]));
        }
      }
      await Promise.all(promises);
    },
  };

  const { version } = await fetchLatestBaileysVersion();
  const browserInfo = Browsers && typeof Browsers.ubuntu === 'function'
    ? Browsers.ubuntu('Chrome')
    : ['Ubuntu', 'Chrome', '22.04.4'];

  console.log(`Connecting WhatsApp socket for session "${SESSION_ID}"...`);
  const sock = makeWASocket({
    version,
    logger,
    auth: { creds, keys },
    printQRInTerminal: false,
    browser: browserInfo,
    connectTimeoutMs: 30_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 2_000,
  });

  sock.ev.on('creds.update', saveCreds);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout after 30 seconds'));
    }, 30_000);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      console.log(`Connection update: ${connection || 'pending'}`);
      if (connection === 'open') {
        clearTimeout(timeout);
        console.log(`✅ WhatsApp Connected! Sending message to ${jid}...`);
        try {
          const result = await sock.sendMessage(jid, { text });
          console.log(`✅ Message successfully sent! Message ID:`, result?.key?.id);
          // Wait 3 seconds to let any ack flush
          await new Promise((r) => setTimeout(r, 3000));
          try { sock.end(); } catch (_) {}
          resolve(result);
        } catch (err) {
          console.error(`❌ Failed to send message:`, err);
          reject(err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`Connection closed with statusCode: ${statusCode}`);
        if (statusCode === DisconnectReason?.loggedOut) {
          clearTimeout(timeout);
          reject(new Error('WhatsApp session logged out'));
        }
      }
    });
  });

  await mongoose.disconnect();
  console.log(`Done!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
