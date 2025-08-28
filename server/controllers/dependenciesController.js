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
    console.log("Dashboard request received:", req.query);
    
    let match = {};
    const currentDate = new Date();

    const currentCountry = req.query.currentCountry;
    
    if (!currentCountry) {
      console.log("Missing currentCountry parameter");
      return res.status(400).json({ message: "currentCountry parameter is required" });
    }

    console.log("Processing dashboard for country:", currentCountry);

    // Lookup FoundLost IDs by code - Auto-create if missing
    let foundOption = await FoundLost.findOne({ code: "FOUND" });
    let lostOption = await FoundLost.findOne({ code: "LOST" });
    
    // Auto-create FoundLost options if they don't exist
    if (!foundOption || !lostOption) {
      console.log("FoundLost options missing, creating them...");
      
      const defaultOptions = [
        {
          code: "FOUND",
          label: "Found",
          labels: {
            en: "Found",
            fr: "Trouvé",
            ar: "تم العثور عليه"
          },
          color: "#4CAF50",
          icon: "🔍",
          isActive: true,
          description: "Items that have been found and are being returned to their owners"
        },
        {
          code: "LOST",
          label: "Lost",
          labels: {
            en: "Lost",
            fr: "Perdu",
            ar: "مفقود"
          },
          color: "#F44336",
          icon: "❓",
          isActive: true,
          description: "Items that have been lost and are being searched for"
        }
      ];
      
      // Clear existing options and create new ones
      await FoundLost.deleteMany({});
      const createdOptions = await FoundLost.insertMany(defaultOptions);
      
      foundOption = createdOptions.find(opt => opt.code === "FOUND");
      lostOption = createdOptions.find(opt => opt.code === "LOST");
      
      console.log("Created FoundLost options:", { found: foundOption._id, lost: lostOption._id });
    }
    
    console.log("Using FoundLost options:", { found: foundOption.code, lost: lostOption.code });

    // Add error handling for aggregation
    let trendingPost = [];
    try {
      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Handle undefined category and city fields and convert to ObjectIds
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },
      // Convert string IDs to ObjectIds for lookups (with error handling)
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { 
                    $and: [
                      { $ne: ["$city", null] }, 
                      { $ne: ["$city", ""] },
                      { $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } }
                    ] 
                  },
              then: { $toObjectId: "$city" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryObjectId",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLostObjectId",
          foreignField: "_id",
          as: "Floptions",
        },
      },
      { $unwind: { path: "$Floptions", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "countries",
          localField: "countryObjectId",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: { path: "$Country", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          exactLocation: 1,
          city: 1,
          cityName: "$City.labels.en",
          cityLabels: "$City.labels",
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          categoryName: { $ifNull: ["$Category.code", "ELECTRONICS"] },
          floptionName: { $ifNull: ["$Floptions.code", "FOUND"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "MOROCCO"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
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
    } catch (error) {
      console.error("Error in trendingPost aggregation:", error);
      trendingPost = [];
    }

    //get recent founds:
    let recentFounds = [];
    try {
      recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      // Handle undefined category and city fields and convert to ObjectIds
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },
      // Convert string IDs to ObjectIds for lookups (with error handling)
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { 
                    $and: [
                      { $ne: ["$city", null] }, 
                      { $ne: ["$city", ""] },
                      { $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } }
                    ] 
                  },
              then: { $toObjectId: "$city" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryObjectId",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "countries",
          localField: "countryObjectId",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: { path: "$Country", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          user: 1,
          country: 1,
          exactLocation: 1,
          city: 1,
          cityName: "$City.labels.en",
          cityLabels: "$City.labels",
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "ELECTRONICS"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "MOROCCO"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
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
    } catch (error) {
      console.error("Error in recentFounds aggregation:", error);
      recentFounds = [];
    }

    //get recent losts
    let recentLosts = [];
    try {
      recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      // Handle undefined category and city fields and convert to ObjectIds
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },
      // Convert string IDs to ObjectIds for lookups (with error handling)
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { 
                    $and: [
                      { $ne: ["$city", null] }, 
                      { $ne: ["$city", ""] },
                      { $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } }
                    ] 
                  },
              then: { $toObjectId: "$city" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryObjectId",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "countries",
          localField: "countryObjectId",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: { path: "$Country", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          user: 1,
          country: 1,
          exactLocation: 1,
          city: 1,
          cityName: "$City.labels.en",
          cityLabels: "$City.labels",
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "ELECTRONICS"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "MOROCCO"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
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
    } catch (error) {
      console.error("Error in recentLosts aggregation:", error);
      recentLosts = [];
    }

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
          code: postcountry?.code || "Unknown",
          categoryname: postCategory?.code || "Unknown",
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
      // Handle both true and null values for isActive
      query.$or = [
        { isActive: true },
        { isActive: null }
      ];
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
      // Handle both true and null values for isActive
      query.$or = [
        { isActive: true },
        { isActive: null }
      ];
    }
    
    // Add search functionality
    if (search) {
      const searchQuery = {
        $or: [
          { code: { $regex: search, $options: 'i' } },
          { 'labels.en': { $regex: search, $options: 'i' } },
          { 'labels.fr': { $regex: search, $options: 'i' } },
          { 'labels.ar': { $regex: search, $options: 'i' } },
          { searchTerms: { $regex: search, $options: 'i' } }
        ]
      };
      
      // Combine with existing query
      if (query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
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
      // Handle both true and null values for isActive
      query.$or = [
        { isActive: true },
        { isActive: null }
      ];
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
    
    if (!countryId) {
      return res.status(400).json({ 
        success: false,
        message: "Country ID is required" 
      });
    }

    const Country = require('../models/Country');
    const City = require('../models/City');
    const mongoose = require('mongoose');
    
    // Try multiple approaches to find cities
    let cities = [];
    let countriesWithCities = null;
    
    // Approach 1: Try with ObjectId
    if (mongoose.Types.ObjectId.isValid(countryId)) {
      const countryObjectId = new mongoose.Types.ObjectId(countryId);
      cities = await City.find({ 
        country: countryObjectId,
        isActive: true
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    }
    
    // Approach 2: If no cities found, try with string
    if (cities.length === 0) {
      cities = await City.find({ 
        country: countryId,
        isActive: true
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    }
    
    // Approach 3: If still no cities, try without isActive filter
    if (cities.length === 0) {
      cities = await City.find({ 
        country: countryId
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    }
    
    // Approach 4: Try with ObjectId without isActive filter
    if (cities.length === 0 && mongoose.Types.ObjectId.isValid(countryId)) {
      const countryObjectId = new mongoose.Types.ObjectId(countryId);
      cities = await City.find({ 
        country: countryObjectId
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    }

    // Approach 5: If still no cities, let's check all cities and their countries
    if (cities.length === 0) {
      const allCities = await City.find().select('_id code country labels names isCapital isActive').lean();
      
      countriesWithCities = new Map();
      for (const city of allCities) {
        const cityCountryId = city.country;
        if (!countriesWithCities.has(cityCountryId)) {
          countriesWithCities.set(cityCountryId, []);
        }
        countriesWithCities.get(cityCountryId).push(city);
      }
    }
    
    // If we still don't have cities but found them in the fallback check, use those
    if (cities.length === 0 && countriesWithCities && countriesWithCities.has(countryId)) {
      const fallbackCities = countriesWithCities.get(countryId);
      cities = fallbackCities.map(city => ({
        _id: city._id,
        code: city.code,
        labels: city.labels || {},
        names: city.names || {},
        isCapital: city.isCapital,
        isActive: city.isActive
      }));
    }

    if (!cities.length) {
      return res.status(200).json({ 
        success: false,
        message: "No cities found for this country",
        data: []
      });
    }

    // Transform response to include language-specific labels
    const transformedCities = cities.map(city => {
      // Get the current language or default to 'en'
      const currentLang = language || 'en';
      
      // Try multiple approaches to get the label in the correct language
      let label = null;
      
      // First try labels with current language
      if (city.labels && city.labels[currentLang]) {
        label = city.labels[currentLang];
      }
      // Then try names with current language
      else if (city.names && city.names[currentLang]) {
        label = city.names[currentLang];
      }
      // Fallback to English labels
      else if (city.labels && city.labels.en) {
        label = city.labels.en;
      }
      // Fallback to English names
      else if (city.names && city.names.en) {
        label = city.names.en;
      }
      // Final fallback to code
      else {
        label = city.code;
      }
      
      return {
        id: city._id,
        code: city.code,
        label: label,
        labels: city.labels || {},
        names: city.names || {},
        isCapital: city.isCapital
      };
    });

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
