const express = require("express");
const router = express.Router();
const { submitPasswordResetRequest } = require("../controllers/passwordResetController");

// @route POST /api/password-reset/request
// @desc Submit a password reset request
// @access Public
router.post("/request", submitPasswordResetRequest);

module.exports = router;

