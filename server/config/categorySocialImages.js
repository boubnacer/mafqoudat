/**
 * The graphic a listing is auto-posted with when it has no photo of its own.
 *
 * The files are static assets on the site (client/public/category-social/),
 * generated from the same icon and accent colour the app draws that category
 * with - `npm run build-category-images` in client/. This module is the
 * server's half of that contract: the codes below are the ones an image was
 * generated for, so a category the DB has and the client has no icon for
 * (the client falls back to OTHER's icon; there is no such file) resolves to
 * the generic placeholder instead of a URL that would 404. Meta fetches this
 * URL itself and fails the publish if it cannot, so guessing is not an option.
 *
 * Adding a category means adding it to client/src/config/categories.js,
 * re-running the generator, and adding its code here.
 */

const CATEGORY_SOCIAL_IMAGE_CODES = new Set([
  'ELECTRONICS',
  'DOCUMENTS',
  'JEWELRY',
  'CLOTHING',
  'PETS',
  'VEHICLES',
  'KEYS',
  'WALLET',
  'BAGS',
  'WATCHES',
  'GLASSES',
  'HEADPHONES',
  'BOOKS',
  'SPORTS',
  'TOYS',
  'CAMERAS',
  'MONEY',
  'PERSON',
  'OTHER',
]);

const CATEGORY_SOCIAL_IMAGE_DIR = 'category-social';

// Says "no image available" in all three languages, which is the honest answer
// for a category we have no graphic for.
const PLACEHOLDER_IMAGE_PATH = 'no-image-placeholder.png';

/** Site-relative path (no leading slash) of the image to post for a category. */
function categorySocialImagePath(categoryCode) {
  const code = typeof categoryCode === 'string' ? categoryCode.trim().toUpperCase() : '';
  if (!CATEGORY_SOCIAL_IMAGE_CODES.has(code)) return PLACEHOLDER_IMAGE_PATH;
  return `${CATEGORY_SOCIAL_IMAGE_DIR}/${code.toLowerCase()}.png`;
}

module.exports = {
  CATEGORY_SOCIAL_IMAGE_CODES,
  CATEGORY_SOCIAL_IMAGE_DIR,
  PLACEHOLDER_IMAGE_PATH,
  categorySocialImagePath,
};
