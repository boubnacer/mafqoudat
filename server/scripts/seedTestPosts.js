const mongoose = require('mongoose');
require('dotenv').config();

const Country = require('../models/Country');
const FoundLost = require('../models/FoundLost');
const Category = require('../models/Category');
const Post = require('../models/Post');
const User = require('../models/User');

// Use production database URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@clustermafqm0.mty6zln.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=ClusterMafqM0';

const seedTestPosts = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check if we have required data
    const countries = await Country.find();
    const categories = await Category.find();
    const foundLostOptions = await FoundLost.find();
    
    console.log(`Found ${countries.length} countries, ${categories.length} categories, ${foundLostOptions.length} found/lost options`);

    if (countries.length === 0 || categories.length === 0 || foundLostOptions.length === 0) {
      console.log('❌ Missing required data. Please run seedData.js first to seed countries, categories, and found/lost options.');
      return;
    }

    // Get a test user or create one
    let testUser = await User.findOne();
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        username: 'testuser',
        email: 'test@mafqoudat.com',
        password: '$2b$10$dummy.hash.for.testing', // Dummy password hash
        country: countries[0]._id,
        isActive: true
      });
      console.log('✅ Created test user');
    }

    // Clear existing posts
    console.log('🗑️  Clearing existing posts...');
    await Post.deleteMany({});
    console.log('✅ Cleared existing posts');

    // Create test posts
    const testPosts = [
      {
        user: testUser._id,
        country: countries[0]._id, // Morocco
        category: categories[0]._id, // Electronics
        foundLost: foundLostOptions[0]._id, // Found
        exactLocation: 'Casablanca, Morocco',
        contact: 'test@mafqoudat.com',
        description: 'Found a smartphone in Casablanca. Black iPhone with a cracked screen. Please contact if this is yours.',
        image: 'https://res.cloudinary.com/du0tmvxhu/image/upload/v1/sample.jpg',
        exactDate: new Date('2024-01-15'),
        returned: false
      },
      {
        user: testUser._id,
        country: countries[0]._id, // Morocco
        category: categories[1]._id, // Documents
        foundLost: foundLostOptions[1]._id, // Lost
        exactLocation: 'Rabat, Morocco',
        contact: 'test@mafqoudat.com',
        description: 'Lost my passport in Rabat. It has a blue cover and was issued in 2023. Please contact if found.',
        exactDate: new Date('2024-01-14'),
        returned: false
      },
      {
        user: testUser._id,
        country: countries[0]._id, // Morocco
        category: categories[2]._id, // Jewelry
        foundLost: foundLostOptions[0]._id, // Found
        exactLocation: 'Marrakech, Morocco',
        contact: 'test@mafqoudat.com',
        description: 'Found a gold ring in Marrakech souk. Beautiful traditional design. Please contact if this belongs to you.',
        image: 'https://res.cloudinary.com/du0tmvxhu/image/upload/v1/sample2.jpg',
        exactDate: new Date('2024-01-13'),
        returned: false
      },
      {
        user: testUser._id,
        country: countries[1]._id, // Algeria
        category: categories[3]._id, // Clothing
        foundLost: foundLostOptions[1]._id, // Lost
        exactLocation: 'Algiers, Algeria',
        contact: 'test@mafqoudat.com',
        description: 'Lost my jacket in Algiers. It\'s a black leather jacket with silver zippers. Please contact if found.',
        exactDate: new Date('2024-01-12'),
        returned: false
      },
      {
        user: testUser._id,
        country: countries[2]._id, // Tunisia
        category: categories[4]._id, // Pets
        foundLost: foundLostOptions[0]._id, // Found
        exactLocation: 'Tunis, Tunisia',
        contact: 'test@mafqoudat.com',
        description: 'Found a friendly cat in Tunis. Orange tabby with white paws. Please contact if this is your pet.',
        image: 'https://res.cloudinary.com/du0tmvxhu/image/upload/v1/sample3.jpg',
        exactDate: new Date('2024-01-11'),
        returned: false
      }
    ];

    console.log('📝 Creating test posts...');
    const posts = await Post.insertMany(testPosts);
    console.log(`✅ Created ${posts.length} test posts`);

    console.log('\n🎉 Test posts seeding completed successfully!');
    console.log('\nSample posts created:');
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.description.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Error seeding test posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedTestPosts();
}

module.exports = { seedTestPosts };
