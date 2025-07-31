const mongoose = require('mongoose');
const Country = require('../models/Country');
const FoundLost = require('../models/FoundLost');
require('dotenv').config();

// Migration mapping for existing countries
const countryMigrationMap = {
  'Malawi': {
    code: 'MW',
    labels: {
      en: 'Malawi',
      fr: 'Malawi',
      ar: 'ملاوي'
    },
    flag: '🇲🇼'
  },
  'Morocco': {
    code: 'MA',
    labels: {
      en: 'Morocco',
      fr: 'Maroc',
      ar: 'المغرب'
    },
    flag: '🇲🇦'
  },
  'Algeria': {
    code: 'DZ',
    labels: {
      en: 'Algeria',
      fr: 'Algérie',
      ar: 'الجزائر'
    },
    flag: '🇩🇿'
  },
  'Tunisia': {
    code: 'TN',
    labels: {
      en: 'Tunisia',
      fr: 'Tunisie',
      ar: 'تونس'
    },
    flag: '🇹🇳'
  },
  'Egypt': {
    code: 'EG',
    labels: {
      en: 'Egypt',
      fr: 'Égypte',
      ar: 'مصر'
    },
    flag: '🇪🇬'
  }
};

// Migration mapping for existing post types
const postTypeMigrationMap = {
  'Found': {
    code: 'FOUND',
    labels: {
      en: 'Found',
      fr: 'Trouvé',
      ar: 'تم العثور عليه'
    },
    color: '#4CAF50',
    icon: '🔍',
    description: 'Items that have been found and are being returned to their owners'
  },
  'Lost': {
    code: 'LOST',
    labels: {
      en: 'Lost',
      fr: 'Perdu',
      ar: 'مفقود'
    },
    color: '#F44336',
    icon: '❓',
    description: 'Items that have been lost and are being searched for'
  }
};

const migrateData = async () => {
  try {
    // Connect to MongoDB
    const databaseUri = process.env.DATABASE_URI || 'mongodb://localhost:27017/mafqoudat';
    console.log(`Connecting to MongoDB: ${databaseUri}`);
    
    await mongoose.connect(databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Migrate Countries
    console.log('\n🔄 Migrating countries...');
    const existingCountries = await Country.find({});
    
    for (const country of existingCountries) {
      const migrationData = countryMigrationMap[country.label || country.code];
      
      if (migrationData) {
        // Update with new structure
        country.code = migrationData.code;
        country.labels = migrationData.labels;
        country.flag = migrationData.flag;
        country.isActive = true;
        
        await country.save();
        console.log(`✅ Migrated: ${country.label} → ${migrationData.labels.en} (${migrationData.code})`);
      } else {
        // Handle unknown countries
        console.log(`⚠️  Unknown country: ${country.label || country.code}`);
        
        // Create basic multilingual structure
        country.labels = {
          en: country.label || country.code,
          fr: country.label || country.code,
          ar: country.label || country.code
        };
        country.isActive = true;
        
        await country.save();
        console.log(`✅ Basic migration: ${country.label || country.code}`);
      }
    }

    // Migrate Post Types
    console.log('\n🔄 Migrating post types...');
    const existingPostTypes = await FoundLost.find({});
    
    for (const postType of existingPostTypes) {
      const migrationData = postTypeMigrationMap[postType.code];
      
      if (migrationData) {
        // Update with new structure
        postType.code = migrationData.code;
        postType.labels = migrationData.labels;
        postType.color = migrationData.color;
        postType.icon = migrationData.icon;
        postType.description = migrationData.description;
        postType.isActive = true;
        
        await postType.save();
        console.log(`✅ Migrated: ${postType.code} → ${migrationData.labels.en} (${migrationData.code})`);
      } else {
        // Handle unknown post types
        console.log(`⚠️  Unknown post type: ${postType.code}`);
        
        // Create basic multilingual structure
        postType.labels = {
          en: postType.code,
          fr: postType.code,
          ar: postType.code
        };
        postType.color = '#666666';
        postType.isActive = true;
        
        await postType.save();
        console.log(`✅ Basic migration: ${postType.code}`);
      }
    }

    console.log('\n🎉 Data migration completed successfully!');
    
    // Show final state
    const finalCountries = await Country.find({ isActive: true });
    const finalPostTypes = await FoundLost.find({ isActive: true });
    
    console.log('\n📊 Final state:');
    console.log(`Countries: ${finalCountries.length}`);
    console.log(`Post Types: ${finalPostTypes.length}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 