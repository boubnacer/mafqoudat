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
  // Get all posts from MongoDB // remember first of all we should skip 0 items
  const currentCountry = req.query.currentCountry;
  const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
  const pageSize = parseInt(req.query.pageSize) || 4;
  const fl = req.query.fl;
  const categoryId = req.query.categoryId;
  const search = req.query.search;
  
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

  console.log('Posts controller - fl parameter:', {
    fl: req.query.fl,
    hasFl: req.query.fl && req.query.fl !== '',
    flType: typeof req.query.fl,
    allQueryParams: req.query
  });
  
  // Only filter if fl is provided and not empty
  if (req.query.fl && req.query.fl !== '') {
    match.foundLost = new mongoose.Types.ObjectId(req.query.fl);
    console.log('Posts controller - added foundLost filter:', match.foundLost);
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

  const postsWithUser = await Post.aggregate([
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
    { $unwind: "$Category" },
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
        city: 1,
        cityName: { $ifNull: ["$City.labels.en", null] },
        cityLabels: { $ifNull: ["$City.labels", null] },
        returned: 1,
        createdAt: 1,
        updatedAt: 1,
        username: "$User.username",
        categoryname: "$Category.code",
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
      $skip: page * pageSize,
    },
    {
      $limit: pageSize,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  // Get total count for pagination
  if (search) {
    totalPosts = await Post.countDocuments({
      ...match,
      country: new mongoose.Types.ObjectId(currentCountry),
    });
  } else if (req.query.fl) {
    totalPosts = await Post.countDocuments({
      foundLost: new mongoose.Types.ObjectId(fl),
      country: new mongoose.Types.ObjectId(currentCountry),
    });
  } else {
    totalPosts = await Post.countDocuments({
      country: new mongoose.Types.ObjectId(currentCountry),
    });
  }

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
      { $unwind: "$Category" },
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
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", null] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          categoryname: "$Category.code",
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

// @desc Get getFilteredPosts
// @route GET /posts
// @access Private
const getFilteredPosts = async (req, res) => {
  const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
  const limit = parseInt(req.query.limit) || 4;
  const startIndex = page * limit;
  const fl = req.query.fl;

  const totalPosts = await Post.countDocuments({ foundLost: fl });

  const posts = await Post.find({ foundLost: fl })
    .sort({ _id: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  // If no posts
  if (!posts?.length) {
    return res.status(400).json({ message: "No posts found" });
  }

  // Add username to each post before sending the response
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
  // You could also do this with a for...of loop
  const postsWithUser = await Promise.all(
    posts.map(async (post) => {
      const user = await User.findById(post.user).lean().exec();
      const country = await Country.findById(post.country).lean().exec();
      return {
        ...post,
        username: user.username,
        code: country.code,
      };
    })
  );

  res.json({
    postsWithUser,
    currentPage: page + 1,
    numberOfPages: Math.ceil(totalPosts / limit),
  });
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

   // Validate references
  
     try {
     const userExists = await User.findById(user).lean();
     const countryExists = await Country.findById(country).lean();
     const categoryExists = await Category.findById(category).lean();
     const foundLostExists = await FoundLost.findById(foundLost).lean();
    
    // Check which references are missing and provide specific error messages
    const missingReferences = [];
    if (!userExists) missingReferences.push('user');
    if (!countryExists) missingReferences.push('country');
    if (!categoryExists) missingReferences.push('category');
    if (!foundLostExists) missingReferences.push('foundLost');
    
         if (missingReferences.length > 0) {
      
      // Get available options to help the client
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
   
   console.log('🔍 DEBUG: City validation - city value:', city);
   console.log('🔍 DEBUG: City validation - is city valid ObjectId?', city && mongoose.Types.ObjectId.isValid(city));
   
   try {
     if (city && mongoose.Types.ObjectId.isValid(city)) {
       console.log('🔍 DEBUG: City is valid ObjectId, checking if exists in database');
       const cityDoc = await City.findById(city).lean();
       if (cityDoc) {
         cityId = city;
         console.log('🔍 DEBUG: City found in database, setting cityId:', cityId);
       } else {
         console.log('🔍 DEBUG: City ObjectId not found in database - treating as invalid');
         // If the ObjectId doesn't exist in database, treat it as invalid
         cityId = null;
       }
     } else {
       console.log('🔍 DEBUG: City is not a valid ObjectId or is null/undefined');
     }
   } catch (cityError) {
     console.error('Error during city validation:', cityError);
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

  console.log('🔍 DEBUG: Post data before city handling:', postData);

     // Handle city field
   if (cityId) {
     console.log('🔍 DEBUG: Setting city to ObjectId:', cityId);
     postData.city = cityId;
   } else if (city) {
     // If we have a city value but no valid cityId, create a new city record
     console.log('🔍 DEBUG: Creating new city record for:', city);
     try {
       // Use translation service to get proper translations for the custom city
       console.log('🔍 DEBUG: Translating custom city name:', city);
       const translations = await TranslationService.translateCityName(city, 'en');
       
       console.log('🔍 DEBUG: Translation result:', translations);
       
       // Create a new city record for the custom city name with translations
       const newCity = await City.create({
         code: city.toUpperCase().replace(/\s+/g, '_'),
         country: country,
         labels: {
           en: translations.en || city,
           fr: translations.fr || city,
           ar: translations.ar || city
         },
         isDynamic: true, // Mark as dynamically created
         searchTerms: [city.toLowerCase()]
       });
       
       console.log('🔍 DEBUG: New city created with ID:', newCity._id);
       postData.city = newCity._id; // Use the new city's ObjectId
     } catch (cityCreationError) {
       console.error('🔍 DEBUG: Error creating city:', cityCreationError);
       // If city creation fails, fall back to storing as string
       postData.city = city;
     }
   } else {
     console.log('🔍 DEBUG: No city handling applied - cityId:', cityId, 'city:', city);
   }

   console.log('🔍 DEBUG: Final post data:', postData);

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

    // Find the post with proper population for the new data structure
    const post = await Post.findById(postId)
      .populate('user', 'username')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en')
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

    // Get user data (if userId is provided and not anonymous)
    let user = null;
    if (reportingUserId && reportingUserId !== 'anonymous') {
      user = await User.findById(reportingUserId).lean().exec();
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

  // Validate references
  const userExists = await User.exists({ _id: user });
  const countryExists = await Country.exists({ _id: country });
  const categoryExists = await Category.exists({ _id: category });
  const foundLostExists = await FoundLost.exists({ _id: foundLost });
  if (!userExists || !countryExists || !categoryExists || !foundLostExists) {
    return res.status(400).json({ message: "Invalid reference in user/country/category/foundLost" });
  }

  // Confirm post exists to update
  const post = await Post.findById(id).exec();

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

  // Confirm post exists to delete
  const post = await Post.findById(id).exec();

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
