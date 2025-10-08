const express = require("express");
const router = express.Router();
const { submitPasswordResetRequest } = require("../controllers/passwordResetController");

console.log('📧 Password reset routes file loaded');

// @route POST /api/password-reset/request
// @desc Submit a password reset request
// @access Public
router.post("/request", submitPasswordResetRequest);
console.log('📧 Registered POST /request route');

module.exports = router;

