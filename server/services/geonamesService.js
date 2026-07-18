const axios = require('axios');

class GeoNamesService {
  constructor() {
    this.baseURL = process.env.GEONAMES_API_URL || 'http://api.geonames.org';
    this.username = process.env.GEONAMES_USERNAME;
    this.rateLimit = {
      requests: 0,
      resetTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      maxRequests: 1000 // Free tier limit
    };
  }

  /**
   * Check if we can make API requests (rate limiting)
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Reset counter if 24 hours have passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = now + (24 * 60 * 60 * 1000);
    }
    
    return this.rateLimit.requests < this.rateLimit.maxRequests;
  }

  /**
   * Increment request counter
   */
  incrementRequestCounter() {
    this.rateLimit.requests++;
  }

  /**
   * Search for cities using GeoNames API
   * @param {string} cityName - The city name to search for
   * @param {string} countryCode - ISO country code (e.g., 'MA', 'EG')
   * @param {string} language - Language code ('en', 'fr', 'ar')
   * @returns {Promise<Array>} Array of city results
   */
  async searchCities(cityName, countryCode, language = 'en') {
    try {
      if (!this.username) {
        throw new Error('GeoNames username not configured');
      }

      if (!this.canMakeRequest()) {
        throw new Error('GeoNames API rate limit exceeded');
      }

      console.log(`🔍 GeoNames API: Searching for "${cityName}" in ${countryCode} (${language})`);

      // GeoNames API parameters. name_startsWith does a genuine prefix match
      // (needed for type-ahead search as the user types); the generic `q`
      // param instead does fuzzy full-text relevance search across all
      // fields, which returns loosely-related places that don't even start
      // with the typed text and misses real prefixes of multi-syllable names.
      const params = {
        name_startsWith: cityName,
        country: countryCode,
        featureClass: 'P', // Populated places (cities, towns, villages)
        maxRows: 20, // Limit results
        username: this.username,
        style: 'FULL' // Get full details
      };

      // Add language parameter if supported
      if (language && language !== 'en') {
        params.lang = language;
      }

      const response = await axios.get(`${this.baseURL}/searchJSON`, {
        params,
        timeout: 10000 // 10 second timeout
      });

      this.incrementRequestCounter();

      if (response.data && response.data.geonames) {
        const cities = response.data.geonames.map(place => this.formatCityData(place, language));
        console.log(`✅ GeoNames API: Found ${cities.length} cities for "${cityName}"`);
        return cities;
      }

      return [];

    } catch (error) {
      console.error('❌ GeoNames API Error:', error.message);
      
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      
      throw new Error(`GeoNames API error: ${error.message}`);
    }
  }

  /**
   * Format GeoNames API response to match our City model structure
   * @param {Object} place - GeoNames place data
   * @param {string} language - Language code
   * @returns {Object} Formatted city data
   */
  formatCityData(place, language) {
    // Determine if this is a capital city
    const isCapital = place.fcode === 'PPLC' || 
                     place.fcode === 'PPLA' || 
                     place.name.toLowerCase().includes('capital');

    // Create multilingual labels
    const labels = {
      en: place.name,
      fr: place.alternateNames?.find(name => name.lang === 'fr')?.name || place.name,
      ar: place.alternateNames?.find(name => name.lang === 'ar')?.name || place.name
    };

    // If we have alternate names, try to get better translations
    if (place.alternateNames && place.alternateNames.length > 0) {
      place.alternateNames.forEach(altName => {
        if (altName.lang === 'fr' && altName.name) {
          labels.fr = altName.name;
        }
        if (altName.lang === 'ar' && altName.name) {
          labels.ar = altName.name;
        }
      });
    }

    // Normalize labels to ensure Latin script consistency
    const normalizedLabels = this.normalizeLabels(labels);

    return {
      code: place.name.toUpperCase().replace(/\s+/g, '_'),
      labels: normalizedLabels,
      isCapital: isCapital,
      isActive: true,
      isDynamic: true, // Mark as dynamically added
      population: place.population || 0,
      coordinates: {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lng)
      },
      countryCode: place.countryCode,
      adminCode1: place.adminCode1, // State/Province
      adminName1: place.adminName1,
      fcode: place.fcode, // Feature code
      searchTerms: [
        place.name.toLowerCase(),
        ...(place.alternateNames || []).map(alt => alt.name.toLowerCase())
      ].filter(term => term && term.length > 0)
    };
  }

  /**
   * Normalize labels to ensure Latin script consistency
   * @param {Object} labels - City labels object
   * @returns {Object} Normalized labels
   */
  normalizeLabels(labels) {
    if (!labels) return labels;
    
    // Helper function to detect if text is in Arabic script
    const isArabicScript = (text) => {
      if (!text) return false;
      const arabicRegex = /[\u0600-\u06FF]/;
      return arabicRegex.test(text);
    };

    const normalizedLabels = { ...labels };
    
    // Find the first available label (any language)
    const availableLabel = normalizedLabels.en || normalizedLabels.fr || normalizedLabels.ar;
    
    if (availableLabel) {
      // Fill all missing labels with the available label
      if (!normalizedLabels.en) normalizedLabels.en = availableLabel;
      if (!normalizedLabels.fr) normalizedLabels.fr = availableLabel;
      if (!normalizedLabels.ar) normalizedLabels.ar = availableLabel;
    }
    
    return normalizedLabels;
  }

  /**
   * Get city details by GeoNames ID
   * @param {string} geonameId - GeoNames ID
   * @returns {Promise<Object>} City details
   */
  async getCityDetails(geonameId) {
    try {
      if (!this.canMakeRequest()) {
        throw new Error('GeoNames API rate limit exceeded');
      }

      const response = await axios.get(`${this.baseURL}/getJSON`, {
        params: {
          geonameId: geonameId,
          username: this.username,
          style: 'FULL'
        },
        timeout: 10000
      });

      this.incrementRequestCounter();

      if (response.data) {
        return this.formatCityData(response.data, 'en');
      }

      return null;

    } catch (error) {
      console.error('❌ GeoNames API Error (getCityDetails):', error.message);
      throw new Error(`GeoNames API error: ${error.message}`);
    }
  }

  /**
   * Get API usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const now = Date.now();
    const timeUntilReset = Math.max(0, this.rateLimit.resetTime - now);
    const hoursUntilReset = Math.ceil(timeUntilReset / (60 * 60 * 1000));

    return {
      requestsUsed: this.rateLimit.requests,
      requestsRemaining: this.rateLimit.maxRequests - this.rateLimit.requests,
      hoursUntilReset: hoursUntilReset,
      canMakeRequest: this.canMakeRequest()
    };
  }
}

module.exports = new GeoNamesService();
