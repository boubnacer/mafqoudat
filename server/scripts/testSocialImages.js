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

const CategoryStub = {
  findById: (id) => {
    const value = CATEGORY_IDS[String(id)] || null;
    const query = {
      select: () => query,
      lean: () => query,
      then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    };
    return query;
  },
};

const originalLoad = Module._load;
Module._load = function load(request, parent) {
  const fromCaption = parent && parent.filename && parent.filename.endsWith('services/socialCaption.js');
  if (fromCaption && request === '../models/Category') return CategoryStub;
  // eslint-disable-next-line prefer-rest-params
  return originalLoad.apply(this, arguments);
};

process.env.CLIENT_URL = 'https://mafqoudat.test';

const { resolveListingImage } = require('../services/socialCaption');
const {
  CATEGORY_SOCIAL_IMAGE_CODES,
  CATEGORY_SOCIAL_IMAGE_DIR,
  PLACEHOLDER_IMAGE_PATH,
  categorySocialImagePath,
} = require('../config/categorySocialImages');

const SITE = process.env.CLIENT_URL;

async function run() {
  console.log('\n-- path mapping --');
  check('a known code maps to its own file', categorySocialImagePath('CLOTHING'), 'category-social/clothing.png');
  check('the code is matched case-insensitively', categorySocialImagePath('clothing'), 'category-social/clothing.png');
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
  check('a photo-less listing takes its category graphic', categorised.imageUrl, `${SITE}/category-social/pets.png`);
  checkThat(
    'the caption is still told there is no photo of the item',
    categorised.isPlaceholder === true,
    'otherwise a reader takes the category icon for the lost item',
  );

  const multiple = await resolveListingImage({
    categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    category: '507f1f77bcf86cd799439012',
  });
  check('the first of several categories decides', multiple.imageUrl, `${SITE}/category-social/electronics.png`);

  const legacyCategory = await resolveListingImage({ category: '507f1f77bcf86cd799439011', categories: [] });
  check('a pre-migration single category still resolves', legacyCategory.imageUrl, `${SITE}/category-social/electronics.png`);

  const unknownCategory = await resolveListingImage({ categories: ['507f1f77bcf86cd799439013'] });
  check('a category with no graphic falls back', unknownCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  const noCategory = await resolveListingImage({});
  check('a listing with no category at all falls back', noCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  const deletedCategory = await resolveListingImage({ categories: ['507f1f77bcf86cd799439099'] });
  check('a category row that no longer exists falls back', deletedCategory.imageUrl, `${SITE}/${PLACEHOLDER_IMAGE_PATH}`);

  console.log('\n-- the files behind the list --');
  const publicDir = path.resolve(__dirname, '../../client/public');
  const imageDir = path.join(publicDir, CATEGORY_SOCIAL_IMAGE_DIR);

  checkThat('the generic placeholder is still there', fs.existsSync(path.join(publicDir, PLACEHOLDER_IMAGE_PATH)));
  checkThat('the category images have been generated', fs.existsSync(imageDir));

  const files = fs.existsSync(imageDir) ? fs.readdirSync(imageDir).filter((f) => f.endsWith('.png')) : [];

  const missing = [...CATEGORY_SOCIAL_IMAGE_CODES].filter((code) => !files.includes(`${code.toLowerCase()}.png`));
  checkThat(
    'every code the server offers has an image on disk',
    missing.length === 0,
    missing.length ? `no file for ${missing.join(', ')} - run npm run build-category-images in client/` : `${CATEGORY_SOCIAL_IMAGE_CODES.size} codes`,
  );

  const orphans = files.filter((file) => !CATEGORY_SOCIAL_IMAGE_CODES.has(path.basename(file, '.png').toUpperCase()));
  checkThat(
    'every generated image is a code the server knows',
    orphans.length === 0,
    orphans.length ? `${orphans.join(', ')} missing from config/categorySocialImages.js` : `${files.length} files`,
  );

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
