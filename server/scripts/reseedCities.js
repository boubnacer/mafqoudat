const mongoose = require("mongoose");
const City = require("../models/City");
const Country = require("../models/Country");
require('dotenv').config();

// Major cities data for Arabic countries with multilingual support (population field removed)
const citiesData = [
  // Morocco (MA) - Major cities
  {
    countryCode: 'MA',
    cities: [
      {
        code: 'CASABLANCA',
        labels: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
        names: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
        isCapital: false
      },
      {
        code: 'RABAT',
        labels: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
        names: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
        isCapital: true
      },
      {
        code: 'FES',
        labels: { en: 'Fez', fr: 'Fès', ar: 'فاس' },
        names: { en: 'Fez', fr: 'Fès', ar: 'فاس' },
        isCapital: false
      },
      {
        code: 'MARRAKECH',
        labels: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
        names: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
        isCapital: false
      },
      {
        code: 'TANGIER',
        labels: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' },
        names: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' },
        isCapital: false
      },
      {
        code: 'AGADIR',
        labels: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' },
        names: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' },
        isCapital: false
      },
      {
        code: 'MEKNES',
        labels: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
        names: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
        isCapital: false
      }
    ]
  },
  // Algeria (DZ) - Major cities
  {
    countryCode: 'DZ',
    cities: [
      {
        code: 'ALGIERS',
        labels: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' },
        names: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' },
        isCapital: true
      },
      {
        code: 'ORAN',
        labels: { en: 'Oran', fr: 'Oran', ar: 'وهران' },
        names: { en: 'Oran', fr: 'Oran', ar: 'وهران' },
        isCapital: false
      },
      {
        code: 'CONSTANTINE',
        labels: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' },
        names: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' },
        isCapital: false
      },
      {
        code: 'ANNABA',
        labels: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' },
        names: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' },
        isCapital: false
      },
      {
        code: 'BATNA',
        labels: { en: 'Batna', fr: 'Batna', ar: 'باتنة' },
        names: { en: 'Batna', fr: 'Batna', ar: 'باتنة' },
        isCapital: false
      },
      {
        code: 'BLIDA',
        labels: { en: 'Blida', fr: 'Blida', ar: 'البليدة' },
        names: { en: 'Blida', fr: 'Blida', ar: 'البليدة' },
        isCapital: false
      }
    ]
  },
  // Tunisia (TN) - Major cities
  {
    countryCode: 'TN',
    cities: [
      {
        code: 'TUNIS',
        labels: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' },
        names: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' },
        isCapital: true
      },
      {
        code: 'SFAX',
        labels: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' },
        names: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' },
        isCapital: false
      },
      {
        code: 'SOUSSE',
        labels: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
        names: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
        isCapital: false
      },
      {
        code: 'GABES',
        labels: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' },
        names: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' },
        isCapital: false
      },
      {
        code: 'ARIANA',
        labels: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' },
        names: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' },
        isCapital: false
      }
    ]
  },
  // Egypt (EG) - Major cities
  {
    countryCode: 'EG',
    cities: [
      {
        code: 'CAIRO',
        labels: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
        names: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
        isCapital: true
      },
      {
        code: 'ALEXANDRIA',
        labels: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' },
        names: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' },
        isCapital: false
      },
      {
        code: 'GIZA',
        labels: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' },
        names: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' },
        isCapital: false
      },
      {
        code: 'SHARM_EL_SHEIKH',
        labels: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' },
        names: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' },
        isCapital: false
      },
      {
        code: 'LUXOR',
        labels: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' },
        names: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' },
        isCapital: false
      },
      {
        code: 'ASWAN',
        labels: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' },
        names: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' },
        isCapital: false
      }
    ]
  },
  // Saudi Arabia (SA) - Major cities
  {
    countryCode: 'SA',
    cities: [
      {
        code: 'RIYADH',
        labels: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
        names: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
        isCapital: true
      },
      {
        code: 'JEDDAH',
        labels: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' },
        names: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' },
        isCapital: false
      },
      {
        code: 'MECCA',
        labels: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' },
        names: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' },
        isCapital: false
      },
      {
        code: 'MEDINA',
        labels: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' },
        names: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' },
        isCapital: false
      },
      {
        code: 'DAMMAM',
        labels: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' },
        names: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' },
        isCapital: false
      },
      {
        code: 'TAIF',
        labels: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' },
        names: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' },
        isCapital: false
      }
    ]
  },
  // UAE (AE) - Major cities
  {
    countryCode: 'AE',
    cities: [
      {
        code: 'DUBAI',
        labels: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
        names: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
        isCapital: false
      },
      {
        code: 'ABU_DHABI',
        labels: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' },
        names: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' },
        isCapital: true
      },
      {
        code: 'SHARJAH',
        labels: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' },
        names: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' },
        isCapital: false
      },
      {
        code: 'AJMAN',
        labels: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' },
        names: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' },
        isCapital: false
      },
      {
        code: 'RAS_AL_KHAIMAH',
        labels: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' },
        names: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' },
        isCapital: false
      }
    ]
  },
  // Qatar (QA) - Major cities
  {
    countryCode: 'QA',
    cities: [
      {
        code: 'DOHA',
        labels: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' },
        names: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' },
        isCapital: true
      },
      {
        code: 'AL_WAKRAH',
        labels: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' },
        names: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' },
        isCapital: false
      },
      {
        code: 'AL_KHOR',
        labels: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' },
        names: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' },
        isCapital: false
      },
      {
        code: 'AL_RAYYAN',
        labels: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' },
        names: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' },
        isCapital: false
      }
    ]
  },
  // Kuwait (KW) - Major cities
  {
    countryCode: 'KW',
    cities: [
      {
        code: 'KUWAIT_CITY',
        labels: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' },
        names: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' },
        isCapital: true
      },
      {
        code: 'JAHRA',
        labels: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' },
        names: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' },
        isCapital: false
      },
      {
        code: 'HAWALLI',
        labels: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' },
        names: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' },
        isCapital: false
      },
      {
        code: 'FARWANIYA',
        labels: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' },
        names: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' },
        isCapital: false
      }
    ]
  },
  // Bahrain (BH) - Major cities
  {
    countryCode: 'BH',
    cities: [
      {
        code: 'MANAMA',
        labels: { en: 'Manama', fr: 'Manama', ar: 'المنامة' },
        names: { en: 'Manama', fr: 'Manama', ar: 'المنامة' },
        isCapital: true
      },
      {
        code: 'MUHARRAQ',
        labels: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' },
        names: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' },
        isCapital: false
      },
      {
        code: 'RIFA',
        labels: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' },
        names: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' },
        isCapital: false
      },
      {
        code: 'HAMAD_TOWN',
        labels: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' },
        names: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' },
        isCapital: false
      }
    ]
  }
];

const reseedCities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // First, delete all existing cities
    console.log('🗑️  Deleting all existing cities...');
    await City.deleteMany({});
    console.log('✅ All cities deleted');

    let totalCities = 0;
    let createdCities = 0;

    for (const countryData of citiesData) {
      // Find the country by code
      const country = await Country.findOne({ code: countryData.countryCode });
      
      if (!country) {
        console.log(`❌ Country ${countryData.countryCode} not found, skipping cities`);
        continue;
      }

      console.log(`\n🌍 Processing cities for ${country.labels.en} (${country.code})...`);

      for (const cityData of countryData.cities) {
        totalCities++;
        
        // Create new city (without population field)
        const newCity = {
          code: cityData.code,
          country: country._id,
          labels: cityData.labels,
          names: cityData.names,
          isCapital: cityData.isCapital,
          isActive: true
        };

        await City.create(newCity);
        console.log(`✅ Created city: ${cityData.labels.en} (${cityData.isCapital ? 'Capital' : 'City'})`);
        createdCities++;
      }
    }

    console.log(`\n🎉 Reseeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total cities processed: ${totalCities}`);
    console.log(`   • Cities created: ${createdCities}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error reseeding cities:', error);
    process.exit(1);
  }
};

// Run the reseeding if this file is executed directly
if (require.main === module) {
  reseedCities();
}

module.exports = reseedCities;
