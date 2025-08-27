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
  console.log('=== CREATE NEW POST START ===');
  
  try {
    console.log('1. Function entered successfully');
    console.log('2. About to log request body...');
    console.log('Received request body:', req.body);
    console.log('3. About to log request headers...');
    console.log('Request headers:', req.headers);
    console.log('4. About to extract fields...');
    
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

    console.log('5. Fields extracted successfully');
    console.log('Extracted fields:', {
      user, 
      country, 
      category, 
      contact, 
      foundLost,
      city,
      exactLocation,
      exactDate,
      description
    });

    console.log('6. About to validate required fields...');

  // Confirm required data
  console.log('Validating required fields...');
  const requiredFields = {
    user: !!user,
    category: !!category,
    contact: !!contact,
    country: !!country,
    foundLost: !!foundLost,
    exactLocation: !!exactLocation,
    exactDate: !!exactDate
  };
  
  console.log('7. Required fields validation completed');
  console.log('Required fields validation:', requiredFields);
  
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  console.log('8. Missing fields check completed');
  
  if (missingFields.length > 0) {
    console.log('Missing required fields:', missingFields);
    return res.status(400).json({ 
      message: "All required fields are required",
      missing: missingFields
    });
  }

  console.log('9. All required fields present, proceeding with validation...');

  // Validate references
  console.log('10. About to validate references...');
  
  try {
    console.log('11. Starting user validation...');
    const userExists = await User.findById(user).lean();
    console.log('User validation:', { user, exists: !!userExists });
    
    console.log('12. Starting country validation...');
    const countryExists = await Country.findById(country).lean();
    console.log('Country validation:', { country, exists: !!countryExists });
    
    console.log('13. Starting category validation...');
    const categoryExists = await Category.findById(category).lean();
    console.log('Category validation:', { category, exists: !!categoryExists });
    
    console.log('14. Starting foundLost validation...');
    const foundLostExists = await FoundLost.findById(foundLost).lean();
    console.log('FoundLost validation:', { foundLost, exists: !!foundLostExists });
    
    console.log('15. All reference validations completed');
    
    if (!userExists || !countryExists || !categoryExists || !foundLostExists) {
      console.log('Reference validation failed:', {
        userExists: !!userExists,
        countryExists: !!countryExists,
        categoryExists: !!categoryExists,
        foundLostExists: !!foundLostExists
      });
      return res.status(400).json({ 
        message: "Invalid reference in user/country/category/foundLost",
        details: {
          userExists: !!userExists,
          countryExists: !!countryExists,
          categoryExists: !!categoryExists,
          foundLostExists: !!foundLostExists
        }
      });
    }
  } catch (validationError) {
    console.error('Error during reference validation:', validationError);
    return res.status(400).json({ 
      message: "Error validating references",
      error: validationError.message
    });
  }
  
  // Handle city validation - simplified approach
  console.log('16. About to validate city...');
  let cityId = null;
  
  try {
    if (city && mongoose.Types.ObjectId.isValid(city)) {
      console.log('17. City is valid ObjectId, checking database...');
      const cityDoc = await City.findById(city).lean();
      if (cityDoc) {
        cityId = city;
        console.log('City validation:', { city, isObjectId: true, exists: true });
      } else {
        console.log('City validation:', { city, isObjectId: true, exists: false });
      }
    } else if (city) {
      // For custom city names, store in region field for now
      console.log('City validation:', { city, isObjectId: false, storingInRegion: true });
    }
    console.log('18. City validation completed');
  } catch (cityError) {
    console.error('Error during city validation:', cityError);
    // Don't fail the request for city validation errors, just log them
    console.log('City validation error, continuing without city...');
  }
  
  console.log('19. Final validation check passed');

  // Prepare post data
  console.log('20. About to prepare post data...');
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

  // Handle city field - simplified approach
  if (cityId) {
    postData.city = cityId;
    console.log('Added city ID to post data:', cityId);
  } else if (city && !mongoose.Types.ObjectId.isValid(city)) {
    // Store custom city name in region field
    postData.region = city;
    console.log('Added custom city to region field:', city);
  } else if (city) {
    // If city is provided but not a valid ObjectId and not a string, just log it
    console.log('City provided but not handled:', city);
  }

  // Add contact preferences if provided
  if (contactPreferences) {
    try {
      const parsedContactPreferences = JSON.parse(contactPreferences);
      postData.contactPreferences = parsedContactPreferences;
      console.log('Added contact preferences:', parsedContactPreferences);
    } catch (error) {
      console.log('Error parsing contact preferences:', error);
      // Use default contact preferences
      postData.contactPreferences = {
        phone: true,
        email: false,
        whatsapp: false
      };
      console.log('Using default contact preferences');
    }
  }

  // Add additional contact if provided
  if (additionalContact) {
    try {
      const parsedAdditionalContact = JSON.parse(additionalContact);
      postData.additionalContact = parsedAdditionalContact;
      console.log('Added additional contact:', parsedAdditionalContact);
    } catch (error) {
      console.log('Error parsing additional contact:', error);
      // Use empty additional contact
      postData.additionalContact = {
        phone: "",
        email: "",
        whatsapp: ""
      };
      console.log('Using empty additional contact');
    }
  }

  // Add Cloudinary image data if available
  if (req.cloudinaryResult) {
    postData.cloudinaryUrl = req.cloudinaryResult.url;
    postData.cloudinaryPublicId = req.cloudinaryResult.public_id;
    // Keep backward compatibility with image field
    postData.image = req.cloudinaryResult.url;
    console.log('Added Cloudinary data to post');
  }

  // Create and store the new post
  console.log('21. About to create post in database...');
  console.log('Creating post with data:', JSON.stringify(postData, null, 2));
  
  try {
    console.log('21.1. Attempting to create post...');
    const post = await Post.create(postData);
    console.log('22. Post created successfully:', post._id);
    console.log('=== CREATE NEW POST SUCCESS ===');

    if (post) {
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
    console.error('Post creation error details:', {
      name: postCreationError.name,
      message: postCreationError.message,
      code: postCreationError.code
    });
    
    // Log the full error for debugging
    console.error('Full error object:', postCreationError);
    
    return res.status(500).json({ 
      message: "Error creating post in database", 
      error: postCreationError.message,
      details: {
        name: postCreationError.name,
        code: postCreationError.code
      }
    });
  }
  
  } catch (error) {
    console.error('=== CREATE NEW POST ERROR ===');
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
