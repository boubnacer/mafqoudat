const multer = require("multer");
const path = require("path");
const { uploadToCloudinary } = require("../config/cloudinary");

// Configure storage - Use memory storage for Cloudinary
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to handle Cloudinary upload
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    if (req.file) {
      // Convert buffer to temporary file path for Cloudinary
      const tempFilePath = `/tmp/${Date.now()}-${req.file.originalname}`;
      require('fs').writeFileSync(tempFilePath, req.file.buffer);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary({ path: tempFilePath });
      
      // Store Cloudinary URL and public_id in request
      req.cloudinaryResult = result;
      
      // Clean up temporary file
      require('fs').unlinkSync(tempFilePath);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadToCloudinaryMiddleware };
