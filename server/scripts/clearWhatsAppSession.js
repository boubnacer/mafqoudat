/**
 * Clears the WhatsApp session from MongoDB so the next server start
 * generates a fresh pairing code.
 *
 * Run with:
 *   node scripts/clearWhatsAppSession.js
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const SESSION_ID = process.env.WA_SESSION_ID || 'mafqoudat';

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const WhatsAppSession = require('../models/WhatsAppSession');
    const result = await WhatsAppSession.deleteMany({ session: SESSION_ID });
    console.log(`✅ Cleared ${result.deletedCount} WhatsApp session document(s) for session "${SESSION_ID}".`);
    console.log('   Next server start will generate a fresh pairing code.');
  } catch (err) {
    console.error('❌ Error:', err?.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
