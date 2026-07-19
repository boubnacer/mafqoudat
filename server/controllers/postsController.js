const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const Category = require("../models/Category");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");
const Report = require("../models/Report");
const { deleteFromCloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");
const TranslationService = require("../services/translationService");
const { cacheService } = require("../config/cache");
const { escapeRegex } = require("../utils/regexUtils");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");
const { getCountryId } = require("../utils/countryCache");

// @desc Get all posts
// @route GET /posts
// @access Private
const getAllPosts = async (req, res) => {
  try {
    // Validate and parse pagination parameters
    const currentCountry = req.query.currentCountry;
    const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 8, 1), 50); // Min 1, Max 50
    const fl = req.query.fl;
    const categoryId = req.query.categoryId; // Single category (backward compatibility)
    const categoryIds = req.query.categoryIds; // Multiple categories (comma-separated or array)
    const cityId = req.query.cityId;
    const search = req.query.search;
    
    // Validate required parameters
    if (!currentCountry) {
      return res.status(400).json({ 
        message: "currentCountry parameter is required",
        error: "Missing required parameter"
      });
    }

  // Validate that currentCountry is a valid ObjectId or country code
  if (currentCountry && !mongoose.Types.ObjectId.isValid(currentCountry)) {
    // Check if it's a valid country code using cached lookup
    const countryId = await getCountryId(currentCountry);
    if (!countryId) {
      return res.status(400).json({ 
        message: "Invalid currentCountry format",
        error: "currentCountry must be a valid MongoDB ObjectId or country code"
      });
    }
  }
  
  // Generate cache key
  const cacheKey = cacheService.generateKey('posts', {
    currentCountry,
    page,
    pageSize,
    fl,
    categoryId,
    categoryIds,
    cityId,
    search
  });
  
  // Check cache first
  const cachedPosts = await cacheService.get(cacheKey);
  if (cachedPosts) {
    return res.json(cachedPosts);
  }

  let totalPosts;
  let match = {};


  
  // Only filter if fl is provided and not empty
  if (req.query.fl && req.query.fl !== '') {
    match.foundLost = new mongoose.Types.ObjectId(req.query.fl);
  }

  // Handle category filtering - support both single categoryId (backward compatibility) and multiple categoryIds
  if (categoryIds) {
    // Multiple categories: parse comma-separated string or array
    let categoryIdArray = [];
    if (typeof categoryIds === 'string') {
      categoryIdArray = categoryIds.split(',').map(id => id.trim()).filter(id => id);
    } else if (Array.isArray(categoryIds)) {
      categoryIdArray = categoryIds;
    }
    
    if (categoryIdArray.length > 0) {
      // Filter posts that have ANY of the specified categories
      match.categories = { 
        $in: categoryIdArray.map(id => new mongoose.Types.ObjectId(id)) 
      };
    }
  } else if (categoryId) {
    // Single category (backward compatibility) - check both categories array and legacy category field
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
    match.$or = [
      { categories: categoryObjectId },
      { category: categoryObjectId }
    ];
    // If there's already an $or condition from search, combine them
    if (match.$or && search) {
      const existingOr = match.$or;
      match.$or = [
        ...existingOr,
        { exactLocation: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
  }

  if (req.query.cityId && mongoose.Types.ObjectId.isValid(cityId)) {
    match.city = new mongoose.Types.ObjectId(cityId);
  }

  // Handle search - combine with category $or if it exists
  if (search) {
    const searchConditions = [
      { exactLocation: { $regex: search, $options: 'i' } },
      { contact: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    
    if (match.$or) {
      // Combine with existing $or conditions
      match.$and = [
        { $or: match.$or },
        { $or: searchConditions }
      ];
      delete match.$or;
    } else {
      match.$or = searchConditions;
    }
  }

  // First, get the country ID from the country code (using cached lookup)
  let countryId = currentCountry;
  if (currentCountry && !mongoose.Types.ObjectId.isValid(currentCountry)) {
    // If currentCountry is not a valid ObjectId, treat it as a country code
    const cachedCountryId = await getCountryId(currentCountry);
    if (cachedCountryId) {
      countryId = cachedCountryId;
    } else {
      return res.status(400).json({ 
        message: "Invalid country code",
        error: `Country with code '${currentCountry}' not found`
      });
    }
  }

  // Build a simple aggregation pipeline
  const pipeline = [
    {
      $match: {
        ...match,
        country: new mongoose.Types.ObjectId(countryId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: page * pageSize,
    },
    {
      $limit: pageSize,
    },
    // Lookup categories array (new format)
    {
      $lookup: {
        from: "categories",
        localField: "categories",
        foreignField: "_id",
        as: "Categories",
      },
    },
    // Lookup single category (legacy format for backward compatibility)
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "Category",
      },
    },
    { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "foundlosts",
        localField: "foundLost",
        foreignField: "_id",
        as: "Floptions",
      },
    },
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
      $lookup: {
        from: "cities",
        localField: "city",
        foreignField: "_id",
        as: "City",
      },
    },
    { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
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
      $project: {
        _id: 1,
        user: 1,
        country: 1,
        exactLocation: 1,
        mainDate: 1,
        city: {
          $cond: {
            if: { $ne: ["$City", null] },
            then: {
              id: "$City._id",
              code: "$City.code",
              labels: "$City.labels",
              isDynamic: "$City.isDynamic"
            },
            else: null
          }
        },
        cityName: { 
          $cond: {
            if: { $ne: ["$City", null] },
            then: { $ifNull: ["$City.labels.en", "$City.code"] },
            else: null
          }
        },
        cityLabels: { $ifNull: ["$City.labels", null] },
        returned: 1,
        createdAt: 1,
        updatedAt: 1,
        username: "$User.username",
        // Categories array (new format)
        Categories: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
            then: {
              $map: {
                input: "$Categories",
                as: "cat",
                in: {
                  _id: "$$cat._id",
                  code: "$$cat.code",
                  labels: "$$cat.labels"
                }
              }
            },
            else: {
              // Fallback to legacy category if Categories array is empty
              $cond: {
                if: { $ne: ["$Category", null] },
                then: [{
                  _id: "$Category._id",
                  code: "$Category.code",
                  labels: "$Category.labels"
                }],
                else: []
              }
            }
          }
        },
        // Legacy single category (backward compatibility)
        categoryname: { 
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
            then: { $arrayElemAt: ["$Categories.code", 0] },
            else: {
              $cond: {
                if: { $ne: ["$Category", null] },
                then: "$Category.code",
                else: "OTHER"
              }
            }
          }
        },
        Category: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
            then: {
              _id: { $arrayElemAt: ["$Categories._id", 0] },
              code: { $arrayElemAt: ["$Categories.code", 0] },
              labels: { $arrayElemAt: ["$Categories.labels", 0] }
            },
            else: {
              $cond: {
                if: { $ne: ["$Category", null] },
                then: {
                  _id: "$Category._id",
                  code: "$Category.code",
                  labels: "$Category.labels"
                },
                else: null
              }
            }
          }
        },
        categoryLabels: { 
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
            then: { $arrayElemAt: ["$Categories.labels", 0] },
            else: { $ifNull: ["$Category.labels", null] }
          }
        },
        countryname: "$Country.code",
        countryLabels: "$Country.names",
        contact: 1,
        image: 1,
        foundLost: 1,
        description: 1,
        contactPreferences: 1,
        Floptions: 1,
      },
    },
  ];

  const postsWithUser = await Post.aggregate(pipeline);
  

  // Get total count for pagination - optimized single query
  totalPosts = await Post.countDocuments({
    ...match,
    country: new mongoose.Types.ObjectId(countryId),
  });

  // If no posts
  if (!postsWithUser?.length) {
    return res.status(200).json({ 
      postsWithUser: [],
      page: page + 1,
      totalPages: 0,
      total: 0
    });
  }

  const response = {
    postsWithUser,
    page: page + 1,
    totalPages: Math.ceil(totalPosts / pageSize),
    total: totalPosts,
  };
  
  // Cache the response for 5 minutes (dynamic data)
  await cacheService.set(cacheKey, response, 300);
  
  res.json(response);
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({ 
      message: "Error fetching posts",
      error: error.message 
    });
  }
};

// get Post
const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      // Lookup categories array (new format)
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "Categories",
        },
      },
      // Lookup single category (legacy format for backward compatibility)
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
        },
      },
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
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
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
        $project: {
          user: 1,
          country: 1,
          exactLocation: 1,
          city: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: {
                id: "$City._id",
                code: "$City.code",
                labels: "$City.labels",
                isDynamic: "$City.isDynamic"
              },
              else: "$city"  // Return the original city value if lookup fails
            }
          },
          cityName: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: { $ifNull: ["$City.labels.en", "$City.code"] },
              else: "$city"  // For API cities, use the original city value
            }
          },
          cityLabels: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: "$City.labels",
              else: {
                // For API cities, create basic labels from the city name
                en: "$city",
                fr: "$city", 
                ar: "$city"
              }
            }
          },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          // Categories array (new format)
          Categories: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: {
                $map: {
                  input: "$Categories",
                  as: "cat",
                  in: {
                    _id: "$$cat._id",
                    code: "$$cat.code",
                    labels: "$$cat.labels"
                  }
                }
              },
              else: {
                // Fallback to legacy category if Categories array is empty
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: [{
                    _id: "$Category._id",
                    code: "$Category.code",
                    labels: "$Category.labels"
                  }],
                  else: []
                }
              }
            }
          },
          // Legacy single category (backward compatibility)
          categoryname: { 
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: { $arrayElemAt: ["$Categories.code", 0] },
              else: {
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: "$Category.code",
                  else: "OTHER"
                }
              }
            }
          },
          Category: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: {
                _id: { $arrayElemAt: ["$Categories._id", 0] },
                code: { $arrayElemAt: ["$Categories.code", 0] },
                labels: { $arrayElemAt: ["$Categories.labels", 0] }
              },
              else: {
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: {
                    _id: "$Category._id",
                    code: "$Category.code",
                    labels: "$Category.labels"
                  },
                  else: null
                }
              }
            }
          },
          countryname: "$Country.code",
          countryLabels: "$Country.names",
          contact: 1,
          image: 1,
          foundLost: 1,
          Floptions: 1,
          description: 1,
          contactPreferences: 1,
          mainDate: 1,
          status: 1,
          views: 1,
        },
      },
    ]);

    if (!post || post.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: "Error fetching post" });
  }
};

// @desc Get filtered posts with pagination
// @route GET /posts/filtered
// @access Public
const getFilteredPosts = async (req, res) => {
  try {
    // Validate and parse pagination parameters
    const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 8, 1), 50); // Min 1, Max 50
    const fl = req.query.fl;
    const currentCountry = req.query.currentCountry;
    const categoryId = req.query.categoryId; // Single category (backward compatibility)
    const categoryIds = req.query.categoryIds; // Multiple categories (comma-separated or array)
    const cityId = req.query.cityId;
    const search = req.query.search;
    
    // Validate required parameters
    if (!currentCountry) {
      return res.status(400).json({ 
        message: "currentCountry parameter is required",
        error: "Missing required parameter"
      });
    }

    // Build match conditions
    let match = {};
    
    if (fl && fl !== '') {
      match.foundLost = new mongoose.Types.ObjectId(fl);
    }

    // Handle category filtering - support both single categoryId (backward compatibility) and multiple categoryIds
    if (categoryIds) {
      // Multiple categories: parse comma-separated string or array
      let categoryIdArray = [];
      if (typeof categoryIds === 'string') {
        categoryIdArray = categoryIds.split(',').map(id => id.trim()).filter(id => id);
      } else if (Array.isArray(categoryIds)) {
        categoryIdArray = categoryIds;
      }
      
      if (categoryIdArray.length > 0) {
        // Filter posts that have ANY of the specified categories
        match.categories = { 
          $in: categoryIdArray.map(id => new mongoose.Types.ObjectId(id)) 
        };
      }
    } else if (categoryId) {
      // Single category (backward compatibility) - check both categories array and legacy category field
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      match.$or = [
        { categories: categoryObjectId },
        { category: categoryObjectId }
      ];
    }

    if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
      match.city = new mongoose.Types.ObjectId(cityId);
    }

    // Handle search - combine with category $or if it exists
    if (search) {
      const searchConditions = [
        { exactLocation: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      
      if (match.$or) {
        // Combine with existing $or conditions
        match.$and = [
          { $or: match.$or },
          { $or: searchConditions }
        ];
        delete match.$or;
      } else {
        match.$or = searchConditions;
      }
    }

    // Handle country filtering (using cached lookup)
    let countryId = currentCountry;
    if (currentCountry && !mongoose.Types.ObjectId.isValid(currentCountry)) {
      const cachedCountryId = await getCountryId(currentCountry);
      if (cachedCountryId) {
        countryId = cachedCountryId;
      } else {
        return res.status(400).json({ 
          message: "Invalid country code",
          error: `Country with code '${currentCountry}' not found`
        });
      }
    }

    if (countryId) {
      match.country = new mongoose.Types.ObjectId(countryId);
    }

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(match);

    // Build aggregation pipeline for filtered posts
    const pipeline = [
      { $match: match },
      // Lookup categories array (new format)
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "Categories",
        },
      },
      // Lookup single category (legacy format for backward compatibility)
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
        },
      },
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
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
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
        $project: {
          user: 1,
          country: 1,
          exactLocation: 1,
          city: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: {
                id: "$City._id",
                code: "$City.code",
                labels: "$City.labels",
                isDynamic: "$City.isDynamic"
              },
              else: null
            }
          },
          cityName: { $ifNull: ["$City.labels.en", "$City.code"] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          cityDebug: {
            originalCityId: "$city",
            cityFound: { $ne: ["$City", null] },
            cityLabels: "$City.labels",
            cityData: "$City",
            cityId: "$City._id",
            cityCode: "$City.code",
            cityIsDynamic: "$City.isDynamic"
          },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          // Categories array (new format)
          Categories: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: {
                $map: {
                  input: "$Categories",
                  as: "cat",
                  in: {
                    _id: "$$cat._id",
                    code: "$$cat.code",
                    labels: "$$cat.labels"
                  }
                }
              },
              else: {
                // Fallback to legacy category if Categories array is empty
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: [{
                    _id: "$Category._id",
                    code: "$Category.code",
                    labels: "$Category.labels"
                  }],
                  else: []
                }
              }
            }
          },
          // Legacy single category (backward compatibility)
          categoryname: { 
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: { $arrayElemAt: ["$Categories.code", 0] },
              else: {
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: "$Category.code",
                  else: "OTHER"
                }
              }
            }
          },
          Category: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$Categories", []] } }, 0] },
              then: {
                _id: { $arrayElemAt: ["$Categories._id", 0] },
                code: { $arrayElemAt: ["$Categories.code", 0] },
                labels: { $arrayElemAt: ["$Categories.labels", 0] }
              },
              else: {
                $cond: {
                  if: { $ne: ["$Category", null] },
                  then: {
                    _id: "$Category._id",
                    code: "$Category.code",
                    labels: "$Category.labels"
                  },
                  else: null
                }
              }
            }
          },
          countryname: "$Country.code",
          countryLabels: "$Country.names",
          contact: 1,
          image: 1,
          foundLost: 1,
          description: 1,
          contactPreferences: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: page * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];

    const postsWithUser = await Post.aggregate(pipeline);
    
    // Debug: Log city information for posts

    // If no posts
    if (!postsWithUser?.length) {
      return res.status(200).json({ 
        postsWithUser: [],
        page: page + 1,
        totalPages: 0,
        total: 0
      });
    }

    const response = {
      postsWithUser,
      page: page + 1,
      totalPages: Math.ceil(totalPosts / pageSize),
      total: totalPosts,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFilteredPosts:', error);
    res.status(500).json({ message: "Error fetching filtered posts" });
  }
};

// @desc Get user's posts
// @route GET /posts/user
// @access Private
const getUserPosts = async (req, res) => {
  try {
    // Fix: req.user is the user ID string, not an object with .id property
    const userId = req.user;
    const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 8, 1), 50);
    const language = req.query.language || 'en';


    // Validate userId before proceeding
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ [getUserPosts] Invalid userId:', userId);
      return res.status(400).json({ 
        message: "Invalid user ID",
        error: "User ID is missing or invalid"
      });
    }

    // Generate cache key
    const cacheKey = cacheService.generateKey('user-posts', {
      userId,
      page,
      pageSize,
      language
    });
    
    // Check cache first
    const cachedPosts = await cacheService.get(cacheKey);
    if (cachedPosts) {
      return res.json(cachedPosts);
    }

    // Build aggregation pipeline for user posts
    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: page * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category"
        }
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions"
        }
      },
      { $unwind: { path: "$Floptions", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country"
        }
      },
      { $unwind: { path: "$Country", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City"
        }
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          user: 1,
          country: 1,
          exactLocation: 1,
          city: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: {
                id: "$City._id",
                code: "$City.code",
                labels: "$City.labels",
                isDynamic: "$City.isDynamic"
              },
              else: null
            }
          },
          category: {
            $cond: {
              if: { $ne: ["$Category", null] },
              then: {
                id: "$Category._id",
                code: "$Category.code",
                labels: "$Category.labels"
              },
              else: null
            }
          },
          foundLost: {
            $cond: {
              if: { $ne: ["$Floptions", null] },
              then: {
                id: "$Floptions._id",
                code: "$Floptions.code",
                labels: "$Floptions.labels"
              },
              else: null
            }
          },
          country: {
            $cond: {
              if: { $ne: ["$Country", null] },
              then: {
                id: "$Country._id",
                code: "$Country.code",
                labels: "$Country.labels"
              },
              else: null
            }
          },
          contact: 1,
          description: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
          returned: 1,
          status: 1,
          mainDate: 1,
          promotionRequested: 1,
          // Add computed fields for easier frontend usage
          title: {
            $cond: {
              if: { $ne: ["$Category", null] },
              then: {
                $cond: {
                  if: { $ne: ["$Floptions", null] },
                  then: {
                    $concat: [
                      { $ifNull: ["$Category.labels.en", "Unknown"] },
                      " ",
                      { $ifNull: ["$Floptions.labels.en", "Item"] }
                    ]
                  },
                  else: { $ifNull: ["$Category.labels.en", "Unknown Item"] }
                }
              },
              else: "Unknown Item"
            }
          },
          categoryname: { $ifNull: ["$Category.code", "UNKNOWN"] },
          floptionName: { $ifNull: ["$Floptions.code", "UNKNOWN"] },
          countryname: { $ifNull: ["$Country.code", "UNKNOWN"] },
          cityName: {
            $cond: {
              if: { $ne: ["$City", null] },
              then: { $ifNull: ["$City.code", "UNKNOWN"] },
              else: "UNKNOWN"
            }
          }
        }
      }
    ];

    let userPosts;
    try {
      userPosts = await Post.aggregate(pipeline);
    } catch (aggregationError) {
      console.error('❌ [getUserPosts] Aggregation Error:', {
        message: aggregationError.message,
        stack: aggregationError.stack,
        pipeline: pipeline
      });
      throw aggregationError;
    }
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments({
      user: new mongoose.Types.ObjectId(userId)
    });

    // If no posts
    if (!userPosts?.length) {
      const response = {
        postsWithUser: [],
        page: page + 1,
        totalPages: 0,
        total: 0
      };
      
      // Cache empty response for 1 minute
      await cacheService.set(cacheKey, response, 60);
      return res.status(200).json(response);
    }

    const response = {
      postsWithUser: userPosts,
      page: page + 1,
      totalPages: Math.ceil(totalPosts / pageSize),
      total: totalPosts
    };
    
    
    // Cache the response for 2 minutes (user-specific data)
    await cacheService.set(cacheKey, response, 120);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching user posts",
      error: error.message 
    });
  }
};

const DEFAULT_CONTACT_PREFERENCES = { phone: true, email: false, whatsapp: false };
const CONTACT_PREFERENCE_KEYS = ['phone', 'email', 'whatsapp'];

// contactPreferences may arrive already parsed (req.parsedPostData) or as a JSON
// string (legacy/manual postData field) - only JSON.parse strings, never objects.
const normalizeContactPreferences = (raw) => {
  if (!raw) return { ...DEFAULT_CONTACT_PREFERENCES };

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return { ...DEFAULT_CONTACT_PREFERENCES };
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_CONTACT_PREFERENCES };
  }

  // Strip anything that isn't one of the known boolean keys
  const normalized = {};
  for (const key of CONTACT_PREFERENCE_KEYS) {
    if (typeof parsed[key] === 'boolean') {
      normalized[key] = parsed[key];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : { ...DEFAULT_CONTACT_PREFERENCES };
};

// @desc Create new post
// @route POST /posts
// @access Private
const createNewPost = async (req, res) => {
  
  try {
    // Use parsed data from validation middleware if available, otherwise parse from req.body
    let postData, user, country, category, categories, contact, foundLost, city, cityData, exactLocation, exactDate, description, contactPreferences;
    
    if (req.parsedPostData) {
      // Use data parsed by validation middleware
      postData = req.parsedPostData;
      user = postData.user;
      country = postData.country;
      categories = postData.categories || (postData.category ? [postData.category] : []);
      category = postData.category || (categories && categories.length > 0 ? categories[0] : null); // Legacy support
      contact = postData.contact;
      foundLost = postData.foundLost;
      city = postData.city;
      cityData = postData.cityData;
      exactLocation = postData.exactLocation;
      exactDate = postData.exactDate;
      description = postData.description;
      contactPreferences = postData.contactPreferences;
    } else if (req.body.postData) {
      // Fallback: parse from postData JSON field
      postData = JSON.parse(req.body.postData);
      user = postData.user;
      country = postData.country;
      categories = postData.categories || (postData.category ? [postData.category] : []);
      category = postData.category || (categories && categories.length > 0 ? categories[0] : null); // Legacy support
      contact = postData.contact;
      foundLost = postData.foundLost;
      city = postData.city;
      cityData = postData.cityData;
      exactLocation = postData.exactLocation;
      exactDate = postData.exactDate;
      description = postData.description;
      contactPreferences = postData.contactPreferences;
    } else {
      // Legacy format: individual fields
      user = req.body.user;
      country = req.body.country;
      categories = req.body.categories || (req.body.category ? [req.body.category] : []);
      category = req.body.category || (categories && categories.length > 0 ? categories[0] : null); // Legacy support
      contact = req.body.contact;
      foundLost = req.body.foundLost;
      city = req.body.city;
      cityData = req.body.cityData;
      exactLocation = req.body.exactLocation;
      exactDate = req.body.exactDate;
      description = req.body.description;
      contactPreferences = req.body.contactPreferences;
    }
    
    

         // Confirm required data
     const requiredFields = {
       user: !!user,
       categories: !!(categories && categories.length > 0),
       contact: !!contact,
       country: !!country,
       foundLost: !!foundLost,
       exactLocation: !!exactLocation
       // exactDate is now optional - removed from required fields
     };
     
     const missingFields = Object.entries(requiredFields)
       .filter(([key, value]) => !value)
       .map(([key]) => key);
  
     if (missingFields.length > 0) {
     return res.status(400).json({ 
       message: "All required fields are required",
       missing: missingFields
     });
   }

   // Validate references with selective field projection
  
     try {
     const userExists = await User.findById(user).select('_id').lean();
     const countryExists = await Country.findById(country).select('_id').lean();
     
     // Validate all categories in the array
     const categoryValidationPromises = categories.map(catId => 
       Category.findById(catId).select('_id').lean()
     );
     const categoryExistsResults = await Promise.all(categoryValidationPromises);
     const allCategoriesExist = categoryExistsResults.every(cat => cat !== null);
     const invalidCategoryIndices = categoryExistsResults
       .map((cat, index) => cat === null ? index : -1)
       .filter(index => index !== -1);
     
     const foundLostExists = await FoundLost.findById(foundLost).select('_id').lean();
    
    // Check which references are invalid and report only which field(s) failed -
    // never dump collection contents to the client.
    const invalidFields = [];
    if (!userExists) invalidFields.push('user');
    if (!countryExists) invalidFields.push('country');
    if (!allCategoriesExist) invalidFields.push('categories');
    if (!foundLostExists) invalidFields.push('foundLost');

    if (invalidFields.length > 0) {
      const response = {
        message: `Invalid reference data provided: ${invalidFields.join(', ')}`,
        invalidFields
      };
      if (invalidCategoryIndices.length > 0) {
        response.invalidCategoryIndices = invalidCategoryIndices;
      }
      return res.status(400).json(response);
    }
  } catch (validationError) {
    console.error('Error during reference validation:', validationError);
    return res.status(400).json({
      message: "Invalid reference data provided",
      error: "Invalid reference data provided"
    });
  }
  
     // Handle city validation
   let cityId = null;
   // Tracks whether the user/API supplied a city and we failed to resolve it -
   // as opposed to the user simply not specifying a city at all. Only the
   // former should surface as a warning: losing a post is worse than losing
   // a city, so we still create the post, but the city-filtered browsing
   // gap needs to be visible somewhere instead of disappearing silently.
   let cityResolutionFailed = false;

   const logCityResolutionFailure = (stage, err) => {
     cityResolutionFailed = true;
     console.error('City resolution failed', {
       stage,
       city,
       cityDataProvided: !!cityData,
       country,
       user,
       error: err?.message || String(err)
     });
   };

   try {
     if (city && mongoose.Types.ObjectId.isValid(city)) {
       // City is a valid ObjectId, verify it exists
       const cityDoc = await City.findById(city).select('_id').lean();
       if (cityDoc) {
         cityId = city;
       } else {
         logCityResolutionFailure('objectId-not-found', `City with ID ${city} not found in database`);
         cityId = null;
       }
     } else if (cityData) {
       // Handle API city data from GeoNames
       try {

         // cityData might already be an object or a JSON string
         const apiCityData = typeof cityData === 'string' ? JSON.parse(cityData) : cityData;

         // Check if city already exists in database (country-scoped; label match
         // is escaped so metacharacters in the API-supplied name can't break or
         // hijack the regex)
         const existingCity = await City.findOne({
           country: country,
           $or: [
             { "labels.en": { $regex: escapeRegex(apiCityData.labels.en), $options: 'i' } },
             { "labels.ar": { $regex: escapeRegex(apiCityData.labels.ar), $options: 'i' } },
             { "labels.fr": { $regex: escapeRegex(apiCityData.labels.fr), $options: 'i' } }
           ]
         });

        if (existingCity) {
          cityId = existingCity._id;
        } else {
          // Create new city from API data (GeoNames or Google Places)
          const cityDataToSave = {
            code: apiCityData.code,
            country: country,
            labels: apiCityData.labels,
            isCapital: apiCityData.isCapital || false,
            isActive: true,
            isDynamic: true, // Mark as dynamically created from API
            searchTerms: apiCityData.searchTerms || []
          };

          // Add API source and place ID if from Google Places
          if (apiCityData.source === 'google') {
            cityDataToSave.apiSource = 'google';
            cityDataToSave.placeId = apiCityData.placeId;
            console.log(`🌐 Saved city from Google Places: ${apiCityData.labels.en}`);
          } else {
            cityDataToSave.apiSource = 'geonames';
            console.log(`🗺️ Saved city from GeoNames: ${apiCityData.labels.en}`);
          }

          const newCity = await City.create(cityDataToSave);
          cityId = newCity._id;
        }
       } catch (apiCityError) {
         logCityResolutionFailure('cityData-processing', apiCityError);
         cityId = null;
       }
     } else if (city && city !== 'other' && typeof city === 'string') {
       // Fallback: If we have a city name but no valid cityId, create a new city record
       // This is a fallback for cases where the frontend didn't create the city first
       try {
         // Use translation service to get proper translations for the custom city
         const translations = await TranslationService.translateCityName(city, 'en');

         // Create a unique code for the custom city
         const baseCode = city.toUpperCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
         const uniqueCode = `${baseCode}_${Date.now()}`;

         // Create a new city record for the custom city name with translations
         const newCity = await City.create({
           code: uniqueCode,
           country: country,
           labels: {
             en: translations.en || city,
             fr: translations.fr || city,
             ar: translations.ar || city
           },
           isDynamic: true, // Mark as dynamically created
           searchTerms: [city.toLowerCase()]
         });

           cityId = newCity._id; // Use the new city's ObjectId
       } catch (cityCreationError) {
         logCityResolutionFailure('fallback-city-creation', cityCreationError);
         cityId = null;
       }
     } else {
       cityId = null;
     }
   } catch (cityError) {
     logCityResolutionFailure('unexpected', cityError);
     cityId = null;
   }

     // Prepare post data
  const newPostData = {
    user,
    categories: categories, // New: array of categories
    category: categories && categories.length > 0 ? categories[0] : null, // Legacy: first category for backward compatibility
    country,
    contact,
    foundLost,
    exactLocation,
    mainDate: exactDate, // Store the exactDate from form as mainDate in the database
    description: description || "",
    contactPreferences: normalizeContactPreferences(contactPreferences),
  };

     // Handle city field - cityId is already processed above
   if (cityId) {
     newPostData.city = cityId;
   }


   // Add Cloudinary image data if available
   if (req.cloudinaryResult) {
     newPostData.cloudinaryUrl = req.cloudinaryResult.url;
     newPostData.cloudinaryPublicId = req.cloudinaryResult.public_id;
     // Keep backward compatibility with image field
     newPostData.image = req.cloudinaryResult.url;
   }

     // Create and store the new post
   try {
     const post = await Post.create(newPostData);

    if (post) {
      // Invalidate related cache entries
      await cacheService.invalidatePattern('posts:*');
      await cacheService.invalidatePattern('dashboard:*');

      // Created
      const response = {
        message: "New post created",
        postId: post._id
      };
      if (cityResolutionFailed) {
        response.warnings = ["city_not_resolved"];
      }
      return res.status(201).json(response);
    } else {
      return res.status(400).json({ message: "Invalid post data received" });
    }
     } catch (postCreationError) {
     console.error('Error creating post in database:', postCreationError);

         return res.status(500).json({
       message: "Failed to create post",
       error: "Failed to create post"
     });
   }

   } catch (error) {
     console.error('Error in createNewPost:', error);
         return res.status(500).json({
       message: "Failed to create post",
       error: "Failed to create post"
     });
  }
};

// @desc Submit a post report
// @route POST /posts/report
// @access Public (no authentication required)
const submitPostReport = async (req, res) => {
  try {
    const { postId, reason, reasonType, reasonLabel, userId } = req.body;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Report submission - body keys:', Object.keys(req.body));
    }

    // For authenticated reports, we'll use the authenticated user's ID
    const reportingUserId = req.user || userId || null;

    // Validate required fields
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false,
        message: "Post ID and reason are required" 
      });
    }

    // Find the post with proper population for the new data structure - optimized with selective fields
    const post = await Post.findById(postId)
      .populate('user', 'username')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en')
      .select('_id foundLost category country region city exactLocation contact description createdAt')
      .lean()
      .exec();

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    // Prepare post data for email with proper field names for new structure
    const emailPostData = {
      _id: post._id,
      foundLost: post.foundLost?.code || 'Unknown',
      category: post.category?.labels?.en || post.category?.code || 'Unknown Category',
      country: post.country?.labels?.en || post.country?.names?.en || post.country?.code || 'Unknown Country',
      region: post.region || 'Unknown',
      city: post.city?.labels?.en || post.city || 'Unknown',
      exactLocation: post.exactLocation || 'Unknown',
      contact: post.contact || 'Not provided',
      description: post.description || 'No description',
      createdAt: post.createdAt
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Email post data prepared for post:', emailPostData._id);
    }

    // Get user data (if userId is provided and not anonymous) - optimized with selective fields
    let user = null;
    if (reportingUserId && reportingUserId !== 'anonymous') {
      user = await User.findById(reportingUserId).select('username email').lean().exec();
      if (!user) {
        // If user not found, use anonymous
        user = {
          username: 'Anonymous User',
          email: 'anonymous@mafqoudat.com'
        };
      }
    } else {
      // Create anonymous user data for email
      user = {
        username: 'Anonymous User',
        email: 'anonymous@mafqoudat.com'
      };
    }

    // Save report to database
    try {
      const reportData = {
        postId: post._id,
        reportedBy: reportingUserId,
        reason: reasonLabel || reason, // Use translated label if available, fallback to reason type
        reasonType: reasonType || reason || 'other',
        postData: {
          userId: post.user._id,
          category: emailPostData.category,
          country: emailPostData.country,
          city: emailPostData.city,
          exactLocation: emailPostData.exactLocation,
          contact: emailPostData.contact,
          createdAt: emailPostData.createdAt,
        },
      };

      const savedReport = await Report.create(reportData);
      console.log('Report saved to database:', savedReport._id);
    } catch (dbError) {
      console.error('Error saving report to database:', dbError);
      // Continue with email notification even if database save fails
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      data: {
        postId,
        reason,
        reportedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit report",
      error: error.message 
    });
  }
};

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = async (req, res) => {
  // Handle both JSON and FormData requests
  let requestData = req.body;
  
  // If postData exists in body (FormData request), parse it
  if (req.body.postData) {
    try {
      requestData = JSON.parse(req.body.postData);
    } catch (error) {
      console.error('Error parsing postData:', error);
      return res.status(400).json({ message: "Invalid postData format" });
    }
  }
  
  const {
    id,
    user,
    country,
    category,
    categories, // New: array of category IDs
    city,
    cityData,
    exactLocation,
    contact,
    returned,
    foundLost,
    description,
    mainDate,
    image,
  } = requestData;

  // Debug: log request shape without leaking PII (contact, exactLocation, description, user id)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 UPDATE POST SERVER - Request body keys:', Object.keys(req.body));
    console.log('🔍 UPDATE POST SERVER - City value present:', !!city, 'Type:', typeof city);
    console.log('🔍 UPDATE POST SERVER - Validation check:');
    console.log('  - id exists:', !!id);
    console.log('  - user exists:', !!user);
    console.log('  - category exists:', !!category);
    console.log('  - categories exists:', !!categories, 'isArray:', Array.isArray(categories));
    console.log('  - exactLocation length:', exactLocation ? String(exactLocation).length : 0);
    console.log('  - country exists:', !!country);
    console.log('  - contact length:', contact ? String(contact).length : 0);
    console.log('  - foundLost exists:', !!foundLost);
    console.log('  - returned type:', typeof returned, 'isBoolean:', typeof returned === "boolean");
  }

  // Determine which category field to use - prefer categories array, fallback to category
  const categoryIds = (categories && Array.isArray(categories) && categories.length > 0)
    ? categories
    : (category ? [category] : []);
  
  console.log('🔍 UPDATE POST SERVER - Category processing:');
  console.log('  - categories (from request):', categories);
  console.log('  - category (from request):', category);
  console.log('  - categoryIds (processed):', categoryIds);
  
  // Use first category for legacy category field validation
  const primaryCategory = categoryIds.length > 0 ? categoryIds[0] : category;
  
  if (
    !id ||
    !user ||
    !primaryCategory ||
    !exactLocation ||
    !country ||
    !contact ||
    !foundLost ||
    typeof returned !== "boolean" ||
    categoryIds.length === 0
  ) {
    console.log('❌ UPDATE POST SERVER - Missing required fields');
    return res.status(400).json({ message: "All fields are required" });
  }
  
  // City is optional but if provided, should not be empty
  if (city !== undefined && !city) {
    return res.status(400).json({ message: "City cannot be empty if provided" });
  }

  // Validate references - using exists() is already optimized for checking existence
  const userExists = await User.exists({ _id: user });
  const countryExists = await Country.exists({ _id: country });
  
  // Validate all categories in the array
  // Filter out invalid ObjectIds first, then validate
  const validCategoryIds = categoryIds.filter(catId => {
    const idStr = String(catId);
    return mongoose.Types.ObjectId.isValid(idStr);
  });
  
  if (validCategoryIds.length !== categoryIds.length) {
    console.log('❌ UPDATE POST SERVER - Invalid category IDs found');
    console.log('  - Received categoryIds:', categoryIds);
    console.log('  - Valid categoryIds:', validCategoryIds);
    return res.status(400).json({ message: "Invalid category ID format" });
  }
  
  console.log('🔍 UPDATE POST SERVER - Validating categories:', validCategoryIds);
  // Convert to ObjectIds for validation
  const categoryObjectIds = validCategoryIds.map(catId => {
    if (typeof catId === 'string' && mongoose.Types.ObjectId.isValid(catId)) {
      return new mongoose.Types.ObjectId(catId);
    }
    return catId;
  });
  
  const categoryValidationPromises = categoryObjectIds.map(catId => Category.exists({ _id: catId }));
  const categoryExistsResults = await Promise.all(categoryValidationPromises);
  console.log('🔍 UPDATE POST SERVER - Category validation results:', categoryExistsResults);
  
  // exists() returns the document _id or null, so check for truthy values
  const allCategoriesExist = categoryExistsResults.every(exists => exists !== null && exists !== undefined);
  console.log('🔍 UPDATE POST SERVER - All categories exist:', allCategoriesExist);
  
  if (!allCategoriesExist) {
    console.log('❌ UPDATE POST SERVER - Some categories do not exist');
    console.log('  - Category IDs checked:', categoryObjectIds);
    console.log('  - Validation results:', categoryExistsResults);
  }
  
  const foundLostExists = await FoundLost.exists({ _id: foundLost });
  
  // Validate city if it's a valid ObjectId (skip validation for API cities)
  let cityExists = true;
  if (city && mongoose.Types.ObjectId.isValid(city)) {
    // console.log('🔍 UPDATE POST SERVER - Validating ObjectId city:', city);
    cityExists = await City.exists({ _id: city });
    // console.log('🔍 UPDATE POST SERVER - City exists:', cityExists);
  } else if (city) {
    // console.log('🔍 UPDATE POST SERVER - API city (non-ObjectId):', city);
  }
  // For API cities (non-ObjectId strings), we'll accept them as-is
  
  // console.log('🔍 UPDATE POST SERVER - Database existence checks:');
  // console.log('  - userExists:', userExists);
  // console.log('  - countryExists:', countryExists);
  // console.log('  - categoryExists:', categoryExists);
  // console.log('  - foundLostExists:', foundLostExists);
  // console.log('  - cityExists:', cityExists);
  
  // Detailed validation error reporting
  if (!userExists || !countryExists || !allCategoriesExist || !foundLostExists || !cityExists) {
    console.log('❌ UPDATE POST SERVER - Database validation failed');
    console.log('  - userExists:', userExists);
    console.log('  - countryExists:', countryExists);
    console.log('  - allCategoriesExist:', allCategoriesExist);
    console.log('  - foundLostExists:', foundLostExists);
    console.log('  - cityExists:', cityExists);
    
    let errorDetails = [];
    if (!userExists) errorDetails.push('user');
    if (!countryExists) errorDetails.push('country');
    if (!allCategoriesExist) errorDetails.push('categories');
    if (!foundLostExists) errorDetails.push('foundLost');
    if (!cityExists) errorDetails.push('city');
    
    return res.status(400).json({ 
      message: `Invalid reference in: ${errorDetails.join(', ')}`,
      details: {
        userExists,
        countryExists,
        allCategoriesExist,
        foundLostExists,
        cityExists,
        categoryIds: validCategoryIds
      }
    });
  }

  // Confirm post exists to update - only select fields needed for update
  // console.log('🔍 UPDATE POST SERVER - Looking for post with ID:', id);
  const post = await Post.findById(id).select('_id user country category categories city exactLocation contact returned foundLost description mainDate cloudinaryPublicId').exec();
  // console.log('🔍 UPDATE POST SERVER - Post found:', !!post);

  if (!post) {
    // console.log('❌ UPDATE POST SERVER - Post not found with ID:', id);
    return res.status(400).json({ message: "Post not found" });
  }

  if (post.user.toString() !== req.user) {
    return res.status(403).json({ message: "Not authorized to update this post" });
  }

  // console.log('🔍 UPDATE POST SERVER - Updating post fields...');
  post.user = user;
  post.country = country;
  
  // Update categories array (new format)
  if (categories && Array.isArray(categories) && categories.length > 0) {
    // Convert all category IDs to ObjectIds
    post.categories = categories.map(catId => {
      if (typeof catId === 'string' && mongoose.Types.ObjectId.isValid(catId)) {
        return new mongoose.Types.ObjectId(catId);
      }
      return catId;
    });
  } else if (categoryIds.length > 0) {
    // Fallback: use categoryIds array if categories wasn't provided
    post.categories = categoryIds.map(catId => {
      if (typeof catId === 'string' && mongoose.Types.ObjectId.isValid(catId)) {
        return new mongoose.Types.ObjectId(catId);
      }
      return catId;
    });
  }
  
  // Update legacy category field (first category for backward compatibility)
  post.category = primaryCategory;
  if (city !== undefined) {
    // Convert string ObjectId to actual ObjectId if needed
    if (typeof city === 'string' && city.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId string, convert to ObjectId
      post.city = new mongoose.Types.ObjectId(city);
    } else if (typeof city === 'string' && cityData) {
      // It's an API city with cityData - create or find database city record
      try {
        const apiCityData = typeof cityData === 'string' ? JSON.parse(cityData) : cityData;
        
        // Check if city already exists in database (country-scoped; label match
        // is escaped so metacharacters in the API-supplied name can't break or
        // hijack the regex)
        const existingCity = await City.findOne({
          country: country,
          $or: [
            { "labels.en": { $regex: escapeRegex(apiCityData.labels.en), $options: 'i' } },
            { "labels.ar": { $regex: escapeRegex(apiCityData.labels.ar), $options: 'i' } },
            { "labels.fr": { $regex: escapeRegex(apiCityData.labels.fr), $options: 'i' } }
          ]
        });

        if (existingCity) {
          post.city = existingCity._id;
        } else {
          // Create new city from API data
          const newCity = await City.create({
            code: apiCityData.code,
            country: country,
            labels: apiCityData.labels,
            isCapital: apiCityData.isCapital || false,
            isActive: true,
            isDynamic: true, // Mark as dynamically created from API
            population: apiCityData.population || 0,
            searchTerms: apiCityData.searchTerms || []
          });
          
          post.city = newCity._id;
        }
      } catch (apiCityError) {
        console.error('Error processing API city data in update:', apiCityError.message);
        // Fallback to storing as string
        post.city = city;
      }
    } else {
      // It's an API city (string like "DAKHLA") without cityData or already an ObjectId
      post.city = city;
    }
  }
  post.exactLocation = exactLocation;
  post.contact = contact;
  post.returned = returned;
  post.foundLost = foundLost;
  if (description !== undefined) {
    post.description = description;
  }
  if (mainDate !== undefined) {
    post.mainDate = mainDate || "";
  }

  // Handle image removal (no replacement) - clean up the old Cloudinary asset
  // so it doesn't leak, then clear all image fields.
  if (image !== undefined && image === null) {
    if (post.cloudinaryPublicId) {
      await deleteFromCloudinary(post.cloudinaryPublicId);
    }
    post.image = null;
    post.cloudinaryUrl = null;
    post.cloudinaryPublicId = null;
  }

  // Handle Cloudinary image data if available (from multer middleware) - a new
  // image is replacing the old one, so clean up the old asset first.
  if (req.cloudinaryResult) {
    if (post.cloudinaryPublicId) {
      await deleteFromCloudinary(post.cloudinaryPublicId);
    }
    post.cloudinaryUrl = req.cloudinaryResult.url;
    post.cloudinaryPublicId = req.cloudinaryResult.public_id;
    // Keep backward compatibility with image field
    post.image = req.cloudinaryResult.url;
  }

  try {
    const updatedPost = await post.save();

    // Invalidate related cache entries
    await cacheService.invalidatePattern('posts:*');
    await cacheService.invalidatePattern('dashboard:*');

    res.json(`Post with ID ${updatedPost._id} updated`);
  } catch (error) {
    console.log('❌ UPDATE POST SERVER - Error saving post:', error.message);
    console.log('❌ UPDATE POST SERVER - Error details:', error);
    return res.status(400).json({ message: "Error updating post: " + error.message });
  }
};

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Post ID required" });
  }

  // Confirm post exists to delete - only select fields needed for deletion (cloudinary cleanup)
  const post = await Post.findById(id).select('_id user cloudinaryPublicId').exec();

  if (!post) {
    return res.status(400).json({ message: "Post not found" });
  }

  if (post.user.toString() !== req.user) {
    return res.status(403).json({ message: "Not authorized to delete this post" });
  }

  // Delete image from Cloudinary if it exists
  if (post.cloudinaryPublicId) {
    await deleteFromCloudinary(post.cloudinaryPublicId);
  }

  const result = await post.deleteOne();

  // Invalidate related cache entries
  await cacheService.invalidatePattern('posts:*');
  await cacheService.invalidatePattern('dashboard:*');

  const reply = `Post with ID ${result._id} deleted`;

  res.json(reply);
};

// @desc Mark post as returned
// @route PATCH /posts/:postId/mark-returned
// @access Private (requires authentication)
const markPostAsReturned = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate post ID
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid post ID" 
      });
    }

    // Find the post
    const post = await Post.findById(postId).select('_id user returned').exec();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.user.toString() !== req.user) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post"
      });
    }

    // Update the post
    post.returned = true;
    post.resolvedAt = new Date();
    await post.save();

    // Invalidate related cache entries
    await cacheService.invalidatePattern('posts:*');
    await cacheService.invalidatePattern('dashboard:*');

    res.json({ 
      success: true,
      message: "Post marked as returned successfully",
      data: {
        postId: post._id,
        returned: post.returned,
        resolvedAt: post.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error marking post as returned:', error);
    res.status(500).json({ 
      success: false,
      message: "Error marking post as returned",
      error: error.message 
    });
  }
};

module.exports = {
  getAllPosts,
  getPost,
  getFilteredPosts,
  getUserPosts,
  createNewPost,
  submitPostReport,
  updatePost,
  deletePost,
  markPostAsReturned,
};
