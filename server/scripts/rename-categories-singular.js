/**
 * Renames plural category labels to singular, across en/fr/ar.
 *
 * Dry-run by default: prints current vs proposed labels, writes nothing.
 * Pass --apply to actually update the DB.
 *
 * Usage:
 *   node scripts/rename-categories-singular.js            (dry run)
 *   node scripts/rename-categories-singular.js --apply     (writes)
 *
 * Targets MONGODB_URI_PROD by default. Set MONGO_TARGET=dev to use
 * MONGODB_URI instead:
 *   MONGO_TARGET=dev node scripts/rename-categories-singular.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const APPLY = process.argv.includes('--apply');
const uri = process.env.MONGO_TARGET === 'dev'
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_PROD;

// code -> singular labels. Only codes listed here are touched;
// anything else in the DB is left alone.
const SINGULAR_LABELS = {
  DOCUMENTS: { en: 'Document', fr: 'Document', ar: 'وثيقة' },
  PETS: { en: 'Pet', fr: 'Animal de compagnie', ar: 'حيوان أليف' },
  VEHICLES: { en: 'Vehicle', fr: 'Véhicule', ar: 'مركبة' },
  KEYS: { en: 'Key', fr: 'Clé', ar: 'مفتاح' },
  WALLET: { en: 'Wallet', fr: 'Portefeuille', ar: 'محفظة' },
  BAGS: { en: 'Bag', fr: 'Sac', ar: 'حقيبة' },
  WATCHES: { en: 'Watch', fr: 'Montre', ar: 'ساعة يد' },
  BOOKS: { en: 'Book', fr: 'Livre', ar: 'كتاب' },
  TOYS: { en: 'Toy', fr: 'Jouet', ar: 'لعبة' },
  CAMERAS: { en: 'Camera', fr: 'Appareil photo', ar: 'كاميرا' },
  PERSON: { en: 'Person', fr: 'Personne', ar: 'شخص' },
  // Deliberately not touched (see script header): GLASSES, HEADPHONES,
  // ELECTRONICS, CLOTHING, MONEY, JEWELRY, SPORTS, OTHER
};

const main = async () => {
  if (!uri) {
    console.error('No Mongo URI resolved — check MONGODB_URI_PROD / MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected (${APPLY ? 'APPLY' : 'DRY RUN'} mode)\n`);

  let changed = 0;
  let missing = 0;

  for (const [code, labels] of Object.entries(SINGULAR_LABELS)) {
    const category = await Category.findOne({ code });
    if (!category) {
      console.log(`⚠️  ${code} not found in DB, skipping`);
      missing++;
      continue;
    }

    const same = category.labels.en === labels.en
      && category.labels.fr === labels.fr
      && category.labels.ar === labels.ar;

    if (same) {
      console.log(`✓  ${code} already singular`);
      continue;
    }

    console.log(`${code}:`);
    console.log(`   en: "${category.labels.en}" -> "${labels.en}"`);
    console.log(`   fr: "${category.labels.fr}" -> "${labels.fr}"`);
    console.log(`   ar: "${category.labels.ar}" -> "${labels.ar}"`);

    if (APPLY) {
      category.labels.en = labels.en;
      category.labels.fr = labels.fr;
      category.labels.ar = labels.ar;
      await category.save();
      console.log('   saved.');
    }
    changed++;
  }

  console.log(`\n${APPLY ? 'Updated' : 'Would update'} ${changed} categories. ${missing} not found.`);
  if (!APPLY && changed > 0) {
    console.log('Re-run with --apply to write these changes.');
  }

  await mongoose.connection.close();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
