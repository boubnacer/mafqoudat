const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const mongoose = require("mongoose");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");
const Category = require("../models/Category");
const City = require("../models/City");

// Get Dashboard
const getDashboard = async (req, res) => {
  try {
    let match = {};
    const currentDate = new Date();

    const currentCountry = req.query.currentCountry;
    
    if (!currentCountry) {
      return res.status(400).json({ message: "currentCountry parameter is required" });
    }

    // Lookup FoundLost IDs by code - Fix inconsistent code references
    const foundOption = await FoundLost.findOne({ code: "FOUND" });
    const lostOption = await FoundLost.findOne({ code: "LOST" });
    
    if (!foundOption) {
      console.error("FOUND option not found in database");
      return res.status(500).json({ message: "FOUND option not set in DB" });
    }
    
    if (!lostOption) {
      console.error("LOST option not found in database");
      return res.status(500).json({ message: "LOST option not set in DB" });
    }
    
    console.log("Found options:", { found: foundOption.code, lost: lostOption.code });

    const trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
        },
      },
      { $unwind: "$Floptions" },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: "$Country" },
      {
        $project: {
          region: 1,
          exactLocation: 1,
          city: 1,
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          categoryName: { $ifNull: ["$Category.code", "Unknown"] },
          floptionName: { $ifNull: ["$Floptions.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: "$Country.labels",
          countryname: "$Country.code",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    //get recent founds:
    const recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: "$Country" },
      {
        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: "$Country.labels",
          countryname: "$Country.code",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 4,
      },
    ]);

    //get recent losts
    const recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: "$Country" },
      {
        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: "$Country.labels",
          countryname: "$Country.code",
        },
      },
      {
        $limit: 4,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    // total Founds
    const totalFounds = await Post.find({
      country: currentCountry,
      foundLost: foundOption._id,
    }).countDocuments();

    // total Losts
    const totalLosts = await Post.find({
      country: currentCountry,
      foundLost: lostOption._id,
    }).countDocuments();

    // total posts
    const totalPosts = await Post.find({
      country: currentCountry,
    }).countDocuments();

    // get geography
    const posts = await Post.find();

    const postsWithCountryname = await Promise.all(
      posts.map(async (post) => {
        const postcountry = await Country.findById(post.country);
        const postCategory = await Category.findById(post.category);
        return {
          ...post._doc,
          code: postcountry.code,
          categoryname: postCategory.code,
        };
      })
    );

    const mappedLocations = postsWithCountryname.reduce((acc, { code }) => {
      const countryISO3 = getCountryIso3(code);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    // today's total founds
    const todaysFoundPosts = await Post.find({
      country: currentCountry,
      createdAt: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ),
        $lt: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        ),
      },
      foundLost: foundOption._id,
    }).countDocuments();

    // today's total losts
    const todaysLostPosts = await Post.find({
      country: currentCountry,
      createdAt: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ),
        $lt: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        ),
      },
      foundLost: lostOption._id,
    }).countDocuments();

    const createdToday = { todaysFoundPosts, todaysLostPosts };

    res.status(200).json({
      trendingPost,
      recentFounds,
      recentLosts,
      totalFounds,
      totalLosts,
      totalPosts,
      formattedLocations,
      createdToday,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// found or lost options
const getflOptions = async (req, res) => {
  try {
    const { language = 'en', active = true } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    
    const flOptions = await FoundLost.find(query)
      .select('code labels color icon isActive description')
      .sort({ code: 1 })
      .lean()
      .exec();

    if (!flOptions.length) {
      return res.status(404).json({ 
        success: false,
        message: "No post types found",
        data: []
      });
    }

    // Transform response to include language-specific labels
    const transformedOptions = flOptions.map(option => ({
      _id: option._id,
      code: option.code,
      label: option.labels[language] || option.labels.en,
      labels: option.labels,
      color: option.color,
      icon: option.icon,
      isActive: option.isActive,
      description: option.description
    }));

    res.status(200).json({
      success: true,
      data: transformedOptions,
      total: transformedOptions.length
    });
  } catch (error) {
    console.error('Error fetching post types:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch post types",
      error: error.message 
    });
  }
};

const getCountries = async (req, res) => {
  try {
    const { language = 'en', search, active = true } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { 'labels.en': { $regex: search, $options: 'i' } },
        { 'labels.fr': { $regex: search, $options: 'i' } },
        { 'labels.ar': { $regex: search, $options: 'i' } },
        { searchTerms: { $regex: search, $options: 'i' } }
      ];
    }
    
    const countries = await Country.find(query)
      .select('code labels flag isActive searchTerms')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    if (!countries.length) {
      return res.status(404).json({ 
        success: false,
        message: "No countries found",
        data: []
      });
    }

    // Transform response to include language-specific labels
    const transformedCountries = countries.map(country => {
      // Check if country has the new labels structure
      if (country.labels && country.labels.en) {
        // New format with multilingual support
        return {
          _id: country._id,
          code: country.code,
          label: country.labels[language] || country.labels.en,
          labels: country.labels,
          flag: country.flag,
          isActive: country.isActive,
          searchTerms: country.searchTerms
        };
      } else {
        // Old format - use code as label and create basic labels structure
        return {
          _id: country._id,
          code: country.code,
          label: country.code, // Use code as label for backward compatibility
          labels: {
            en: country.code,
            fr: country.code,
            ar: country.code
          },
          flag: country.flag || null,
          isActive: country.isActive !== undefined ? country.isActive : true,
          searchTerms: country.searchTerms || []
        };
      }
    });

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

const getCategories = async (req, res) => {
  try {
    const { language = 'en', active = true } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    
    const categories = await Category.find(query)
      .select('code labels flag icon color isActive description')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    if (!categories.length) {
      return res.status(404).json({ 
        success: false,
        message: "No categories found",
        data: []
      });
    }

    // Transform response to include language-specific labels
    // Handle both old format (code only) and new format (with labels)
    const transformedCategories = categories.map(category => {
      // Check if category has the new labels structure
      if (category.labels && category.labels.en) {
        // New format with multilingual support
        return {
          _id: category._id,
          code: category.code,
          label: category.labels[language] || category.labels.en,
          labels: category.labels,
          flag: category.flag,
          icon: category.icon,
          color: category.color,
          isActive: category.isActive,
          description: category.description
        };
      } else {
        // Old format - use code as label and create basic labels structure
        return {
          _id: category._id,
          code: category.code,
          label: category.code, // Use code as label for backward compatibility
          labels: {
            en: category.code,
            fr: category.code,
            ar: category.code
          },
          flag: category.flag,
          icon: category.icon || null,
          color: category.color || '#2196F3',
          isActive: category.isActive !== undefined ? category.isActive : true,
          description: category.description || null
        };
      }
    });

    res.json({
      success: true,
      data: transformedCategories,
      total: transformedCategories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch categories",
      error: error.message 
    });
  }
};

// Create category dynamically
const createCategory = async (req, res) => {
  try {
    const { code, labels, flag, icon, color, description } = req.body;
    
    // Validate required fields
    if (!code || !labels || !labels.en || !labels.fr || !labels.ar) {
      return res.status(400).json({ 
        success: false,
        message: "Category code and labels in all languages (en, fr, ar) are required" 
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ code: code.toUpperCase() });
    if (existingCategory) {
      return res.status(409).json({ 
        success: false,
        message: `Category with code ${code} already exists` 
      });
    }

    const newCategory = {
      code: code.toUpperCase(),
      labels: {
        en: labels.en.trim(),
        fr: labels.fr.trim(),
        ar: labels.ar.trim()
      },
      flag: flag || null,
      icon: icon || null,
      color: color || '#2196F3',
      description: description || null
    };

    const addedCategory = await Category.create(newCategory);
    
    res.status(201).json({
      success: true,
      message: `Category ${addedCategory.labels.en} (${addedCategory.code}) added successfully`,
      data: {
        _id: addedCategory._id,
        code: addedCategory.code,
        labels: addedCategory.labels,
        flag: addedCategory.flag,
        icon: addedCategory.icon,
        color: addedCategory.color,
        description: addedCategory.description
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create category",
      error: error.message 
    });
  }
};

// Create foundLost dynamically
const createFoundLost = async (req, res) => {
  try {
    const { code, labels, color, icon, description } = req.body;
    
    // Validate required fields
    if (!code || !labels || !labels.en || !labels.fr || !labels.ar) {
      return res.status(400).json({ 
        success: false,
        message: "Post type code and labels in all languages (en, fr, ar) are required" 
      });
    }

    // Validate code enum
    const validCodes = ['FOUND', 'LOST'];
    if (!validCodes.includes(code.toUpperCase())) {
      return res.status(400).json({ 
        success: false,
        message: "Post type code must be either 'FOUND' or 'LOST'" 
      });
    }

    // Check if post type already exists
    const existingPostType = await FoundLost.findOne({ code: code.toUpperCase() });
    if (existingPostType) {
      return res.status(409).json({ 
        success: false,
        message: `Post type with code ${code} already exists` 
      });
    }

    const newPostType = {
      code: code.toUpperCase(),
      labels: {
        en: labels.en.trim(),
        fr: labels.fr.trim(),
        ar: labels.ar.trim()
      },
      color: color || (code.toUpperCase() === 'FOUND' ? '#4CAF50' : '#F44336'),
      icon: icon || null,
      description: description || null
    };

    const addedPostType = await FoundLost.create(newPostType);
    
    res.status(201).json({
      success: true,
      message: `Post type ${addedPostType.labels.en} (${addedPostType.code}) added successfully`,
      data: {
        _id: addedPostType._id,
        code: addedPostType.code,
        labels: addedPostType.labels,
        color: addedPostType.color,
        icon: addedPostType.icon,
        description: addedPostType.description
      }
    });
  } catch (error) {
    console.error('Error creating post type:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create post type",
      error: error.message 
    });
  }
};

const postsPerDay = async () => {
  const currentDate = new Date();

  // Lookup FoundLost IDs by code - Fix inconsistent code references
  const foundOption = await FoundLost.findOne({ code: "FOUND" });
  const lostOption = await FoundLost.findOne({ code: "LOST" });
  if (!foundOption || !lostOption) {
    console.error("Found/Lost options not set in DB");
    return;
  }

  // today's founds
  const todaysFoundPosts = await Post.find({
    createdAt: {
      $gte: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ),
      $lt: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      ),
    },
    foundLost: foundOption._id,
  }).countDocuments();

  // today's losts
  const todaysLostPosts = await Post.find({
    createdAt: {
      $gte: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ),
      $lt: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      ),
    },
    foundLost: lostOption._id,
  }).countDocuments();

  const createdToday = { todaysFoundPosts, todaysLostPosts };

  console.log("Posts inserted today:", createdToday);
};

// Get cities by country
const getCitiesByCountry = async (req, res) => {
  try {
    const { countryId, language = 'en' } = req.query;
    console.log('🔍 getCitiesByCountry called with:', { countryId, language });
    console.log('🔍 Request query:', req.query);
    
    if (!countryId) {
      return res.status(400).json({ 
        success: false,
        message: "Country ID is required" 
      });
    }

    console.log('🔍 Searching for cities with countryId:', countryId);
    const cities = await City.find({ 
      country: countryId, 
      isActive: true 
    })
    .select('_id code labels names isCapital')
    .sort({ 'labels.en': 1 })
    .lean()
    .exec();

    console.log('🔍 Found cities:', cities.length);
    if (!cities.length) {
      console.log('❌ No cities found for countryId:', countryId);
      return res.status(200).json({ 
        success: false,
        message: "No cities found for this country",
        data: []
      });
    }

    // Transform response to include language-specific labels
    const transformedCities = cities.map(city => ({
      id: city._id,
      code: city.code,
      label: city.labels[language] || city.labels.en,
      labels: city.labels,
      names: city.names || {},
      isCapital: city.isCapital
    }));

    console.log('✅ Sending response with', transformedCities.length, 'cities');
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

module.exports = {
  getDashboard,
  getflOptions,
  getCategories,
  getCountries,
  getCitiesByCountry,
  createCategory,
  createFoundLost,
};
