/**
 * Multi-country social channels configuration for Facebook and Instagram.
 *
 * Each country can have its own dedicated Facebook Page and Instagram Account.
 * The primary / default country is Morocco ('MA').
 *
 * Environment variable resolution for a country (e.g. 'MA', 'DZ'):
 *   Facebook Page ID:
 *     process.env[`FACEBOOK_PAGE_ID_${code}`] || (code === 'MA' ? process.env.FACEBOOK_PAGE_ID : null)
 *   Instagram Account ID:
 *     process.env[`INSTAGRAM_ACCOUNT_ID_${code}`] || (code === 'MA' ? process.env.INSTAGRAM_ACCOUNT_ID : null)
 *   Access Token:
 *     process.env[`FACEBOOK_PAGE_ACCESS_TOKEN_${code}`] || process.env.FACEBOOK_PAGE_ACCESS_TOKEN
 *     (Shares the System User Token across all pages by default if under the same Business Portfolio)
 */

const DEFAULT_COUNTRY_CODE = 'MA';

// In-memory cache for Country ObjectId -> country code mappings
const countryCodeCache = new Map();

/**
 * Normalizes a country code to uppercase string (e.g. 'MA').
 */
function normalizeCode(code) {
  if (!code) return DEFAULT_COUNTRY_CODE;
  const str = String(code).trim().toUpperCase();
  return str || DEFAULT_COUNTRY_CODE;
}

/**
 * Parses optional JSON config from process.env.SOCIAL_CHANNELS_CONFIG.
 */
function getCustomJsonConfig() {
  if (!process.env.SOCIAL_CHANNELS_CONFIG) return {};
  try {
    return JSON.parse(process.env.SOCIAL_CHANNELS_CONFIG);
  } catch (err) {
    console.warn(`socialChannels: failed to parse SOCIAL_CHANNELS_CONFIG JSON: ${err.message}`);
    return {};
  }
}

/**
 * Returns the social channel configuration for a specific country code.
 *
 * @param {string} [countryCode='MA'] Country code (e.g. 'MA', 'DZ', 'FR')
 * @returns {{
 *   countryCode: string,
 *   facebook: { pageId: string|null, accessToken: string|null, isConfigured: boolean },
 *   instagram: { accountId: string|null, accessToken: string|null, isConfigured: boolean }
 * }}
 */
function getSocialConfig(countryCode = DEFAULT_COUNTRY_CODE) {
  const code = normalizeCode(countryCode);
  const jsonConfig = getCustomJsonConfig()[code] || {};

  // Facebook resolution
  const fbPageId =
    jsonConfig.facebookPageId ||
    process.env[`FACEBOOK_PAGE_ID_${code}`] ||
    (code === DEFAULT_COUNTRY_CODE ? process.env.FACEBOOK_PAGE_ID : null) ||
    null;

  const fbToken =
    jsonConfig.facebookAccessToken ||
    process.env[`FACEBOOK_PAGE_ACCESS_TOKEN_${code}`] ||
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    null;

  // Instagram resolution
  const igAccountId =
    jsonConfig.instagramAccountId ||
    process.env[`INSTAGRAM_ACCOUNT_ID_${code}`] ||
    (code === DEFAULT_COUNTRY_CODE ? process.env.INSTAGRAM_ACCOUNT_ID : null) ||
    null;

  const igToken =
    jsonConfig.instagramAccessToken ||
    process.env[`INSTAGRAM_ACCESS_TOKEN_${code}`] ||
    fbToken;

  return {
    countryCode: code,
    facebook: {
      pageId: fbPageId,
      accessToken: fbToken,
      isConfigured: !!(fbPageId && fbToken),
    },
    instagram: {
      accountId: igAccountId,
      accessToken: igToken,
      isConfigured: !!(igAccountId && igToken),
    },
  };
}

/**
 * Checks whether a specific platform ('facebook' | 'instagram') is configured
 * for the given country.
 */
function isPlatformConfiguredForCountry(platform, countryCode = DEFAULT_COUNTRY_CODE) {
  const config = getSocialConfig(countryCode);
  if (platform === 'facebook') return config.facebook.isConfigured;
  if (platform === 'instagram') return config.instagram.isConfigured;
  return false;
}

/**
 * Returns a list of all configured Facebook Page IDs across all countries.
 * Used for webhook routing and event validation.
 */
function getAllConfiguredFacebookPageIds() {
  const pageIds = new Set();

  // Primary / fallback Page ID
  if (process.env.FACEBOOK_PAGE_ID) {
    pageIds.add(process.env.FACEBOOK_PAGE_ID);
  }

  // Scan environment variables for FACEBOOK_PAGE_ID_*
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('FACEBOOK_PAGE_ID_') && value) {
      pageIds.add(value.trim());
    }
  }

  // Scan JSON config
  const jsonConfig = getCustomJsonConfig();
  for (const entry of Object.values(jsonConfig)) {
    if (entry?.facebookPageId) {
      pageIds.add(entry.facebookPageId.trim());
    }
  }

  return Array.from(pageIds);
}

/**
 * Returns all country codes that have at least one social platform configured.
 */
function getConfiguredCountries() {
  const countries = new Set();

  // Default country
  const defaultCfg = getSocialConfig(DEFAULT_COUNTRY_CODE);
  if (defaultCfg.facebook.isConfigured || defaultCfg.instagram.isConfigured) {
    countries.add(DEFAULT_COUNTRY_CODE);
  }

  // Scan env variables
  for (const key of Object.keys(process.env)) {
    const fbMatch = /^FACEBOOK_PAGE_ID_([A-Z0-9_-]+)$/i.exec(key);
    if (fbMatch) countries.add(fbMatch[1].toUpperCase());
    const igMatch = /^INSTAGRAM_ACCOUNT_ID_([A-Z0-9_-]+)$/i.exec(key);
    if (igMatch) countries.add(igMatch[1].toUpperCase());
  }

  // Scan JSON config
  for (const code of Object.keys(getCustomJsonConfig())) {
    countries.add(code.toUpperCase());
  }

  return Array.from(countries);
}

/**
 * Resolves the uppercase country code (e.g. 'MA') from a post's country field.
 * Handles objects, strings, ObjectIds, and database lookups.
 *
 * @param {any} countryValue - Value from post.country
 * @param {object} [CountryModel] - Optional Mongoose Country model
 * @returns {Promise<string>}
 */
async function resolveCountryCode(countryValue, CountryModel = null) {
  if (!countryValue) return DEFAULT_COUNTRY_CODE;

  // Case 1: Populated Country object with code
  if (typeof countryValue === 'object') {
    if (countryValue.code && typeof countryValue.code === 'string') {
      return countryValue.code.trim().toUpperCase();
    }
    if (countryValue._id) {
      countryValue = countryValue._id;
    }
  }

  const idStr = String(countryValue).trim();
  if (!idStr) return DEFAULT_COUNTRY_CODE;

  // Case 2: Country code passed directly as 2-3 char string
  if (idStr.length <= 3 && /^[A-Z]{2,3}$/i.test(idStr)) {
    return idStr.toUpperCase();
  }

  // Case 3: Cached in memory
  if (countryCodeCache.has(idStr)) {
    return countryCodeCache.get(idStr);
  }

  // Case 4: Database lookup
  try {
    const Model = CountryModel || require('../models/Country');
    const doc = await Model.findById(idStr).select('code').lean();
    if (doc?.code) {
      const resolved = String(doc.code).trim().toUpperCase();
      countryCodeCache.set(idStr, resolved);
      return resolved;
    }
  } catch (err) {
    // If DB is offline or mock, fallback safely
  }

  return DEFAULT_COUNTRY_CODE;
}

module.exports = {
  DEFAULT_COUNTRY_CODE,
  getSocialConfig,
  isPlatformConfiguredForCountry,
  getAllConfiguredFacebookPageIds,
  getConfiguredCountries,
  resolveCountryCode,
};
