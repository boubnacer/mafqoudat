/**
 * In-memory cache for country code to ObjectId mappings
 * Reduces database queries for country lookups
 */

const Country = require('../models/Country');
const mongoose = require('mongoose');

// In-memory cache with TTL
const countryCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get country ObjectId from country code or ObjectId string
 * Uses in-memory cache to avoid repeated database queries
 * 
 * @param {string} countryIdentifier - Country code (e.g., 'MA') or ObjectId string
 * @returns {Promise<string|null>} - Country ObjectId or null if not found
 */
async function getCountryId(countryIdentifier) {
  // If it's already a valid ObjectId, return it
  if (mongoose.Types.ObjectId.isValid(countryIdentifier)) {
    // Check if it's a 24-character hex string (ObjectId format)
    if (countryIdentifier.length === 24) {
      return countryIdentifier;
    }
  }

  // Normalize country code to uppercase for consistent cache keys
  // This prevents duplicate cache entries for "ma" vs "MA"
  const normalizedCode = countryIdentifier.toUpperCase();

  // Check cache first using normalized key (FIX: use normalizedCode consistently)
  if (countryCache.has(normalizedCode)) {
    const cached = countryCache.get(normalizedCode);
    // Check if cache is still valid
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.countryId;
    } else {
      // Cache expired, remove it
      countryCache.delete(normalizedCode);
    }
  }

  // Cache miss - query database
  try {
    const country = await Country.findOne({ code: normalizedCode })
      .select('_id code')
      .lean()
      .exec();

    if (country) {
      const countryId = country._id.toString();
      // Store in cache using normalized key (FIX: use normalizedCode, not countryIdentifier)
      countryCache.set(normalizedCode, {
        countryId,
        timestamp: Date.now()
      });
      return countryId;
    }
  } catch (error) {
    console.error('Error fetching country from database:', error);
  }

  return null;
}

/**
 * Clear the country cache (useful for testing or when countries are updated)
 */
function clearCache() {
  countryCache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: countryCache.size,
    entries: Array.from(countryCache.entries()).map(([code, data]) => ({
      code,
      countryId: data.countryId,
      age: Date.now() - data.timestamp
    }))
  };
}

module.exports = {
  getCountryId,
  clearCache,
  getCacheStats
};

