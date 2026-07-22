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
      const baseParams = {
        country: countryCode,
        featureClass: 'P', // Populated places (cities, towns, villages)
        maxRows: 20, // Limit results
        username: this.username,
        style: 'FULL' // Get full details
      };

      // Add language parameter if supported
      if (language && language !== 'en') {
        baseParams.lang = language;
      }

      const response = await axios.get(`${this.baseURL}/searchJSON`, {
        params: { ...baseParams, name_startsWith: cityName },
        timeout: 10000 // 10 second timeout
      });

      this.incrementRequestCounter();

      // GeoNames reports errors (bad username, credit limit, ...) as HTTP 200
      // with a `status` object instead of a `geonames` array - surface them
      // rather than silently returning no results.
      if (response.data && response.data.status) {
        throw new Error(response.data.status.message || 'GeoNames returned an error status');
      }

      let places = (response.data && response.data.geonames) || [];

      // Typo-tolerance fallback: prefix search found nothing, so retry with
      // GeoNames' Lucene fuzzy matching on the name field (0.6 similarity
      // allows 1-2 character edits, e.g. "Dchira" -> "Dcheira"). Only fires
      // on zero prefix results, so correctly-typed searches cost one request.
      if (places.length === 0 && this.canMakeRequest()) {
        console.log(`🔎 GeoNames API: No prefix match for "${cityName}", retrying with fuzzy search...`);
        const fuzzyResponse = await axios.get(`${this.baseURL}/searchJSON`, {
          params: { ...baseParams, name: cityName, fuzzy: 0.6 },
          timeout: 10000
        });

        this.incrementRequestCounter();
        places = (fuzzyResponse.data && fuzzyResponse.data.geonames) || [];
      }

      if (places.length > 0) {
        const cities = places.map(place => this.formatCityData(place, language));
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

    const isArabicScript = (text) => /[؀-ۿ]/.test(text || '');

    // place.name is localized by the request's `lang` param, so when the user
    // searched in Arabic it IS the Arabic name - it must never be blindly
    // assigned to labels.en/fr. toponymName is the canonical (usually Latin)
    // name, always present with style=FULL. Pick each label by script:
    const altEn = place.alternateNames?.find(name => name.lang === 'en')?.name;
    const altFr = place.alternateNames?.find(name => name.lang === 'fr')?.name;
    const altAr = place.alternateNames?.find(name => name.lang === 'ar')?.name;

    const latinName = [altEn, place.toponymName, place.name]
      .find(name => name && !isArabicScript(name)) || null;
    const arabicName = [altAr, place.name, place.toponymName]
      .find(name => name && isArabicScript(name)) || null;

    // Create multilingual labels: en/fr Latin, ar Arabic, each falling back
    // to the other script only when its own isn't available at all.
    const labels = {
      en: latinName || arabicName || place.name,
      fr: (altFr && !isArabicScript(altFr) ? altFr : null) || latinName || arabicName || place.name,
      ar: arabicName || latinName || place.name
    };

    // Normalize labels to ensure Latin script consistency
    const normalizedLabels = this.normalizeLabels(labels);

    return {
      // Codes are derived from the Latin name so an Arabic-language search
      // doesn't produce an Arabic-script city code.
      code: (latinName || place.name).toUpperCase().replace(/\s+/g, '_'),
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
