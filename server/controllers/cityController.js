const City = require("../models/City");
const Country = require("../models/Country");
const TranslationService = require("../services/translationService");
const geonamesService = require("../services/geonamesService");
const googlePlacesService = require("../services/googlePlacesService");
const { cacheService } = require("../config/cache");
const { getCountryId } = require("../utils/countryCache");
const { escapeRegex } = require("../utils/regexUtils");
const {
  buildCitySearchPattern,
  rankCityMatches,
  cityDedupeKey,
  CANDIDATE_OVERFETCH,
} = require("../utils/cityMatching");
const { normalizeCoordinates, MISSING_COORDINATES } = require("../utils/cityCoordinates");

// Helper function to check for Arabic text
const isArabicText = (text) => {
  if (!text) return false;
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

/**
 * Build a case-insensitive regex pattern for a city search term.
 *
 * Delegates to the shared folding in utils/cityMatching: it is not only
 * Arabic that is written more than one way. Nobody types "Aït-Melloul"
 * with the trema and the hyphen, and a literal regex over the stored label
 * misses the row that is sitting right there.
 * @param {string} text - Raw search term
 * @returns {string} - Regex pattern string
 */
const buildSearchPattern = (text) => buildCitySearchPattern(text) || escapeRegex(text);

// Helper function to normalize city labels
const normalizeCityLabels = (labels) => {
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
};

const getCities = async (req, res) => {
  try {
    const { language = 'en', search, active = true, countryId, countryCode } = req.query;
    
    // Generate cache key
    const cacheKey = cacheService.generateKey('cities', {
      language,
      search,
      active,
      countryId,
      countryCode
    });
    
    // Check cache first
    const cachedCities = await cacheService.get(cacheKey);
    if (cachedCities) {
      return res.json(cachedCities);
    }
    
    let query = {};
    
    // Build query conditions
    const conditions = [];
    
    // Filter by active status
    if (active === 'true') {
      conditions.push({
        $or: [
          { isActive: true },
          { isActive: null }
        ]
      });
    }
    
    // Filter by country (using cached lookup)
    if (countryId) {
      conditions.push({ country: countryId });
    } else if (countryCode) {
      const cachedCountryId = await getCountryId(countryCode.toUpperCase());
      if (cachedCountryId) {
        conditions.push({ country: cachedCountryId });
      }
    }
    
    // Add search functionality - use regex for partial matching
    if (search) {
      // Arabic-aware pattern: matches "اكادير" with "أكادير" (with/without hamza)
      const searchPattern = buildSearchPattern(search);

      // Use regex for case-insensitive partial matching across all language labels
      conditions.push({
        $or: [
          { 'labels.en': { $regex: searchPattern, $options: 'i' } },
          { 'labels.fr': { $regex: searchPattern, $options: 'i' } },
          { 'labels.ar': { $regex: searchPattern, $options: 'i' } },
          { code: { $regex: searchPattern, $options: 'i' } }
        ]
      });
    }
    
    // Combine all conditions with $and
    if (conditions.length > 0) {
      query.$and = conditions;
    }
    
    const cities = await City.find(query)
      .populate('country', 'code labels flag')
      .select('code labels isCapital isActive country')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    // Return empty array instead of 404 - this allows frontend to handle "no results" gracefully
    if (!cities.length) {
      const response = {
        success: true,
        data: [],
        total: 0
      };
      // Cache empty results for shorter time (5 minutes)
      await cacheService.set(cacheKey, response, 300);
      return res.json(response);
    }

    // Transform response to include language-specific labels
    const transformedCities = cities.map(city => ({
      _id: city._id,
      code: city.code,
      label: city.labels[language] || city.labels.en,
      labels: city.labels,
      isCapital: city.isCapital,
      isActive: city.isActive,
      country: city.country ? {
        _id: city.country._id,
        code: city.country.code,
        label: city.country.labels[language] || city.country.labels.en,
        labels: city.country.labels,
        flag: city.country.flag
      } : null
    }));

    const response = {
      success: true,
      data: transformedCities,
      total: transformedCities.length
    };
    
    // Cache the response for 24 hours (aggressive static data caching)
    await cacheService.set(cacheKey, response, 86400);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch cities",
    });
  }
};

// A city already in the database, saved before coordinates were stored, is
// completed from the API answer that is about to be thrown away as a duplicate
// of it. The map places cities from City.coordinates and cannot work a village
// out from its name (see utils/cityGeocode.js), so without this a row created
// last year stays unplaceable however many people file listings there - the
// post path only ever sees the row's id, never a fresh search result.
//
// Costs nothing extra: GeoNames/Google were already asked, and their answer is
// already in hand. Matched on the folded name (the same key the de-duplication
// uses, so "Ait-Melloul" completes the stored "Aït Melloul"), written guarded
// on the field still being absent, and fire-and-forget - a search must never
// fail or wait because of it.
const adoptApiCoordinates = (localCities, apiCities, language) => {
  if (!localCities.length || !apiCities.length) return;

  const needsCoordinates = new Map();
  localCities.forEach((city) => {
    if (city.coordinates) return;
    const key = cityDedupeKey(city, language);
    if (key && !needsCoordinates.has(key)) needsCoordinates.set(key, city);
  });
  if (!needsCoordinates.size) return;

  const writes = [];
  apiCities.forEach((apiCity) => {
    const key = cityDedupeKey(apiCity, language);
    const localCity = key && needsCoordinates.get(key);
    if (!localCity) return;
    const coordinates = normalizeCoordinates(apiCity.coordinates);
    if (!coordinates) return;
    needsCoordinates.delete(key);
    // Stamped on the row in hand as well, so the Google pass right after the
    // GeoNames one does not queue a second write for a city just filled.
    localCity.coordinates = coordinates;
    writes.push(
      City.updateOne(
        { _id: localCity._id, ...MISSING_COORDINATES },
        { $set: { coordinates } }
      )
    );
  });

  if (writes.length) {
    Promise.all(writes).catch((error) => {
      console.warn('Could not save coordinates onto existing cities:', error.message);
    });
  }
};

const searchCities = async (req, res) => {
  try {
    const { q, language = 'en', limit = 10, countryCode } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 2 characters long" 
      });
    }

    // Generate cache key for hybrid search (including google places)
    const cacheKey = cacheService.generateKey('cities-hybrid-search-google', {
      q: q.toLowerCase(),
      language,
      countryCode,
      limit
    });

    // Check cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Step 1: Search local database first
    let query = {
      $text: { $search: q },
      $or: [
        { isActive: true },
        { isActive: null }
      ]
    };

    // Filter by country if specified (using cached lookup)
    let country = null;
    if (countryCode) {
      const cachedCountryId = await getCountryId(countryCode.toUpperCase());
      if (cachedCountryId) {
        query.country = cachedCountryId;
        // Fetch full country data if needed for response
        country = await Country.findById(cachedCountryId).select('code labels flag').lean();
      }
    }

    // Fetch more candidates than will be shown: $text answers in no
    // particular order, so cutting at the display limit here can drop the
    // exact match and keep nine near-misses. Ranking does the cutting, below.
    const candidateLimit = parseInt(limit) * CANDIDATE_OVERFETCH;

    let localCities = await City.find(query)
      .populate('country', 'code labels flag')
      .select('code labels isCapital country isDynamic coordinates')
      .limit(candidateLimit)
      .lean()
      .exec();

    // Fallback: $text only matches whole words, so partial queries ("Dchei")
    // and Arabic spelling variants ("اكادير" vs "أكادير") find nothing.
    // Retry with an Arabic-aware, case-insensitive regex over labels and
    // searchTerms before going to the external APIs.
    if (localCities.length === 0) {
      const searchPattern = buildSearchPattern(q.trim());
      const regexQuery = {
        $and: [
          { $or: [{ isActive: true }, { isActive: null }] },
          {
            $or: [
              { 'labels.en': { $regex: searchPattern, $options: 'i' } },
              { 'labels.fr': { $regex: searchPattern, $options: 'i' } },
              { 'labels.ar': { $regex: searchPattern, $options: 'i' } },
              { searchTerms: { $regex: searchPattern, $options: 'i' } }
            ]
          }
        ]
      };
      if (query.country) {
        regexQuery.country = query.country;
      }

      localCities = await City.find(regexQuery)
        .populate('country', 'code labels flag')
        .select('code labels isCapital country isDynamic coordinates')
        .limit(candidateLimit)
        .lean()
        .exec();
    }

    let allCities = [...localCities];
    let apiCities = [];
    let googleCities = [];
    let needsArabicSupplement = false;

    // Step 2: If we need more results or found few local results, search GeoNames API
    if (localCities.length < parseInt(limit) && countryCode) {
      try {
        apiCities = await geonamesService.searchCities(q, countryCode, language);

        // Filter out cities that already exist in our database. Compared on
        // the folded name, so the stored "Aït Melloul" and GeoNames'
        // "Ait-Melloul" are recognised as one place rather than listed twice.
        const existingCityNames = new Set(localCities.map(city => cityDedupeKey(city, language)));

        // Before the duplicates are dropped: a duplicate of a row that has no
        // coordinates is the one thing that can place that row on the map.
        adoptApiCoordinates(localCities, apiCities, language);

        apiCities = apiCities.filter(apiCity => !existingCityNames.has(cityDedupeKey(apiCity, language)));

        // A GeoNames match is real, useful data even when it lacks translated
        // alternate names (common for small towns/villages) - it just falls
        // back to showing the Latin name in every language, which is still
        // correct. It must never be discarded outright just because it isn't
        // fully translated. We only use translation quality to decide whether
        // Arabic searches need a Google Places supplement (Google's Place
        // Details calls can fetch a real Arabic name GeoNames doesn't have).
        const hasArabicCoverage = apiCities.some(city => city.labels?.ar && isArabicText(city.labels.ar));
        needsArabicSupplement = language === 'ar' && apiCities.length > 0 && !hasArabicCoverage;

        // Every GeoNames candidate goes into the pool, not just the ones that
        // fit the remaining slots: the list is ranked by match quality before
        // it is cut, so a village sitting twelfth in GeoNames' own order can
        // still reach the reader. Cutting first is how it never did.
        allCities = [...localCities, ...apiCities];

      } catch (apiError) {
        console.warn('⚠️ GeoNames API error:', apiError.message);
        // Continue with local results only
      }
    }

    // Step 3: Search Google Places if we're still short of the requested
    // limit (same "keep filling until full" pattern as the GeoNames gate
    // above), or (for Arabic searches specifically) GeoNames couldn't
    // provide a real Arabic name. Results are merged into allCities, never
    // replace what's already been found.
    //
    // This gate is deliberately row-count based and stays that way: Google
    // Places is billed per request and each kept result costs 2-3 further
    // Place Details calls, so asking it on every search that hasn't found an
    // exact match is a cost decision, not a search-quality one.
    if ((allCities.length < parseInt(limit) || needsArabicSupplement) && countryCode) {
      try {
        googleCities = await googlePlacesService.searchCities(q, countryCode, language);

        // Merge, de-duplicated on the folded name so a place already found
        // under another spelling isn't listed twice.
        adoptApiCoordinates(localCities, googleCities, language);

        const existingNames = new Set(allCities.map(city => cityDedupeKey(city, language)));
        const newGoogleCities = googleCities.filter(city => {
          const key = cityDedupeKey(city, language);
          return key && !existingNames.has(key);
        });
        allCities = [...allCities, ...newGoogleCities];

      } catch (googleError) {
        console.warn('⚠️ Google Places API error:', googleError.message);
        // Continue with existing results
      }
    }

    // Rank before cutting: the three sources are merged in the order they
    // were asked, and both external ones answer with plenty of places that
    // merely share a few letters with the query. Sorted by how well each one
    // matches what was typed, the answer is at the top instead of past the
    // end. Ties keep source order, so an equally good database row still
    // outranks an API one.
    allCities = rankCityMatches(allCities, q).slice(0, parseInt(limit));

    // Step 4: Transform results
    const transformedCities = allCities.map(city => {
      // Normalize labels before processing
      const normalizedLabels = normalizeCityLabels(city.labels);
      
      // Handle database cities, GeoNames API cities, and Google Places cities
      if (city._id) {
        // Local database city
        return {
          _id: city._id,
          code: city.code,
          label: normalizedLabels[language] || normalizedLabels.en,
          labels: normalizedLabels,
          fallbackLabels: {
            en: normalizedLabels.en || normalizedLabels[language] || city.code,
            fr: normalizedLabels.fr || normalizedLabels.en || normalizedLabels[language] || city.code,
            ar: normalizedLabels.ar || normalizedLabels.en || normalizedLabels[language] || city.code
          },
          isCapital: city.isCapital,
          isDynamic: city.isDynamic || false,
          source: 'database',
          country: city.country ? {
            _id: city.country._id,
            code: city.country.code,
            label: city.country.labels[language] || city.country.labels.en,
            labels: city.country.labels,
            flag: city.country.flag
          } : null
        };
      } else {
        // External API city (GeoNames or Google Places)
        const apiSource = city.source === 'google' ? 'google' : 'geonames';
        return {
          _id: null, // No database ID for API cities
          code: city.code,
          label: normalizedLabels[language] || normalizedLabels.en,
          labels: normalizedLabels,
          fallbackLabels: {
            en: normalizedLabels.en || normalizedLabels[language] || city.code,
            fr: normalizedLabels.fr || normalizedLabels.en || normalizedLabels[language] || city.code,
            ar: normalizedLabels.ar || normalizedLabels.en || normalizedLabels[language] || city.code
          },
          isCapital: city.isCapital,
          isDynamic: true,
          source: apiSource,
          population: city.population,
          coordinates: city.coordinates,
          placeId: city.placeId, // Google Places ID
          // Disambiguation context surfaced in the NewPost form's city
          // dropdown only (not saved) - GeoNames supplies the admin region
          // (state/province), Google Places supplies a full formatted
          // address (locality, region, country).
          adminName1: city.adminName1,
          formattedAddress: city.formattedAddress,
          country: country ? {
            _id: country._id,
            code: country.code,
            label: country.labels[language] || country.labels.en,
            labels: country.labels,
            flag: country.flag
          } : null
        };
      }
    });

    const response = {
      success: true,
      data: transformedCities,
      total: transformedCities.length,
      sources: {
        database: localCities.length,
        geonames: apiCities.length,
        google: googleCities.length
      },
      geonamesStats: geonamesService.getUsageStats(),
      googlePlacesStats: googlePlacesService.getUsageStats()
    };

    // Cache the response for 1 hour (shorter cache for search results)
    await cacheService.set(cacheKey, response, 3600);

    res.json(response);
  } catch (error) {
    console.error('Error in hybrid city search:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to search cities",
    });
  }
};

const getCitiesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { language = 'en', active = true } = req.query;
    
    let query = { country: countryId };
    
    // Filter by active status
    if (active === 'true') {
      query.isActive = true;
    }
    
         const cities = await City.find(query)
       .select('code labels isCapital isActive')
       .sort({ 'labels.en': 1 })
       .lean()
       .exec();

     if (!cities.length) {
       return res.status(404).json({ 
         message: "No cities found for this country",
         data: []
       });
     }

     const transformedCities = cities.map(city => ({
       _id: city._id,
       code: city.code,
       label: city.labels[language] || city.labels.en,
       labels: city.labels,
       isCapital: city.isCapital,
       isActive: city.isActive
     }));

    res.json({
      success: true,
      data: transformedCities,
      total: transformedCities.length
    });
  } catch (error) {
    console.error('Error fetching cities by country:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch cities by country",
    });
  }
};

const createCity = async (req, res) => {
  try {
         const { code, countryId, countryCode, labels, isCapital, population } = req.body;
    
    // Validate required fields
    if (!code || !labels || !labels.en || !labels.fr || !labels.ar) {
      return res.status(400).json({ 
        success: false,
        message: "City code and labels in all languages (en, fr, ar) are required" 
      });
    }

    // Find country (using cached lookup for code)
    let country;
    if (countryId) {
      country = await Country.findById(countryId);
    } else if (countryCode) {
      const cachedCountryId = await getCountryId(countryCode.toUpperCase());
      if (cachedCountryId) {
        country = await Country.findById(cachedCountryId);
      }
    }

    if (!country) {
      return res.status(400).json({ 
        success: false,
        message: "Valid country ID or country code is required" 
      });
    }

    // Check if city already exists
    const existingCity = await City.findOne({ 
      country: country._id, 
      code: code.toUpperCase() 
    });
    
    if (existingCity) {
      return res.status(409).json({ 
        success: false,
        message: `City with code ${code} already exists in ${country.labels.en}` 
      });
    }

         // Normalize labels before creating city
         const normalizedLabels = normalizeCityLabels({
           en: labels.en.trim(),
           fr: labels.fr.trim(),
           ar: labels.ar.trim()
         });

         const newCity = {
       code: code.toUpperCase(),
       country: country._id,
       labels: normalizedLabels,
       isCapital: isCapital || false,
       population: population || null
     };

    const addedCity = await City.create(newCity);
    
    // Invalidate cities cache after creation
    await cacheService.invalidatePattern('cities*');
    await cacheService.invalidatePattern('cities-search*');
    await cacheService.invalidatePattern('cities-search-name*');
    await cacheService.invalidatePattern('cities-by-country*');
    await cacheService.invalidatePattern('cities-public*');
    await cacheService.invalidatePattern('cities-simple*');
    await cacheService.invalidatePattern('dependencies-cities*');
    
         // Populate country info
     await addedCity.populate('country', 'code labels flag');
    
    res.status(201).json({
      success: true,
      message: `City ${addedCity.labels.en} (${addedCity.code}) added successfully to ${country.labels.en}`,
             data: {
         _id: addedCity._id,
         code: addedCity.code,
         labels: addedCity.labels,
         isCapital: addedCity.isCapital,
         population: addedCity.population,
         country: {
           _id: addedCity.country._id,
           code: addedCity.country.code,
           labels: addedCity.country.labels,
           flag: addedCity.country.flag
         }
       }
    });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create city",
    });
  }
};

const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
         const { labels, isCapital, population, isActive } = req.body;
    
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({ 
        success: false,
        message: "City not found" 
      });
    }

    const updateData = {};
    
    if (labels) {
      // Normalize labels before updating
      const normalizedLabels = normalizeCityLabels({
        en: labels.en?.trim() || city.labels.en,
        fr: labels.fr?.trim() || city.labels.fr,
        ar: labels.ar?.trim() || city.labels.ar
      });
      updateData.labels = normalizedLabels;
    }
    
    
    
    if (typeof isCapital === 'boolean') {
      updateData.isCapital = isCapital;
    }
    
    if (typeof population === 'number') {
      updateData.population = population;
    }
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

         const updatedCity = await City.findByIdAndUpdate(
       id, 
       updateData, 
       { new: true, runValidators: true }
     ).populate('country', 'code labels flag');

    // Invalidate cities cache after update
    await cacheService.invalidatePattern('cities*');
    await cacheService.invalidatePattern('cities-search*');
    await cacheService.invalidatePattern('cities-search-name*');
    await cacheService.invalidatePattern('cities-by-country*');
    await cacheService.invalidatePattern('cities-public*');
    await cacheService.invalidatePattern('cities-simple*');
    await cacheService.invalidatePattern('dependencies-cities*');

    res.json({
      success: true,
      message: `City ${updatedCity.labels.en} updated successfully`,
             data: {
         _id: updatedCity._id,
         code: updatedCity.code,
         labels: updatedCity.labels,
         isCapital: updatedCity.isCapital,
         population: updatedCity.population,
         isActive: updatedCity.isActive,
         country: {
           _id: updatedCity.country._id,
           code: updatedCity.country.code,
           labels: updatedCity.country.labels,
           flag: updatedCity.country.flag
         }
       }
    });
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update city",
    });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({ 
        success: false,
        message: "City not found" 
      });
    }

    // Check if this is an admin request (admin routes should do hard delete)
    // For now, we'll do a hard delete (actually remove from database)
    // This is safer for admin operations
    await City.findByIdAndDelete(id);

    // Invalidate cities cache after deletion
    await cacheService.invalidatePattern('cities*');
    await cacheService.invalidatePattern('cities-search*');
    await cacheService.invalidatePattern('cities-search-name*');
    await cacheService.invalidatePattern('cities-by-country*');
    await cacheService.invalidatePattern('cities-public*');
    await cacheService.invalidatePattern('cities-simple*');
    await cacheService.invalidatePattern('dependencies-cities*');

    res.json({
      success: true,
      message: `City ${city.labels.en} has been deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete city",
    });
  }
};

// Create a new dynamic city
const createDynamicCity = async (req, res) => {
  try {
    const { cityName, countryId, sourceLanguage = 'en' } = req.body;

    if (!cityName || !countryId) {
      return res.status(400).json({
        success: false,
        message: "City name and country ID are required"
      });
    }

    // Check if country exists
    const country = await Country.findById(countryId);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }

         // Check if city already exists for this country
     const existingCity = await City.findOne({
       country: countryId,
       $or: [
         { "labels.en": { $regex: buildSearchPattern(cityName), $options: 'i' } },
         { "labels.ar": { $regex: buildSearchPattern(cityName), $options: 'i' } },
         { "labels.fr": { $regex: buildSearchPattern(cityName), $options: 'i' } }
       ]
     });

    if (existingCity) {
      return res.status(200).json({
        success: true,
        message: "City already exists",
        data: existingCity
      });
    }

    // Translate the city name
    const translations = await TranslationService.translateCityName(cityName, sourceLanguage);
    
    // Generate a unique code for the city
    const cityCode = await TranslationService.generateCityCode(cityName, country.code, countryId);

         // Normalize labels before creating city
         const normalizedLabels = normalizeCityLabels({
           en: translations.en,
           fr: translations.fr,
           ar: translations.ar
         });

         // Create the new city
     const newCity = new City({
       code: cityCode,
       country: countryId,
       labels: normalizedLabels,
       isCapital: false,
       isDynamic: true,
       isActive: true,
       searchTerms: [cityName, normalizedLabels.en, normalizedLabels.fr, normalizedLabels.ar]
     });

    try {
      await newCity.save();
    } catch (saveError) {
      console.error('Error saving dynamic city:', saveError);

      // If it's a duplicate key error, try to find the existing city
      if (saveError.code === 11000) {
        const existingCity = await City.findOne({
          country: countryId,
          $or: [
            { "labels.en": { $regex: buildSearchPattern(cityName), $options: 'i' } },
            { "labels.ar": { $regex: buildSearchPattern(cityName), $options: 'i' } },
            { "labels.fr": { $regex: buildSearchPattern(cityName), $options: 'i' } }
          ]
        });

        if (existingCity) {
          return res.status(200).json({
            success: true,
            message: "City already exists",
            data: existingCity
          });
        }
      }
      
      throw saveError;
    }

    // Invalidate cities cache after creation
    await cacheService.invalidatePattern('cities*');
    await cacheService.invalidatePattern('cities-search*');
    await cacheService.invalidatePattern('cities-search-name*');
    await cacheService.invalidatePattern('cities-by-country*');
    await cacheService.invalidatePattern('cities-public*');
    await cacheService.invalidatePattern('cities-simple*');
    await cacheService.invalidatePattern('dependencies-cities*');

    res.status(201).json({
      success: true,
      message: "Dynamic city created successfully",
      data: newCity
    });

  } catch (error) {
    console.error("Error creating dynamic city:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Smart caching function for API results
const shouldCacheCity = (city, searchCount = 1) => {
  // Cache cities that meet certain criteria
  const criteria = [
    city.population > 10000, // Cities with significant population
    city.isCapital, // Capital cities
    searchCount > 2, // Frequently searched cities
    city.fcode === 'PPLA' || city.fcode === 'PPLA2' // Administrative centers
  ];
  
  return criteria.some(criterion => criterion);
};

// Cache API city to database
const cacheApiCityToDatabase = async (apiCity, countryId) => {
  try {
    // Check if city already exists. A label an API didn't supply is skipped
    // rather than searched for: an empty pattern matches every row, which
    // would report the first city in the country as this one.
    const nameConditions = ['en', 'ar', 'fr']
      .map(lang => [lang, buildSearchPattern(apiCity.labels?.[lang])])
      .filter(([, pattern]) => pattern)
      .map(([lang, pattern]) => ({ [`labels.${lang}`]: { $regex: pattern, $options: 'i' } }));

    if (nameConditions.length === 0) {
      return null;
    }

    const existingCity = await City.findOne({
      country: countryId,
      $or: nameConditions
    });

    if (existingCity) {
      return existingCity;
    }

    // Normalize labels before creating city
    const normalizedLabels = normalizeCityLabels(apiCity.labels);

    // Create new city from API data
    const newCity = new City({
      code: apiCity.code,
      country: countryId,
      labels: normalizedLabels,
      isCapital: apiCity.isCapital,
      isActive: true,
      isDynamic: true,
      population: apiCity.population,
      searchTerms: apiCity.searchTerms || []
    });

    await newCity.save();

    // Invalidate cache
    await cacheService.invalidatePattern('cities*');
    
    return newCity;
  } catch (error) {
    console.error('Error caching API city:', error);
    return null;
  }
};

// Search cities by name (for the "Other" option)
const searchCitiesByName = async (req, res) => {
  try {
    const { query, countryId, limit = 10 } = req.query;

    if (!query || !countryId) {
      return res.status(400).json({
        success: false,
        message: "Query and country ID are required"
      });
    }

         const searchPattern = buildSearchPattern(query);
     const searchQuery = {
       country: countryId,
       isActive: true,
       $or: [
         { "labels.en": { $regex: searchPattern, $options: 'i' } },
         { "labels.ar": { $regex: searchPattern, $options: 'i' } },
         { "labels.fr": { $regex: searchPattern, $options: 'i' } },
         { searchTerms: { $regex: searchPattern, $options: 'i' } }
       ]
     };

     const cities = await City.find(searchQuery)
       .select('code labels isCapital isDynamic')
       .limit(parseInt(limit))
       .sort({ isCapital: -1, 'labels.en': 1 });

    res.status(200).json({
      success: true,
      message: "Cities found",
      data: cities
    });

  } catch (error) {
    console.error("Error searching cities:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Cache API city endpoint (for manual caching of popular cities)
const cacheApiCity = async (req, res) => {
  try {
    const { apiCity, countryId } = req.body;

    if (!apiCity || !countryId) {
      return res.status(400).json({
        success: false,
        message: "API city data and country ID are required"
      });
    }

    const cachedCity = await cacheApiCityToDatabase(apiCity, countryId);
    
    if (cachedCity) {
      res.json({
        success: true,
        message: "City cached successfully",
        data: cachedCity
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to cache city"
      });
    }
  } catch (error) {
    console.error('Error caching API city:', error);
    res.status(500).json({
      success: false,
      message: "Failed to cache city",
    });
  }
};

// Get GeoNames API usage statistics
const getGeonamesStats = async (req, res) => {
  try {
    const stats = geonamesService.getUsageStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting GeoNames stats:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get GeoNames statistics",
    });
  }
};

module.exports = {
  getCities,
  searchCities,
  getCitiesByCountry,
  createCity,
  updateCity,
  deleteCity,
  createDynamicCity,
  searchCitiesByName,
  cacheApiCity,
  getGeonamesStats,
  shouldCacheCity,
  cacheApiCityToDatabase
};
