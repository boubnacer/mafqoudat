/**
 * Category accent colours and their pale card backgrounds, mirrored from
 * client/src/config/categories.js.
 *
 * The client config is the source of truth - this file is the server's
 * read-only copy of the two values it needs (the accent `color` and the card
 * `backgroundColor`). sync-categories.js already keeps the DB's `.color` in
 * step with the client config; this file is the equivalent for the background.
 *
 * Used by services/dynamicCategoryImage.js to generate social-media fallback
 * images whose colours match the site's own category cards exactly.
 *
 * When a category is added or its colours change in the client config, update
 * this file to match.
 */

const CATEGORY_COLORS = {
  ELECTRONICS:  { color: '#00BCD4', backgroundColor: '#E0F7FA' },
  DOCUMENTS:    { color: '#795548', backgroundColor: '#EFEBE9' },
  JEWELRY:      { color: '#9C27B0', backgroundColor: '#F3E5F6' },
  CLOTHING:     { color: '#4CAF50', backgroundColor: '#EAF5EA' },
  PETS:         { color: '#FF6B6B', backgroundColor: '#FFEDED' },
  VEHICLES:     { color: '#607D8B', backgroundColor: '#ECEFF1' },
  KEYS:         { color: '#FB8C00', backgroundColor: '#FFF1E0' },
  WALLET:       { color: '#BF360C', backgroundColor: '#F7E7E2' },
  BAGS:         { color: '#827717', backgroundColor: '#F0EFE3' },
  WATCHES:      { color: '#2196F3', backgroundColor: '#E4F2FE' },
  GLASSES:      { color: '#3F51B5', backgroundColor: '#E8EAF6' },
  HEADPHONES:   { color: '#7E57C2', backgroundColor: '#F0EBF8' },
  BOOKS:        { color: '#5E35B1', backgroundColor: '#ECE7F6' },
  SPORTS:       { color: '#8BC34A', backgroundColor: '#F1F8E9' },
  TOYS:         { color: '#AFB42B', backgroundColor: '#F5F6E6' },
  CAMERAS:      { color: '#0097A7', backgroundColor: '#E0F3F4' },
  CHARGERS:     { color: '#455A64', backgroundColor: '#E9EBEC' },
  UMBRELLAS:    { color: '#0277BD', backgroundColor: '#E1EFF7' },
  BICYCLES:     { color: '#009966', backgroundColor: '#E0F3ED' },
  MONEY:        { color: '#2E7D32', backgroundColor: '#E6EFE6' },
  PERSON:       { color: '#F44336', backgroundColor: '#FEE8E7' },
  MEDICAL:      { color: '#C2185B', backgroundColor: '#F8E3EB' },
  BABY:         { color: '#EC407A', backgroundColor: '#FDE8EF' },
  MUSIC:        { color: '#009688', backgroundColor: '#E0F2F1' },
  OTHER:        { color: '#9E9E9E', backgroundColor: '#F3F3F3' },
};

const DEFAULT_CATEGORY = CATEGORY_COLORS.OTHER;

/**
 * Returns { color, backgroundColor } for the given category code, falling
 * back to OTHER's grey when the code is unknown.
 */
function getCategoryColors(code) {
  const key = typeof code === 'string' ? code.trim().toUpperCase() : '';
  return CATEGORY_COLORS[key] || DEFAULT_CATEGORY;
}

module.exports = { CATEGORY_COLORS, getCategoryColors };
