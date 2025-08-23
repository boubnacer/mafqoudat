const City = require("../models/City");
const Country = require("../models/Country");
const TranslationService = require("../services/translationService");

const getCities = async (req, res) => {
  try {
    const { language = 'en', search, active = true, countryId, countryCode } = req.query;
    
    let query = {};
    
    // Filter by active status
    if (active === 'true') {
      query.isActive = true;
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
      .populate('country', 'code labels names flag')
      .select('code labels names isCapital isActive country')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    if (!cities.length) {
      return res.status(404).json({ 
        message: "No cities found",
        data: []
      });
    }

    // Transform response to include language-specific labels and names
    const transformedCities = cities.map(city => ({
      _id: city._id,
      code: city.code,
      label: city.labels[language] || city.labels.en,
      labels: city.labels,
      names: city.names || {},
      isCapital: city.isCapital,
      isActive: city.isActive,
      country: city.country ? {
        _id: city.country._id,
        code: city.country.code,
        label: city.country.labels[language] || city.country.labels.en,
        labels: city.country.labels,
        names: city.country.names || {},
        flag: city.country.flag
      } : null
    }));

    res.json({
      success: true,
      data: transformedCities,
      total: transformedCities.length
    });
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

    let query = {
      $text: { $search: q },
      isActive: true
    };

    // Filter by country if specified
    if (countryCode) {
      const country = await Country.findOne({ code: countryCode.toUpperCase() });
      if (country) {
        query.country = country._id;
      }
    }

    const cities = await City.find(query)
      .populate('country', 'code labels names flag')
      .select('code labels names isCapital country')
      .limit(parseInt(limit))
      .lean()
      .exec();

    const transformedCities = cities.map(city => ({
      _id: city._id,
      code: city.code,
      label: city.labels[language] || city.labels.en,
      labels: city.labels,
      names: city.names || {},
      isCapital: city.isCapital,
      country: city.country ? {
        _id: city.country._id,
        code: city.country.code,
        label: city.country.labels[language] || city.country.labels.en,
        labels: city.country.labels,
        names: city.country.names || {},
        flag: city.country.flag
      } : null
    }));

    res.json({
      success: true,
      data: transformedCities,
      total: transformedCities.length
    });
  } catch (error) {
    console.error('Error searching cities:', error);
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
      .select('code labels names isCapital isActive')
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
      names: city.names || {},
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
    const { code, countryId, countryCode, labels, names, isCapital, population } = req.body;
    
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
      names: names ? {
        en: names.en?.trim() || labels.en.trim(),
        fr: names.fr?.trim() || labels.fr.trim(),
        ar: names.ar?.trim() || labels.ar.trim()
      } : {
        en: labels.en.trim(),
        fr: labels.fr.trim(),
        ar: labels.ar.trim()
      },
      isCapital: isCapital || false,
      population: population || null
    };

    const addedCity = await City.create(newCity);
    
    // Populate country info
    await addedCity.populate('country', 'code labels names flag');
    
    res.status(201).json({
      success: true,
      message: `City ${addedCity.labels.en} (${addedCity.code}) added successfully to ${country.labels.en}`,
      data: {
        _id: addedCity._id,
        code: addedCity.code,
        labels: addedCity.labels,
        names: addedCity.names,
        isCapital: addedCity.isCapital,
        population: addedCity.population,
        country: {
          _id: addedCity.country._id,
          code: addedCity.country.code,
          labels: addedCity.country.labels,
          names: addedCity.country.names,
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
    const { labels, names, isCapital, population, isActive } = req.body;
    
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
    
    if (names) {
      updateData.names = {
        en: names.en?.trim() || city.names.en,
        fr: names.fr?.trim() || city.names.fr,
        ar: names.ar?.trim() || city.names.ar
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
    ).populate('country', 'code labels names flag');

    res.json({
      success: true,
      message: `City ${updatedCity.labels.en} updated successfully`,
      data: {
        _id: updatedCity._id,
        code: updatedCity.code,
        labels: updatedCity.labels,
        names: updatedCity.names,
        isCapital: updatedCity.isCapital,
        population: updatedCity.population,
        isActive: updatedCity.isActive,
        country: {
          _id: updatedCity.country._id,
          code: updatedCity.country.code,
          labels: updatedCity.country.labels,
          names: updatedCity.country.names,
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
        { "labels.fr": { $regex: new RegExp(cityName, 'i') } },
        { "names.en": { $regex: new RegExp(cityName, 'i') } },
        { "names.ar": { $regex: new RegExp(cityName, 'i') } },
        { "names.fr": { $regex: new RegExp(cityName, 'i') } }
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
    const cityCode = TranslationService.generateCityCode(cityName, country.code);

    // Create the new city
    const newCity = new City({
      code: cityCode,
      country: countryId,
      labels: {
        en: translations.en,
        fr: translations.fr,
        ar: translations.ar
      },
      names: {
        en: translations.en,
        fr: translations.fr,
        ar: translations.ar
      },
      isCapital: false,
      isDynamic: true,
      isActive: true,
      searchTerms: [cityName, translations.en, translations.fr, translations.ar]
    });

    await newCity.save();

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
        { "names.en": { $regex: new RegExp(query, 'i') } },
        { "names.ar": { $regex: new RegExp(query, 'i') } },
        { "names.fr": { $regex: new RegExp(query, 'i') } },
        { searchTerms: { $regex: new RegExp(query, 'i') } }
      ]
    };

    const cities = await City.find(searchQuery)
      .select('code labels names isCapital isDynamic')
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

module.exports = {
  getCities,
  searchCities,
  getCitiesByCountry,
  createCity,
  updateCity,
  deleteCity,
  createDynamicCity,
  searchCitiesByName
};
