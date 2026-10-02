/**
 * fix-post-text-indexes.js
 *
 * One-time migration: drops the existing text indexes on the `posts` collection
 * and recreates them with `language_override: "none"`.
 *
 * WHY: MongoDB's text index, by default, reads a document field named `language`
 * to choose its stemmer. The Post schema has `language: { default: 'ar' }`.
 * MongoDB does not support Arabic ('ar') as a text-search stemmer (error 17262),
 * so every post insert fails. Setting language_override:"none" disables the
 * per-document language override and uses simple tokenisation instead,
 * which works correctly for Arabic/French/English mixed content.
 *
 * Usage:
 *   node scripts/fix-post-text-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

// Text indexes to drop (by name)
const TEXT_INDEXES_TO_DROP = [
  'exactLocation_text_description_text',         // unnamed text index
  'country_status_text_search_optimized',        // named compound text index
];

// Text indexes to recreate with language_override: "none"
const TEXT_INDEXES_TO_CREATE = [
  {
    spec: { exactLocation: 'text', description: 'text' },
    options: { language_override: 'none' },
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('posts');

  // List current indexes
  const allIndexes = await collection.indexes();
  console.log('\nCurrent text indexes on posts collection:');
  const textIndexes = allIndexes.filter(i => Object.values(i.key || {}).includes('text'));
  if (textIndexes.length === 0) {
    console.log('  (none found)');
  } else {
    textIndexes.forEach(i => {
      console.log(`  name="${i.name}", language_override="${i.language_override || '(default=language field)'}"`);
    });
  }

  // Drop old text indexes
  console.log('\nDropping old text indexes...');
  for (const indexName of TEXT_INDEXES_TO_DROP) {
    const exists = allIndexes.some(i => i.name === indexName);
    if (!exists) {
      console.log(`  SKIP: "${indexName}" not found`);
      continue;
    }
    try {
      await collection.dropIndex(indexName);
      console.log(`  DROPPED: "${indexName}"`);
    } catch (err) {
      console.warn(`  WARN: could not drop "${indexName}": ${err.message}`);
    }
  }

  // Also drop any unnamed text index that may have a different auto-generated name
  const remainingIndexes = await collection.indexes();
  const remainingText = remainingIndexes.filter(i =>
    Object.values(i.key || {}).includes('text') && i.name !== '_id_'
  );
  for (const idx of remainingText) {
    if (!idx.language_override || idx.language_override !== 'none') {
      try {
        await collection.dropIndex(idx.name);
        console.log(`  DROPPED remaining: "${idx.name}"`);
      } catch (err) {
        console.warn(`  WARN: could not drop "${idx.name}": ${err.message}`);
      }
    }
  }

  // Recreate with language_override: "none"
  console.log('\nRecreating text indexes with language_override:"none"...');
  for (const { spec, options } of TEXT_INDEXES_TO_CREATE) {
    try {
      await collection.createIndex(spec, options);
      const name = options.name || Object.keys(spec).join('_');
      console.log(`  CREATED: ${name}`);
    } catch (err) {
      console.error(`  ERROR creating index: ${err.message}`);
    }
  }

  // Verify
  const finalIndexes = await collection.indexes();
  const finalText = finalIndexes.filter(i => Object.values(i.key || {}).includes('text'));
  console.log('\nFinal text indexes:');
  finalText.forEach(i => {
    console.log(`  name="${i.name}", language_override="${i.language_override || '(default)'}"`);
  });

  await mongoose.disconnect();
  console.log('\nDone. Text indexes fixed.');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
