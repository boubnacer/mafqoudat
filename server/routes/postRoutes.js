const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const commentsController = require("../controllers/commentsController");
const { verifyJWT } = require("../middleware/jwtSecurity");
const optionalAuth = require("../middleware/optionalAuth");
const trackPostView = require("../middleware/postViewTracker");
const attachLivePostStats = require("../middleware/postStatsOverlay");
const { dynamicDataCache, paginatedCache, invalidateCache } = require("../middleware/cacheMiddleware");
const { 
  postsCache, 
  paginatedCache: optimizedPaginatedCache, 
  searchResultsCache,
  invalidateCache: optimizedInvalidateCache 
} = require("../middleware/optimizedCacheMiddleware");
const { generateFieldSelectionDocs, POSTS_SCHEMA } = require("../utils/graphqlFieldSelection");
const { upload, uploadWithFields, uploadToCloudinaryMiddleware } = require("../middleware/multer");
const { validateRequest, validationSets, commonValidations } = require("../middleware/validation");
const { parseFormData } = require("../middleware/formDataParser");
const { upload: uploadRateLimit, report: reportRateLimit, search: searchRateLimit, createPost: createPostLimit, imageUpload: imageUploadLimit, createRateLimiter } = require("../middleware/rateLimiting");

// Keyed by account rather than IP: everything it guards runs after verifyJWT,
// and IP keying on this platform's CGNAT-heavy networks would throttle
// unrelated people together. Generous enough for a real back-and-forth about
// a lost item, tight enough that one account cannot flood a thread.
const commentActionLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => (req.user ? `user:${req.user}` : `ip:${req.ip}`),
  message: "Too many comments, please slow down",
});

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

// Public routes - still reachable by guests, but optionalAuth identifies a
// signed-in viewer so the controller can drop posts by users they have blocked.
// It has to run BEFORE the cache middleware: those key on the viewer, and a key
// computed before the token is read would serve one viewer's filtered listing to
// everyone else.
// attachLivePostStats sits ahead of every cache layer below (the shared
// optimizedPaginatedCache/searchResultsCache middleware, and getUserPosts'
// own inline cache) on purpose: it wraps res.json before a cache hit can
// short-circuit past the controller, so views/social/socialStats are always
// merged in fresh regardless of which path produced the rest of the response.
router.route("/")
  .get(
    // searchRateLimit, // TEMPORARILY DISABLED for feature testing - re-enable before shipping to prod
    optionalAuth,
    commonValidations.pagination(),
    commonValidations.searchQuery(),
    validateRequest,
    attachLivePostStats,
    optimizedPaginatedCache('posts'),
    postsController.getAllPosts
  );

router.route("/filtered")
  .get(
    // searchRateLimit, // TEMPORARILY DISABLED for feature testing - re-enable before shipping to prod
    optionalAuth,
    commonValidations.pagination(),
    commonValidations.searchQuery(),
    validateRequest,
    attachLivePostStats,
    searchResultsCache('posts-filtered'),
    postsController.getFilteredPosts
  );

router.route("/user")
  .get(
    verifyJWT,
    // searchRateLimit, // TEMPORARILY DISABLED for feature testing - re-enable before shipping to prod
    commonValidations.pagination(),
    commonValidations.searchQuery(),
    validateRequest,
    attachLivePostStats,
    postsController.getUserPosts
  );

// trackPostView sits ahead of the cache on purpose: on a cache hit the
// controller never runs, so a counter incremented there would miss most views.
router.route("/:id")
  .get(
    commonValidations.objectId('id'),
    validateRequest,
    trackPostView,
    attachLivePostStats,
    postsCache('post-detail'),
    postsController.getPost
  );

// Comment thread on a listing. Deliberately uncached: a thread whose whole
// point is "someone may have just told you where your thing is" is the wrong
// place to serve a 10-minute-old copy, and it is a cheap query.
//
// optionalAuth on the read so the response can mark which comments this
// particular viewer may delete or report, and so blocked authors drop out for
// a signed-in reader - guests still get the thread, just without those flags.
router.route("/:id/comments")
  .get(
    commonValidations.objectId('id'),
    validateRequest,
    optionalAuth,
    commentsController.getPostComments
  )
  .post(
    verifyJWT,
    commentActionLimit,
    commonValidations.objectId('id'),
    validationSets.commentCreation,
    validateRequest,
    commentsController.createComment
  );

router.route("/:id/comments/:commentId")
  .delete(
    verifyJWT,
    commonValidations.objectId('id'),
    commonValidations.objectId('commentId'),
    validateRequest,
    commentsController.deleteComment
  );

router.route("/:id/comments/:commentId/report")
  .post(
    verifyJWT,
    reportRateLimit,
    commonValidations.objectId('id'),
    commonValidations.objectId('commentId'),
    validationSets.commentReport,
    validateRequest,
    commentsController.reportComment
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
    // createPostLimit, // TEMPORARILY DISABLED for feature testing - re-enable before shipping to prod
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
    // Length limits on the free-text fields, same bounds as create. Without
    // this an edit could store a description of any size at all.
    validationSets.postUpdate,
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
