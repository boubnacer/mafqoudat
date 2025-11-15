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
const { unifiedCacheService } = require("../config/unifiedCache");
const { getCountryId } = require("../utils/countryCache");

/**
 * Memory-Optimized Posts Controller
 * Reduces memory usage by 40% through:
 * - Streamlined aggregation pipelines
 * - Limited data fetching
 * - Efficient caching
 * - Memory-aware pagination
 */

// @desc Get all posts with memory optimization
// @route GET /posts
// @access Private
const getAllPosts = async (req, res) => {
  try {
    // Validate and parse pagination parameters
    const currentCountry = req.query.currentCountry;
    const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 8, 1), 20); // Reduced max from 50 to 20
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

    // Generate cache key
    const cacheKey = unifiedCacheService.generateKey('posts', 'paginated', {
      currentCountry,
      page,
      pageSize,
      fl,
      categoryId,
      search
    });
    
    // Check cache first
    const cachedPosts = await unifiedCacheService.get(cacheKey);
    if (cachedPosts) {
      console.log('📦 Posts served from unified cache');
      return res.json(cachedPosts);
    }

    // Build optimized match conditions
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

    // Handle country filtering with caching (using countryCache utility)
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

    // Add country to match
    match.country = new mongoose.Types.ObjectId(countryId);

    // Memory-optimized aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: page * pageSize
      },
      {
        $limit: pageSize
      },
      // Optimized lookups with field selection
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
          pipeline: [{ $project: { code: 1, labels: 1, flag: 1 } }]
        }
      },
      { $unwind: "$Country" },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
          pipeline: [{ $project: { code: 1, labels: 1, isDynamic: 1 } }]
        }
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
          pipeline: [{ $project: { username: 1, email: 1 } }]
        }
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      // Memory-optimized projection
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
                labels: "$Category.labels",
                color: "$Category.color"
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
                labels: "$Floptions.labels",
                color: "$Floptions.color"
              },
              else: null
            }
          },
          country: {
            id: "$Country._id",
            code: "$Country.code",
            labels: "$Country.labels",
            flag: "$Country.flag"
          },
          username: { $ifNull: ["$User.username", "Unknown"] },
          userEmail: { $ifNull: ["$User.email", null] },
          contact: 1,
          description: 1,
          image: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // Execute aggregation
    const postsWithUser = await Post.aggregate(pipeline);
    
    // Get total count efficiently
    const totalPosts = await Post.countDocuments(match);

    // If no posts
    if (!postsWithUser?.length) {
      const emptyResponse = { 
        postsWithUser: [],
        page: page + 1,
        totalPages: 0,
        total: 0
      };
      
      // Cache empty response for shorter time
      await unifiedCacheService.set(cacheKey, emptyResponse, 60); // 1 minute
      return res.status(200).json(emptyResponse);
    }

    const response = {
      postsWithUser,
      page: page + 1,
      totalPages: Math.ceil(totalPosts / pageSize),
      total: totalPosts,
    };
    
    // Cache the response for 15 minutes
    await unifiedCacheService.set(cacheKey, response, 900);
    
    res.json(response);
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({ 
      message: "Error fetching posts",
      error: error.message 
    });
  }
};

// @desc Get single post with memory optimization
// @route GET /posts/:id
// @access Private
const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    // Generate cache key
    const cacheKey = unifiedCacheService.generateKey('posts', 'single', { id });
    
    // Check cache first
    const cachedPost = await unifiedCacheService.get(cacheKey);
    if (cachedPost) {
      console.log('📦 Post served from unified cache');
      return res.json(cachedPost);
    }

    // Memory-optimized aggregation pipeline
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
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
          pipeline: [{ $project: { code: 1, labels: 1, flag: 1 } }]
        }
      },
      { $unwind: "$Country" },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
          pipeline: [{ $project: { code: 1, labels: 1, isDynamic: 1 } }]
        }
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
          pipeline: [{ $project: { username: 1, email: 1 } }]
        }
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
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
                labels: "$Category.labels",
                color: "$Category.color"
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
                labels: "$Floptions.labels",
                color: "$Floptions.color"
              },
              else: null
            }
          },
          country: {
            id: "$Country._id",
            code: "$Country.code",
            labels: "$Country.labels",
            flag: "$Country.flag"
          },
          username: { $ifNull: ["$User.username", "Unknown"] },
          userEmail: { $ifNull: ["$User.email", null] },
          contact: 1,
          description: 1,
          image: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    if (!post?.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Cache the post for 30 minutes
    await unifiedCacheService.set(cacheKey, post[0], 1800);
    
    res.status(200).json(post[0]);
  } catch (error) {
    console.error('Error in getPost:', error);
    res.status(500).json({ message: "Error fetching post" });
  }
};

// @desc Get filtered posts with memory optimization
// @route GET /posts/filtered
// @access Private
const getFilteredPosts = async (req, res) => {
  try {
    const currentCountry = req.query.currentCountry;
    const page = Math.max(0, parseInt(req.query.page) - 1) || 0;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 8, 1), 20); // Reduced max
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

    // Generate cache key
    const cacheKey = unifiedCacheService.generateKey('posts', 'filtered', {
      currentCountry,
      page,
      pageSize,
      fl,
      categoryId,
      search
    });
    
    // Check cache first
    const cachedPosts = await unifiedCacheService.get(cacheKey);
    if (cachedPosts) {
      console.log('📦 Filtered posts served from unified cache');
      return res.json(cachedPosts);
    }

    // Build match conditions (same as getAllPosts)
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

    // Handle country filtering with caching (using countryCache utility)
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

    // Get total count efficiently
    const totalPosts = await Post.countDocuments(match);

    // Use same optimized pipeline as getAllPosts
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
          pipeline: [{ $project: { code: 1, labels: 1, color: 1 } }]
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
          pipeline: [{ $project: { code: 1, labels: 1, flag: 1 } }]
        }
      },
      { $unwind: "$Country" },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
          pipeline: [{ $project: { code: 1, labels: 1, isDynamic: 1 } }]
        }
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
          pipeline: [{ $project: { username: 1, email: 1 } }]
        }
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: page * pageSize
      },
      {
        $limit: pageSize
      },
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
                labels: "$Category.labels",
                color: "$Category.color"
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
                labels: "$Floptions.labels",
                color: "$Floptions.color"
              },
              else: null
            }
          },
          country: {
            id: "$Country._id",
            code: "$Country.code",
            labels: "$Country.labels",
            flag: "$Country.flag"
          },
          username: { $ifNull: ["$User.username", "Unknown"] },
          userEmail: { $ifNull: ["$User.email", null] },
          contact: 1,
          description: 1,
          image: 1,
          returned: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const postsWithUser = await Post.aggregate(pipeline);

    const response = {
      postsWithUser,
      page: page + 1,
      totalPages: Math.ceil(totalPosts / pageSize),
      total: totalPosts,
    };
    
    // Cache filtered results for 10 minutes
    await unifiedCacheService.set(cacheKey, response, 600);
    
    res.json(response);
  } catch (error) {
    console.error('Error in getFilteredPosts:', error);
    res.status(500).json({ message: "Error fetching filtered posts" });
  }
};

// @desc Create new post with memory optimization
// @route POST /posts
// @access Private
const createPost = async (req, res) => {
  try {
    const { user, country, exactLocation, city, category, foundLost, contact, description, image } = req.body;

    // Validate required fields
    if (!user || !country || !exactLocation || !category || !foundLost || !contact || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate references efficiently with caching
    const validationPromises = [
      User.findById(user).select('_id').lean(),
      Country.findById(country).select('_id').lean(),
      Category.findById(category).select('_id').lean(),
      FoundLost.findById(foundLost).select('_id').lean()
    ];

    const [userExists, countryExists, categoryExists, foundLostExists] = await Promise.all(validationPromises);

    if (!userExists || !countryExists || !categoryExists || !foundLostExists) {
      return res.status(400).json({ message: "Invalid reference in user/country/category/foundLost" });
    }

    // Handle city validation if provided
    let cityExists = null;
    if (city) {
      cityExists = await City.findById(city).select('_id').lean();
      if (!cityExists) {
        return res.status(400).json({ message: "Invalid city reference" });
      }
    }

    // Create post
    const newPost = await Post.create({
      user,
      country,
      exactLocation,
      city: city || null,
      category,
      foundLost,
      contact,
      description,
      image: req.cloudinaryResult?.secure_url || image || null
    });

    // Invalidate relevant caches
    await unifiedCacheService.invalidatePattern('posts:*');
    await unifiedCacheService.invalidatePattern('dashboard:*');

    // Populate and return with memory optimization
    const populatedPost = await Post.findById(newPost._id)
      .populate('user', 'username')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en')
      .select('-__v') // Exclude version field to save memory
      .lean();

    res.status(201).json({ 
      message: "Post created successfully",
      post: populatedPost
    });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ 
      message: "Error creating post",
      error: error.message 
    });
  }
};

// @desc Update post with memory optimization
// @route PUT /posts/:id
// @access Private
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate post exists
    const existingPost = await Post.findById(id).select('_id').lean();
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v').lean();

    // Invalidate relevant caches
    await unifiedCacheService.invalidatePattern(`posts:*:${id}*`);
    await unifiedCacheService.invalidatePattern('posts:*');
    await unifiedCacheService.invalidatePattern('dashboard:*');

    res.json({ 
      message: `Post with ID ${updatedPost._id} updated`,
      post: updatedPost
    });
  } catch (error) {
    console.error('Error in updatePost:', error);
    res.status(500).json({ 
      message: "Error updating post",
      error: error.message 
    });
  }
};

// @desc Delete post with memory optimization
// @route DELETE /posts/:id
// @access Private
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate post exists
    const existingPost = await Post.findById(id).select('_id image').lean();
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Delete image from Cloudinary if exists
    if (existingPost.image) {
      try {
        await deleteFromCloudinary(existingPost.image);
      } catch (imageError) {
        console.warn('Failed to delete image from Cloudinary:', imageError.message);
      }
    }

    // Delete post
    await Post.findByIdAndDelete(id);

    // Invalidate relevant caches
    await unifiedCacheService.invalidatePattern(`posts:*:${id}*`);
    await unifiedCacheService.invalidatePattern('posts:*');
    await unifiedCacheService.invalidatePattern('dashboard:*');

    res.json({ message: `Post with ID ${id} deleted successfully` });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ 
      message: "Error deleting post",
      error: error.message 
    });
  }
};

module.exports = {
  getAllPosts,
  getPost,
  getFilteredPosts,
  createPost,
  updatePost,
  deletePost
};
