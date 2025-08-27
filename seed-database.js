require("dotenv").config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Import models
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    const City = require('./server/models/City');

    console.log('\n🌱 Seeding database...');

    // Check and seed countries
    console.log('\n🌍 Checking countries...');
    let countries = await Country.find().lean();
    if (countries.length === 0) {
      console.log('No countries found, creating default countries...');
      const defaultCountries = [
        {
          code: 'MA',
          labels: { en: 'MA', fr: 'MA', ar: 'MA' },
          names: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' },
          flag: '🇲🇦',
          isActive: true
        }
      ];
      
      const createdCountries = await Country.insertMany(defaultCountries);
      console.log(`✅ Created ${createdCountries.length} countries`);
      countries = createdCountries;
    } else {
      console.log(`✅ Found ${countries.length} countries`);
    }

    // Check and seed categories
    console.log('\n📂 Checking categories...');
    let categories = await Category.find().lean();
    if (categories.length === 0) {
      console.log('No categories found, creating default categories...');
      const defaultCategories = [
        {
          code: 'DOCUMENTS',
          labels: { en: 'Documents', fr: 'Documents', ar: 'وثائق' },
          isActive: true
        },
        {
          code: 'ELECTRONICS',
          labels: { en: 'Electronics', fr: 'Électronique', ar: 'إلكترونيات' },
          isActive: true
        },
        {
          code: 'JEWELRY',
          labels: { en: 'Jewelry', fr: 'Bijoux', ar: 'مجوهرات' },
          isActive: true
        },
        {
          code: 'PETS',
          labels: { en: 'Pets', fr: 'Animaux', ar: 'حيوانات أليفة' },
          isActive: true
        }
      ];
      
      const createdCategories = await Category.insertMany(defaultCategories);
      console.log(`✅ Created ${createdCategories.length} categories`);
      categories = createdCategories;
    } else {
      console.log(`✅ Found ${categories.length} categories`);
    }

    // Check and seed found/lost options
    console.log('\n🔍 Checking found/lost options...');
    let foundLostOptions = await FoundLost.find().lean();
    if (foundLostOptions.length === 0) {
      console.log('No found/lost options found, creating default options...');
      const defaultFoundLost = [
        {
          code: 'FOUND',
          labels: { en: 'Found', fr: 'Trouvé', ar: 'وجدت' },
          isActive: true
        },
        {
          code: 'LOST',
          labels: { en: 'Lost', fr: 'Perdu', ar: 'فقدت' },
          isActive: true
        }
      ];
      
      const createdFoundLost = await FoundLost.insertMany(defaultFoundLost);
      console.log(`✅ Created ${createdFoundLost.length} found/lost options`);
      foundLostOptions = createdFoundLost;
    } else {
      console.log(`✅ Found ${foundLostOptions.length} found/lost options`);
    }

    // Check and seed cities for Morocco
    console.log('\n🏙️ Checking cities...');
    const morocco = countries.find(c => c.code === 'MA');
    if (morocco) {
      let cities = await City.find({ country: morocco._id }).lean();
      if (cities.length === 0) {
        console.log('No cities found for Morocco, creating default cities...');
        const defaultCities = [
          {
            code: 'CASABLANCA',
            country: morocco._id,
            labels: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
            names: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
            isActive: true,
            isCapital: false,
            isDynamic: false
          },
          {
            code: 'RABAT',
            country: morocco._id,
            labels: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
            names: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
            isActive: true,
            isCapital: true,
            isDynamic: false
          }
        ];
        
        const createdCities = await City.insertMany(defaultCities);
        console.log(`✅ Created ${createdCities.length} cities`);
      } else {
        console.log(`✅ Found ${cities.length} cities for Morocco`);
      }
    }

    // Display current database state
    console.log('\n📊 Current database state:');
    console.log(`  - Countries: ${await Country.countDocuments()}`);
    console.log(`  - Categories: ${await Category.countDocuments()}`);
    console.log(`  - Found/Lost options: ${await FoundLost.countDocuments()}`);
    console.log(`  - Cities: ${await City.countDocuments()}`);

    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedDatabase();
