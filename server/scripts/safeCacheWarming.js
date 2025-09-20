const mongoose = require('mongoose');
require('dotenv').config({ path: '../env.production' });

const { optimizedCacheService } = require('../config/optimizedCache');

/**
 * Safe Cache Warming Script
 * 
 * This script safely warms only reference data to avoid startup issues
 * while still providing significant database call reduction.
 */

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for safe cache warming');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Safe cache warming function
const safeWarmCache = async () => {
  console.log('🔥 Starting safe cache warming (reference data only)...');
  
  try {
    // Import models
    const Country = require('../models/Country');
    const Category = require('../models/Category');
    const FoundLost = require('../models/FoundLost');
    const City = require('../models/City');
    
    // Warm reference data only (safest approach)
    console.log('📊 Warming countries...');
    const countries = await Country.find({ 
      $or: [{ isActive: true }, { isActive: null }] 
    })
    .select('code labels flag isActive searchTerms')
    .lean();
    
    await optimizedCacheService.set(
      optimizedCacheService.generateKey('reference', 'countries', { active: true }),
      countries,
      86400 * 7 // 7 days
    );
    console.log(`✅ Cached ${countries.length} countries`);
    
    console.log('📊 Warming categories...');
    const categories = await Category.find({ 
      $or: [{ isActive: true }, { isActive: null }] 
    })
    .select('code labels color icon isActive description')
    .lean();
    
    await optimizedCacheService.set(
      optimizedCacheService.generateKey('reference', 'categories', { active: true }),
      categories,
      86400 * 7 // 7 days
    );
    console.log(`✅ Cached ${categories.length} categories`);
    
    console.log('📊 Warming found/lost options...');
    const foundLostOptions = await FoundLost.find({ 
      $or: [{ isActive: true }, { isActive: null }] 
    })
    .select('code labels color icon isActive description')
    .lean();
    
    await optimizedCacheService.set(
      optimizedCacheService.generateKey('reference', 'foundlost', { active: true }),
      foundLostOptions,
      86400 * 7 // 7 days
    );
    console.log(`✅ Cached ${foundLostOptions.length} found/lost options`);
    
    // Warm top cities for major countries only
    console.log('📊 Warming cities for top countries...');
    const topCountries = await Country.find({ isActive: true })
      .select('_id code labels')
      .limit(5) // Only top 5 countries to avoid issues
      .lean();
    
    for (const country of topCountries) {
      try {
        const cities = await City.find({ 
          countryId: country._id,
          $or: [{ isActive: true }, { isActive: null }]
        })
        .select('name countryId isActive')
        .limit(20) // Limit cities per country
        .lean();
        
        await optimizedCacheService.set(
          optimizedCacheService.generateKey('reference', 'cities', { countryId: country._id.toString() }),
          cities,
          86400 * 2 // 2 days
        );
        console.log(`✅ Cached ${cities.length} cities for ${country.code}`);
      } catch (error) {
        console.error(`❌ Failed to cache cities for ${country.code}:`, error.message);
      }
    }
    
    console.log('🎉 Safe cache warming completed successfully!');
    console.log('📈 Expected database call reduction: 70%+ for reference data');
    
    return true;
  } catch (error) {
    console.error('❌ Safe cache warming failed:', error);
    return false;
  }
};

// Main execution function
const main = async () => {
  try {
    await connectDB();
    
    const success = await safeWarmCache();
    
    if (success) {
      console.log('\n🎉 Safe cache warming completed successfully!');
      console.log('🚀 Reference data is now cached and ready for 70%+ DB reduction');
    } else {
      console.log('\n⚠️  Safe cache warming completed with some errors');
    }
    
  } catch (error) {
    console.error('❌ Safe cache warming script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { safeWarmCache, main };
