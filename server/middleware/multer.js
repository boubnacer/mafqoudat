const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

// Use simple Cloudinary for now to ensure uploads work
let uploadToCloudinary;
try {
  // Try optimized first, but fallback to simple if there are issues
  uploadToCloudinary = require("../config/optimizedCloudinary").uploadToCloudinary;
} catch (error) {
  console.warn('⚠️ Optimized Cloudinary not available, using simple version');
  uploadToCloudinary = require("../config/simpleCloudinary").uploadToCloudinary;
}

// Memory-optimized storage configuration
const storage = multer.memoryStorage();

// Enhanced file filter with security checks
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Check file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed!'), false);
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension!'), false);
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.html$/i,
    /\.htm$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
    return cb(new Error('Suspicious file name detected!'), false);
  }

  cb(null, true);
};

// Configure multer with enhanced security and memory optimization
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1, // Limit to 1 file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Limit field name size
    fields: 10, // Limit number of fields
    parts: 20, // Limit number of parts
    headerPairs: 2000 // Limit header pairs
  }
});

// Create a multer instance that handles both files and fields
const uploadWithFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1, // Limit to 1 file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Limit field name size
    fields: 10, // Limit number of fields
    parts: 20, // Limit number of parts
    headerPairs: 2000 // Limit header pairs
  }
});

// Enhanced security middleware for file uploads
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  let tempFilePath = null;
  
  try {
    console.log('🔧 Multer middleware - req.file:', req.file ? 'File present' : 'No file');
    console.log('🔧 Multer middleware - req.files:', req.files ? req.files.length : 0);
    console.log('🔧 Multer middleware - req.body keys:', Object.keys(req.body));
    console.log('🔧 Multer middleware - req.body.postData exists:', !!req.body.postData);
    
    // Handle files array from uploadWithFields
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(file => file.fieldname === 'image');
      if (imageFile) {
        req.file = imageFile;
        console.log('🔧 Extracted image file from files array');
      }
    }
    
    if (req.file) {
      // Enhanced file validation
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File size too large. Maximum 2MB allowed.',
          isError: true
        });
      }

      // Check for minimum file size (prevent empty files)
      if (req.file.size < 100) {
        return res.status(400).json({ 
          error: 'File too small. Minimum 100 bytes required.',
          isError: true
        });
      }

      // Generate secure filename with hash
      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex').substring(0, 16);
      const sanitizedOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileExtension = path.extname(sanitizedOriginalName);
      
      // Use os.tmpdir() for cross-platform compatibility
      const os = require('os');
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `${fileHash}-${Date.now()}${fileExtension}`);
      
      // Store buffer before clearing it
      const fileBuffer = req.file.buffer;
      
      // Write file asynchronously to prevent blocking
      await fs.writeFile(tempFilePath, fileBuffer);
      
      // Clear the buffer immediately to free memory
      req.file.buffer = null;
      
      // Upload to Cloudinary with optimization
      let result;
      try {
        result = await uploadToCloudinary({ 
          buffer: fileBuffer,
          path: tempFilePath 
        });
      } catch (uploadError) {
        console.error('Upload failed with optimized version, trying simple version:', uploadError.message);
        // Fallback to simple Cloudinary
        const { uploadToCloudinary: simpleUpload } = require("../config/simpleCloudinary");
        result = await simpleUpload({ 
          path: tempFilePath 
        });
      }
      
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

module.exports = { upload, uploadWithFields, uploadToCloudinaryMiddleware };
