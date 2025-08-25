const mongoose = require('mongoose');

// Your MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testYourDatabase() {
  console.log('🔍 Testing Your Database Directly...\\n');
  console.log('Connecting to your MongoDB...');
  
  try {
    // Connect to your database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to your MongoDB database');
    
    // Get the database instance
    const db = mongoose.connection.db;
    
    // Step 1: Check all collections
    console.log('\\n1. Checking all collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Step 2: Check posts collection
    console.log('\\n2. Checking posts collection...');
    const postsCollection = db.collection('posts');
    const postsCount = await postsCollection.countDocuments();
    console.log(`Posts count: ${postsCount}`);
    
    if (postsCount > 0) {
      const posts = await postsCollection.find({}).limit(5).toArray();
      console.log('Sample posts:');
      posts.forEach((post, index) => {
        console.log(`  ${index + 1}. ID: ${post._id}`);
        console.log(`     User: ${post.user}`);
        console.log(`     Country: ${post.country}`);
        console.log(`     Category: ${post.category}`);
        console.log(`     Found/Lost: ${post.foundLost}`);
        console.log(`     Location: ${post.exactLocation}`);
        console.log(`     Created: ${post.createdAt}`);
        console.log('');
      });
    }
    
    // Step 3: Check users collection
    console.log('\\n3. Checking users collection...');
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    console.log(`Users count: ${usersCount}`);
    
    if (usersCount > 0) {
      const users = await usersCollection.find({}).limit(3).toArray();
      console.log('Sample users:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}`);
        console.log(`     Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log('');
      });
    }
    
    // Step 4: Check countries collection
    console.log('\\n4. Checking countries collection...');
    const countriesCollection = db.collection('countries');
    const countriesCount = await countriesCollection.countDocuments();
    console.log(`Countries count: ${countriesCount}`);
    
    if (countriesCount > 0) {
      const morocco = await countriesCollection.findOne({ code: 'MA' });
      if (morocco) {
        console.log('Morocco found:');
        console.log(`  ID: ${morocco._id}`);
        console.log(`  Code: ${morocco.code}`);
        console.log(`  Labels: ${JSON.stringify(morocco.labels)}`);
      } else {
        console.log('❌ Morocco not found in countries collection');
      }
    }
    
    // Step 5: Check categories collection
    console.log('\\n5. Checking categories collection...');
    const categoriesCollection = db.collection('categories');
    const categoriesCount = await categoriesCollection.countDocuments();
    console.log(`Categories count: ${categoriesCount}`);
    
    if (categoriesCount > 0) {
      const electronics = await categoriesCollection.findOne({ code: 'ELECTRONICS' });
      if (electronics) {
        console.log('Electronics category found:');
        console.log(`  ID: ${electronics._id}`);
        console.log(`  Code: ${electronics.code}`);
      } else {
        console.log('❌ Electronics category not found');
      }
    }
    
    // Step 6: Check foundlosts collection
    console.log('\\n6. Checking foundlosts collection...');
    const foundlostsCollection = db.collection('foundlosts');
    const foundlostsCount = await foundlostsCollection.countDocuments();
    console.log(`Found/Lost options count: ${foundlostsCount}`);
    
    if (foundlostsCount > 0) {
      const foundlosts = await foundlostsCollection.find({}).toArray();
      console.log('Found/Lost options:');
      foundlosts.forEach((fl, index) => {
        console.log(`  ${index + 1}. ID: ${fl._id}`);
        console.log(`     Code: ${fl.code}`);
        console.log(`     Labels: ${JSON.stringify(fl.labels)}`);
      });
    }
    
    console.log('\\n🎉 Database check completed!');
    
    // Summary
    console.log('\\n📋 SUMMARY:');
    console.log(`Posts: ${postsCount}`);
    console.log(`Users: ${usersCount}`);
    console.log(`Countries: ${countriesCount}`);
    console.log(`Categories: ${categoriesCount}`);
    console.log(`Found/Lost Options: ${foundlostsCount}`);
    
    if (postsCount === 0) {
      console.log('\\n❌ No posts found in your database!');
      console.log('💡 This explains why the report functionality is not working.');
      console.log('   You need to create posts first.');
    } else {
      console.log('\\n✅ Posts found in your database!');
      console.log('💡 The issue might be with the deployment server connection.');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testYourDatabase();
