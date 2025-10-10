const City = require("../models/City");
const Country = require("../models/Country");
const TranslationService = require("../services/translationService");
const geonamesService = require("../services/geonamesService");
const googlePlacesService = require("../services/googlePlacesService");
const { cacheService } = require("../config/cache");

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
      console.log('📦 Cities served from cache');
      return res.json(cachedCities);
    }
    
    let query = {};
    
    // Filter by active status
    if (active === 'true') {
      // Handle both true and null values for isActive
      query.$or = [
        { isActive: true },
        { isActive: null }
      ];
    }
    
    // Filter by country
    if (countryId) {
      query.country = countryId;
    } else if (countryCode) {
      const country = await Country.findOne({ code: countryCode.toUpperCase() });
      if (country) {
        query.country = country._id;
      }
    }
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    const cities = await City.find(query)
      .populate('country', 'code labels flag')
      .select('code labels isCapital isActive country')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    if (!cities.length) {
      return res.status(404).json({ 
        message: "No cities found",
        data: []
      });
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
      error: error.message 
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
      console.log('📦 Hybrid search served from cache');
      return res.json(cachedResult);
    }

    console.log(`🔍 Hybrid search: "${q}" in ${countryCode || 'all countries'} (${language})`);

    // Step 1: Search local database first
    let query = {
      $text: { $search: q },
      $or: [
        { isActive: true },
        { isActive: null }
      ]
    };

    // Filter by country if specified
    let country = null;
    if (countryCode) {
      country = await Country.findOne({ code: countryCode.toUpperCase() });
      if (country) {
        query.country = country._id;
      }
    }

    const localCities = await City.find(query)
      .populate('country', 'code labels flag')
      .select('code labels isCapital country isDynamic')
      .limit(parseInt(limit))
      .lean()
      .exec();

    console.log(`📊 Local database found ${localCities.length} cities`);

    let allCities = [...localCities];
    let apiCities = [];
    let googleCities = [];

    // Step 2: If we need more results or found few local results, search GeoNames API
    if (localCities.length < parseInt(limit) && countryCode) {
      try {
        console.log(`🌐 Searching GeoNames API for more cities...`);
        console.log(`🔍 Service call: geonamesService.searchCities("${q}", "${countryCode}", "${language}")`);
        apiCities = await geonamesService.searchCities(q, countryCode, language);
        console.log(`🔍 Service returned ${apiCities.length} cities`);
        
        // Filter out cities that already exist in our database
        const existingCityNames = localCities.map(city => 
          city.labels[language]?.toLowerCase() || city.labels.en?.toLowerCase()
        );
        
        apiCities = apiCities.filter(apiCity => {
          const apiCityName = apiCity.labels[language]?.toLowerCase() || apiCity.labels.en?.toLowerCase();
          return !existingCityNames.includes(apiCityName);
        });

        console.log(`🌐 GeoNames API found ${apiCities.length} additional cities`);
        console.log(`🔍 API cities before filtering:`, apiCities.map(c => c.labels?.en || c.code));
        console.log(`🔍 Existing city names:`, existingCityNames);
        
        // Add API cities to results (limit total results)
        const remainingSlots = parseInt(limit) - localCities.length;
        allCities = [...localCities, ...apiCities.slice(0, remainingSlots)];

      } catch (apiError) {
        console.warn('⚠️ GeoNames API error:', apiError.message);
        // Continue with local results only
      }
    }

    // Step 3: If we have NO results from database AND GeoNames, search Google Places API as last resort
    if (allCities.length === 0 && countryCode) {
      try {
        console.log(`🌐 No results from Database or GeoNames. Trying Google Places API as last resort...`);
        console.log(`🔍 Service call: googlePlacesService.searchCities("${q}", "${countryCode}", "${language}")`);
        googleCities = await googlePlacesService.searchCities(q, countryCode, language);
        console.log(`🔍 Service returned ${googleCities.length} cities`);
        
        // No need to filter duplicates since allCities is empty at this point (no database or GeoNames results)
        
        console.log(`✅ Google Places API found ${googleCities.length} cities`);
        if (googleCities.length > 0) {
          console.log(`🔍 Google cities:`, googleCities.map(c => c.labels?.en || c.code));
        }
        
        // Add Google Places cities to results (up to limit since allCities is empty at this point)
        allCities = [...googleCities.slice(0, parseInt(limit))];

      } catch (googleError) {
        console.warn('⚠️ Google Places API error:', googleError.message);
        // Continue with existing results
      }
    }

    // Step 4: Transform results
    const transformedCities = allCities.map(city => {
      // Handle database cities, GeoNames API cities, and Google Places cities
      if (city._id) {
        // Local database city
        return {
          _id: city._id,
          code: city.code,
          label: city.labels[language] || city.labels.en,
          labels: city.labels,
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
          label: city.labels[language] || city.labels.en,
          labels: city.labels,
          isCapital: city.isCapital,
          isDynamic: true,
          source: apiSource,
          population: city.population,
          coordinates: city.coordinates,
          placeId: city.placeId, // Google Places ID
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

    // Log final source breakdown
    console.log(`📊 Final source breakdown - Database: ${localCities.length}, GeoNames: ${apiCities.length}, Google: ${googleCities.length}, Total: ${transformedCities.length}`);

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
      error: error.message 
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
      error: error.message 
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

    // Find country
    let country;
    if (countryId) {
      country = await Country.findById(countryId);
    } else if (countryCode) {
      country = await Country.findOne({ code: countryCode.toUpperCase() });
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

         const newCity = {
       code: code.toUpperCase(),
       country: country._id,
       labels: {
         en: labels.en.trim(),
         fr: labels.fr.trim(),
         ar: labels.ar.trim()
       },
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
      error: error.message 
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
      updateData.labels = {
        en: labels.en?.trim() || city.labels.en,
        fr: labels.fr?.trim() || city.labels.fr,
        ar: labels.ar?.trim() || city.labels.ar
      };
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
      error: error.message 
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

    // Soft delete - set isActive to false
    await City.findByIdAndUpdate(id, { isActive: false });

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
      message: `City ${city.labels.en} has been deactivated successfully`
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete city",
      error: error.message 
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
         { "labels.en": { $regex: new RegExp(cityName, 'i') } },
         { "labels.ar": { $regex: new RegExp(cityName, 'i') } },
         { "labels.fr": { $regex: new RegExp(cityName, 'i') } }
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
    console.log('Generating city code for:', cityName, 'in country:', country.code);
    const cityCode = await TranslationService.generateCityCode(cityName, country.code, countryId);
    console.log('Generated city code:', cityCode);

         // Create the new city
     const newCity = new City({
       code: cityCode,
       country: countryId,
       labels: {
         en: translations.en,
         fr: translations.fr,
         ar: translations.ar
       },
       isCapital: false,
       isDynamic: true,
       isActive: true,
       searchTerms: [cityName, translations.en, translations.fr, translations.ar]
     });

    try {
      await newCity.save();
      console.log('Successfully created dynamic city:', newCity);
    } catch (saveError) {
      console.error('Error saving dynamic city:', saveError);
      
      // If it's a duplicate key error, try to find the existing city
      if (saveError.code === 11000) {
        console.log('Duplicate key error detected, looking for existing city...');
        const existingCity = await City.findOne({
          country: countryId,
          $or: [
            { "labels.en": { $regex: new RegExp(cityName, 'i') } },
            { "labels.ar": { $regex: new RegExp(cityName, 'i') } },
            { "labels.fr": { $regex: new RegExp(cityName, 'i') } }
          ]
        });
        
        if (existingCity) {
          console.log('Found existing city:', existingCity);
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
      error: error.message
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
    // Check if city already exists
    const existingCity = await City.findOne({
      country: countryId,
      $or: [
        { "labels.en": { $regex: new RegExp(apiCity.labels.en, 'i') } },
        { "labels.ar": { $regex: new RegExp(apiCity.labels.ar, 'i') } },
        { "labels.fr": { $regex: new RegExp(apiCity.labels.fr, 'i') } }
      ]
    });

    if (existingCity) {
      return existingCity;
    }

    // Create new city from API data
    const newCity = new City({
      code: apiCity.code,
      country: countryId,
      labels: apiCity.labels,
      isCapital: apiCity.isCapital,
      isActive: true,
      isDynamic: true,
      population: apiCity.population,
      searchTerms: apiCity.searchTerms || []
    });

    await newCity.save();
    console.log(`💾 Cached API city to database: ${apiCity.labels.en}`);
    
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

         const searchQuery = {
       country: countryId,
       isActive: true,
       $or: [
         { "labels.en": { $regex: new RegExp(query, 'i') } },
         { "labels.ar": { $regex: new RegExp(query, 'i') } },
         { "labels.fr": { $regex: new RegExp(query, 'i') } },
         { searchTerms: { $regex: new RegExp(query, 'i') } }
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
      error: error.message
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
      error: error.message
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
      error: error.message
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
