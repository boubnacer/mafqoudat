const mongoose = require('mongoose');

async function checkCategoryId() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Category = require('./server/models/Category');
    const Post = require('./server/models/Post');

    // Check if the category ID exists
    const categoryId = '68a4b54ab46524c54c553cc9';
    const category = await Category.findById(categoryId);
    
    if (category) {
      console.log('✅ Category found:');
      console.log(`  - ID: ${category._id}`);
      console.log(`  - Code: ${category.code}`);
      console.log(`  - Labels:`, category.labels);
    } else {
      console.log('❌ Category not found with ID:', categoryId);
    }

    // Get all categories to see what's available
    const allCategories = await Category.find();
    console.log(`\n📋 All available categories (${allCategories.length}):`);
    allCategories.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.code} (${cat.labels?.en})`);
    });

    // Check posts that have this category ID
    const postsWithCategory = await Post.find({ category: categoryId });
    console.log(`\n📝 Posts with category ${categoryId}: ${postsWithCategory.length}`);

    if (postsWithCategory.length > 0) {
      console.log('Sample post:');
      const samplePost = postsWithCategory[0];
      console.log(`  - Post ID: ${samplePost._id}`);
      console.log(`  - Category: ${samplePost.category}`);
      console.log(`  - City: ${samplePost.city}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

console.log('🔍 Checking category ID...');
checkCategoryId();
