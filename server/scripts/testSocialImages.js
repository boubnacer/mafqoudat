/**
 * Offline check of the graphic and caption a listing is auto-posted with.
 *
 *   node scripts/testSocialImages.js
 *
 * No database, no network - models/Category is stubbed for socialCaption.js.
 *
 * Exits non-zero if any assertion failed.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const sharp = require('sharp');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  if (actual === expected) {
    console.log(`ok    ${label}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}\n        expected ${expected}\n        actual   ${actual}`);
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (condition) {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
};

// ------------------------------------------------------------- model stub
const CATEGORY_IDS = {
  '507f1f77bcf86cd799439011': { code: 'ELECTRONICS' },
  '507f1f77bcf86cd799439012': { code: 'PETS' },
  '507f1f77bcf86cd799439013': { code: 'LUGGAGE' },
  '507f1f77bcf86cd799439014': { _id: '507f1f77bcf86cd799439014', code: 'DOCUMENTS', labels: { ar: 'وثائق', fr: 'Documents', en: 'Documents' } },
  '507f1f77bcf86cd799439015': { _id: '507f1f77bcf86cd799439015', code: 'KEYS', labels: { ar: 'مفاتيح', fr: 'Clés', en: 'Keys' } },
};

/** A findById()/find() stand-in answering a fixed value, chainable like mongoose. */
const stubQuery = (value) => {
  const query = {
    select: () => query,
    lean: () => query,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return query;
};

const CategoryStub = {
  findById: (id) => stubQuery(CATEGORY_IDS[String(id)] || null),
  find: ({ _id: { $in: ids } }) => stubQuery(
    ids.map((id) => CATEGORY_IDS[String(id)]).filter(Boolean).map((category) => ({
      labels: { ar: 'فئة', fr: 'Categorie', en: 'Category' },
      ...category,
    })),
  ),
};

const FoundLostStub = { findById: () => stubQuery({ code: 'LOST' }) };
const CityStub = { findById: () => stubQuery({ labels: { ar: 'الدار البيضاء', fr: 'Casablanca', en: 'Casablanca' } }) };
const CountryStub = { findById: () => stubQuery({ names: { ar: 'المغرب', fr: 'Maroc', en: 'Morocco' }, flag: '🇲🇦' }) };

const DOCUMENT_TYPES = {
  '507f1f77bcf86cd7994390d1': {
    _id: '507f1f77bcf86cd7994390d1',
    labels: { ar: 'جواز السفر', fr: 'Passeport', en: 'Passport' },
  },
  '507f1f77bcf86cd7994390d2': {
    _id: '507f1f77bcf86cd7994390d2',
    labels: { ar: 'بطاقة الهوية الوطنية', fr: "Carte nationale d'identité", en: 'National identity card' },
  },
};
const DocumentTypeStub = {
  find: ({ _id: { $in: ids } }) => stubQuery(
    ids.map((id) => DOCUMENT_TYPES[String(id)]).filter(Boolean).reverse(),
  ),
};

const originalLoad = Module._load;
Module._load = function load(request, parent) {
  const fromCaption = parent && parent.filename && /[\\/]services[\\/]socialCaption\.js$/.test(parent.filename);
  if (fromCaption && request === '../models/Category') return CategoryStub;
  if (fromCaption && request === '../models/FoundLost') return FoundLostStub;
  if (fromCaption && request === '../models/City') return CityStub;
  if (fromCaption && request === '../models/Country') return CountryStub;
  if (fromCaption && request === '../models/DocumentType') return DocumentTypeStub;
  return originalLoad.apply(this, arguments);
};

process.env.CLIENT_URL = 'https://mafqoudat.test';

const { resolveListingImage, buildListingCaption } = require('../services/socialCaption');
const { generateCategoryImage, isAvailable: dynamicImageAvailable } = require('../services/dynamicCategoryImage');

const SITE = process.env.CLIENT_URL;

async function run() {
  console.log('\n-- dynamic category image generation --');
  checkThat('dynamic generator is available with Sharp', dynamicImageAvailable());

  const singleBuf = await generateCategoryImage(['PETS']);
  checkThat('generates JPEG buffer for single category', Buffer.isBuffer(singleBuf) && singleBuf.length > 0);

  const dualBuf = await generateCategoryImage(['PETS', 'KEYS']);
  checkThat('generates JPEG buffer for dual categories', Buffer.isBuffer(dualBuf) && dualBuf.length > 0);

  const tripleBuf = await generateCategoryImage(['PETS', 'KEYS', 'ELECTRONICS']);
  checkThat('generates JPEG buffer for triple categories', Buffer.isBuffer(tripleBuf) && tripleBuf.length > 0);

  const emptyBuf = await generateCategoryImage([]);
  checkThat('generates JPEG buffer with OTHER fallback for empty list', Buffer.isBuffer(emptyBuf) && emptyBuf.length > 0);

  const unknownBuf = await generateCategoryImage(['UNKNOWN_CODE_123']);
  checkThat('generates JPEG buffer for unknown category code', Buffer.isBuffer(unknownBuf) && unknownBuf.length > 0);

  console.log('\n-- image format & Instagram compliance --');
  const samples = [
    { label: 'single category', buf: singleBuf },
    { label: 'dual category', buf: dualBuf },
    { label: 'triple category', buf: tripleBuf },
    { label: 'fallback graphic', buf: emptyBuf },
  ];

  for (const { label, buf } of samples) {
    const meta = await sharp(buf).metadata();
    checkThat(`${label} is JPEG format`, meta.format === 'jpeg');
    checkThat(`${label} is sRGB color space`, meta.space === 'srgb');
    checkThat(`${label} is 1080x1080 square (aspect 1:1)`, meta.width === 1080 && meta.height === 1080);
    checkThat(`${label} is under 8 MB limit`, buf.length < 8 * 1024 * 1024, `${Math.round(buf.length / 1024)} KB`);
  }

  console.log('\n-- what a listing publishes with --');
  const uploaded = await resolveListingImage({
    cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/x.jpg',
    categories: ['507f1f77bcf86cd799439011'],
  });
  check('a real photo wins over any graphic', uploaded.imageUrl, 'https://res.cloudinary.com/demo/image/upload/x.jpg');
  checkThat('a real photo is not flagged as a placeholder', uploaded.isPlaceholder === false);

  const legacyUpload = await resolveListingImage({ image: 'https://cdn.example.com/legacy.jpg' });
  check('the legacy image field still wins', legacyUpload.imageUrl, 'https://cdn.example.com/legacy.jpg');

  console.log('\n-- the caption Instagram will accept --');
  const IG_LIMIT = 2200;
  const longPost = {
    _id: '507f1f77bcf86cd7994390aa',
    foundLost: 'fl',
    city: 'c1',
    country: 'co1',
    categories: ['507f1f77bcf86cd799439011'],
    exactLocation: 'Rue Mohammed V, near the central market',
    mainDate: '12 January 2026',
    description: 'A black leather wallet with a broken zip. '.repeat(48),
  };

  const unbounded = await buildListingCaption(longPost);
  checkThat(
    'the description no longer appears in the caption',
    !unbounded.includes('broken zip'),
    `${unbounded.length} characters, no limit passed`,
  );
  checkThat('the fixed SEO tags are there', unbounded.includes('#مفقودات') && unbounded.includes('#Mafqoudat'));

  const documentsPost = {
    _id: '507f1f77bcf86cd7994390ab',
    foundLost: 'fl',
    city: 'c1',
    country: 'co1',
    categories: ['507f1f77bcf86cd799439011'],
    documentTypes: ['507f1f77bcf86cd7994390d1', '507f1f77bcf86cd7994390d2'],
    documentOwnerName: { ar: 'محمد العلوي', latin: 'Mohamed Alaoui' },
  };
  const documentsCaption = await buildListingCaption(documentsPost);
  checkThat(
    'the document titles follow the category in every language',
    documentsCaption.includes('(جواز السفر، بطاقة الهوية الوطنية)')
      && documentsCaption.includes("(Passeport, Carte nationale d'identité)")
      && documentsCaption.includes('(Passport, National identity card)'),
    'a header that could be any of twenty titles tells a reader nothing',
  );
  checkThat(
    'each block carries the name in its own script',
    documentsCaption.includes('الاسم على الوثيقة: محمد العلوي')
      && documentsCaption.includes('Nom figurant sur le document: Mohamed Alaoui')
      && documentsCaption.includes('Name on the document: Mohamed Alaoui'),
  );

  const multiCategoryDocPost = {
    _id: '507f1f77bcf86cd7994390ac',
    foundLost: 'fl',
    city: 'c1',
    country: 'co1',
    categories: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015'], // Documents, Keys
    documentTypes: ['507f1f77bcf86cd7994390d1', '507f1f77bcf86cd7994390d2'],
    documentOwnerName: { ar: 'محمد العلوي', latin: 'Mohamed Alaoui' },
  };
  const multiCategoryCaption = await buildListingCaption(multiCategoryDocPost);
  checkThat(
    'when Documents is selected with other categories, Documents is last and has document types attached',
    multiCategoryCaption.includes('Lost Keys, Documents (Passport, National identity card)')
      && multiCategoryCaption.includes("Perte de Clés, Documents (Passeport, Carte nationale d'identité)")
      && multiCategoryCaption.includes('فقدان مفاتيح، وثائق (جواز السفر، بطاقة الهوية الوطنية)'),
    'Documents must be the last category in caption and have type in parentheses',
  );

  const reverseMultiDocPost = {
    ...multiCategoryDocPost,
    _id: '507f1f77bcf86cd7994390ad',
    categories: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439014'], // Keys, Documents
  };
  const reverseMultiCaption = await buildListingCaption(reverseMultiDocPost);
  checkThat(
    'Documents is still last even if selected after other categories',
    reverseMultiCaption.includes('Lost Keys, Documents (Passport, National identity card)')
      && reverseMultiCaption.includes("Perte de Clés, Documents (Passeport, Carte nationale d'identité)")
      && reverseMultiCaption.includes('فقدان مفاتيح، وثائق (جواز السفر، بطاقة الهوية الوطنية)'),
  );

  const capped = await buildListingCaption(longPost, { maxLength: IG_LIMIT });
  check(
    'well under the real Instagram limit, nothing to trim',
    capped,
    unbounded,
  );

  checkThat(
    'the country flag and exact location are in the caption for all languages',
    unbounded.includes('🇲🇦 🔴 Lost')
      && unbounded.includes('🇲🇦 🔴 Perte de')
      && unbounded.includes('🇲🇦 🔴 فقدان')
      && unbounded.includes('exactly at:\n\u200E📍 Rue Mohammed V, near the central market')
      && unbounded.includes('exactement à :\n\u200E📍 Rue Mohammed V, near the central market')
      && unbounded.includes('تحديداً في :\n\u200F📍 Rue Mohammed V, near the central market'),
    'country flag + status dot and exact location on new line',
  );

  const tightLimit = 1000;
  const tight = await buildListingCaption(longPost, { maxLength: tightLimit });
  checkThat('a tight limit is honored', tight.length <= tightLimit, `${tight.length} characters`);
  checkThat('the link survives the trim', tight.includes(`/dash/posts/${longPost._id}`));
  checkThat('all three languages are still there', tight.includes('Perte de') && tight.includes('Lost') && tight.includes('فقدان'));

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
