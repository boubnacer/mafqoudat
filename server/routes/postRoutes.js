const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const { verifyJWT } = require("../middleware/jwtSecurity");
const { dynamicDataCache, paginatedCache, invalidateCache } = require("../middleware/cacheMiddleware");
const { 
  postsCache, 
  paginatedCache: optimizedPaginatedCache, 
  searchResultsCache,
  invalidateCache: optimizedInvalidateCache 
} = require("../middleware/optimizedCacheMiddleware");
const { postsOptimizationMiddleware } = require("../middleware/responseOptimization");
const { generateFieldSelectionDocs, POSTS_SCHEMA } = require("../utils/graphqlFieldSelection");
const { upload, uploadWithFields, uploadToCloudinaryMiddleware } = require("../middleware/multer");
const { validateRequest, validationSets, commonValidations } = require("../middleware/validation");
const { parseFormData } = require("../middleware/formDataParser");
const { upload: uploadRateLimit, report: reportRateLimit, search: searchRateLimit, createPost: createPostLimit, imageUpload: imageUploadLimit } = require("../middleware/rateLimiting");

// The image-upload limiter only runs after multer has parsed the multipart body -
// that's the earliest point req.files is populated, so it's the earliest point we
// can tell whether this particular request actually contains an image. Requests
// without an image skip it entirely and are never counted against it.
const conditionalImageUploadLimit = (req, res, next) => {
  const hasImage = !!(req.files && req.files.image && req.files.image.length > 0);
  if (hasImage) {
    return imageUploadLimit(req, res, next);
  }
  next();
};

// Public routes - no authentication required (using optimized caching)
router.route("/")
  .get(
    searchRateLimit,
    commonValidations.pagination(),
    validateRequest,
    optimizedPaginatedCache('posts'), 
    postsController.getAllPosts
  );

router.route("/filtered")
  .get(
    searchRateLimit,
    commonValidations.pagination(),
    validateRequest,
    searchResultsCache('posts-filtered'), 
    postsController.getFilteredPosts
  );

router.route("/user")
  .get(
    verifyJWT,
    searchRateLimit,
    commonValidations.pagination(),
    validateRequest,
    postsController.getUserPosts
  );

router.route("/:id")
  .get(
    commonValidations.objectId('id'),
    validateRequest,
    postsCache('post-detail'), 
    postsController.getPost
  );

// Field selection documentation endpoint
router.route("/fields")
  .get((req, res) => {
    const docs = generateFieldSelectionDocs(POSTS_SCHEMA);
    res.json({
      success: true,
      data: docs,
      usage: {
        description: "Use the 'fields' or 'select' query parameter to specify which fields to return",
        examples: [
          "GET /posts?fields=id,description,contact",
          "GET /posts?fields=id,description,user{username},category{code}",
          "GET /posts?fields=id,description,contact,exactLocation,city{code,labels}"
        ],
        syntax: {
          simple: "field1,field2,field3",
          nested: "field1,field2{child1,child2},field3",
          description: "Use comma to separate fields, curly braces for nested selection"
        }
      }
    });
  });

// Optimization test endpoint
router.route("/optimization-test")
  .get(...postsOptimizationMiddleware(), (req, res) => {
    const testData = {
      postsWithUser: [
        {
          _id: "test123",
          description: "Test post for optimization demonstration",
          contact: "test@example.com",
          exactLocation: "Test Location",
          createdAt: new Date(),
          username: "testuser",
          categoryname: "ELECTRONICS",
          countryname: "MA",
          cityName: "Casablanca",
          image: "https://res.cloudinary.com/test/image/upload/test.jpg",
          returned: false,
          user: {
            _id: "user123",
            username: "testuser"
          },
          category: {
            _id: "cat123",
            code: "ELECTRONICS",
            labels: { en: "Electronics", ar: "إلكترونيات", fr: "Électronique" }
          },
          country: {
            _id: "country123",
            code: "MA",
            labels: { en: "Morocco", ar: "المغرب", fr: "Maroc" }
          },
          city: {
            id: "city123",
            code: "CASABLANCA",
            labels: { en: "Casablanca", ar: "الدار البيضاء", fr: "Casablanca" },
            isDynamic: false
          }
        }
      ],
      page: 1,
      totalPages: 1,
      total: 1
    };

    // Add optimization metadata
    testData._metadata = {
      timestamp: new Date().toISOString(),
      optimization: {
        fieldProjection: !!req.selectedFields,
        compression: true,
        cacheHeaders: true,
        paginationOptimized: true
      },
      testMode: true,
      description: "This is a test endpoint to demonstrate API optimization features"
    };

    res.json(testData);
  });

// Simple health check endpoint to test header setting
router.route("/health-check")
  .get((req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "Headers should be set correctly without errors"
    });
  });

// Protected routes - require authentication
router.use(verifyJWT);

// Report route - requires authentication
router.route("/report").post(
  reportRateLimit,
  validationSets.reportSubmission,
  validateRequest,
  postsController.submitPostReport
);

router
  .route("/")
  .post(
    createPostLimit,
    (req, res, next) => {
      uploadWithFields.fields([
        { name: 'image', maxCount: 1 },
        { name: 'postData', maxCount: 1 }
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: { message: 'File upload error: ' + err.message }
          });
        }
        next();
      });
    },
    conditionalImageUploadLimit,
    uploadToCloudinaryMiddleware,
    validationSets.postCreation,
    validateRequest,
    optimizedInvalidateCache([], 'posts'),
    postsController.createNewPost
  )
  .patch(
    uploadRateLimit,
    (req, res, next) => {
      uploadWithFields.fields([
        { name: 'image', maxCount: 1 },
        { name: 'postData', maxCount: 1 }
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ 
            success: false, 
            error: { message: 'File upload error: ' + err.message } 
          });
        }
        next();
      });
    },
    uploadToCloudinaryMiddleware,
    // Custom validation for FormData requests
    (req, res, next) => {
      // If this is a FormData request (has postData field), validate the parsed data
      if (req.body.postData) {
        try {
          const postData = JSON.parse(req.body.postData);
          if (!postData.id || !postData.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
              success: false, 
              error: { message: 'Invalid post ID in FormData' } 
            });
          }
          // Add the id to req.body for compatibility with existing validation
          req.body.id = postData.id;
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            error: { message: 'Invalid postData format' } 
          });
        }
      }
      next();
    },
    commonValidations.bodyObjectId('id'),
    validateRequest,
    optimizedInvalidateCache([], 'posts'), 
    postsController.updatePost
  )
  .delete(
    commonValidations.bodyObjectId('id'),
    validateRequest,
    optimizedInvalidateCache([], 'posts'), 
    postsController.deletePost
  );

// Mark post as returned route - requires authentication
router.patch('/:postId/mark-returned', 
  commonValidations.objectId('postId'),
  validateRequest,
  optimizedInvalidateCache([], 'posts'),
  postsController.markPostAsReturned
);

module.exports = router;
