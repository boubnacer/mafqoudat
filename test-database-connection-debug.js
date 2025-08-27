const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnectionDebug() {
  console.log('🔍 Testing database connection debug...\n');
  
  try {
    // Step 1: Connect to the same database as Railway
    console.log('1️⃣ Connecting to MongoDB...');
    const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('Connection host:', mongoose.connection.host);
    console.log('Connection name:', mongoose.connection.name);
    
    // Step 2: Import the same models as the post controller
    console.log('\n2️⃣ Testing model imports...');
    const User = require('./server/models/User');
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    
    console.log('✅ Models imported successfully');
    
    // Step 3: Test the exact queries from the post controller
    console.log('\n3️⃣ Testing exact post controller queries...');
    
    const testIds = {
      user: '68af89bb30464c5a97ca8fcf',
      country: '68a4b54ab46524c54c553cae',
      category: '68a4b54ab46524c54c553cc9',
      foundLost: '68a4b54ab46524c54c553cc3'
    };
    
    console.log('Testing IDs:', testIds);
    
    // Test User.findById
    console.log('\n🔍 Testing User.findById...');
    const userExists = await User.findById(testIds.user).lean();
    console.log('User validation:', { user: testIds.user, exists: !!userExists });
    
    // Test Country.findById
    console.log('\n🔍 Testing Country.findById...');
    const countryExists = await Country.findById(testIds.country).lean();
    console.log('Country validation:', { country: testIds.country, exists: !!countryExists });
    
    // Test Category.findById
    console.log('\n🔍 Testing Category.findById...');
    const categoryExists = await Category.findById(testIds.category).lean();
    console.log('Category validation:', { category: testIds.category, exists: !!categoryExists });
    
    // Test FoundLost.findById
    console.log('\n🔍 Testing FoundLost.findById...');
    const foundLostExists = await FoundLost.findById(testIds.foundLost).lean();
    console.log('FoundLost validation:', { foundLost: testIds.foundLost, exists: !!foundLostExists });
    
    // Step 4: Test alternative queries to see if data exists
    console.log('\n4️⃣ Testing alternative queries...');
    
    // Test Country.find() to see all countries
    const allCountries = await Country.find().select('_id code labels.en').lean();
    console.log('All countries count:', allCountries.length);
    console.log('First 5 countries:', allCountries.slice(0, 5));
    
    // Test Category.find() to see all categories
    const allCategories = await Category.find().select('_id code labels.en').lean();
    console.log('All categories count:', allCategories.length);
    console.log('First 5 categories:', allCategories.slice(0, 5));
    
    // Test FoundLost.find() to see all found/lost options
    const allFoundLost = await FoundLost.find().select('_id code labels.en').lean();
    console.log('All found/lost count:', allFoundLost.length);
    console.log('All found/lost:', allFoundLost);
    
    // Step 5: Check if our specific IDs exist in the collections
    console.log('\n5️⃣ Checking if our IDs exist in collections...');
    
    const ourCountry = allCountries.find(c => c._id.toString() === testIds.country);
    const ourCategory = allCategories.find(c => c._id.toString() === testIds.category);
    const ourFoundLost = allFoundLost.find(f => f._id.toString() === testIds.foundLost);
    
    console.log('Our country in collection:', ourCountry ? '✅ YES' : '❌ NO');
    console.log('Our category in collection:', ourCategory ? '✅ YES' : '❌ NO');
    console.log('Our foundLost in collection:', ourFoundLost ? '✅ YES' : '❌ NO');
    
    if (ourCountry) console.log('  Country details:', ourCountry);
    if (ourCategory) console.log('  Category details:', ourCategory);
    if (ourFoundLost) console.log('  FoundLost details:', ourFoundLost);
    
    // Step 6: Test ObjectId validation
    console.log('\n6️⃣ Testing ObjectId validation...');
    
    const isValidUser = mongoose.Types.ObjectId.isValid(testIds.user);
    const isValidCountry = mongoose.Types.ObjectId.isValid(testIds.country);
    const isValidCategory = mongoose.Types.ObjectId.isValid(testIds.category);
    const isValidFoundLost = mongoose.Types.ObjectId.isValid(testIds.foundLost);
    
    console.log('ObjectId validation:');
    console.log('- User ID valid:', isValidUser);
    console.log('- Country ID valid:', isValidCountry);
    console.log('- Category ID valid:', isValidCategory);
    console.log('- FoundLost ID valid:', isValidFoundLost);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('- User exists:', !!userExists);
    console.log('- Country exists:', !!countryExists);
    console.log('- Category exists:', !!categoryExists);
    console.log('- FoundLost exists:', !!foundLostExists);
    
    if (userExists && countryExists && categoryExists && foundLostExists) {
      console.log('\n🎉 All validations pass! The issue might be elsewhere.');
    } else {
      console.log('\n🚨 Some validations fail. This explains the post creation issue.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

testDatabaseConnectionDebug().catch(console.error);
