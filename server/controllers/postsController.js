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
  const page = parseInt(req.query.page) - 1 || 0;
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

  const postsWithUser = await Post.aggregate([
    {
      $match: {
        ...match,
        country: new mongoose.Types.ObjectId(currentCountry),
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
    { $unwind: "$User" },
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
      { $unwind: "$User" },
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
  const page = parseInt(req.query.page) - 1 || 0;
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
  const cityExists = city ? await City.exists({ _id: city }) : true;
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
    city,
    exactLocation,
    exactDate: new Date(exactDate),
    description: description || "",
  };



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
// @access Private
const submitPostReport = async (req, res) => {
  try {
    const { postId, reason, userId } = req.body;
    
    // Debug: Check request data
    console.log('Report submission - req.body:', req.body);
    console.log('Report submission - req.headers:', req.headers);
    
    // For public reports, we'll use the userId from the request body
    // If no userId provided, we'll use a default or anonymous user
    const reportingUserId = userId || 'anonymous';

    // Validate required fields
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false,
        message: "Post ID and reason are required" 
      });
    }

    // Find the post with proper population
    const post = await Post.findById(postId)
      .populate('user', 'username')
      .populate('category', 'code')
      .populate('country', 'code')
      .populate('foundLost', 'code')
      .lean()
      .exec();

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    // Prepare post data for email with proper field names
    const emailPostData = {
      _id: post._id,
      foundLost: post.foundLost?.code || post.foundLost,
      category: post.category?.code || post.category,
      country: post.country?.code || post.country,
      region: post.region || 'Unknown',
      city: post.city || 'Unknown',
      exactLocation: post.exactLocation || 'Unknown',
      contact: post.contact || 'Not provided',
      description: post.description || 'No description',
      createdAt: post.createdAt
    };

    // Get user data (if userId is provided and not anonymous)
    let user = null;
    if (reportingUserId && reportingUserId !== 'anonymous') {
      user = await User.findById(reportingUserId).lean().exec();
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
    } else {
      // Create anonymous user data for email
      user = {
        username: 'Anonymous User',
        email: 'anonymous@mafqoudat.com'
      };
    }

    // Send email notification to admin
    const emailNotification = require('../utils/emailNotification');
    const emailResult = await emailNotification.sendReportNotification(emailPostData, user, reason);

    if (!emailResult.success) {
      console.error('Failed to send report email:', emailResult.error);
      // Don't fail the request if email fails, just log it
    }

    // Note: We don't store report data in the database anymore
    // Reports are sent directly to admin via email

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
