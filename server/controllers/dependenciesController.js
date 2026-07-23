const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const mongoose = require("mongoose");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");
const Category = require("../models/Category");
const City = require("../models/City");
const { cacheService } = require("../config/cache");
const { geocodeCityName } = require("../utils/cityGeocode");

// Get Dashboard
const getDashboard = async (req, res) => {
  try {
    const { currentCountry, language = 'en' } = req.query;
    
    // Validate currentCountry parameter
    if (!currentCountry) {
      return res.status(400).json({ 
        message: "currentCountry parameter is required",
        error: "Missing required parameter"
      });
    }

    // Validate that currentCountry is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(currentCountry)) {
      return res.status(400).json({ 
        message: "Invalid currentCountry format",
        error: "currentCountry must be a valid MongoDB ObjectId"
      });
    }

    console.log('Dashboard request received:', { currentCountry, language });
    
    // Generate cache key
    const cacheKey = cacheService.generateKey('dashboard', {
      currentCountry,
      user: req.user?.id || 'anonymous'
    });
    
    // Check cache first
    const cachedDashboard = await cacheService.get(cacheKey);
    if (cachedDashboard) {
      console.log('📦 Dashboard served from cache');
      return res.json(cachedDashboard);
    }
    
    let match = {};
    const currentDate = new Date();
    
    if (!currentCountry) {
      console.log("Missing currentCountry parameter");
      return res.status(400).json({ message: "currentCountry parameter is required" });
    }

    console.log("Processing dashboard for country:", currentCountry);

    // OPTIMIZED: Lookup FoundLost IDs by code - Combined query using Promise.all
    // Auto-create if missing
    const [foundOption, lostOption] = await Promise.all([
      FoundLost.findOne({ code: "FOUND" }).lean(),
      FoundLost.findOne({ code: "LOST" }).lean()
    ]);
    
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
      
      const newFoundOption = createdOptions.find(opt => opt.code === "FOUND");
      const newLostOption = createdOptions.find(opt => opt.code === "LOST");
      
      // Update variables (convert to plain objects for consistency with .lean())
      foundOption = newFoundOption ? newFoundOption.toObject ? newFoundOption.toObject() : newFoundOption : null;
      lostOption = newLostOption ? newLostOption.toObject ? newLostOption.toObject() : newLostOption : null;
      
      console.log("Created FoundLost options:", { found: foundOption?._id, lost: lostOption?._id });
    }
    
    console.log("Using FoundLost options:", { found: foundOption?.code, lost: lostOption?.code });

    // Add error handling for aggregation
    let trendingPost = [];
    try {
      console.log('Dashboard: Starting trending post aggregation for country:', currentCountry);
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
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      // Debug stage to see what's happening with city lookup
      {
        $addFields: {
          cityDebug: {
            originalCityId: "$city",
            cityObjectId: "$cityObjectId",
            cityFound: { $ne: ["$City", null] },
            cityLabels: "$City.labels",
            cityData: "$City",
            cityId: "$City._id",
            cityCode: "$City.code",
            cityIsDynamic: "$City.isDynamic"
          }
        }
      },
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
          exactLocation: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", null] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          cityDebug: 1,
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          mainDate: 1, // Add mainDate field to projection
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
                  else: "ELECTRONICS"
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
          floptionName: { $ifNull: ["$Floptions.code", "FOUND"] },
          username: { $ifNull: ["$User.username", "Unknown"] },
          Floptions: {
            $cond: {
              if: { $ne: ["$Floptions", null] },
              then: "$Floptions",
              else: {
                code: "FOUND",
                color: "#4CAF50",
                labels: {
                  en: "Found",
                  fr: "Trouvé",
                  ar: "تم العثور عليه"
                }
              }
            }
          },
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
        $limit: 6,
      },
    ]);
    console.log('Dashboard: Trending post aggregation result:', {
      count: trendingPost.length,
      firstPost: trendingPost[0] ? {
        _id: trendingPost[0]._id,
        categoryname: trendingPost[0].categoryname,
        floptionName: trendingPost[0].floptionName,
        Floptions: trendingPost[0].Floptions,
        cityName: trendingPost[0].cityName,
        cityLabels: trendingPost[0].cityLabels,
        city: trendingPost[0].city,
        cityDebug: trendingPost[0].cityDebug
      } : null
    });
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
      // Convert string IDs to ObjectIds for lookups (same as trending posts)
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
      { $unwind: "$Floptions" },
      {
        $lookup: {
          from: "countries",
          localField: "countryObjectId",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: "$Country" },
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
          mainDate: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", null] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
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
                  else: "ELECTRONICS"
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
          contact: 1,
          image: 1,
          mainDate: 1, // Add mainDate field to projection
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
        $limit: 5,
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
          mainDate: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", null] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
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
                  else: "ELECTRONICS"
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
          contact: 1,
          image: 1,
          mainDate: 1, // Add mainDate field to projection
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "MOROCCO"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },
      },
      {
        $limit: 5,
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

    // OPTIMIZED: Get all counts in a single aggregation using $facet
    const todayStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const todayEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1
    );

    const countsResult = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry)
        }
      },
      {
        $facet: {
          totalFounds: [
            { $match: { foundLost: foundOption._id } },
            { $count: "count" }
          ],
          totalLosts: [
            { $match: { foundLost: lostOption._id } },
            { $count: "count" }
          ],
          totalPosts: [
            { $count: "count" }
          ],
          totalReturned: [
            { $match: { returned: true } },
            { $count: "count" }
          ],
          todaysFoundPosts: [
            {
              $match: {
                foundLost: foundOption._id,
                createdAt: {
                  $gte: todayStart,
                  $lt: todayEnd
                }
              }
            },
            { $count: "count" }
          ],
          todaysLostPosts: [
            {
              $match: {
                foundLost: lostOption._id,
                createdAt: {
                  $gte: todayStart,
                  $lt: todayEnd
                }
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    // Extract counts from aggregation result with safety check
    const counts = countsResult && countsResult[0] ? countsResult[0] : {};
    const totalFounds = counts.totalFounds?.[0]?.count || 0;
    const totalLosts = counts.totalLosts?.[0]?.count || 0;
    const totalPosts = counts.totalPosts?.[0]?.count || 0;
    const totalReturned = counts.totalReturned?.[0]?.count || 0;
    const todaysFoundPosts = counts.todaysFoundPosts?.[0]?.count || 0;
    const todaysLostPosts = counts.todaysLostPosts?.[0]?.count || 0;

    // OPTIMIZED: Get geography data using aggregation with $lookup instead of N+1 queries
    // CRITICAL FIX: Filter by currentCountry to avoid processing all posts
    const geographyData = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry)
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      {
        $project: {
          code: { $arrayElemAt: ["$countryData.code", 0] },
          categoryname: { $arrayElemAt: ["$categoryData.code", 0] }
        }
      },
      {
        $group: {
          _id: "$code",
          count: { $sum: 1 }
        }
      }
    ]);

    const mappedLocations = geographyData.reduce((acc, { _id: code, count }) => {
      const countryISO3 = getCountryIso3(code || "Unknown");
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3] += count;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    const createdToday = { todaysFoundPosts, todaysLostPosts };

    // Daily Found/Lost activity for the header's trend chart — a dense
    // day-by-day series (zero-filled, not just the days that had posts) so
    // the client can plot it directly without backfilling missing dates.
    const DAILY_TREND_DAYS = 14;
    const trendRangeStart = new Date(todayStart);
    trendRangeStart.setDate(trendRangeStart.getDate() - (DAILY_TREND_DAYS - 1));

    const dailyActivityResult = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          createdAt: { $gte: trendRangeStart, $lt: todayEnd },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            foundLost: "$foundLost",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyMap = new Map();
    for (let i = 0; i < DAILY_TREND_DAYS; i++) {
      const d = new Date(trendRangeStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, found: 0, lost: 0 });
    }
    dailyActivityResult.forEach((row) => {
      const day = dailyMap.get(row._id.day);
      if (!day) return;
      if (String(row._id.foundLost) === String(foundOption._id)) day.found = row.count;
      else if (String(row._id.foundLost) === String(lostOption._id)) day.lost = row.count;
    });
    const dailyActivity = Array.from(dailyMap.values());

    // Platform-wide posts-per-country, for the header's world activity map.
    // Deliberately NOT scoped to currentCountry (unlike formattedLocations
    // above, which matches currentCountry first and so can only ever
    // resolve to that one country) — this is meant to show reach across
    // the whole platform, not just the selected country.
    const worldActivityResult = await Post.aggregate([
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },
      { $unwind: "$countryData" },
      {
        $group: {
          _id: "$countryData.code",
          count: { $sum: 1 },
        },
      },
    ]);
    const worldActivity = worldActivityResult
      .filter((row) => row._id)
      .map((row) => ({ code: row._id, count: row.count }));

    // City-level activity for the map's city markers, scoped to
    // currentCountry (the map is always zoomed to one country, so no need
    // for this to be platform-wide the way worldActivity is).
    //
    // First cut of this used exactLocation as the primary city signal,
    // based on how the local seed data happened to look ("Casablanca, near
    // Gare Routière" — city name first). Real production data disproves
    // that: posts do carry a properly-linked city ObjectId (resolving to a
    // real City doc with labels.en/fr/ar, exactly like recentFounds'
    // cityName below), while exactLocation turns out to hold street/
    // neighborhood detail instead ("سباتة، شارع جمال الذرة", "Euueueue") —
    // rarely a usable city name at all. That mismatch is why this shipped
    // working locally but came back empty in production: every real post
    // has a resolvable city, but the code was reading the wrong field.
    // City.labels.en is now the primary geocoding key (matches the English
    // dataset in cityGeocode.js), display name follows the requested
    // language, and free-text is only a last-resort fallback for posts
    // with no linked City doc at all.
    const cityObjectIdConversion = {
      $cond: {
        if: {
          $and: [
            { $ne: ["$city", null] },
            { $ne: ["$city", ""] },
            { $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } },
          ],
        },
        then: { $toObjectId: "$city" },
        else: null,
      },
    };
    const cityActivityPosts = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      { $addFields: { cityObjectId: cityObjectIdConversion } },
      { $lookup: { from: "cities", localField: "cityObjectId", foreignField: "_id", as: "CityDoc" } },
      { $unwind: { path: "$CityDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          geocodeName: { $ifNull: ["$CityDoc.labels.en", null] },
          displayName: { $ifNull: [`$CityDoc.labels.${language}`, `$CityDoc.labels.en`] },
          city: 1,
          exactLocation: 1,
        },
      },
    ]);

    const CITY_OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
    const extractFallbackCityName = (post) => {
      if (typeof post.city === "string" && post.city.trim() && !CITY_OBJECT_ID_RE.test(post.city.trim())) {
        return post.city.trim();
      }
      if (post.exactLocation) {
        const firstPart = post.exactLocation.split(",")[0].split("(")[0].trim();
        const cleaned = firstPart.replace(/\d+/g, "").trim();
        return cleaned || null;
      }
      return null;
    };

    const currentCountryDoc = await Country.findById(currentCountry).select("code").lean();
    const cityCounts = new Map();
    cityActivityPosts.forEach((post) => {
      const hasCityDoc = Boolean(post.geocodeName);
      const geocodeName = post.geocodeName || extractFallbackCityName(post);
      if (!geocodeName) return;
      const displayName = post.displayName || geocodeName;
      const key = geocodeName.toLowerCase();
      const existing = cityCounts.get(key);
      if (existing) {
        existing.count += 1;
        // Prefer the linked City doc's localized label over a name
        // recovered from free text, regardless of which post the grouping
        // happened to see first.
        if (hasCityDoc && !existing.hasCityDoc) {
          existing.displayName = displayName;
          existing.hasCityDoc = true;
        }
      } else {
        cityCounts.set(key, { geocodeName, displayName, count: 1, hasCityDoc });
      }
    });

    const cityActivity = [];
    if (currentCountryDoc?.code) {
      cityCounts.forEach(({ geocodeName, displayName, count }) => {
        const geo = geocodeCityName(geocodeName, currentCountryDoc.code);
        if (geo) cityActivity.push({ name: displayName, count, lon: geo.lon, lat: geo.lat });
      });
    }

    const response = {
      trendingPost,
      recentFounds,
      recentLosts,
      totalFounds,
      totalLosts,
      totalPosts,
      totalReturned,
      formattedLocations,
      createdToday,
      dailyActivity,
      worldActivity,
      cityActivity,
    };

    // Cache the response for 5 minutes (dynamic data)
    await cacheService.set(cacheKey, response, 300);
    
    // Invalidate any old cached data to ensure fresh data
    
    
    res.status(200).json(response);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// found or lost options
const getflOptions = async (req, res) => {
  try {
    const { language = 'en', active = true } = req.query;
    
    let query = {};
    if (active === 'true' || active === true) {
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
    if (active === 'true' || active === true) {
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

    const response = {
      success: true,
      data: transformedCountries,
      total: transformedCountries.length
    };
    
    // Cache the response for 24 hours (aggressive static data caching)
    await cacheService.set(cacheKey, response, 86400);
    
    res.json(response);
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
    // Cache bypass option for testing
    if (req.query.nocache === 'true') {
      console.log('🚫 Cache bypassed for categories');
    }
    
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

    const response = {
      success: true,
      data: transformedCategories,
      total: transformedCategories.length
    };
    
    res.json(response);
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
    
    // Invalidate categories cache after creation
    
    
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
    
    // Invalidate fl-options cache after creation
    
    
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

  // OPTIMIZED: Lookup FoundLost IDs by code - Combined query using Promise.all
  const [foundOption, lostOption] = await Promise.all([
    FoundLost.findOne({ code: "FOUND" }).lean(),
    FoundLost.findOne({ code: "LOST" }).lean()
  ]);
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
