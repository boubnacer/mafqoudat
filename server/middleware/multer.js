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

// Magic-byte signatures for the formats fileFilter claims to allow.
//
// fileFilter can only see what the client chose to tell us: `file.mimetype` is
// taken verbatim from the multipart part header, and the extension check below
// it is skipped entirely when the filename carries no extension. So a file of
// any kind, sent as `Content-Type: image/jpeg` under a name like `blob`,
// passed every check. multer's fileFilter runs before any bytes are buffered,
// so the only place this can be answered is uploadToCloudinaryMiddleware,
// where req.file.buffer exists.
const IMAGE_SIGNATURES = [
  { mime: 'image/jpeg', test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  { mime: 'image/gif', test: (b) => b.length >= 6 && b.toString('ascii', 0, 6).match(/^GIF8[79]a$/) !== null },
  {
    mime: 'image/webp',
    test: (b) =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

// The real format of the bytes, or null when they are not an image we accept.
// Deliberately answers on the content alone and ignores the declared mimetype:
// the two disagreeing is normal and harmless (a phone labelling a JPEG
// image/jpg, a client re-encoding to WebP without relabelling), while the
// content not being an image at all is the thing worth refusing.
const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;
  const match = IMAGE_SIGNATURES.find((signature) => signature.test(buffer));
  return match ? match.mime : null;
};

// Enhanced file filter with security checks
const fileFilter = (req, file, cb) => {
  // Check file type - only allow common image MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type! Allowed: ${allowedMimeTypes.join(', ')}`), false);
  }

  // Check file extension - only if filename has an extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // If filename has an extension, validate it
  if (fileExtension && fileExtension !== '') {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error(`Invalid file extension! Allowed: ${allowedExtensions.join(', ')}`), false);
    }
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
    // Handle files object from uploadWithFields.fields()
    if (req.files && req.files.image && req.files.image.length > 0) {
      req.file = req.files.image[0]; // Extract the first image file
    } else if (req.files && req.files.image) {
      req.file = req.files.image; // If it's not an array, use directly
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

      // The only check on this path that the uploader does not control. See
      // detectImageType above for why the declared mimetype cannot carry it.
      const detectedType = detectImageType(req.file.buffer);
      if (!detectedType) {
        return res.status(400).json({
          error: 'Invalid file type! Allowed: image/jpeg, image/png, image/gif, image/webp',
          isError: true
        });
      }
      req.file.detectedMimeType = detectedType;

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

module.exports = { upload, uploadWithFields, uploadToCloudinaryMiddleware, detectImageType };
