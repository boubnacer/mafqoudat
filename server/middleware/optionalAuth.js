const jwt = require("jsonwebtoken");

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
 */
const readBearerUserInfo = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded?.UserInfo?.usernameId ? decoded.UserInfo : null;
  } catch (err) {
    return null;
  }
};

const optionalAuth = (req, res, next) => {
  const userInfo = readBearerUserInfo(req);

  if (userInfo) {
    req.user = userInfo.usernameId;
    req.username = userInfo.username;
    req.country = userInfo.country;
    req.role = userInfo.role;
  }

  next();
};

module.exports = optionalAuth;
module.exports.readBearerUserInfo = readBearerUserInfo;
