/**
 * Reads the authenticated user's id off a request.
 *
 * Both JWT middlewares (middleware/verifyJWT.js and middleware/jwtSecurity.js)
 * assign `req.user` the id *string*, not a user object. Several call sites were
 * written as `req.user?.id`, which on a string is always undefined - so every
 * cache key recorded the viewer as "anonymous" and the per-user rate limiter
 * always fell back to the IP. That was merely wasteful while responses were the
 * same for everyone; it stops being harmless the moment a response depends on
 * who is asking (see the blocked-user filtering in postsController), because a
 * key that cannot tell two viewers apart will serve one of them the other's
 * filtered results.
 *
 * Accepts the object shape too, so this keeps working if a middleware is ever
 * changed to attach the full user.
 */
const getRequestUserId = (req) => {
  const user = req?.user;
  if (!user) return null;
  if (typeof user === 'string') return user;
  return user.id || user._id?.toString() || null;
};

/** The same value, shaped for a cache key. */
const getCacheUserKey = (req) => getRequestUserId(req) || 'anonymous';

module.exports = { getRequestUserId, getCacheUserKey };
