// Single re-export, kept as its own module because ~15 route files import
// `require("../middleware/verifyJWT")` and expect the middleware function itself.
//
// This file used to carry a second, weaker implementation: it skipped the issuer and
// audience checks, ignored the revocation list, and answered 403 with a bare
// "Forbidden". Routes were split across the two more or less by accident - /posts,
// /notifications and /auth/logout on the strict one, everything else here - so the
// same token could be accepted on /users and rejected on /posts. That is what a
// signed-in user hit as "I am logged in but cannot create a post", with no way to
// tell from the UI that their session was the problem.
//
// One implementation, one verdict per token. See middleware/jwtSecurity.js.
const { verifyJWT } = require("./jwtSecurity");

module.exports = verifyJWT;
