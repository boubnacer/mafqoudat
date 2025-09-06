const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const Category = require("../models/Category");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");
const { deleteFromCloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");
const TranslationService = require("../services/translationService");
const { cacheService } = require("../config/cache");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");

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
    const categoryId = req.query.categoryId;
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
      // Check if it's a valid country code
      const country = await Country.findOne({ code: currentCountry }).lean();
      if (!country) {
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
    search
  });
  
  // Check cache first
  const cachedPosts = await cacheService.get(cacheKey);
  if (cachedPosts) {
    console.log('📦 Posts served from cache');
    return res.json(cachedPosts);
  }

  let totalPosts;
  let match = {};


  
  // Only filter if fl is provided and not empty
  if (req.query.fl && req.query.fl !== '') {
    match.foundLost = new mongoose.Types.ObjectId(req.query.fl);
  }

  if (req.query.categoryId) {
    match.category = new mongoose.Types.ObjectId(categoryId);
  }

  if (search) {
    match.$or = [
      { exactLocation: { $regex: search, $options: 'i' } },
      { contact: { $regex: search, $options: 'i' } },
      { "Category.code": { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // First, get the country ID from the country code
  let countryId = currentCountry;
  if (currentCountry && !mongoose.Types.ObjectId.isValid(currentCountry)) {
    // If currentCountry is not a valid ObjectId, treat it as a country code
    const country = await Country.findOne({ code: currentCountry }).lean();
    if (country) {
      countryId = country._id;
    } else {
      return res.status(400).json({ 
        message: "Invalid country code",
        error: `Country with code '${currentCountry}' not found`
      });
    }
  }

  // Build the aggregation pipeline
  const pipeline = [
    {
      $match: {
        ...match,
        country: new mongoose.Types.ObjectId(countryId),
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
    { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "foundlosts",
        localField: "foundLost", // was 'foundlost'
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
        $addFields: {
          cityDebug: {
            originalCityId: "$city",
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
        cityName: { 
          $cond: {
            if: { $ne: ["$City", null] },
            then: { $ifNull: ["$City.labels.en", "$City.code"] },
            else: null
          }
        },
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
        categoryname: { 
          $cond: {
            if: { $ne: ["$Category", null] },
            then: "$Category.code",
            else: "OTHER"
          }
        },
        categoryLabels: { $ifNull: ["$Category.labels", null] },
        countryname: "$Country.code",
        countryLabels: "$Country.labels",
        contact: 1,
        image: 1,
        foundLost: 1,
        description: 1,
        contactPreferences: 1,
        additionalContact: 1,
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
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          categoryname: { $ifNull: ["$Category.code", "OTHER"] },
          countryname: "$Country.code",
          countryLabels: "$Country.labels",
          contact: 1,
          image: 1,
          foundLost: 1,
          description: 1,
          contactPreferences: 1,
          additionalContact: 1,
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
    const categoryId = req.query.categoryId;
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

    if (categoryId) {
      match.category = new mongoose.Types.ObjectId(categoryId);
    }

    if (search) {
      match.$or = [
        { exactLocation: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle country filtering
    let countryId = currentCountry;
    if (currentCountry && !mongoose.Types.ObjectId.isValid(currentCountry)) {
      const country = await Country.findOne({ code: currentCountry }).lean();
      if (country) {
        countryId = country._id;
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
          categoryname: { 
            $cond: {
              if: { $ne: ["$Category", null] },
              then: "$Category.code",
              else: "OTHER"
            }
          },
          countryname: "$Country.code",
          countryLabels: "$Country.labels",
          contact: 1,
          image: 1,
          foundLost: 1,
          description: 1,
          contactPreferences: 1,
          additionalContact: 1,
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
    console.log('🔍 DEBUG: Posts with city info:', postsWithUser.map(post => ({
      id: post._id,
      city: post.city,
      cityName: post.cityName,
      cityLabels: post.cityLabels,
      hasCity: !!post.city,
      cityDebug: post.cityDebug
    })));

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

// @desc Create new post
// @route POST /posts
// @access Private
const createNewPost = async (req, res) => {
  try {
    const { 
      user, 
      country, 
      category, 
      contact, 
      foundLost,
      city,
      exactLocation,
      exactDate,
      description,
      contactPreferences,
      additionalContact
    } = req.body;
    

         // Confirm required data
     const requiredFields = {
       user: !!user,
       category: !!category,
       contact: !!contact,
       country: !!country,
       foundLost: !!foundLost,
       exactLocation: !!exactLocation,
       exactDate: !!exactDate
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
     const categoryExists = await Category.findById(category).select('_id').lean();
     const foundLostExists = await FoundLost.findById(foundLost).select('_id').lean();
    
    // Check which references are missing and provide specific error messages
    const missingReferences = [];
    if (!userExists) missingReferences.push('user');
    if (!countryExists) missingReferences.push('country');
    if (!categoryExists) missingReferences.push('category');
    if (!foundLostExists) missingReferences.push('foundLost');
    
         if (missingReferences.length > 0) {
      
             // Get available options to help the client - only select necessary fields
       const availableCountries = await Country.find().select('_id code names.en').lean();
       const availableCategories = await Category.find().select('_id code labels.en').lean();
       const availableFoundLost = await FoundLost.find().select('_id code labels.en').lean();
      
             // Check if the IDs exist in the available options (database connection issue workaround)
       const countryExistsInOptions = availableCountries.find(c => c._id.toString() === country);
       const categoryExistsInOptions = availableCategories.find(c => c._id.toString() === category);
       const foundLostExistsInOptions = availableFoundLost.find(f => f._id.toString() === foundLost);
       
       // If IDs exist in available options but not in findById, this is a database connection issue
       if (countryExistsInOptions && categoryExistsInOptions && foundLostExistsInOptions) {
         // Continue with post creation since the data exists
       } else {
        return res.status(400).json({ 
          message: `Invalid references: ${missingReferences.join(', ')}`,
          details: {
            missingReferences,
            userExists: !!userExists,
            countryExists: !!countryExists,
            categoryExists: !!categoryExists,
            foundLostExists: !!foundLostExists,
            availableOptions: {
              countries: availableCountries.map(c => ({ id: c._id, code: c.code, name: c.names?.en || c.code })),
              categories: availableCategories.map(c => ({ id: c._id, code: c.code, name: c.labels?.en || c.code })),
              foundLost: availableFoundLost.map(f => ({ id: f._id, code: f.code, name: f.labels?.en || f.code }))
            }
          }
        });
      }
    }
  } catch (validationError) {
    console.error('Error during reference validation:', validationError);
    return res.status(400).json({ 
      message: "Error validating references",
      error: validationError.message
    });
  }
  
     // Handle city validation
   let cityId = null;
   
   try {
     if (city && mongoose.Types.ObjectId.isValid(city)) {
       // City is a valid ObjectId, verify it exists
       const cityDoc = await City.findById(city).select('_id').lean();
       if (cityDoc) {
         cityId = city;
       } else {
         console.warn(`City with ID ${city} not found in database`);
         cityId = null;
       }
     } else if (city && city !== 'other' && typeof city === 'string') {
       // Fallback: If we have a city name but no valid cityId, create a new city record
       // This is a fallback for cases where the frontend didn't create the city first
       try {
         console.log(`Creating fallback city for: ${city}`);
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
         console.log(`Created fallback city with ID: ${cityId}`);
       } catch (cityCreationError) {
         console.error('Error creating fallback city:', cityCreationError.message);
         cityId = null;
       }
     } else {
       cityId = null;
     }
   } catch (cityError) {
     console.error('Error during city validation:', cityError.message);
     cityId = null;
   }

     // Prepare post data
  const postData = {
    user,
    category,
    country,
    contact,
    foundLost,
    exactLocation,
    exactDate: new Date(exactDate),
    description: description || "",
  };

     // Handle city field - cityId is already processed above
   if (cityId) {
     postData.city = cityId;
     console.log(`Setting city field in post data: ${cityId}`);
     console.log(`City field type: ${typeof cityId}`);
     console.log(`City field is valid ObjectId: ${mongoose.Types.ObjectId.isValid(cityId)}`);
   } else {
     console.log('No cityId set, city field will be null');
     console.log(`Original city value: ${city}`);
     console.log(`City value type: ${typeof city}`);
   }

   // Add contact preferences if provided
   if (contactPreferences) {
     try {
       const parsedContactPreferences = JSON.parse(contactPreferences);
       postData.contactPreferences = parsedContactPreferences;
     } catch (error) {
       // Use default contact preferences
       postData.contactPreferences = {
         phone: true,
         email: false,
         whatsapp: false
       };
     }
   }

   // Add additional contact if provided
   if (additionalContact) {
     try {
       const parsedAdditionalContact = JSON.parse(additionalContact);
       postData.additionalContact = parsedAdditionalContact;
     } catch (error) {
       // Use empty additional contact
       postData.additionalContact = {
         phone: "",
         email: "",
         whatsapp: ""
       };
     }
   }

   // Add Cloudinary image data if available
   if (req.cloudinaryResult) {
     postData.cloudinaryUrl = req.cloudinaryResult.url;
     postData.cloudinaryPublicId = req.cloudinaryResult.public_id;
     // Keep backward compatibility with image field
     postData.image = req.cloudinaryResult.url;
   }

     // Create and store the new post
   try {
     console.log('Final post data before creation:', {
       city: postData.city,
       cityType: typeof postData.city,
       cityIsValidObjectId: mongoose.Types.ObjectId.isValid(postData.city),
       hasCity: !!postData.city
     });
     const post = await Post.create(postData);

    if (post) {
      // Invalidate related cache entries
      await cacheService.invalidatePattern('posts:*');
      await cacheService.invalidatePattern('dashboard:*');
      
      // Created
      return res.status(201).json({ 
        message: "New post created",
        postId: post._id 
      });
    } else {
      return res.status(400).json({ message: "Invalid post data received" });
    }
     } catch (postCreationError) {
     console.error('Error creating post in database:', postCreationError);
    
         return res.status(500).json({ 
       message: "Error creating post in database", 
       error: postCreationError.message
     });
   }
   
   } catch (error) {
     console.error('Error in createNewPost:', error);
         return res.status(500).json({ 
       message: "Error creating post", 
       error: error.message
     });
  }
};

// @desc Submit a post report
// @route POST /posts/report
// @access Public (no authentication required)
const submitPostReport = async (req, res) => {
  try {
    const { postId, reason, userId } = req.body;
    
    // Debug: Check request data
    console.log('Report submission - req.body:', req.body);
    console.log('Report submission - req.headers:', req.headers);
    
    // For authenticated reports, we'll use the authenticated user's ID
    const reportingUserId = req.user || userId || 'anonymous';

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

    console.log('Email post data prepared:', emailPostData);

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

    // Return success response immediately - don't wait for email
    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      notificationSent: false, // Will be updated by background email
      data: {
        postId,
        reason,
        reportedAt: new Date()
      }
    });

    // Send email notification in background (non-blocking)
    setImmediate(async () => {
      try {
        const emailNotification = require('../utils/emailNotification');
        const emailResult = await emailNotification.sendReportNotification(emailPostData, user, reason);
        console.log('Background email notification result:', emailResult);
      } catch (emailError) {
        console.error('Background email notification failed:', emailError);
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
  const {
    id,
    user,
    country,
    category,
    exactLocation,
    contact,
    returned,
    foundLost,
    description,
  } = req.body;

  // Confirm data
  if (
    !id ||
    !user ||
    !category ||
    !exactLocation ||
    !country ||
    !contact ||
    !foundLost ||
    typeof returned !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate references - using exists() is already optimized for checking existence
  const userExists = await User.exists({ _id: user });
  const countryExists = await Country.exists({ _id: country });
  const categoryExists = await Category.exists({ _id: category });
  const foundLostExists = await FoundLost.exists({ _id: foundLost });
  if (!userExists || !countryExists || !categoryExists || !foundLostExists) {
    return res.status(400).json({ message: "Invalid reference in user/country/category/foundLost" });
  }

  // Confirm post exists to update - only select fields needed for update
  const post = await Post.findById(id).select('_id user country category exactLocation contact returned foundLost description').exec();

  if (!post) {
    return res.status(400).json({ message: "Post not found" });
  }

  post.user = user;
  post.country = country;
  post.category = category;
  post.exactLocation = exactLocation;
  post.contact = contact;
  post.returned = returned;
  post.foundLost = foundLost;
  if (description !== undefined) {
    post.description = description;
  }



  const updatedPost = await post.save();

  // Invalidate related cache entries
  await cacheService.invalidatePattern('posts:*');
  await cacheService.invalidatePattern('dashboard:*');

  res.json(`'${updatedPost.title || updatedPost._id}' updated`);
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
  const post = await Post.findById(id).select('_id cloudinaryPublicId title').exec();

  if (!post) {
    return res.status(400).json({ message: "Post not found" });
  }

  // Delete image from Cloudinary if it exists
  if (post.cloudinaryPublicId) {
    await deleteFromCloudinary(post.cloudinaryPublicId);
  }

  const result = await post.deleteOne();

  // Invalidate related cache entries
  await cacheService.invalidatePattern('posts:*');
  await cacheService.invalidatePattern('dashboard:*');

  const reply = `Post '${result.title || result._id}' with ID ${result._id} deleted`;

  res.json(reply);
};


module.exports = {
  getAllPosts,
  getPost,
  getFilteredPosts,
  createNewPost,
  submitPostReport,
  updatePost,
  deletePost,
};
