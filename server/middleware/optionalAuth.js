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
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (!err && decoded?.UserInfo?.usernameId) {
      req.user = decoded.UserInfo.usernameId;
      req.username = decoded.UserInfo.username;
      req.country = decoded.UserInfo.country;
      req.role = decoded.UserInfo.role;
    }
    next();
  });
};

module.exports = optionalAuth;
