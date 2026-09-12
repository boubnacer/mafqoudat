/**
 * Offline check of the graphic a photo-less listing is auto-posted with.
 *
 *   node scripts/testSocialImages.js
 *
 * No database, no network - models/Category is stubbed for socialCaption.js.
 *
 * What actually matters here is the last block: Meta fetches the image URL
 * itself and fails the whole publish when it 404s, so a code in
 * config/categorySocialImages.js with no file behind it in client/public
 * would take the listing off the Page entirely. That pair of directions -
 * every code has a file, every file has a code - is the only thing keeping
 * the server's list and the generated assets from drifting apart.
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
  // Seeded before the icon set existed - the client falls back to OTHER's
  // icon for it, and no image was ever generated under this code.
  '507f1f77bcf86cd799439013': { code: 'LUGGAGE' },
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

// The rest of what buildListingCaption resolves. Only the caption block below
// uses these; the image checks never reach them.
const FoundLostStub = { findById: () => stubQuery({ code: 'LOST' }) };
const CityStub = { findById: () => stubQuery({ labels: { ar: 'الدار البيضاء', fr: 'Casablanca', en: 'Casablanca' } }) };
const CountryStub = { findById: () => stubQuery({ names: { ar: 'المغرب', fr: 'Maroc', en: 'Morocco' } }) };

const originalLoad = Module._load;
Module._load = function load(request, parent) {
  const fromCaption = parent && parent.filename && parent.filename.endsWith('services/socialCaption.js');
  if (fromCaption && request === '../models/Category') return CategoryStub;
  if (fromCaption && request === '../models/FoundLost') return FoundLostStub;
  if (fromCaption && request === '../models/City') return CityStub;
  if (fromCaption && request === '../models/Country') return CountryStub;
  // eslint-disable-next-line prefer-rest-params
  return originalLoad.apply(this, arguments);
};

process.env.CLIENT_URL = 'https://mafqoudat.test';

const { resolveListingImage, buildListingCaption } = require('../services/socialCaption');
const {
  CATEGORY_SOCIAL_IMAGE_CODES,
  CATEGORY_SOCIAL_IMAGE_DIR,
  PLACEHOLDER_IMAGE_PATH,
  categorySocialImagePath,
} = require('../config/categorySocialImages');

const SITE = process.env.CLIENT_URL;

async function run() {
  console.log('\n-- path mapping --');
  check('a known code maps to its own file', categorySocialImagePath('CLOTHING'), 'category-social/clothing.jpg');
  check('the code is matched case-insensitively', categorySocialImagePath('clothing'), 'category-social/clothing.jpg');
  check('a code with no image falls back', categorySocialImagePath('LUGGAGE'), PLACEHOLDER_IMAGE_PATH);
  check('a missing code falls back', categorySocialImagePath(undefined), PLACEHOLDER_IMAGE_PATH);
  check('a non-string falls back', categorySocialImagePath({ code: 'PETS' }), PLACEHOLDER_IMAGE_PATH);

  console.log('\n-- what a listing publishes with --');
  const uploaded = await resolveListingImage({
    cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/x.jpg',
    categories: ['507f1f77bcf86cd799439011'],
  });
  check('a real photo wins over any graphic', uploaded.imageUrl, 'https://res.cloudinary.com/demo/image/upload/x.jpg');
  checkThat('a real photo is not flagged as a placeholder', uploaded.isPlaceholder === false);

  const legacyUpload = await resolveListingImage({ image: 'https://cdn.example.com/legacy.jpg' });
  check('the legacy image field still wins', legacyUpload.imageUrl, 'https://cdn.example.com/legacy.jpg');

  const categorised = await resolveListingImage({ categories: ['507f1f77bcf86cd799439012'] });
  check('a photo-less listing takes its category graphic', categorised.imageUrl, `${SITE}/category-social/pets.jpg`);
  checkThat(
    'the caption is still told there is no photo of the item',
    categorised.isPlaceholder === true,
    'otherwise a reader takes the category icon for the lost item',
  );

  const multiple = await resolveListingImage({
    categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    category: '507f1f77bcf86cd799439012',
  });
  check('the first of several categories decides', multiple.imageUrl, `${SITE}/category-social/electronics.jpg`);

  const legacyCategory = await resolveListingImage({ category: '507f1f77bcf86cd799439011', categories: [] });
  check('a pre-migration single category still resolves', legacyCategory.imageUrl, `${SITE}/category-social/electronics.jpg`);

  const unknownCategory = await resolveListingImage({ categories: ['507f1f77bcf86cd799439013'] });
  check('a category with no graphic falls back', unknownCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  const noCategory = await resolveListingImage({});
  check('a listing with no category at all falls back', noCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  const deletedCategory = await resolveListingImage({ categories: ['507f1f77bcf86cd799439099'] });
  check('a category row that no longer exists falls back', deletedCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  console.log('\n-- the caption Instagram will accept --');
  // 2,200 characters, and a container carrying more is refused outright. The
  // caption is just a header + contact line per language plus hashtags now -
  // no free-text description - so the trim's only elastic part left is the
  // hashtag list, dropped from the per-post (city/category) end first, ahead
  // of the fixed brand/SEO tags at the front.
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

  const capped = await buildListingCaption(longPost, { maxLength: IG_LIMIT });
  check(
    'well under the real Instagram limit, nothing to trim',
    capped,
    unbounded,
  );

  // Force the trim path itself with a maxLength no real listing needs, since
  // header + link + a normal hashtag count never gets near 2,200. Chosen
  // above the header+link+divider body's own length so only the hashtags -
  // the actual elastic part now - give way, not a language block.
  const tightLimit = 600;
  const tight = await buildListingCaption(longPost, { maxLength: tightLimit });
  checkThat('a tight limit is honored', tight.length <= tightLimit, `${tight.length} characters`);
  checkThat(
    'the link survives the trim',
    tight.includes(`/dash/posts/${longPost._id}`),
    'cutting the caption at its end would drop the one line that lets anyone act on it',
  );
  checkThat(
    'all three languages are still there',
    tight.includes('Perte de') && tight.includes('Lost') && tight.includes('فقدان'),
  );
  checkThat(
    'fewer hashtags than the untrimmed caption',
    (tight.match(/#/g) || []).length < (unbounded.match(/#/g) || []).length,
    `${(tight.match(/#/g) || []).length} vs ${(unbounded.match(/#/g) || []).length}`,
  );

  const manyCategories = {
    ...longPost,
    categories: Object.keys(CATEGORY_IDS),
  };
  const tagged = await buildListingCaption(manyCategories, { maxLength: IG_LIMIT });
  checkThat(
    'never more hashtags than Instagram accepts',
    (tagged.match(/#/g) || []).length <= 30,
    `${(tagged.match(/#/g) || []).length} tags`,
  );

  console.log('\n-- the files behind the list --');
  const publicDir = path.resolve(__dirname, '../../client/public');
  const imageDir = path.join(publicDir, CATEGORY_SOCIAL_IMAGE_DIR);

  checkThat('the generic placeholder is still there', fs.existsSync(path.join(publicDir, PLACEHOLDER_IMAGE_PATH)));
  checkThat('the category images have been generated', fs.existsSync(imageDir));

  const files = fs.existsSync(imageDir) ? fs.readdirSync(imageDir).filter((f) => f.endsWith('.jpg')) : [];

  const missing = [...CATEGORY_SOCIAL_IMAGE_CODES].filter((code) => !files.includes(`${code.toLowerCase()}.jpg`));
  checkThat(
    'every code the server offers has an image on disk',
    missing.length === 0,
    missing.length ? `no file for ${missing.join(', ')} - run npm run build-category-images in client/` : `${CATEGORY_SOCIAL_IMAGE_CODES.size} codes`,
  );

  const orphans = files.filter((file) => !CATEGORY_SOCIAL_IMAGE_CODES.has(path.basename(file, '.jpg').toUpperCase()));
  checkThat(
    'every generated image is a code the server knows',
    orphans.length === 0,
    orphans.length ? `${orphans.join(', ')} missing from config/categorySocialImages.js` : `${files.length} files`,
  );

  console.log('\n-- the graphics Instagram will accept --');
  // Meta fetches these URLs itself. A PNG, a stray aspect ratio or a file
  // over its size cap is not a degraded post - the media container fails and
  // the listing never reaches the account, which is the same failure mode the
  // missing-file check above exists for.
  const publishable = [
    ...files.map((file) => path.join(imageDir, file)),
    path.join(publicDir, PLACEHOLDER_IMAGE_PATH),
  ];

  const wrongFormat = [];
  const wrongShape = [];
  const tooBig = [];

  for (const file of publishable) {
    // eslint-disable-next-line no-await-in-loop
    const meta = await sharp(file).metadata();
    const ratio = meta.width / meta.height;
    if (meta.format !== 'jpeg' || meta.space !== 'srgb') wrongFormat.push(path.basename(file));
    if (ratio < 0.8 || ratio > 1.91 || meta.width < 320 || meta.width > 1440) wrongShape.push(path.basename(file));
    if (fs.statSync(file).size > 8 * 1024 * 1024) tooBig.push(path.basename(file));
  }

  checkThat('every graphic is an sRGB JPEG', wrongFormat.length === 0, wrongFormat.join(', ') || `${publishable.length} files`);
  checkThat('every graphic is inside 4:5 - 1.91:1 and 320-1440px', wrongShape.length === 0, wrongShape.join(', '));
  checkThat('every graphic is under 8 MB', tooBig.length === 0, tooBig.join(', '));

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
