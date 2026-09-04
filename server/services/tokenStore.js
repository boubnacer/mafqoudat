/**
 * Durable token store: refresh sessions + revoked-access-token (jti) denylist.
 *
 * Backed by the shared Redis client from config/unifiedCache.js so revocation
 * survives restarts and is visible to every instance behind a load balancer -
 * the in-memory Map this replaces silently un-revoked every logged-out session
 * on each deploy. When Redis is not configured (local dev without REDIS_URL)
 * or a Redis call fails, an in-memory fallback keeps single-instance behavior
 * working; entries written to the fallback are also checked on reads, so a
 * Redis blip mid-process never resurrects a token this process revoked.
 *
 * Refresh tokens are opaque 256-bit random values. Only their SHA-256 hash is
 * ever stored, so a leaked Redis dump does not contain usable credentials.
 */

const crypto = require('crypto');
const { getRedisClient } = require('../config/unifiedCache');

const REFRESH_PREFIX = 'auth:refresh:';
const REVOKED_PREFIX = 'auth:revoked:';

// In-memory fallbacks (per process). value: { data, expiresAt (epoch ms) }
const memoryRefreshSessions = new Map();
const memoryRevokedJtis = new Map();

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const sweepExpired = (map) => {
  const now = Date.now();
  for (const [key, entry] of map.entries()) {
    if (now > entry.expiresAt) map.delete(key);
  }
};

// One sweep interval for both maps. unref() so it never holds the process open
// (the old blacklist interval in jwtSecurity.js did).
const sweepInterval = setInterval(() => {
  sweepExpired(memoryRefreshSessions);
  sweepExpired(memoryRevokedJtis);
}, 5 * 60 * 1000);
if (typeof sweepInterval.unref === 'function') sweepInterval.unref();

/**
 * Create a refresh session for a user. Returns the opaque token to hand to
 * the client; the stored record is keyed by its hash.
 */
const createRefreshSession = async (userId, ttlSeconds) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const key = REFRESH_PREFIX + hashToken(token);
  const record = JSON.stringify({
    userId: String(userId),
    createdAt: Date.now(),
  });

  const redis = getRedisClient();
  let storedInRedis = false;
  if (redis) {
    try {
      await redis.setEx(key, ttlSeconds, record);
      storedInRedis = true;
    } catch (error) {
      console.error('tokenStore: Redis createRefreshSession failed, using memory fallback:', error.message);
    }
  }

  if (!storedInRedis) {
    memoryRefreshSessions.set(key, {
      data: record,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  return token;
};

/**
 * Look up and delete a refresh session in one step (rotation: every use of a
 * refresh token invalidates it; the caller mints a replacement).
 * Returns { userId } or null.
 */
const consumeRefreshSession = async (token) => {
  if (!token || typeof token !== 'string') return null;
  const key = REFRESH_PREFIX + hashToken(token);

  let record = null;

  const redis = getRedisClient();
  if (redis) {
    try {
      // GETDEL is atomic, so two concurrent refresh calls with the same token
      // can never both succeed (node-redis v4 exposes it as getDel).
      record = await redis.getDel(key);
    } catch (error) {
      console.error('tokenStore: Redis consumeRefreshSession failed:', error.message);
    }
  }

  // Memory fallback - covers sessions created while Redis was down.
  if (!record) {
    const entry = memoryRefreshSessions.get(key);
    if (entry) {
      memoryRefreshSessions.delete(key);
      if (Date.now() <= entry.expiresAt) record = entry.data;
    }
  } else {
    memoryRefreshSessions.delete(key);
  }

  if (!record) return null;

  try {
    const parsed = JSON.parse(record);
    return parsed && parsed.userId ? parsed : null;
  } catch (error) {
    return null;
  }
};

/** Revoke a refresh session without caring about its contents (logout). */
const revokeRefreshSession = async (token) => {
  await consumeRefreshSession(token);
};

/**
 * Denylist an access token's jti until the token's own expiry, after which
 * the entry is dead weight (the token is refused on `exp` alone).
 */
const revokeAccessToken = async (jti, expiresAtMs) => {
  if (!jti) return;
  const ttlSeconds = Math.max(Math.ceil(((expiresAtMs || Date.now()) - Date.now()) / 1000), 1);
  const key = REVOKED_PREFIX + jti;

  // Written to both stores on purpose: memory keeps this process correct
  // through a Redis outage, Redis carries it across restarts and instances.
  memoryRevokedJtis.set(jti, { data: '1', expiresAt: Date.now() + ttlSeconds * 1000 });

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.setEx(key, ttlSeconds, '1');
    } catch (error) {
      console.error('tokenStore: Redis revokeAccessToken failed (memory fallback still holds it):', error.message);
    }
  }
};

/** Whether an access token's jti has been revoked. */
const isAccessTokenRevoked = async (jti) => {
  if (!jti) return false;

  const entry = memoryRevokedJtis.get(jti);
  if (entry) {
    if (Date.now() <= entry.expiresAt) return true;
    memoryRevokedJtis.delete(jti);
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const value = await redis.get(REVOKED_PREFIX + jti);
      if (value) return true;
    } catch (error) {
      // Fail open, matching the guarantee level of the old in-memory Map: an
      // unreachable Redis must not lock every signed-in user out.
      console.error('tokenStore: Redis isAccessTokenRevoked failed:', error.message);
    }
  }

  return false;
};

module.exports = {
  createRefreshSession,
  consumeRefreshSession,
  revokeRefreshSession,
  revokeAccessToken,
  isAccessTokenRevoked,
};
