const mongoose = require('mongoose');
const Country = require('../models/Country');
const FoundLost = require('../models/FoundLost');
require('dotenv').config();

// Sample countries data with multilingual support
const countriesData = [
  {
    code: 'MA',
    labels: {
      en: 'Morocco',
      fr: 'Maroc',
      ar: 'المغرب'
    },
    flag: '🇲🇦'
  },
  {
    code: 'DZ',
    labels: {
      en: 'Algeria',
      fr: 'Algérie',
      ar: 'الجزائر'
    },
    flag: '🇩🇿'
  },
  {
    code: 'TN',
    labels: {
      en: 'Tunisia',
      fr: 'Tunisie',
      ar: 'تونس'
    },
    flag: '🇹🇳'
  },
  {
    code: 'EG',
    labels: {
      en: 'Egypt',
      fr: 'Égypte',
      ar: 'مصر'
    },
    flag: '🇪🇬'
  },
  {
    code: 'SA',
    labels: {
      en: 'Saudi Arabia',
      fr: 'Arabie Saoudite',
      ar: 'المملكة العربية السعودية'
    },
    flag: '🇸🇦'
  },
  {
    code: 'AE',
    labels: {
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
    flag: '🇶🇦'
  },
  {
    code: 'KW',
    labels: {
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
    flag: '🇧🇭'
  },
  {
    code: 'OM',
    labels: {
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
    flag: '🇯🇴'
  },
  {
    code: 'LB',
    labels: {
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
    flag: '🇸🇾'
  },
  {
    code: 'IQ',
    labels: {
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
    flag: '🇵🇸'
  },
  {
    code: 'LY',
    labels: {
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
    flag: '🇸🇩'
  },
  {
    code: 'SO',
    labels: {
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
    flag: '🇩🇯'
  },
  {
    code: 'KM',
    labels: {
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
    flag: '🇲🇷'
  },
  {
    code: 'ML',
    labels: {
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
    flag: '🇳🇪'
  },
  {
    code: 'TD',
    labels: {
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
    flag: '🇨🇫'
  }
];

// Post types data
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

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Country.deleteMany({});
    await FoundLost.deleteMany({});
    console.log('Cleared existing data');

    // Seed countries
    const countries = await Country.insertMany(countriesData);
    console.log(`✅ Seeded ${countries.length} countries`);

    // Seed post types
    const postTypes = await FoundLost.insertMany(postTypesData);
    console.log(`✅ Seeded ${postTypes.length} post types`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample data:');
    console.log('Countries:', countries.map(c => `${c.code}: ${c.labels.en}`).join(', '));
    console.log('Post Types:', postTypes.map(p => `${p.code}: ${p.labels.en}`).join(', '));

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

module.exports = { seedData, countriesData, postTypesData }; 