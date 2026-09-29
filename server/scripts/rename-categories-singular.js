/**
 * Renames plural category labels to singular, across en/fr/ar.
 *
 * Dry-run by default: prints current vs proposed labels, writes nothing.
 * Pass --apply to actually update the DB.
 *
 * Usage:
 *   node scripts/rename-categories-singular.js            (dry run)
 *   node scripts/rename-categories-singular.js --apply     (writes to default DB)
 *
 * Targets MONGODB_URI_PROD by default. Set MONGO_TARGET=dev to use
 * MONGODB_URI instead:
 *   MONGO_TARGET=dev node scripts/rename-categories-singular.js --apply
 *
 * Pass --both to run against both DEV and PROD:
 *   node scripts/rename-categories-singular.js --apply --both
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const APPLY = process.argv.includes('--apply');
const BOTH = process.argv.includes('--both');

// Code -> Singular labels across all 3 languages
const SINGULAR_LABELS = {
  PHONES: { en: 'Phone & Tablet', fr: 'Téléphone & Tablette', ar: 'هاتف' },
  LAPTOPS: { en: 'Laptop / PC', fr: 'Ordinateur & PC', ar: 'حاسوب' },
  POWERBANKS: { en: 'Power Bank', fr: 'Batterie externe', ar: 'باور بانك' },
  STORAGE: { en: 'Storage', fr: 'Stockage', ar: 'جهاز تخزين' },
  DOCUMENTS: { en: 'Document', fr: 'Document', ar: 'وثيقة' },
  PETS: { en: 'Pet', fr: 'Animal de compagnie', ar: 'حيوان أليف' },
  VEHICLES: { en: 'Vehicle', fr: 'Véhicule', ar: 'مركبة' },
  KEYS: { en: 'Key', fr: 'Clé', ar: 'مفتاح' },
  WALLET: { en: 'Wallet', fr: 'Portefeuille', ar: 'محفظة' },
  BAGS: { en: 'Bag', fr: 'Sac', ar: 'حقيبة' },
  WATCHES: { en: 'Watch', fr: 'Montre', ar: 'ساعة يد' },
  BOOKS: { en: 'Book', fr: 'Livre', ar: 'كتاب' },
  SPORTS: { en: 'Sports Equipment', fr: 'Équipement sportif', ar: 'معدات رياضية' },
  TOYS: { en: 'Toy', fr: 'Jouet', ar: 'لعبة' },
  CAMERAS: { en: 'Camera', fr: 'Appareil photo', ar: 'كاميرا' },
  CHARGERS: { en: 'Charger & Cable', fr: 'Chargeur & Câble', ar: 'شاحن وكابل' },
  UMBRELLAS: { en: 'Umbrella', fr: 'Parapluie', ar: 'مظلة' },
  BICYCLES: { en: 'Bicycle & Scooter', fr: 'Vélo et trottinette', ar: 'دراجة وسكوتر' },
  PERSON: { en: 'Person', fr: 'Personne', ar: 'شخص' },
  MEDICAL: { en: 'Medical & Mobility Aid', fr: 'Aide médicale', ar: 'مستلزم طبي' },
  BABY: { en: 'Baby & Kids Gear', fr: 'Article pour enfant', ar: 'مستلزمات الأطفال' },
  MUSIC: { en: 'Musical Instrument', fr: 'Instrument de musique', ar: 'آلة موسيقية' },
  ELECTRONICS: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
  JEWELRY: { en: 'Jewelry', fr: 'Bijou', ar: 'مجوهرات' },
  CLOTHING: { en: 'Clothing', fr: 'Vêtement', ar: 'ملابس' },
  GLASSES: { en: 'Glasses', fr: 'Lunettes', ar: 'نظارة' },
  HEADPHONES: { en: 'Headphones', fr: 'Écouteur', ar: 'سماعة' },
  MONEY: { en: 'Money', fr: 'Argent', ar: 'نقود' },
  OTHER: { en: 'Other', fr: 'Autre', ar: 'أخرى' },
};

const processDatabase = async (name, uri) => {
  if (!uri) {
    console.log(`⚠️  No URI found for ${name}, skipping.`);
    return;
  }

  console.log(`\n==================================================`);
  console.log(`Connecting to ${name} (${APPLY ? 'APPLY' : 'DRY RUN'} mode)`);
  console.log(`==================================================\n`);

  await mongoose.connect(uri);

  let changed = 0;
  let alreadySingular = 0;
  let missing = 0;

  for (const [code, targetLabels] of Object.entries(SINGULAR_LABELS)) {
    const category = await Category.findOne({ code });
    if (!category) {
      console.log(`⚠️  ${code} not found in DB, skipping`);
      missing++;
      continue;
    }

    const currentLabels = category.labels || {};
    const diffs = [];

    if (currentLabels.en !== targetLabels.en) {
      diffs.push(`   en: "${currentLabels.en}" -> "${targetLabels.en}"`);
    }
    if (currentLabels.fr !== targetLabels.fr) {
      diffs.push(`   fr: "${currentLabels.fr}" -> "${targetLabels.fr}"`);
    }
    if (currentLabels.ar !== targetLabels.ar) {
      diffs.push(`   ar: "${currentLabels.ar}" -> "${targetLabels.ar}"`);
    }

    if (diffs.length === 0) {
      console.log(`✓  ${code.padEnd(12)} already singular (${currentLabels.en} / ${currentLabels.fr} / ${currentLabels.ar})`);
      alreadySingular++;
      continue;
    }

    console.log(`~  ${code}:`);
    diffs.forEach((d) => console.log(d));

    if (APPLY) {
      category.labels = {
        ...category.labels,
        en: targetLabels.en,
        fr: targetLabels.fr,
        ar: targetLabels.ar,
      };
      // Ensure searchTerms includes both old and new terms
      const existingTerms = Array.isArray(category.searchTerms) ? category.searchTerms : [];
      category.searchTerms = Array.from(new Set([
        ...existingTerms,
        targetLabels.en.toLowerCase(),
        targetLabels.fr.toLowerCase(),
        targetLabels.ar,
      ]));
      await category.save();
      console.log('   -> saved.');
    }
    changed++;
  }

  console.log(`\n[${name}] ${APPLY ? 'Updated' : 'Would update'} ${changed} categories. ${alreadySingular} already singular, ${missing} not found.`);
  await mongoose.connection.close();
};

const main = async () => {
  const targets = [];

  if (BOTH) {
    if (process.env.MONGODB_URI) targets.push(['DEV', process.env.MONGODB_URI]);
    if (process.env.MONGODB_URI_PROD && process.env.MONGODB_URI_PROD !== process.env.MONGODB_URI) {
      targets.push(['PROD', process.env.MONGODB_URI_PROD]);
    }
  } else {
    const isDev = process.env.MONGO_TARGET === 'dev';
    const uri = isDev ? process.env.MONGODB_URI : (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI);
    targets.push([isDev ? 'DEV' : 'PROD', uri]);
  }

  for (const [name, uri] of targets) {
    await processDatabase(name, uri);
  }

  if (!APPLY) {
    console.log('\nDRY RUN complete. Re-run with --apply to write these changes to the database.');
  } else {
    console.log('\nAll changes applied successfully!');
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
