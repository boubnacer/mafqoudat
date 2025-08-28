const mongoose = require('mongoose');
const Country = require('../models/Country');
const FoundLost = require('../models/FoundLost');
const Category = require('../models/Category');

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

// Sample countries data with multilingual support
const countriesData = [
  {
    code: 'MA',
    labels: {
      en: 'MA',
      fr: 'MA',
      ar: 'MA'
    },
    names: {
      en: 'Morocco',
      fr: 'Maroc',
      ar: 'المغرب'
    },
    flag: '🇲🇦'
  },
  {
    code: 'DZ',
    labels: {
      en: 'DZ',
      fr: 'DZ',
      ar: 'DZ'
    },
    names: {
      en: 'Algeria',
      fr: 'Algérie',
      ar: 'الجزائر'
    },
    flag: '🇩🇿'
  },
  {
    code: 'TN',
    labels: {
      en: 'TN',
      fr: 'TN',
      ar: 'TN'
    },
    names: {
      en: 'Tunisia',
      fr: 'Tunisie',
      ar: 'تونس'
    },
    flag: '🇹🇳'
  },
  {
    code: 'EG',
    labels: {
      en: 'EG',
      fr: 'EG',
      ar: 'EG'
    },
    names: {
      en: 'Egypt',
      fr: 'Égypte',
      ar: 'مصر'
    },
    flag: '🇪🇬'
  },
  {
    code: 'SA',
    labels: {
      en: 'SA',
      fr: 'SA',
      ar: 'SA'
    },
    names: {
      en: 'Saudi Arabia',
      fr: 'Arabie Saoudite',
      ar: 'المملكة العربية السعودية'
    },
    flag: '🇸🇦'
  },
  {
    code: 'AE',
    labels: {
      en: 'AE',
      fr: 'AE',
      ar: 'AE'
    },
    names: {
      en: 'United Arab Emirates',
      fr: 'Émirats Arabes Unis',
      ar: 'الإمارات العربية المتحدة'
    },
    flag: '🇦🇪'
  },
  {
    code: 'QA',
    labels: {
      en: 'Qatar',
      fr: 'Qatar',
      ar: 'قطر'
    },
    names: {
      en: 'Qatar',
      fr: 'Qatar',
      ar: 'قطر'
    },
    flag: '🇶🇦'
  },
  {
    code: 'KW',
    labels: {
      en: 'Kuwait',
      fr: 'Koweït',
      ar: 'الكويت'
    },
    names: {
      en: 'Kuwait',
      fr: 'Koweït',
      ar: 'الكويت'
    },
    flag: '🇰🇼'
  },
  {
    code: 'BH',
    labels: {
      en: 'Bahrain',
      fr: 'Bahreïn',
      ar: 'البحرين'
    },
    names: {
      en: 'Bahrain',
      fr: 'Bahreïn',
      ar: 'البحرين'
    },
    flag: '🇧🇭'
  },
  {
    code: 'OM',
    labels: {
      en: 'Oman',
      fr: 'Oman',
      ar: 'عُمان'
    },
    names: {
      en: 'Oman',
      fr: 'Oman',
      ar: 'عُمان'
    },
    flag: '🇴🇲'
  },
  {
    code: 'JO',
    labels: {
      en: 'Jordan',
      fr: 'Jordanie',
      ar: 'الأردن'
    },
    names: {
      en: 'Jordan',
      fr: 'Jordanie',
      ar: 'الأردن'
    },
    flag: '🇯🇴'
  },
  {
    code: 'LB',
    labels: {
      en: 'Lebanon',
      fr: 'Liban',
      ar: 'لبنان'
    },
    names: {
      en: 'Lebanon',
      fr: 'Liban',
      ar: 'لبنان'
    },
    flag: '🇱🇧'
  },
  {
    code: 'SY',
    labels: {
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
    },
    names: {
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
    },
    flag: '🇸🇾'
  },
  {
    code: 'IQ',
    labels: {
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
    },
    names: {
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
    },
    flag: '🇮🇶'
  },
  {
    code: 'PS',
    labels: {
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
    },
    names: {
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
    },
    flag: '🇵🇸'
  },
  {
    code: 'LY',
    labels: {
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
    },
    names: {
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
    },
    flag: '🇱🇾'
  },
  {
    code: 'SD',
    labels: {
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
    },
    names: {
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
    },
    flag: '🇸🇩'
  },
  {
    code: 'SO',
    labels: {
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
    },
    names: {
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
    },
    flag: '🇸🇴'
  },
  {
    code: 'DJ',
    labels: {
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
    },
    names: {
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
    },
    flag: '🇩🇯'
  },
  {
    code: 'KM',
    labels: {
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
    },
    names: {
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
    },
    flag: '🇰🇲'
  },
  {
    code: 'MR',
    labels: {
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
    },
    names: {
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
    },
    flag: '🇲🇷'
  },
  {
    code: 'ML',
    labels: {
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
    },
    names: {
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
    },
    flag: '🇲🇱'
  },
  {
    code: 'NE',
    labels: {
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
    },
    names: {
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
    },
    flag: '🇳🇪'
  },
  {
    code: 'TD',
    labels: {
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
    },
    names: {
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
    },
    flag: '🇹🇩'
  },
  {
    code: 'CF',
    labels: {
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    },
    names: {
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    },
    flag: '🇨🇫'
  }
];

// Post types data - Fixed to use consistent codes
const postTypesData = [
  {
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
  {
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
];

// Sample categories data
const categoriesData = [
  {
    code: 'ELECTRONICS',
    labels: {
      en: 'Electronics',
      fr: 'Électronique',
      ar: 'إلكترونيات'
    },
    flag: '📱',
    icon: '📱',
    color: '#2196F3',
    description: 'Electronic devices and gadgets'
  },
  {
    code: 'DOCUMENTS',
    labels: {
      en: 'Documents',
      fr: 'Documents',
      ar: 'وثائق'
    },
    flag: '📄',
    icon: '📄',
    color: '#FF9800',
    description: 'Important documents and papers'
  },
  {
    code: 'JEWELRY',
    labels: {
      en: 'Jewelry',
      fr: 'Bijoux',
      ar: 'مجوهرات'
    },
    flag: '💍',
    icon: '💍',
    color: '#E91E63',
    description: 'Jewelry and accessories'
  },
  {
    code: 'CLOTHING',
    labels: {
      en: 'Clothing',
      fr: 'Vêtements',
      ar: 'ملابس'
    },
    flag: '👕',
    icon: '👕',
    color: '#9C27B0',
    description: 'Clothing and fashion items'
  },
  {
    code: 'PETS',
    labels: {
      en: 'Pets',
      fr: 'Animaux',
      ar: 'حيوانات أليفة'
    },
    flag: '🐕',
    icon: '🐕',
    color: '#795548',
    description: 'Lost or found pets'
  },
  {
    code: 'VEHICLES',
    labels: {
      en: 'Vehicles',
      fr: 'Véhicules',
      ar: 'مركبات'
    },
    flag: '🚗',
    icon: '🚗',
    color: '#607D8B',
    description: 'Cars, motorcycles, and other vehicles'
  }
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Country.deleteMany({});
    await FoundLost.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Cleared existing data');

    // Seed countries
    console.log('🌍 Seeding countries...');
    const countries = await Country.insertMany(countriesData);
    console.log(`✅ Seeded ${countries.length} countries`);

    // Seed post types
    console.log('📝 Seeding post types...');
    const postTypes = await FoundLost.insertMany(postTypesData);
    console.log(`✅ Seeded ${postTypes.length} post types`);

    // Seed categories
    console.log('📂 Seeding categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Seeded ${categories.length} categories`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample data:');
    console.log('Countries:', countries.map(c => `${c.code}: ${c.labels.en}`).join(', '));
    console.log('Post Types:', postTypes.map(p => `${p.code}: ${p.labels.en}`).join(', '));
    console.log('Categories:', categories.map(c => `${c.code}: ${c.labels.en}`).join(', '));

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, countriesData, postTypesData, categoriesData }; 