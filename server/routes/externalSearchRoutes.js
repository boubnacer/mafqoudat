const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const { optionalAuth, verifyJWT, requireAdmin } = require("../middleware/jwtSecurity");
const { externalSearchRateLimit } = require("../middleware/rateLimiting");
const { validateRequest } = require("../middleware/validation");
const { logEvents } = require("../middleware/logger");
const externalSearchService = require("../services/externalSearchService");
const { unifiedCacheService } = require("../config/unifiedCache");

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

const externalSearchValidation = [
  query("q")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("q must be 2-100 characters"),
  query("countryCode")
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage("countryCode must be a 2-letter ISO code")
    .isAlpha()
    .withMessage("countryCode must be a 2-letter ISO code"),
  query("language")
    .optional()
    .isIn(["en", "fr", "ar"])
    .withMessage("language must be one of en, fr, ar"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("limit must be between 1 and 10")
];

// GET /external-search - public web search for lost/found related posts (Serper.dev pass-through, no DB writes)
router.get(
  "/",
  optionalAuth,
  externalSearchRateLimit,
  externalSearchValidation,
  validateRequest,
  async (req, res) => {
    const q = req.query.q.trim();
    const countryCode = req.query.countryCode ? req.query.countryCode.toUpperCase() : undefined;
    const language = req.query.language || "en";
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔍 External search requested by ${req.user || "anonymous"}: "${q}"`);
    }

    const cacheKey = `external-search:${q}:${countryCode}:${language}:${limit}`;

    try {
      const cached = await unifiedCacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const { results, stats } = await externalSearchService.searchExternal({
        q,
        countryCode,
        language,
        limit
      });

      const payload = { results, stats, degraded: false };

      await unifiedCacheService.set(cacheKey, payload, CACHE_TTL_SECONDS);

      return res.json(payload);
    } catch (error) {
      logEvents(
        `External Search Error: ${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );

      return res.status(200).json({
        results: [],
        degraded: true,
        reason: error.message
      });
    }
  }
);

// GET /external-search/stats - admin-only usage/quota stats, for the admin dashboard
router.get("/stats", verifyJWT, requireAdmin, (req, res) => {
  res.json({ success: true, data: externalSearchService.getStats() });
});

module.exports = router;
