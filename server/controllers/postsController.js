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
          cityLabels: "$City.labels"
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
        cityDebug: 1,
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
  
  // Debug: Log city information for posts
  console.log('🔍 DEBUG: All posts with city info:', postsWithUser.map(post => ({
    id: post._id,
    city: post.city,
    cityName: post.cityName,
    cityLabels: post.cityLabels,
    cityDebug: post.cityDebug,
    hasCity: !!post.city
  })));

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
      hasCity: !!post.city
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
    console.log('🔍 DEBUG: Raw request body:', req.body);
    console.log('🔍 DEBUG: Request files:', req.files);
    console.log('🔍 DEBUG: Request file:', req.file);
    
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
    
    console.log('🔍 DEBUG: Parsed request data:', {
      user,
      country,
      category,
      contact,
      foundLost,
      city,
      exactLocation,
      exactDate,
      description: description ? 'provided' : 'empty',
      contactPreferences,
      additionalContact
    });

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
   
   console.log('🔍 DEBUG: City validation - received city:', city, 'type:', typeof city, 'isValidObjectId:', city ? mongoose.Types.ObjectId.isValid(city) : 'N/A');
   
   try {
     if (city && mongoose.Types.ObjectId.isValid(city)) {
       console.log('🔍 DEBUG: City is valid ObjectId, checking if exists in database');
       const cityDoc = await City.findById(city).select('_id').lean();
       if (cityDoc) {
         cityId = city;
         console.log('🔍 DEBUG: City found in database, using existing cityId:', cityId);
       } else {
         // If the ObjectId doesn't exist in database, treat it as invalid
         cityId = null;
         console.log('🔍 DEBUG: City ObjectId not found in database, setting cityId to null');
       }
     } else if (city && city !== 'other') {
       console.log('🔍 DEBUG: City is custom string, creating new city record for:', city);
       // If we have a city value but no valid cityId, create a new city record
       try {
         // Use translation service to get proper translations for the custom city
         const translations = await TranslationService.translateCityName(city, 'en');
         
         // Create a unique code for the custom city
         const baseCode = city.toUpperCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
         const uniqueCode = `${baseCode}_${Date.now()}`;
         
         console.log('🔍 DEBUG: Creating city with code:', uniqueCode, 'for city name:', city);
         
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
         
         console.log('🔍 DEBUG: Created custom city successfully:', {
           id: newCity._id,
           code: newCity.code,
           labels: newCity.labels,
           country: newCity.country
         });
         
         cityId = newCity._id; // Use the new city's ObjectId
         console.log('🔍 DEBUG: Set cityId to new city ObjectId:', cityId);
       } catch (cityCreationError) {
         console.error('🔍 DEBUG: Error creating city:', {
           error: cityCreationError.message,
           code: cityCreationError.code,
           name: cityCreationError.name,
           city: city,
           country: country,
           uniqueCode: uniqueCode
         });
         
         // If city creation fails, set to null instead of string
         cityId = null;
       }
     } else {
       // If city is 'other' or empty, set to null
       console.log('🔍 DEBUG: City is "other" or empty, setting cityId to null');
       cityId = null;
     }
   } catch (cityError) {
     console.error('🔍 DEBUG: Error during city validation:', cityError);
     cityId = null;
   }
   
   console.log('🔍 DEBUG: Final cityId after validation:', cityId);

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
     console.log('🔍 DEBUG: Setting post city to:', cityId);
   } else {
     console.log('🔍 DEBUG: No city ID, post will have null city');
   }
   
   console.log('🔍 DEBUG: Final post data before creation:', {
     ...postData,
     city: cityId,
     user: user ? 'provided' : 'missing',
     category: category ? 'provided' : 'missing',
     country: country ? 'provided' : 'missing'
   });

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

    // Try to send email notification, but don't fail if it doesn't work
    let emailResult = { success: false, message: 'Email not configured' };
    try {
      const emailNotification = require('../utils/emailNotification');
      emailResult = await emailNotification.sendReportNotification(emailPostData, user, reason);
      console.log('Email notification result:', emailResult);
    } catch (emailError) {
      console.error('Failed to send report email:', emailError);
      emailResult = { success: false, error: emailError.message };
    }

    // Return success response regardless of email status
    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      notificationSent: emailResult.success,
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

// Test endpoint for city creation
const testCityCreation = async (req, res) => {
  try {
    const { cityName, countryId } = req.body;
    
    console.log('🔍 DEBUG: Testing city creation with:', { cityName, countryId });
    
    // Test translation service
    const translations = await TranslationService.translateCityName(cityName, 'en');
    console.log('🔍 DEBUG: Translation result:', translations);
    
    // Test city creation
    const baseCode = cityName.toUpperCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const uniqueCode = `${baseCode}_${Date.now()}`;
    
    const newCity = await City.create({
      code: uniqueCode,
      country: countryId,
      labels: {
        en: translations.en || cityName,
        fr: translations.fr || cityName,
        ar: translations.ar || cityName
      },
      isDynamic: true,
      searchTerms: [cityName.toLowerCase()]
    });
    
    console.log('🔍 DEBUG: City created successfully:', newCity);
    
    res.json({
      success: true,
      city: newCity,
      translations
    });
  } catch (error) {
    console.error('🔍 DEBUG: City creation test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
};

module.exports = {
  getAllPosts,
  getPost,
  getFilteredPosts,
  createNewPost,
  submitPostReport,
  updatePost,
  deletePost,
  testCityCreation,
};
