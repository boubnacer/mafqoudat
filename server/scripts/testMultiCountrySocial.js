const assert = require('assert');
const {
  DEFAULT_COUNTRY_CODE,
  getSocialConfig,
  isPlatformConfiguredForCountry,
  getAllConfiguredFacebookPageIds,
  getConfiguredCountries,
  resolveCountryCode,
} = require('../config/socialChannels');

async function runTests() {
  console.log('--- Testing Multi-Country Social Channels Configuration ---');

  // Setup test environment variables
  process.env.FACEBOOK_PAGE_ID = 'page_ma_default';
  process.env.INSTAGRAM_ACCOUNT_ID = 'ig_ma_default';
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN = 'token_master_system_user';

  process.env.FACEBOOK_PAGE_ID_DZ = 'page_dz_123';
  process.env.INSTAGRAM_ACCOUNT_ID_DZ = 'ig_dz_456';

  // Test 1: Morocco defaults
  const maConfig = getSocialConfig('MA');
  assert.strictEqual(maConfig.countryCode, 'MA');
  assert.strictEqual(maConfig.facebook.pageId, 'page_ma_default');
  assert.strictEqual(maConfig.facebook.accessToken, 'token_master_system_user');
  assert.strictEqual(maConfig.facebook.isConfigured, true);
  assert.strictEqual(maConfig.instagram.accountId, 'ig_ma_default');
  assert.strictEqual(maConfig.instagram.accessToken, 'token_master_system_user');
  assert.strictEqual(maConfig.instagram.isConfigured, true);
  console.log('ok    Morocco resolves default page and token');

  // Test 2: Unspecified country code defaults to Morocco
  const defaultCheck = getSocialConfig();
  assert.strictEqual(defaultCheck.countryCode, 'MA');
  assert.strictEqual(defaultCheck.facebook.pageId, 'page_ma_default');
  console.log('ok    Empty country code falls back to MA');

  // Test 3: Algeria configured
  const dzConfig = getSocialConfig('DZ');
  assert.strictEqual(dzConfig.countryCode, 'DZ');
  assert.strictEqual(dzConfig.facebook.pageId, 'page_dz_123');
  assert.strictEqual(dzConfig.facebook.accessToken, 'token_master_system_user'); // inherits token!
  assert.strictEqual(dzConfig.facebook.isConfigured, true);
  assert.strictEqual(dzConfig.instagram.accountId, 'ig_dz_456');
  assert.strictEqual(dzConfig.instagram.isConfigured, true);
  console.log('ok    Algeria resolves custom page/account and shares system user token');

  // Test 4: Unconfigured country (e.g. Tunisia 'TN')
  const tnConfig = getSocialConfig('TN');
  assert.strictEqual(tnConfig.countryCode, 'TN');
  assert.strictEqual(tnConfig.facebook.isConfigured, false);
  assert.strictEqual(tnConfig.instagram.isConfigured, false);
  assert.strictEqual(isPlatformConfiguredForCountry('facebook', 'TN'), false);
  assert.strictEqual(isPlatformConfiguredForCountry('instagram', 'TN'), false);
  console.log('ok    Unconfigured country gracefully returns isConfigured: false');

  // Test 5: All configured Facebook Page IDs for webhooks
  const allPageIds = getAllConfiguredFacebookPageIds();
  assert.ok(allPageIds.includes('page_ma_default'));
  assert.ok(allPageIds.includes('page_dz_123'));
  assert.strictEqual(allPageIds.length, 2);
  console.log('ok    getAllConfiguredFacebookPageIds includes both MA and DZ pages');

  // Test 6: Configured countries list
  const configuredCountries = getConfiguredCountries();
  assert.ok(configuredCountries.includes('MA'));
  assert.ok(configuredCountries.includes('DZ'));
  console.log('ok    getConfiguredCountries includes MA and DZ');

  // Test 7: resolveCountryCode
  assert.strictEqual(await resolveCountryCode('MA'), 'MA');
  assert.strictEqual(await resolveCountryCode('dz'), 'DZ');
  assert.strictEqual(await resolveCountryCode({ code: 'fr' }), 'FR');
  assert.strictEqual(await resolveCountryCode(null), 'MA');
  console.log('ok    resolveCountryCode normalizes inputs properly');

  console.log('\nAll Multi-Country Social tests passed!\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
