const express = require("express");
const router = express.Router();
const { getDocumentTypes, createDocumentType } = require("../controllers/documentTypesController");
const { verifyJWT } = require("../middleware/jwtSecurity");
const { userActionRateLimiter } = require("../middleware/rateLimiting");

// Deliberately not behind the static-data cache the categories route uses: a
// title contributed from the New Post form has to appear in the list the
// moment it is saved, including for the reader who just added it.
router.route("/").get(getDocumentTypes);

// Writing is for signed-in readers only - the row it creates is listed to
// everyone - and paced, since the form lets a reader add one title per
// listing and nothing legitimate adds them in bursts.
router.route("/").post(verifyJWT, userActionRateLimiter, createDocumentType);

module.exports = router;
