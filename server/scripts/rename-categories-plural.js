/**
 * Renames singular category labels to plural, across en/fr/ar.
 *
 * Dry-run by default: prints current vs proposed labels, writes nothing.
 * Pass --apply to actually update the DB.
 *
 * Usage:
 *   node scripts/rename-categories-plural.js            (dry run)
 *   node scripts/rename-categories-plural.js --apply     (writes to default DB)
 *
 * Targets MONGODB_URI_PROD by default. Set MONGO_TARGET=dev to use
 * MONGODB_URI instead:
 *   MONGO_TARGET=dev node scripts/rename-categories-plural.js --apply
 *
 * Pass --both to run against both DEV and PROD:
 *   node scripts/rename-categories-plural.js --apply --both
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const APPLY = process.argv.includes('--apply');
const BOTH = process.argv.includes('--both');

// Code -> Plural labels across all 3 languages
const PLURAL_LABELS = {
  DOCUMENTS: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
  PETS: { en: 'Pets', fr: 'Animaux de compagnie', ar: 'حيوانات أليفة' },
  VEHICLES: { en: 'Vehicles', fr: 'Véhicules', ar: 'مركبات' },
  KEYS: { en: 'Keys', fr: 'Clés', ar: 'مفاتيح' },
  WALLET: { en: 'Wallets', fr: 'Portefeuilles', ar: 'محافظ' },
  BAGS: { en: 'Bags', fr: 'Sacs', ar: 'حقائب' },
  WATCHES: { en: 'Watches', fr: 'Montres', ar: 'ساعات يد' },
  BOOKS: { en: 'Books', fr: 'Livres', ar: 'كتب' },
  SPORTS: { en: 'Sports Equipment', fr: 'Équipements sportifs', ar: 'معدات رياضية' },
  TOYS: { en: 'Toys', fr: 'Jouets', ar: 'ألعاب' },
  CAMERAS: { en: 'Cameras', fr: 'Appareils photo', ar: 'كاميرات' },
  CHARGERS: { en: 'Chargers & Cables', fr: 'Chargeurs et câbles', ar: 'شواحن وكابلات' },
  UMBRELLAS: { en: 'Umbrellas', fr: 'Parapluies', ar: 'مظلات' },
  BICYCLES: { en: 'Bicycles & Scooters', fr: 'Vélos et trottinettes', ar: 'دراجات وسكوترات' },
  PERSON: { en: 'Persons', fr: 'Personnes', ar: 'أشخاص' },
  MEDICAL: { en: 'Medical & Mobility Aids', fr: 'Aides médicales', ar: 'مستلزمات طبية' },
  BABY: { en: 'Baby & Kids Gear', fr: 'Articles pour enfants', ar: 'مستلزمات الأطفال' },
  MUSIC: { en: 'Musical Instruments', fr: 'Instruments de musique', ar: 'آلات موسيقية' },
  // Already plural / collective in all 3 languages (checked for completeness):
  ELECTRONICS: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
  JEWELRY: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
  CLOTHING: { en: 'Clothing', fr: 'Vêtements', ar: 'ملابس' },
  GLASSES: { en: 'Glasses', fr: 'Lunettes', ar: 'نظارات' },
  HEADPHONES: { en: 'Headphones', fr: 'Écouteurs', ar: 'سماعات' },
  MONEY: { en: 'Money', fr: 'Argent', ar: 'نقود' },
  OTHER: { en: 'Other Items', fr: 'Autres articles', ar: 'أشياء أخرى' },
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
  let alreadyPlural = 0;
  let missing = 0;

  for (const [code, targetLabels] of Object.entries(PLURAL_LABELS)) {
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
      console.log(`✓  ${code.padEnd(12)} already plural (${currentLabels.en} / ${currentLabels.fr} / ${currentLabels.ar})`);
      alreadyPlural++;
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

  console.log(`\n[${name}] ${APPLY ? 'Updated' : 'Would update'} ${changed} categories. ${alreadyPlural} already plural, ${missing} not found.`);
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
