const mongoose = require('mongoose');

async function simpleDataFix() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');

    // Get the "OTHER" category
    const otherCategory = await Category.findOne({ code: 'OTHER' });
    if (!otherCategory) {
      console.log('❌ OTHER category not found, creating it...');
      const newOtherCategory = await Category.create({
        code: 'OTHER',
        labels: {
          en: 'Other',
          fr: 'Autre',
          ar: 'أخرى'
        },
        color: '#9E9E9E',
        isActive: true,
        description: 'Other items'
      });
      console.log('✅ Created OTHER category:', newOtherCategory._id);
    }

    // Get all posts that have invalid category references
    const posts = await Post.find();
    console.log(`📝 Found ${posts.length} posts to check`);

    let fixedCount = 0;

    for (const post of posts) {
      if (!post.category) {
        console.log(`❌ Post ${post._id}: No category assigned`);
        // Assign the OTHER category
        await Post.findByIdAndUpdate(post._id, { category: otherCategory._id });
        fixedCount++;
        console.log(`✅ Fixed post ${post._id}: Assigned OTHER category`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} posts with missing categories`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Uncomment the line below to run the fix
// simpleDataFix();
console.log('💡 To fix missing categories, uncomment the last line in this script and run it');
