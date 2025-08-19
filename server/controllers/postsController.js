const Post = require("../models/Post");
const User = require("../models/User");
const Country = require("../models/Country");
const Category = require("../models/Category");
const FoundLost = require("../models/FoundLost");
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
      { region: { $regex: search, $options: 'i' } },
      { contact: { $regex: search, $options: 'i' } },
      { "Category.code": { $regex: search, $options: 'i' } }
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
        region: 1,
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

  // we should get the country name for the default value in the dropdown !
  const post = await Post.findOne({ _id: id });

  res.status(200).json(post);
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
  const { user, country, category, region, contact, foundLost } = req.body;
  const formData = req.body;

  // Confirm data
  if (!user || !category || !region || !contact || !country || !foundLost) {
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

  // Prepare post data
  const postData = {
    user,
    category,
    region,
    country,
    contact,
    foundLost,
  };

  // Add Cloudinary image data if available
  if (req.cloudinaryResult) {
    postData.cloudinaryUrl = req.cloudinaryResult.url;
    postData.cloudinaryPublicId = req.cloudinaryResult.public_id;
    // Keep backward compatibility with image field
    postData.image = req.cloudinaryResult.url;
  }

  // Create and store the new post
  const post = await Post.create(postData);

  if (post) {
    // Created
    return res.status(201).json({ 
      message: "New post created",
      postId: post._id 
    });
  } else {
    return res.status(400).json({ message: "Invalid post data received" });
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
    region,
    contact,
    returned,
    foundLost,
    reported,
    reportedTxt,
  } = req.body;

  // Confirm data
  if (
    !id ||
    !user ||
    !category ||
    !region ||
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
  post.region = region;
  post.contact = contact;
  post.returned = returned;
  post.foundLost = foundLost;

  if (typeof reported === "boolean") {
    post.reported = reported;
    post.reportedTxt = reportedTxt;
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
  updatePost,
  deletePost,
};
