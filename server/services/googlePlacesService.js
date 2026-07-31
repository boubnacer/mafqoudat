const axios = require('axios');
const TranslationService = require('./translationService');

class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.baseURL = 'https://maps.googleapis.com/maps/api/place';
    this.rateLimit = {
      daily: {
        requests: 0,
        resetTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        maxRequests: 100 // Daily limit
      },
      monthly: {
        requests: 0,
        resetTime: this.getNextMonthResetTime(),
        maxRequests: 2000 // Monthly limit
      }
    };
    this.supportedLanguages = ['en', 'fr', 'ar'];
  }

  /**
   * Calculate reset time for monthly counter (first day of next month)
   */
  getNextMonthResetTime() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return nextMonth.getTime();
  }

  /**
   * Check if we can make API requests (rate limiting)
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Reset daily counter if 24 hours have passed
    if (now > this.rateLimit.daily.resetTime) {
      this.rateLimit.daily.requests = 0;
      this.rateLimit.daily.resetTime = now + (24 * 60 * 60 * 1000);
    }
    
    // Reset monthly counter if a new month has started
    if (now > this.rateLimit.monthly.resetTime) {
      this.rateLimit.monthly.requests = 0;
      this.rateLimit.monthly.resetTime = this.getNextMonthResetTime();
    }
    
    // Check both daily and monthly limits
    const withinDailyLimit = this.rateLimit.daily.requests < this.rateLimit.daily.maxRequests;
    const withinMonthlyLimit = this.rateLimit.monthly.requests < this.rateLimit.monthly.maxRequests;
    
    return withinDailyLimit && withinMonthlyLimit;
  }

  /**
   * Increment request counters for both daily and monthly limits
   */
  incrementRequestCounter() {
    this.rateLimit.daily.requests++;
    this.rateLimit.monthly.requests++;
  }

  /**
   * Search for cities using Google Places Text Search API
   * @param {string} cityName - The city name to search for
   * @param {string} countryCode - ISO country code (e.g., 'MA', 'EG')
   * @param {string} language - Language code ('en', 'fr', 'ar')
   * @returns {Promise<Array>} Array of city results
   */
  async searchCities(cityName, countryCode, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('Google Places API key not configured');
      }

      if (!this.canMakeRequest()) {
        const stats = this.getUsageStats();
        throw new Error(
          `Google Places API rate limit exceeded. Daily: ${stats.daily.requestsUsed}/${stats.daily.maxRequests}, Monthly: ${stats.monthly.requestsUsed}/${stats.monthly.maxRequests}`
        );
      }

      // Validate language
      const requestLanguage = this.supportedLanguages.includes(language) ? language : 'en';

      // Log search
      console.log(`🔍 Google Places: "${cityName}" in ${countryCode} (${requestLanguage})`);

      // Construct search query with country name for better results
      const searchQuery = `${cityName} ${this.getCountryName(countryCode)}`;

      // Google Places Text Search API parameters
      const params = {
        query: searchQuery,
        type: 'locality', // Filter to only cities
        key: this.apiKey,
        language: requestLanguage
      };

      const response = await axios.get(`${this.baseURL}/textsearch/json`, {
        params,
        timeout: 10000 // 10 second timeout
      });

      this.incrementRequestCounter();

      if (response.data && response.data.status === 'OK' && response.data.results) {
        // Filter results to only include localities (cities) and match country
        const cities = await Promise.all(
          response.data.results
            .filter(place => {
              // Ensure it's a locality (city)
              const isLocality = place.types && place.types.includes('locality');
              // Check if it matches the country code
              const matchesCountry = this.matchesCountryCode(place, countryCode);
              return isLocality && matchesCountry;
            })
            // Keep this small: enrichWithTranslations makes 2 extra Place
            // Details calls (fr + ar) per result, so 5 results = up to 11
            // requests per search against the 100/day budget.
            .slice(0, 5)
            .map(place => this.formatCityData(place, countryCode, requestLanguage))
        );

        // Fetch additional language variants if needed
        const enrichedCities = await Promise.all(
          cities.map(city => this.enrichWithTranslations(city, requestLanguage))
        );

        console.log(`✅ Google Places: ${enrichedCities.length} cities found`);
        return enrichedCities;
      }

      if (response.data && response.data.status === 'ZERO_RESULTS') {
        console.log(`✅ Google Places API: No cities found for "${cityName}"`);
        return [];
      }

      if (response.data && response.data.status !== 'OK') {
        console.error(`❌ Google Places API returned status: ${response.data.status}`);
        if (response.data.error_message) {
          console.error(`Error message: ${response.data.error_message}`);
        }
      }

      return [];

    } catch (error) {
      console.error('❌ Google Places API Error:', error.message);
      
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      
      throw new Error(`Google Places API error: ${error.message}`);
    }
  }

  /**
   * Check if a place matches the given country code
   * @param {Object} place - Google Places result
   * @param {string} countryCode - ISO country code
   * @returns {boolean}
   */
  matchesCountryCode(place, countryCode) {
    // If no address components, be lenient since we're searching with country name
    if (!place.address_components) {
      return true; // Allow it since we searched with country name in query
    }

    const countryComponent = place.address_components.find(component =>
      component.types.includes('country')
    );

    if (!countryComponent) {
      return true; // Allow it since we searched with country name in query
    }

    return countryComponent.short_name === countryCode;
  }

  /**
   * Get country name for better search results
   * @param {string} countryCode - ISO country code
   * @returns {string}
   */
  getCountryName(countryCode) {
    const countryNames = {
      'MA': 'Morocco',
      'EG': 'Egypt',
      'DZ': 'Algeria',
      'TN': 'Tunisia',
      'LY': 'Libya',
      'SA': 'Saudi Arabia',
      'AE': 'United Arab Emirates',
      'JO': 'Jordan',
      'LB': 'Lebanon',
      'SY': 'Syria',
      'IQ': 'Iraq',
      'KW': 'Kuwait',
      'QA': 'Qatar',
      'BH': 'Bahrain',
      'OM': 'Oman',
      'YE': 'Yemen',
      'PS': 'Palestine',
      'SD': 'Sudan',
      'SO': 'Somalia',
      'DJ': 'Djibouti',
      'KM': 'Comoros',
      'MR': 'Mauritania'
    };

    return countryNames[countryCode] || countryCode;
  }

  /**
   * Format Google Places API response to match City model structure
   * @param {Object} place - Google Places result data
   * @param {string} countryCode - ISO country code
   * @param {string} language - Language code
   * @returns {Object} Formatted city data
   */
  formatCityData(place, countryCode, language) {
    // Extract city name
    const cityName = this.extractCityName(place);

    // State/province/region, e.g. "Grand Casablanca" - same disambiguation
    // role as GeoNames' adminName1, so the two sources render identically in
    // the NewPost city dropdown (StepLocation.jsx/CityPickerModal.js).
    const adminName1 = this.extractAdminArea(place);

    // Determine if this is a capital city (basic check)
    const isCapital = place.types.includes('political') || 
                     place.name.toLowerCase().includes('capital') ||
                     this.isKnownCapital(cityName, countryCode);

    // Create multilingual labels (will be enriched later)
    const labels = {
      en: cityName,
      fr: cityName,
      ar: cityName
    };

    // Set the current language label
    labels[language] = place.name;

    return {
      code: cityName.toUpperCase().replace(/\s+/g, '_'),
      labels: labels,
      isCapital: isCapital,
      isActive: true,
      isDynamic: true,
      source: 'google',
      placeId: place.place_id,
      countryCode: countryCode,
      coordinates: place.geometry && place.geometry.location ? {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      } : null,
      formattedAddress: place.formatted_address,
      adminName1: adminName1,
      types: place.types
    };
  }

  /**
   * Extract the state/province/region name from a place's address components
   * (Google's `administrative_area_level_1`). Not populated for every
   * country - Google's admin-area coverage is thinner than GeoNames' for
   * some regions, so this can legitimately come back null.
   * @param {Object} place - Google Places result
   * @returns {string|null}
   */
  extractAdminArea(place) {
    if (!place.address_components) return null;
    const adminComponent = place.address_components.find(component =>
      component.types.includes('administrative_area_level_1')
    );
    return adminComponent ? adminComponent.long_name : null;
  }

  /**
   * Extract clean city name from place data
   * @param {Object} place - Google Places result
   * @returns {string}
   */
  extractCityName(place) {
    // Try to get the locality name from address components
    if (place.address_components) {
      const localityComponent = place.address_components.find(component =>
        component.types.includes('locality')
      );
      if (localityComponent) {
        return localityComponent.long_name;
      }
    }

    // Fallback to the place name
    return place.name;
  }

  /**
   * Check if a city is a known capital
   * @param {string} cityName - City name
   * @param {string} countryCode - ISO country code
   * @returns {boolean}
   */
  isKnownCapital(cityName, countryCode) {
    const capitals = {
      'MA': ['Rabat'],
      'EG': ['Cairo'],
      'DZ': ['Algiers'],
      'TN': ['Tunis'],
      'LY': ['Tripoli'],
      'SA': ['Riyadh'],
      'AE': ['Abu Dhabi'],
      'JO': ['Amman'],
      'LB': ['Beirut'],
      'SY': ['Damascus'],
      'IQ': ['Baghdad'],
      'KW': ['Kuwait City'],
      'QA': ['Doha'],
      'BH': ['Manama'],
      'OM': ['Muscat'],
      'YE': ['Sanaa'],
      'PS': ['Jerusalem', 'Ramallah'],
      'SD': ['Khartoum'],
      'SO': ['Mogadishu'],
      'DJ': ['Djibouti'],
      'KM': ['Moroni'],
      'MR': ['Nouakchott']
    };

    const countryCapitals = capitals[countryCode] || [];
    return countryCapitals.some(capital => 
      cityName.toLowerCase().includes(capital.toLowerCase()) ||
      capital.toLowerCase().includes(cityName.toLowerCase())
    );
  }

  /**
   * Enrich city data with NATIVE names in all languages (like GeoNames does)
   * This makes 3 API calls to get the native name in each language
   * @param {Object} cityData - Formatted city data
   * @param {string} requestLanguage - The language the original search was made in;
   *  used to prefer an admin-area name in that language when one is found.
   * @returns {Promise<Object>} Enriched city data with native names
   */
  async enrichWithTranslations(cityData, requestLanguage = 'en') {
    try {
      const isArabicScript = (text) => /[؀-ۿ]/.test(text || '');

      const nativeNames = {
        en: cityData.labels.en, // Already have this (unless search was Arabic)
        fr: cityData.labels.en, // Will fetch
        ar: cityData.labels.en  // Will fetch
      };

      // Fetch native names for French and Arabic by calling Place Details API.
      // If the base name came from an Arabic-language search it is Arabic
      // script, so the English name must be fetched too - otherwise the city
      // gets persisted with Arabic in labels.en and becomes unfindable (and
      // duplicated) for Latin-script searches.
      const languagesToFetch = ['fr', 'ar'];
      if (isArabicScript(nativeNames.en)) {
        languagesToFetch.unshift('en');
      }
      let translationQuality = 0;
      // Google's Text Search results don't include address_components (only
      // Place Details does) - the initial formatCityData() call already ran
      // extractAdminArea() and came up empty, so this stays null unless one
      // of the Details calls below finds it. Rides along on the same
      // requests already being made for name translation - address_components
      // costs nothing extra on top of the 'name' field.
      let adminName1 = cityData.adminName1 || null;

      for (const lang of languagesToFetch) {
        if (!this.canMakeRequest()) {
          break;
        }

        try {
          const params = {
            place_id: cityData.placeId,
            fields: 'name,address_components',
            language: lang,
            key: this.apiKey
          };

          const response = await axios.get(`${this.baseURL}/details/json`, {
            params,
            timeout: 5000
          });

          this.incrementRequestCounter();

          if (response.data && response.data.status === 'OK' && response.data.result) {
            const translatedName = response.data.result.name;
            nativeNames[lang] = translatedName;

            // If we got a different name, that's a good translation
            if (translatedName !== cityData.labels.en) {
              translationQuality++;
            }

            // Prefer the admin-area name in the UI's own language; otherwise
            // take whichever language's response has it first.
            const extractedAdminArea = this.extractAdminArea(response.data.result);
            if (extractedAdminArea && (!adminName1 || lang === requestLanguage)) {
              adminName1 = extractedAdminArea;
            }
          }
        } catch (error) {
          // Silently continue with default name
        }
      }

      cityData.adminName1 = adminName1;

      // Update cityData with native names, but keep fallbacks
      cityData.labels = {
        en: nativeNames.en || cityData.labels.en || cityData.code,
        fr: nativeNames.fr || cityData.labels.fr || cityData.labels.en || cityData.code,
        ar: nativeNames.ar || cityData.labels.ar || cityData.labels.en || cityData.code
      };
      
      // NEW: If we only have Arabic script, try to get Latin version
      // If we only have Latin script, try to get Arabic version
      cityData.labels = this.ensureBothScripts(cityData.labels);

      // The code was derived from the search-language name in formatCityData;
      // if that was Arabic script, rebuild it from the freshly-fetched Latin
      // (English) name so city codes stay Latin regardless of UI language.
      if (isArabicScript(cityData.code) && !isArabicScript(cityData.labels.en)) {
        cityData.code = cityData.labels.en.toUpperCase().replace(/\s+/g, '_');
      }

      // Add translation quality score
      cityData.translationQuality = translationQuality;
      
      // Add search terms with all language variants
      cityData.searchTerms = [
        nativeNames.en.toLowerCase(),
        nativeNames.fr.toLowerCase(),
        nativeNames.ar
      ].filter((term, index, self) => term && self.indexOf(term) === index);

      return cityData;
    } catch (error) {
      // Return original data if enrichment fails
      console.error('⚠️ Translation enrichment error:', error.message);
      return cityData;
    }
  }

  /**
   * Ensure we have both Latin and Arabic scripts when possible
   * @param {Object} labels - City labels object
   * @returns {Object} Normalized labels with both scripts when possible
   */
  ensureBothScripts(labels) {
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
   * Get city details by Google Place ID
   * @param {string} placeId - Google Place ID
   * @param {string} language - Language code
   * @returns {Promise<Object>} City details
   */
  async getCityDetails(placeId, language = 'en') {
    try {
      if (!this.canMakeRequest()) {
        throw new Error('Google Places API rate limit exceeded');
      }

      const requestLanguage = this.supportedLanguages.includes(language) ? language : 'en';

      const params = {
        place_id: placeId,
        fields: 'name,place_id,geometry,formatted_address,address_components,types',
        language: requestLanguage,
        key: this.apiKey
      };

      const response = await axios.get(`${this.baseURL}/details/json`, {
        params,
        timeout: 10000
      });

      this.incrementRequestCounter();

      if (response.data && response.data.status === 'OK' && response.data.result) {
        const place = response.data.result;
        const countryComponent = place.address_components?.find(component =>
          component.types.includes('country')
        );
        const countryCode = countryComponent ? countryComponent.short_name : 'XX';

        return this.formatCityData(place, countryCode, requestLanguage);
      }

      return null;

    } catch (error) {
      console.error('❌ Google Places API Error (getCityDetails):', error.message);
      throw new Error(`Google Places API error: ${error.message}`);
    }
  }

  /**
   * Get API usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const now = Date.now();
    
    // Daily stats
    const dailyTimeUntilReset = Math.max(0, this.rateLimit.daily.resetTime - now);
    const dailyHoursUntilReset = Math.ceil(dailyTimeUntilReset / (60 * 60 * 1000));
    
    // Monthly stats
    const monthlyTimeUntilReset = Math.max(0, this.rateLimit.monthly.resetTime - now);
    const monthlyDaysUntilReset = Math.ceil(monthlyTimeUntilReset / (24 * 60 * 60 * 1000));

    return {
      daily: {
        requestsUsed: this.rateLimit.daily.requests,
        requestsRemaining: this.rateLimit.daily.maxRequests - this.rateLimit.daily.requests,
        maxRequests: this.rateLimit.daily.maxRequests,
        hoursUntilReset: dailyHoursUntilReset
      },
      monthly: {
        requestsUsed: this.rateLimit.monthly.requests,
        requestsRemaining: this.rateLimit.monthly.maxRequests - this.rateLimit.monthly.requests,
        maxRequests: this.rateLimit.monthly.maxRequests,
        daysUntilReset: monthlyDaysUntilReset
      },
      canMakeRequest: this.canMakeRequest()
    };
  }
}

module.exports = new GooglePlacesService();

