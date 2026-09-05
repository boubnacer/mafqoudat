const multer = require('multer');

// Create a multer instance specifically for parsing FormData without file handling
const formDataParser = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Allow all files for parsing, we'll handle validation later
    cb(null, true);
  },
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

// Middleware to parse FormData and extract fields
const parseFormData = (req, res, next) => {
  // Only process if it's FormData
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Use multer to parse the FormData
    formDataParser.any()(req, res, (err) => {
      if (err) {
        console.error('FormData parsing error:', err);
        return res.status(400).json({
          message: 'FormData parsing failed',
          error: err.message,
          isError: true
        });
      }

      // Move files to req.file for compatibility with existing code
      if (req.files && req.files.length > 0) {
        req.file = req.files[0]; // Take the first file
      }

      next();
    });
  } else {
    next();
  }
};

module.exports = { parseFormData };
