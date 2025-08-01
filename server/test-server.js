const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
const testConnection = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connection successful');
    
    // Test basic operations
    const Country = require('./models/Country');
    const FoundLost = require('./models/FoundLost');
    const Category = require('./models/Category');
    
    const countries = await Country.countDocuments();
    const foundLost = await FoundLost.countDocuments();
    const categories = await Category.countDocuments();
    
    console.log(`✅ Database collections: ${countries} countries, ${foundLost} found/lost options, ${categories} categories`);
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Test environment variables
const testEnvironment = () => {
  const required = ['DATABASE_URI', 'ACCESS_TOKEN_SECRET', 'REFRECH_TOKEN_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ Environment variables configured');
  return true;
};

// Test file system
const fs = require('fs');
const path = require('path');

const testFileSystem = () => {
  const requiredDirs = ['uploads', 'logs'];
  const missing = requiredDirs.filter(dir => !fs.existsSync(dir));
  
  if (missing.length > 0) {
    console.log('⚠️  Creating missing directories:', missing.join(', '));
    missing.forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  }
  
  console.log('✅ File system ready');
};

// Run tests
const runTests = async () => {
  console.log('🧪 Running server tests...\n');
  
  testFileSystem();
  if (!testEnvironment()) {
    process.exit(1);
  }
  await testConnection();
  
  console.log('\n🎉 All tests passed! Server is ready for deployment.');
};

if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 