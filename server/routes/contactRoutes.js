const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const verifyJWT = require("../middleware/verifyJWT");
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
  (req, res, next) => {
    console.log('Contact POST route hit:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    next();
  },
  // Temporarily remove rate limiting and sanitization for debugging
  // contactRateLimit,
  // sanitizeInput,
  contactController.submitContactForm
);

// Simple test route without middleware
router.post("/test", (req, res) => {
  console.log('Contact test route hit:', req.body);
  res.json({
    success: true,
    message: "Contact test route working",
    received: req.body
  });
});

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
