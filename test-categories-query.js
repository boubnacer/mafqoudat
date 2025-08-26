require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testCategoriesQuery() {
  try {
    console.log('🔌 Testing categories query...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const Category = require('./server/models/Category');
    
    // Test 1: Get all categories
    console.log('\n📊 Test 1: All categories');
    const allCategories = await Category.find().lean().exec();
    console.log(`Total categories: ${allCategories.length}`);
    
    if (allCategories.length > 0) {
      console.log('Sample category:', JSON.stringify(allCategories[0], null, 2));
    }
    
    // Test 2: Get categories with isActive = true
    console.log('\n📊 Test 2: Categories with isActive = true');
    const activeCategories = await Category.find({ isActive: true }).lean().exec();
    console.log(`Active categories: ${activeCategories.length}`);
    
    // Test 3: Get categories with isActive = null
    console.log('\n📊 Test 3: Categories with isActive = null');
    const nullActiveCategories = await Category.find({ isActive: null }).lean().exec();
    console.log(`Null isActive categories: ${nullActiveCategories.length}`);
    
    // Test 4: Get categories with isActive field exists
    console.log('\n📊 Test 4: Categories where isActive field exists');
    const hasActiveField = await Category.find({ isActive: { $exists: true } }).lean().exec();
    console.log(`Categories with isActive field: ${hasActiveField.length}`);
    
    // Test 5: Get categories without isActive filter
    console.log('\n📊 Test 5: Categories without isActive filter (like the API)');
    const noFilterCategories = await Category.find()
      .select('code labels flag icon color isActive description')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    console.log(`Categories without filter: ${noFilterCategories.length}`);
    
    if (noFilterCategories.length > 0) {
      console.log('Sample category without filter:', JSON.stringify(noFilterCategories[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCategoriesQuery();
