const Country = require("../models/Country");

const getCountries = async (req, res) => {
  try {
    const { language = 'en', search, active = true } = req.query;
    
    let query = {};
    
    // Filter by active status
    if (active === 'true') {
      query.isActive = true;
    }
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    const countries = await Country.find(query)
      .select('code labels names flag isActive')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    if (!countries.length) {
      return res.status(404).json({ 
        message: "No countries found",
        data: []
      });
    }

    // Transform response to include language-specific labels and names
    const transformedCountries = countries.map(country => ({
      _id: country._id,
      code: country.code,
      label: country.names?.[language] || country.names?.en || country.labels[language] || country.labels.en,
      labels: country.labels,
      names: country.names || {},
      flag: country.flag,
      isActive: country.isActive
    }));

    res.json({
      success: true,
      data: transformedCountries,
      total: transformedCountries.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch countries",
      error: error.message 
    });
  }
};

const searchCountries = async (req, res) => {
  try {
    const { q, language = 'en', limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 2 characters long" 
      });
    }

    const countries = await Country.find({
      $text: { $search: q },
      isActive: true
    })
    .select('code labels names flag')
    .limit(parseInt(limit))
    .lean()
    .exec();

    const transformedCountries = countries.map(country => ({
      _id: country._id,
      code: country.code,
      label: country.names?.[language] || country.names?.en || country.labels[language] || country.labels.en,
      labels: country.labels,
      names: country.names || {},
      flag: country.flag
    }));

    res.json({
      success: true,
      data: transformedCountries,
      total: transformedCountries.length
    });
  } catch (error) {
    console.error('Error searching countries:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to search countries",
      error: error.message 
    });
  }
};

const createCountry = async (req, res) => {
  try {
    const { code, labels, flag } = req.body;
    
    // Validate required fields
    if (!code || !labels || !labels.en || !labels.fr || !labels.ar) {
      return res.status(400).json({ 
        success: false,
        message: "Country code and labels in all languages (en, fr, ar) are required" 
      });
    }

    // Check if country already exists
    const existingCountry = await Country.findOne({ code: code.toUpperCase() });
    if (existingCountry) {
      return res.status(409).json({ 
        success: false,
        message: `Country with code ${code} already exists` 
      });
    }

    const newCountry = {
      code: code.toUpperCase(),
      labels: {
        en: labels.en.trim(),
        fr: labels.fr.trim(),
        ar: labels.ar.trim()
      },
      flag: flag || null
    };

    const addedCountry = await Country.create(newCountry);
    
    res.status(201).json({
      success: true,
      message: `Country ${addedCountry.labels.en} (${addedCountry.code}) added successfully`,
      data: {
        _id: addedCountry._id,
        code: addedCountry.code,
        labels: addedCountry.labels,
        flag: addedCountry.flag
      }
    });
  } catch (error) {
    console.error('Error creating country:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create country",
      error: error.message 
    });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { labels, flag, isActive } = req.body;

    const country = await Country.findById(id);
    if (!country) {
      return res.status(404).json({ 
        success: false,
        message: "Country not found" 
      });
    }

    // Update fields
    if (labels) {
      country.labels = { ...country.labels, ...labels };
    }
    if (flag !== undefined) {
      country.flag = flag;
    }
    if (isActive !== undefined) {
      country.isActive = isActive;
    }

    await country.save();

    res.json({
      success: true,
      message: `Country ${country.labels.en} updated successfully`,
      data: {
        _id: country._id,
        code: country.code,
        labels: country.labels,
        flag: country.flag,
        isActive: country.isActive
      }
    });
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update country",
      error: error.message 
    });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findById(id);
    if (!country) {
      return res.status(404).json({ 
        success: false,
        message: "Country not found" 
      });
    }

    // Soft delete by setting isActive to false
    country.isActive = false;
    await country.save();

    res.json({
      success: true,
      message: `Country ${country.labels.en} deactivated successfully`
    });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete country",
      error: error.message 
    });
  }
};

module.exports = { 
  getCountries, 
  searchCountries,
  createCountry, 
  updateCountry,
  deleteCountry 
};
