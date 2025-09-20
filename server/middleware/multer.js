const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { uploadToCloudinary } = require("../config/optimizedCloudinary");

// Memory-optimized storage configuration
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

// Configure multer with memory optimization
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Reduced to 2MB limit to save memory
    files: 1, // Limit to 1 file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
  }
});

// Memory-optimized middleware to handle Cloudinary upload
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  let tempFilePath = null;
  
  try {
    console.log('Multer middleware - req.file:', req.file ? 'File present' : 'No file');
    
    if (req.file) {
      // Validate file size before processing
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File size too large. Maximum 2MB allowed.' 
        });
      }
      
      // Use os.tmpdir() for cross-platform compatibility
      const os = require('os');
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `${Date.now()}-${Math.random().toString(36).substring(7)}-${req.file.originalname}`);
      
      // Store buffer before clearing it
      const fileBuffer = req.file.buffer;
      
      // Write file asynchronously to prevent blocking
      await fs.writeFile(tempFilePath, fileBuffer);
      
      // Clear the buffer immediately to free memory
      req.file.buffer = null;
      
      // Upload to Cloudinary with optimization
      const result = await uploadToCloudinary({ 
        buffer: fileBuffer,
        path: tempFilePath 
      });
      
      // Store Cloudinary URL and public_id in request
      req.cloudinaryResult = result;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    next();
  } catch (error) {
    console.error('Error in uploadToCloudinaryMiddleware:', error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file on error:', cleanupError.message);
      }
    }
    
    next(error);
  } finally {
    // Always clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError.message);
      }
    }
  }
};

module.exports = { upload, uploadToCloudinaryMiddleware };
