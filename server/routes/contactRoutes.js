const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const { createRateLimiter } = require("../middleware/rateLimiting");
const { sanitizeInput } = require("../middleware/validation");

// Health check endpoint for contact routes
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Contact routes are working",
    timestamp: new Date().toISOString()
  });
});

// Create contact form rate limiter
const contactRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per 15 minutes
  message: "Too many contact form submissions, please wait 15 minutes before trying again"
});

// Public route for submitting contact forms - simplified for debugging
router.post(
  "/",
  contactController.submitContactForm
);

// Even simpler test route
router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Contact routes are working",
    timestamp: new Date().toISOString()
  });
});

// Admin routes - require authentication and admin privileges
router.use(verifyJWT);
router.use(verifyAdmin);

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
