/**
 * Brings the Category collection in line with client/src/config/categories.js.
 *
 * Dry-run by default: prints what it would create and change, writes nothing.
 * Pass --apply to actually update the DB.
 *
 * Usage:
 *   node scripts/sync-categories.js            (dry run)
 *   node scripts/sync-categories.js --apply     (writes)
 *
 * Targets MONGODB_URI_PROD by default. Set MONGO_TARGET=dev to use
 * MONGODB_URI instead:
 *   MONGO_TARGET=dev node scripts/sync-categories.js
 *
 * Two things kept the two halves apart, and this script is the fix for both:
 *
 *  - The DB is what the app lists; the client config is only what it can
 *    *draw*. getCategoryConfig falls back to OTHER's grey icon for a code it
 *    does not know, silently - so a category seeded on the server alone
 *    renders as an unnamed grey "other" tile, and a category the client draws
 *    but the DB never got simply does not exist. TOYS was the second kind: a
 *    full-replace seed (setup-lost-found-categories.js) dropped it while the
 *    icon stayed in the client config, so the app has had a toy icon nothing
 *    could ever be filed under.
 *  - The accent colours drifted into duplicates (jewelry and headphones on one
 *    purple, clothing/sports/money on one green, keys and toys on one orange).
 *    The client config is the source of truth for those - neither front end
 *    reads Category.color - but an admin looking at the collection should not
 *    be shown a colour the site does not use.
 *
 * So: categories missing from the DB are created, and every category's colour
 * and priority is synced. Labels are deliberately left alone on categories
 * that already exist - they are live, curated copy (plural, per
 * rename-categories-plural.js), and this script has no business rewriting
 * them. Nothing is ever deleted or deactivated: a code in the DB that this
 * file does not list is reported and left exactly as it is.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const APPLY = process.argv.includes('--apply');
const uri = process.env.MONGO_TARGET === 'dev'
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_PROD;

// Mirrors CATEGORY_CONFIG in client/src/config/categories.js: same codes, same
// colours, same priorities. `labels`/`description`/`searchTerms` are used only
// when a category has to be created - see the header.
const CATEGORIES = [
  {
    code: 'ELECTRONICS',
    labels: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
    color: '#00BCD4',
    priority: 1,
    description: 'Mobile phones, tablets, laptops, and electronic devices',
    searchTerms: ['electronics', 'électronique', 'إلكترونيات', 'phone', 'laptop', 'tablet'],
  },
  {
    code: 'DOCUMENTS',
    labels: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
    color: '#795548',
    priority: 2,
    description: 'ID cards, passports, licenses, certificates, papers',
    searchTerms: ['documents', 'وثائق', 'papers', 'ID', 'passport', 'certificate'],
  },
  {
    code: 'JEWELRY',
    labels: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
    color: '#9C27B0',
    priority: 3,
    description: 'Rings, necklaces, bracelets, earrings',
    searchTerms: ['jewelry', 'bijoux', 'مجوهرات', 'ring', 'necklace', 'bracelet'],
  },
  {
    code: 'CLOTHING',
    labels: { en: 'Clothing', fr: 'Vêtements', ar: 'ملابس' },
    color: '#4CAF50',
    priority: 4,
    description: 'Coats, jackets, hats, scarves, shoes',
    searchTerms: ['clothing', 'vêtements', 'ملابس', 'clothes', 'coat', 'shoes'],
  },
  {
    code: 'PETS',
    labels: { en: 'Pets', fr: 'Animaux de compagnie', ar: 'حيوانات أليفة' },
    color: '#FF6B6B',
    priority: 5,
    description: 'Lost or found pets and animals',
    searchTerms: ['pets', 'animaux', 'حيوانات', 'dog', 'cat', 'animal'],
  },
  {
    code: 'VEHICLES',
    labels: { en: 'Vehicles', fr: 'Véhicules', ar: 'مركبات' },
    color: '#607D8B',
    priority: 6,
    description: 'Cars, motorcycles, vans',
    searchTerms: ['vehicles', 'véhicules', 'مركبات', 'car', 'motorcycle', 'voiture'],
  },
  {
    code: 'KEYS',
    labels: { en: 'Keys', fr: 'Clés', ar: 'مفاتيح' },
    color: '#FB8C00',
    priority: 7,
    description: 'House keys, car keys, key chains',
    searchTerms: ['keys', 'clés', 'مفاتيح', 'keychain', 'house keys', 'car keys'],
  },
  {
    code: 'WALLET',
    labels: { en: 'Wallets', fr: 'Portefeuilles', ar: 'محافظ' },
    color: '#BF360C',
    priority: 8,
    description: 'Wallets, purses, card holders',
    searchTerms: ['wallets', 'wallet', 'portefeuilles', 'portefeuille', 'محافظ', 'محفظة', 'purse', 'card holder'],
  },
  {
    code: 'BAGS',
    labels: { en: 'Bags', fr: 'Sacs', ar: 'حقائب' },
    color: '#827717',
    priority: 9,
    description: 'Backpacks, handbags, briefcases, suitcases',
    searchTerms: ['bags', 'sacs', 'حقائب', 'backpack', 'handbag', 'suitcase', 'luggage'],
  },
  {
    code: 'WATCHES',
    labels: { en: 'Watches', fr: 'Montres', ar: 'ساعات يد' },
    color: '#2196F3',
    priority: 10,
    description: 'Wristwatches, smartwatches, fitness trackers',
    searchTerms: ['watches', 'watch', 'montres', 'montre', 'ساعات', 'ساعة', 'smartwatch', 'wristwatch'],
  },
  {
    code: 'GLASSES',
    labels: { en: 'Glasses', fr: 'Lunettes', ar: 'نظارات' },
    color: '#3F51B5',
    priority: 11,
    description: 'Eyeglasses, sunglasses, reading glasses',
    searchTerms: ['glasses', 'lunettes', 'نظارات', 'sunglasses', 'eyewear'],
  },
  {
    code: 'HEADPHONES',
    labels: { en: 'Headphones', fr: 'Écouteurs', ar: 'سماعات' },
    color: '#7E57C2',
    priority: 12,
    description: 'Headphones, earbuds, speakers',
    searchTerms: ['headphones', 'écouteurs', 'سماعات', 'earbuds', 'airpods'],
  },
  {
    code: 'BOOKS',
    labels: { en: 'Books', fr: 'Livres', ar: 'كتب' },
    color: '#5E35B1',
    priority: 13,
    description: 'Books, textbooks, notebooks, journals',
    searchTerms: ['books', 'livres', 'كتب', 'notebook', 'textbook', 'cahier'],
  },
  {
    code: 'SPORTS',
    labels: { en: 'Sports Equipment', fr: 'Équipements sportifs', ar: 'معدات رياضية' },
    color: '#8BC34A',
    priority: 14,
    description: 'Sports gear, balls, gym bags',
    searchTerms: ['sports', 'sport', 'رياضة', 'ball', 'gym', 'équipement'],
  },
  {
    code: 'TOYS',
    labels: { en: 'Toys', fr: 'Jouets', ar: 'ألعاب' },
    color: '#AFB42B',
    priority: 15,
    description: "Children's toys, games, plush animals",
    searchTerms: ['toys', 'jouets', 'ألعاب', 'لعبة', 'children', 'kids', 'doll', 'دمية'],
  },
  {
    code: 'CAMERAS',
    labels: { en: 'Cameras', fr: 'Appareils photo', ar: 'كاميرات' },
    color: '#0097A7',
    priority: 16,
    description: 'Cameras, lenses, photography equipment',
    searchTerms: ['cameras', 'camera', 'appareils photo', 'appareil photo', 'كاميرات', 'كاميرا', 'lens', 'photography'],
  },
  {
    code: 'CHARGERS',
    labels: { en: 'Chargers & Cables', fr: 'Chargeurs et câbles', ar: 'شواحن وكابلات' },
    color: '#455A64',
    priority: 17,
    description: 'Chargers, cables, power banks, SIM cards, memory cards',
    searchTerms: [
      'chargers', 'charger', 'chargeurs', 'chargeur', 'شواحن', 'شاحن', 'cables', 'cable', 'câbles', 'câble', 'كابلات', 'كابل',
      'power bank', 'batterie externe', 'بطارية متنقلة',
      'sim', 'puce', 'شريحة', 'memory card', 'carte mémoire', 'بطاقة ذاكرة',
    ],
  },
  {
    code: 'UMBRELLAS',
    labels: { en: 'Umbrellas', fr: 'Parapluies', ar: 'مظلات' },
    color: '#0277BD',
    priority: 18,
    description: 'Umbrellas and parasols',
    searchTerms: ['umbrellas', 'umbrella', 'parapluies', 'parapluie', 'مظلات', 'مظلة', 'شمسية', 'parasol'],
  },
  {
    code: 'BICYCLES',
    labels: { en: 'Bicycles & Scooters', fr: 'Vélos et trottinettes', ar: 'دراجات وسكوترات' },
    color: '#009966',
    priority: 19,
    description: 'Bicycles, e-bikes, scooters, skateboards',
    searchTerms: [
      'bicycles', 'bicycle', 'vélos', 'vélo', 'دراجات', 'دراجة', 'bike', 'e-bike', 'vélo électrique',
      'scooters', 'scooter', 'trottinettes', 'trottinette', 'سكوتر', 'سكوترات', 'skateboard', 'لوح تزلج',
    ],
  },
  {
    code: 'MONEY',
    labels: { en: 'Money', fr: 'Argent', ar: 'نقود' },
    color: '#2E7D32',
    priority: 20,
    description: 'Cash, coins, banknotes',
    searchTerms: ['money', 'argent', 'نقود', 'cash', 'coins', 'banknotes', 'عملة'],
  },
  {
    code: 'PERSON',
    labels: { en: 'Persons', fr: 'Personnes', ar: 'أشخاص' },
    color: '#F44336',
    priority: 21,
    description: 'Missing person reports',
    searchTerms: ['persons', 'person', 'personnes', 'personne', 'أشخاص', 'شخص', 'missing', 'disparu', 'مفقود'],
  },
  {
    code: 'MEDICAL',
    labels: { en: 'Medical & Mobility Aids', fr: 'Aides médicales', ar: 'مستلزمات طبية' },
    color: '#C2185B',
    priority: 23,
    description: 'Hearing aids, inhalers, prescriptions, canes, crutches, wheelchairs',
    searchTerms: [
      'medical', 'médical', 'طبي', 'hearing aid', 'appareil auditif', 'سماعة طبية',
      'inhaler', 'inhalateur', 'بخاخ', 'prescription', 'ordonnance', 'وصفة طبية',
      'cane', 'canne', 'عكاز', 'crutches', 'béquilles', 'wheelchair', 'fauteuil roulant', 'كرسي متحرك',
    ],
  },
  {
    code: 'BABY',
    labels: { en: 'Baby & Kids Gear', fr: 'Articles pour enfants', ar: 'مستلزمات الأطفال' },
    color: '#EC407A',
    priority: 24,
    description: 'Strollers, car seats, baby bottles, nappy bags',
    searchTerms: [
      'baby', 'bébé', 'طفل', 'رضيع', 'stroller', 'poussette', 'عربة أطفال',
      'car seat', 'siège auto', 'مقعد سيارة', 'bottle', 'biberon', 'رضاعة',
    ],
  },
  {
    code: 'MUSIC',
    labels: { en: 'Musical Instruments', fr: 'Instruments de musique', ar: 'آلات موسيقية' },
    color: '#009688',
    priority: 25,
    description: 'Musical instruments and their cases and accessories',
    searchTerms: [
      'music', 'musique', 'موسيقى', 'instruments', 'instrument', 'آلات موسيقية', 'آلة موسيقية',
      'guitar', 'guitare', 'قيثارة', 'violin', 'violon', 'كمان', 'oud', 'عود',
    ],
  },
  {
    code: 'OTHER',
    labels: { en: 'Other Items', fr: 'Autres articles', ar: 'أشياء أخرى' },
    color: '#9E9E9E',
    // Always last. The categories API sorts alphabetically by labels.en rather
    // than by this, so it decides nothing today - but a catch-all sitting in
    // the middle of a priority-ordered list is a trap for whoever changes that.
    priority: 99,
    description: 'Items not fitting other categories',
    searchTerms: ['other', 'autre', 'آخر', 'misc', 'miscellaneous', 'divers'],
  },
];

const main = async () => {
  if (!uri) {
    console.error('No Mongo URI resolved — check MONGODB_URI_PROD / MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected (${APPLY ? 'APPLY' : 'DRY RUN'} mode)\n`);

  const existing = await Category.find({}).lean();
  const byCode = new Map(existing.map((category) => [category.code, category]));

  let created = 0;
  let updated = 0;

  console.log('-- categories to create --');
  for (const canonical of CATEGORIES) {
    if (byCode.has(canonical.code)) continue;

    console.log(`+  ${canonical.code.padEnd(12)} ${canonical.labels.en} / ${canonical.labels.fr} / ${canonical.labels.ar}`);
    if (APPLY) await Category.create({ ...canonical, isActive: true });
    created += 1;
  }
  if (created === 0) console.log('   (none — every category is already there)');

  console.log('\n-- colour / priority changes --');
  for (const canonical of CATEGORIES) {
    const current = byCode.get(canonical.code);
    if (!current) continue;

    const changes = [];
    if (current.color !== canonical.color) changes.push(`color ${current.color} -> ${canonical.color}`);
    if (current.priority !== canonical.priority) changes.push(`priority ${current.priority} -> ${canonical.priority}`);
    if (current.isActive === false) changes.push('isActive false -> true');
    if (changes.length === 0) continue;

    console.log(`~  ${canonical.code.padEnd(12)} ${changes.join(', ')}`);
    if (APPLY) {
      await Category.updateOne(
        { _id: current._id },
        { $set: { color: canonical.color, priority: canonical.priority, isActive: true } },
      );
    }
    updated += 1;
  }
  if (updated === 0) console.log('   (none — every category already matches the client config)');

  const canonicalCodes = new Set(CATEGORIES.map((category) => category.code));
  const unknown = existing.filter((category) => !canonicalCodes.has(category.code));
  if (unknown.length > 0) {
    console.log('\n-- in the DB, not in the client config (left untouched) --');
    unknown.forEach((category) => {
      console.log(`?  ${category.code.padEnd(12)} ${category.labels?.en || '(no label)'} — renders with OTHER's grey icon`);
    });
  }

  console.log(`\n${APPLY ? 'Created' : 'Would create'} ${created}, ${APPLY ? 'updated' : 'would update'} ${updated}.`);
  if (!APPLY && (created > 0 || updated > 0)) {
    console.log('Re-run with --apply to write these changes.');
  }

  await mongoose.connection.close();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
