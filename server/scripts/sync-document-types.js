/**
 * Brings the DocumentType collection in line with config/documentTypes.js.
 *
 * Dry-run by default: prints what it would create and change, writes nothing.
 * Pass --apply to actually update the DB.
 *
 *   node scripts/sync-document-types.js            (dry run)
 *   node scripts/sync-document-types.js --apply    (writes)
 *
 * Targets MONGODB_URI_PROD by default; MONGO_TARGET=dev switches to
 * MONGODB_URI - same shape as scripts/sync-categories.js, and for the same
 * reason: the DB is what the form actually lists, the config file is only the
 * vocabulary this build ships with.
 *
 * Labels are left alone on rows that already exist (they are curated copy, and
 * a title's wording on a live listing is not a colour to be re-synced), and
 * nothing is ever deleted or deactivated - a code in the DB this file does not
 * list is reported and left exactly as it is, which is what every title a
 * reader contributed through the form looks like from here.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DocumentType = require('../models/DocumentType');
const { DEFAULT_DOCUMENT_TYPES } = require('../config/documentTypes');

const APPLY = process.argv.includes('--apply');
const uri = process.env.MONGO_TARGET === 'dev'
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_PROD;

const run = async () => {
  if (!uri) {
    console.error('No MongoDB URI found. Set MONGODB_URI_PROD (or MONGO_TARGET=dev with MONGODB_URI).');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected. Mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}\n`);

  // The unique index on normalizedLabels is what keeps a contributed title
  // from being added twice; an existing deployment has to be told to build it.
  if (APPLY) {
    await DocumentType.syncIndexes();
  }

  const existing = await DocumentType.find({}).lean().exec();
  const byCode = new Map(existing.map((doc) => [doc.code, doc]));

  let created = 0;
  let updated = 0;

  for (const seed of DEFAULT_DOCUMENT_TYPES) {
    const current = byCode.get(seed.code);

    if (!current) {
      console.log(`+ create ${seed.code}  (${seed.labels.en} / ${seed.labels.ar})`);
      if (APPLY) {
        await DocumentType.create({
          code: seed.code,
          labels: seed.labels,
          priority: seed.priority || 0,
          searchTerms: seed.searchTerms || [],
          isCustom: false,
          isActive: true,
        });
      }
      created += 1;
      continue;
    }

    const changes = {};
    if ((current.priority || 0) !== (seed.priority || 0)) {
      changes.priority = seed.priority || 0;
    }
    // normalizedLabels is derived, so a row written before this field existed
    // (or by a path that skipped the pre-save hook) is backfilled here.
    const wantedNormalized = DocumentType.buildNormalizedLabels(current.labels);
    const haveNormalized = Array.isArray(current.normalizedLabels) ? current.normalizedLabels : [];
    if (wantedNormalized.join('|') !== haveNormalized.join('|')) {
      changes.normalizedLabels = wantedNormalized;
    }

    if (Object.keys(changes).length > 0) {
      console.log(`~ update ${seed.code}: ${Object.keys(changes).join(', ')}`);
      if (APPLY) {
        await DocumentType.updateOne({ _id: current._id }, { $set: changes });
      }
      updated += 1;
    }
  }

  const seedCodes = new Set(DEFAULT_DOCUMENT_TYPES.map((seed) => seed.code));
  const extras = existing.filter((doc) => !seedCodes.has(doc.code));
  if (extras.length > 0) {
    console.log(`\nIn the DB but not in this config (left untouched - contributed titles live here):`);
    extras.forEach((doc) => {
      console.log(`  ${doc.code}  (${doc.labels?.en} / ${doc.labels?.ar})${doc.isActive ? '' : '  [inactive]'}`);
    });
  }

  console.log(`\n${created} to create, ${updated} to update, ${extras.length} left alone.`);
  if (!APPLY) {
    console.log('Dry run - nothing was written. Re-run with --apply.');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('sync-document-types failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
