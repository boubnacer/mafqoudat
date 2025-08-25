const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const Category = require("../models/Category");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");
const { deleteFromCloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");
// const getCountryIso3 = require("country-iso-2-to-3");
const getCountryIso3 = require("country-iso-2-to-3");
const TranslationService = require("../services/translationService");

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

  let totalPosts;
  let match = {};

  if (req.query.fl) {
    match.foundLost = new mongoose.Types.ObjectId(fl);
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
        region: 1,
        city: 1,
        cityName: "$City.labels.en",
        cityLabels: "$City.labels",
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

  res.json({
    postsWithUser,
    page: page + 1,
    totalPages: Math.ceil(totalPosts / pageSize),
    total: totalPosts,
  });
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
          region: 1,
          city: 1,
          cityName: "$City.labels.en",
          cityLabels: "$City.labels",
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
    console.log('Received request body:', req.body);
    console.log('Request headers:', req.headers);
    
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
    const formData = req.body;

  // Confirm required data
  console.log('Validating required fields:', {
    user: !!user,
    category: !!category,
    contact: !!contact,
    country: !!country,
    foundLost: !!foundLost,
    city: !!city,
    exactLocation: !!exactLocation,
    exactDate: !!exactDate
  });
  
  if (!user || !category || !contact || !country || !foundLost || !city || !exactLocation || !exactDate) {
    console.log('Missing required fields:', {
      user: !user,
      category: !category,
      contact: !contact,
      country: !country,
      foundLost: !foundLost,
      city: !city,
      exactLocation: !exactLocation,
      exactDate: !exactDate
    });
    return res.status(400).json({ 
      message: "All required fields are required",
      missing: {
        user: !user,
        category: !category,
        contact: !contact,
        country: !country,
        foundLost: !foundLost,
        city: !city,
        exactLocation: !exactLocation,
        exactDate: !exactDate
      }
    });
  }

  // Validate references
  const userExists = await User.exists({ _id: user });
  const countryExists = await Country.exists({ _id: country });
  const categoryExists = await Category.exists({ _id: category });
  const foundLostExists = await FoundLost.exists({ _id: foundLost });
  
  // Handle city validation - check if it's an ObjectId or a custom city name
  let cityId = city;
  let cityExists = true;
  let customCityName = null;
  
  if (city) {
    // Check if city is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(city)) {
      cityExists = await City.exists({ _id: city });
    } else {
      // It's a custom city name, we'll create it in the database
      customCityName = city;
      cityExists = true; // Allow custom city names
      cityId = null; // Don't set city field for custom names yet
    }
  }
  
  if (!userExists || !countryExists || !categoryExists || !foundLostExists || !cityExists) {
    return res.status(400).json({ message: "Invalid reference in user/country/category/foundLost/city" });
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

  // Handle city field - create custom city if needed
  if (cityId) {
    postData.city = cityId;
  } else if (customCityName) {
    try {
      console.log('Creating custom city:', customCityName);
      
      // Get country code for city creation
      const countryDoc = await Country.findById(country).lean();
      const countryCode = countryDoc?.code || 'UNKNOWN';
      console.log('Country code:', countryCode);
      
      // Detect the source language of the custom city name
      const sourceLanguage = TranslationService.isArabicText(customCityName) ? 'ar' : 'en';
      console.log('Detected source language:', sourceLanguage);
      
      // Translate the city name to all languages
      const translations = await TranslationService.translateCityName(customCityName, sourceLanguage);
      console.log('Translation result:', translations);
      
      // Generate a unique code for the city
      const cityCode = TranslationService.generateCityCode(customCityName, countryCode);
      console.log('Generated city code:', cityCode);
      
      // Check if city already exists with this code
      let existingCity = await City.findOne({ code: cityCode }).lean();
      console.log('Existing city check:', existingCity ? 'Found' : 'Not found');
      
      if (!existingCity) {
        // Create new city in the database
        const newCity = await City.create({
          code: cityCode,
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
          country: country,
          isDynamic: true, // Mark as dynamically created
          isCapital: false
        });
        
        console.log('Created new city:', newCity);
        cityId = newCity._id;
        postData.city = cityId;
      } else {
        // Use existing city
        console.log('Using existing city:', existingCity);
        cityId = existingCity._id;
        postData.city = cityId;
      }
    } catch (error) {
      console.error('Error creating custom city:', error);
      // Fallback: store in region field
      postData.region = customCityName;
    }
  }



  // Add contact preferences if provided
  if (contactPreferences) {
    try {
      const parsedContactPreferences = JSON.parse(contactPreferences);
      postData.contactPreferences = parsedContactPreferences;
    } catch (error) {
      console.log('Error parsing contact preferences:', error);
    }
  }

  // Add additional contact if provided
  if (additionalContact) {
    try {
      const parsedAdditionalContact = JSON.parse(additionalContact);
      postData.additionalContact = parsedAdditionalContact;
    } catch (error) {
      console.log('Error parsing additional contact:', error);
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
  console.log('Creating post with data:', postData);
  
  const post = await Post.create(postData);
  console.log('Post created successfully:', post._id);

  if (post) {
    // Created
    return res.status(201).json({ 
      message: "New post created",
      postId: post._id 
    });
  } else {
    return res.status(400).json({ message: "Invalid post data received" });
  }
  } catch (error) {
    console.error('Error in createNewPost:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: "Error creating post", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
