const { verifyAccessToken } = require("./jwtSecurity");

/**
 * Populates req.user/req.username/req.country/req.role when the request carries
 * a valid Bearer token, and does nothing at all when it does not.
 *
 * Public listing routes (GET /posts, GET /posts/filtered) must keep serving
 * guests, but they now need to know who is asking so blocked authors can be
 * filtered out for a signed-in viewer. verifyJWT cannot do that job - it
 * rejects anonymous requests - and dropping it onto those routes would lock
 * guests out of browsing entirely.
 *
 * A malformed or expired token is treated exactly like no token: the request
 * continues as a guest rather than failing. These routes are public, so the
 * worst case of an unreadable token is that the viewer sees the unfiltered
 * listing, which is what they would have seen signed out anyway.
 */
/**
 * The token's UserInfo payload, or null - without touching the request.
 *
 * Exported separately for the places that need to know who is asking but must
 * not let it change the request: middleware/postViewTracker.js runs ahead of a
 * response cache whose key includes req.user, so populating the request there
 * would hand every signed-in viewer their own copy of an identical post detail
 * response.
 *
 * Verification goes through jwtSecurity's shared verifyAccessToken rather than
 * calling jwt.verify here, so the issuer/audience/algorithm options can never
 * drift from the ones verifyJWT enforces. Async because that helper is - the
 * one caller of this (postViewTracker) is already async.
 */
const readBearerUserInfo = async (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const decoded = await verifyAccessToken(authHeader.split(" ")[1]);
    return decoded?.UserInfo?.usernameId ? decoded.UserInfo : null;
  } catch (err) {
    return null;
  }
};

const optionalAuth = (req, res, next) => {
  readBearerUserInfo(req)
    .then((userInfo) => {
      if (userInfo) {
        req.user = userInfo.usernameId;
        req.username = userInfo.username;
        req.country = userInfo.country;
        req.role = userInfo.role;
      }
    })
    // Same contract as before: an unreadable token leaves the request a guest
    // and continues, it never becomes the route's error. Caught *before*
    // next(), so only the token read is swallowed here.
    .catch(() => {})
    // This middleware is a promise chain now, so it no longer sits inside the
    // router's own try/catch: a downstream handler that throws synchronously
    // would land here as a rejection. Hand it to Express the way the router
    // would, rather than leaving it an unhandled rejection - server.js exits
    // the process on those.
    .then(() => next())
    .catch(next);
};

module.exports = optionalAuth;
module.exports.readBearerUserInfo = readBearerUserInfo;
