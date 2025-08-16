const mongoose = require('mongoose');
const Country = require('../models/Country');
require('dotenv').config();

// Migration data to add names field to existing countries
const countryNamesMigration = [
  {
    code: 'MA',
    names: {
      en: 'Morocco',
      fr: 'Maroc',
      ar: 'المغرب'
    }
  },
  {
    code: 'DZ',
    names: {
      en: 'Algeria',
      fr: 'Algérie',
      ar: 'الجزائر'
    }
  },
  {
    code: 'TN',
    names: {
      en: 'Tunisia',
      fr: 'Tunisie',
      ar: 'تونس'
    }
  },
  {
    code: 'EG',
    names: {
      en: 'Egypt',
      fr: 'Égypte',
      ar: 'مصر'
    }
  },
  {
    code: 'SA',
    names: {
      en: 'Saudi Arabia',
      fr: 'Arabie Saoudite',
      ar: 'المملكة العربية السعودية'
    }
  },
  {
    code: 'AE',
    names: {
      en: 'United Arab Emirates',
      fr: 'Émirats Arabes Unis',
      ar: 'الإمارات العربية المتحدة'
    }
  },
  {
    code: 'QA',
    names: {
      en: 'Qatar',
      fr: 'Qatar',
      ar: 'قطر'
    }
  },
  {
    code: 'KW',
    names: {
      en: 'Kuwait',
      fr: 'Koweït',
      ar: 'الكويت'
    }
  },
  {
    code: 'BH',
    names: {
      en: 'Bahrain',
      fr: 'Bahreïn',
      ar: 'البحرين'
    }
  },
  {
    code: 'OM',
    names: {
      en: 'Oman',
      fr: 'Oman',
      ar: 'عُمان'
    }
  },
  {
    code: 'JO',
    names: {
      en: 'Jordan',
      fr: 'Jordanie',
      ar: 'الأردن'
    }
  },
  {
    code: 'LB',
    names: {
      en: 'Lebanon',
      fr: 'Liban',
      ar: 'لبنان'
    }
  },
  {
    code: 'SY',
    names: {
      en: 'Syria',
      fr: 'Syrie',
      ar: 'سوريا'
    }
  },
  {
    code: 'IQ',
    names: {
      en: 'Iraq',
      fr: 'Irak',
      ar: 'العراق'
    }
  },
  {
    code: 'PS',
    names: {
      en: 'Palestine',
      fr: 'Palestine',
      ar: 'فلسطين'
    }
  },
  {
    code: 'LY',
    names: {
      en: 'Libya',
      fr: 'Libye',
      ar: 'ليبيا'
    }
  },
  {
    code: 'SD',
    names: {
      en: 'Sudan',
      fr: 'Soudan',
      ar: 'السودان'
    }
  },
  {
    code: 'SO',
    names: {
      en: 'Somalia',
      fr: 'Somalie',
      ar: 'الصومال'
    }
  },
  {
    code: 'DJ',
    names: {
      en: 'Djibouti',
      fr: 'Djibouti',
      ar: 'جيبوتي'
    }
  },
  {
    code: 'KM',
    names: {
      en: 'Comoros',
      fr: 'Comores',
      ar: 'جزر القمر'
    }
  },
  {
    code: 'MR',
    names: {
      en: 'Mauritania',
      fr: 'Mauritanie',
      ar: 'موريتانيا'
    }
  },
  {
    code: 'ML',
    names: {
      en: 'Mali',
      fr: 'Mali',
      ar: 'مالي'
    }
  },
  {
    code: 'NE',
    names: {
      en: 'Niger',
      fr: 'Niger',
      ar: 'النيجر'
    }
  },
  {
    code: 'TD',
    names: {
      en: 'Chad',
      fr: 'Tchad',
      ar: 'تشاد'
    }
  },
  {
    code: 'CF',
    names: {
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
      ar: 'جمهورية أفريقيا الوسطى'
    }
  }
];

const updateCountriesWithNames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    let updatedCount = 0;
    let createdCount = 0;

    for (const migration of countryNamesMigration) {
      // Check if country exists
      const existingCountry = await Country.findOne({ code: migration.code });
      
      if (existingCountry) {
        // Update existing country with names field
        if (!existingCountry.names || !existingCountry.names.en) {
          await Country.findByIdAndUpdate(existingCountry._id, {
            names: migration.names
          });
          console.log(`✅ Updated country: ${migration.code} with names field`);
          updatedCount++;
        } else {
          console.log(`⏭️  Country already has names field: ${migration.code}`);
        }
      } else {
        console.log(`⚠️  Country not found: ${migration.code}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Updated: ${updatedCount} countries`);
    console.log(`⏭️  Already migrated: ${countryNamesMigration.length - updatedCount} countries`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

// Run the migration
updateCountriesWithNames();
