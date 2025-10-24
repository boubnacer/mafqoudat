const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const verifyJWT = require("../middleware/verifyJWT");
const { general: rateLimit } = require("../middleware/rateLimiting");
const { sanitizeInput } = require("../middleware/validation");

// Public route for submitting contact forms
// Rate limit: 5 submissions per 15 minutes per IP
router.post(
  "/",
  rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  sanitizeInput,
  contactController.submitContactForm
);

// Admin routes - require authentication
router.use(verifyJWT);

// Get all contacts with pagination and filtering
router.get(
  "/",
  contactController.getAllContacts
);

// Get contact statistics
router.get(
  "/stats",
  contactController.getContactStats
);

// Get contact by ID
router.get(
  "/:id",
  contactController.getContactById
);

// Update contact (status, response, priority)
router.patch(
  "/:id",
  sanitizeInput,
  contactController.updateContact
);

// Delete contact
router.delete(
  "/:id",
  contactController.deleteContact
);

module.exports = router;
