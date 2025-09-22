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
  console.log('🔧 FormData parser middleware called');
  console.log('📥 Content-Type:', req.headers['content-type']);
  console.log('📥 Request method:', req.method);
  console.log('📥 Request URL:', req.url);
  
  // Only process if it's FormData
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('📋 Processing FormData...');
    
    // Use multer to parse the FormData
    formDataParser.any()(req, res, (err) => {
      if (err) {
        console.error('❌ FormData parsing error:', err);
        return res.status(400).json({
          message: 'FormData parsing failed',
          error: err.message,
          isError: true
        });
      }
      
      console.log('✅ FormData parsed successfully');
      console.log('📥 Parsed body keys:', Object.keys(req.body));
      console.log('📥 Parsed files:', req.files ? req.files.length : 0);
      
      // Move files to req.file for compatibility with existing code
      if (req.files && req.files.length > 0) {
        req.file = req.files[0]; // Take the first file
        console.log('📷 File extracted:', req.file ? req.file.fieldname : 'none');
      }
      
      next();
    });
  } else {
    console.log('📋 Not FormData, skipping FormData parsing');
    next();
  }
};

console.log('📦 FormData parser middleware loaded successfully');

module.exports = { parseFormData };
