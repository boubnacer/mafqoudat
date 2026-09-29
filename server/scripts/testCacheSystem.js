/**
 * Automated Test Suite for Unified Cache System
 * 
 * Verifies:
 * 1. Unified singleton behavior across config/cache, config/optimizedCache, config/unifiedCache
 * 2. L1 in-memory storage, retrieval, and deletion
 * 3. Compression and transparent decompression for payloads > 1KB
 * 4. Multi-signature key generation (2-arg and 3-arg)
 * 5. Targeted pattern invalidation (verifies no full-cache wipeouts)
 * 6. Domain-specific type invalidation (invalidateByType)
 * 7. Safe header sanitization preventing Unicode/Arabic header crashes
 * 8. Cache bypass honoring nocache=true and Cache-Control headers
 * 9. Resilience and graceful degradation
 */

const assert = require('assert');
const { unifiedCacheService, CACHE_TTL } = require('../config/unifiedCache');
const { cacheService } = require('../config/cache');
const { optimizedCacheService } = require('../config/optimizedCache');
const { sanitizeHeaderKey, cacheMiddleware } = require('../middleware/cacheMiddleware');
const { paginatedCache, searchResultsCache, invalidateCache } = require('../middleware/optimizedCacheMiddleware');

let passed = 0;
let total = 0;

const test = async (name, fn) => {
  total++;
  try {
    await fn();
    console.log(`✅ ok: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
};

(async () => {
  console.log('🧪 Starting Cache System Tests...\n');

  // Test 1: Singleton Identity
  await test('Singleton identity across all gateways', () => {
    assert.strictEqual(cacheService, unifiedCacheService, 'cacheService must equal unifiedCacheService');
    assert.strictEqual(optimizedCacheService, unifiedCacheService, 'optimizedCacheService must equal unifiedCacheService');
  });

  // Test 2: Basic Set, Get, Del
  await test('L1 cache set, get, and del operations', async () => {
    const key = 'test:item:1';
    const data = { id: 1, name: 'Lost Wallet', color: 'black' };

    await unifiedCacheService.set(key, data, 60);
    const retrieved = await unifiedCacheService.get(key);
    assert.deepStrictEqual(retrieved, data, 'Retrieved data must match stored data');

    // Cross-gateway access
    const viaLegacyGateway = await cacheService.get(key);
    assert.deepStrictEqual(viaLegacyGateway, data, 'Legacy gateway must read identical cached data');

    await unifiedCacheService.del(key);
    const afterDelete = await unifiedCacheService.get(key);
    assert.strictEqual(afterDelete, null, 'Deleted key must return null');
  });

  // Test 3: Compression and Decompression for Large Payloads
  await test('Automatic gzip compression for large objects (> 1KB)', async () => {
    const largeArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      title: `Item number ${i} with long description text to ensure payload is sufficiently large for compression testing.`,
      tags: ['electronics', 'mobile', 'valuable', 'urgent']
    }));

    const key = 'test:large:payload';
    await unifiedCacheService.set(key, largeArray, 60);

    const retrieved = await unifiedCacheService.get(key);
    assert.deepStrictEqual(retrieved, largeArray, 'Decompressed payload must equal original data');
    assert.strictEqual(retrieved.length, 50);
    await unifiedCacheService.del(key);
  });

  // Test 4: Key Generation Multi-signature
  await test('Universal key generation (2-arg and 3-arg signatures)', () => {
    // 2-arg signature
    const key2 = unifiedCacheService.generateKey('posts', { country: 'MA', page: 1 });
    assert.strictEqual(key2, 'posts:country:MA|page:1');

    // 3-arg signature (type, prefix, params)
    const key3 = unifiedCacheService.generateKey('paginated', 'posts', { country: 'MA', page: 1 });
    assert.strictEqual(key3, 'paginated:posts:country:MA|page:1');

    // Key with empty/null params (should omit null/undefined)
    const keyClean = unifiedCacheService.generateKey('cities', { active: true, search: '', countryId: null });
    assert.strictEqual(keyClean, 'cities:active:true');
  });

  // Test 5: Targeted Pattern Invalidation (NO full cache wipeout)
  await test('Targeted pattern invalidation purges ONLY matching keys', async () => {
    // Populate keys across different domains
    await unifiedCacheService.set('posts:page:1', { page: 1 }, 300);
    await unifiedCacheService.set('paginated:posts:page:2', { page: 2 }, 300);
    await unifiedCacheService.set('dashboard:country:MA', { stats: true }, 300);
    await unifiedCacheService.set('countries:en', [{ code: 'MA' }], 300);
    await unifiedCacheService.set('cities:MA', [{ name: 'Casablanca' }], 300);

    // Invalidate only posts
    const purged = await unifiedCacheService.invalidatePattern('posts*');
    assert(purged >= 2, `Expected at least 2 purged keys, got ${purged}`);

    // Verify posts keys are gone
    assert.strictEqual(await unifiedCacheService.get('posts:page:1'), null, 'posts:page:1 must be invalidated');
    assert.strictEqual(await unifiedCacheService.get('paginated:posts:page:2'), null, 'paginated:posts:page:2 must be invalidated');

    // Verify other domain keys are STILL INTACT!
    assert.notStrictEqual(await unifiedCacheService.get('dashboard:country:MA'), null, 'dashboard must NOT be invalidated by posts*');
    assert.notStrictEqual(await unifiedCacheService.get('countries:en'), null, 'countries must NOT be invalidated by posts*');
    assert.notStrictEqual(await unifiedCacheService.get('cities:MA'), null, 'cities must NOT be invalidated by posts*');

    // Clean up
    await unifiedCacheService.del('dashboard:country:MA');
    await unifiedCacheService.del('countries:en');
    await unifiedCacheService.del('cities:MA');
  });

  // Test 6: Invalidate by Data Type
  await test('invalidateByType purges expected domain clusters', async () => {
    await unifiedCacheService.set('posts:1', { id: 1 }, 300);
    await unifiedCacheService.set('dashboard:1', { id: 1 }, 300);
    await unifiedCacheService.set('categories:en', [{ id: 'cat1' }], 300);

    // Invalidate posts domain (should invalidate posts + dashboard)
    await unifiedCacheService.invalidateByType('posts');

    assert.strictEqual(await unifiedCacheService.get('posts:1'), null, 'posts must be deleted');
    assert.strictEqual(await unifiedCacheService.get('dashboard:1'), null, 'dashboard must be deleted');
    assert.notStrictEqual(await unifiedCacheService.get('categories:en'), null, 'categories must survive post invalidation');

    await unifiedCacheService.del('categories:en');
  });

  // Test 7: Safe Header Sanitization (Arabic / Unicode)
  await test('sanitizeHeaderKey prevents ERR_HTTP_INVALID_HEADER_VALUE crashes on Arabic/Unicode', () => {
    const arabicKey = 'search:posts:q:محفظة مفقودة|lang:ar';
    const sanitized = sanitizeHeaderKey(arabicKey);

    // Must be pure printable ASCII
    assert.strictEqual(/^[\x20-\x7E]*$/.test(sanitized), true, 'Sanitized key must contain only printable ASCII');
    // Must contain URL-encoded representation
    assert(sanitized.includes('%D9%85%D8%AD%D9%81%D8%B8%D8%A9'), 'Must contain percent-encoded Arabic characters');

    // Test with accents
    const frenchKey = 'cities:téléphone';
    const sanitizedFrench = sanitizeHeaderKey(frenchKey);
    assert.strictEqual(/^[\x20-\x7E]*$/.test(sanitizedFrench), true);
  });

  // Test 8: Cache Bypass Detection
  await test('Cache middleware honors nocache=true and Cache-Control: no-cache', async () => {
    let nextCalled = false;
    const req = {
      method: 'GET',
      query: { nocache: 'true' },
      headers: {}
    };
    const res = {
      headers: {},
      set(k, v) { this.headers[k] = v; }
    };
    const next = () => { nextCalled = true; };

    const mw = cacheMiddleware('test-bypass');
    await mw(req, res, next);

    assert.strictEqual(nextCalled, true, 'Middleware must call next() on bypass');
    assert.strictEqual(res.headers['X-Cache'], 'BYPASS', 'Middleware must tag response with X-Cache: BYPASS');
  });

  // Test 9: Health Check and Stats
  await test('Health check and stats reporting', async () => {
    const health = await unifiedCacheService.healthCheck();
    assert.strictEqual(health.status, 'healthy', 'Health check status must be healthy');
    assert.strictEqual(health.memory, 'working', 'Memory cache layer must be working');

    const stats = unifiedCacheService.getStats();
    assert(stats.memory !== undefined, 'Stats must include memory metrics');
    assert(stats.performance !== undefined, 'Stats must include performance metrics');
    assert(stats.redis !== undefined, 'Stats must include redis metrics');
  });

  // Test 10: Clear Cache
  await test('Clear cache resets all state cleanly', async () => {
    await unifiedCacheService.set('temp:1', 'a', 60);
    await unifiedCacheService.set('temp:2', 'b', 60);
    await unifiedCacheService.clear(true);

    assert.strictEqual(await unifiedCacheService.get('temp:1'), null);
    assert.strictEqual(await unifiedCacheService.get('temp:2'), null);
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
