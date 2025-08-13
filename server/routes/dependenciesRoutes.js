const express = require("express");
const router = express.Router();
const { createCategory, createFoundLost } = require("../controllers/dependenciesController");
const verifyJWT = require("../middleware/verifyJWT");

// Apply JWT verification to all routes
// router.use(verifyJWT);

// POST /dependencies/category
router.route("/category").post(createCategory);

// POST /dependencies/foundlost
router.route("/foundlost").post(createFoundLost);

module.exports = router; 