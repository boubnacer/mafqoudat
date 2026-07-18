const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

/**
 * Backfill script for posts affected by the contactPreferences bug in
 * createNewPost: contactPreferences arrived already parsed as an object,
 * JSON.parse() was called on it anyway, threw, and the catch block silently
 * overwrote it with { phone: true, email: false, whatsapp: false }.
 *
 * The frontend always sends { whatsapp: true }, so this exact signature
 * (phone: true, email: false, whatsapp: false) is the fingerprint left by
 * the bug. This script assumes every post matching that signature was
 * affected and should have had whatsapp: true.
 *
 * Usage:
 *   Dry run (default): node server/scripts/backfill-contact-preferences.js
 *   Apply:              node server/scripts/backfill-contact-preferences.js --apply
 */

const APPLY = process.argv.includes('--apply');

const BUGGY_DEFAULT_FILTER = {
  'contactPreferences.phone': true,
  'contactPreferences.email': false,
  'contactPreferences.whatsapp': false
};

async function backfillContactPreferences() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mafqoudat');
    console.log('✅ Connected to MongoDB');

    const affectedCount = await Post.countDocuments(BUGGY_DEFAULT_FILTER);
    console.log(`📊 Found ${affectedCount} posts matching the buggy default signature (phone: true, email: false, whatsapp: false)`);

    if (affectedCount === 0) {
      console.log('✅ Nothing to backfill.');
      await mongoose.connection.close();
      return;
    }

    if (!APPLY) {
      console.log('\n🔍 Dry run only - no changes made. Re-run with --apply to update these posts.');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n✏️  Applying fix: setting contactPreferences.whatsapp = true on ${affectedCount} posts...`);
    const result = await Post.updateMany(BUGGY_DEFAULT_FILTER, {
      $set: { 'contactPreferences.whatsapp': true }
    });

    console.log('\n📈 Backfill Summary:');
    console.log(`✅ Matched: ${result.matchedCount ?? result.n}`);
    console.log(`✅ Modified: ${result.modifiedCount ?? result.nModified}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  backfillContactPreferences()
    .then(() => {
      console.log('✅ Backfill script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backfill script failed:', error);
      process.exit(1);
    });
}

module.exports = backfillContactPreferences;
