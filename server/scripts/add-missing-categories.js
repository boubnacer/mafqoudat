/**
 * Script to add missing categories to match the frontend configuration
 * This will add the 19 missing categories (you already have 6: CLOTHING, DOCUMENTS, ELECTRONICS, JEWELRY, PETS, VEHICLES)
 * 
 * Usage: node scripts/add-missing-categories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Missing categories to add (matching frontend config exactly)
const missingCategories = [
  {
    code: "KEYS",
    labels: {
      en: "Keys",
      fr: "Clés",
      ar: "مفاتيح"
    },
    color: "#FF9800",
    isActive: true,
    description: "House keys, car keys, key chains",
    priority: 7,
    searchTerms: ["keys", "clés", "مفاتيح", "keychain", "house keys", "car keys"]
  },
  {
    code: "WALLET",
    labels: {
      en: "Wallets & Purses",
      fr: "Portefeuilles et Sacs",
      ar: "محافظ وحقائب"
    },
    color: "#FF5722",
    isActive: true,
    description: "Wallets, purses, money holders",
    priority: 8,
    searchTerms: ["wallet", "portefeuille", "محفظة", "purse", "money", "cash"]
  },
  {
    code: "WATCHES",
    labels: {
      en: "Watches",
      fr: "Montres",
      ar: "ساعات"
    },
    color: "#2196F3",
    isActive: true,
    description: "Wristwatches, smartwatches",
    priority: 9,
    searchTerms: ["watch", "montre", "ساعة", "smartwatch", "wristwatch", "timepiece"]
  },
  {
    code: "GAMING",
    labels: {
      en: "Gaming Devices",
      fr: "Appareils de jeu",
      ar: "أجهزة الألعاب"
    },
    color: "#E91E63",
    isActive: true,
    description: "Game consoles, controllers, gaming accessories",
    priority: 10,
    searchTerms: ["gaming", "jeu", "ألعاب", "console", "playstation", "xbox", "nintendo"]
  },
  {
    code: "MEDICAL",
    labels: {
      en: "Medical Items",
      fr: "Articles médicaux",
      ar: "مستلزمات طبية"
    },
    color: "#F44336",
    isActive: true,
    description: "Medical devices, prescriptions, health items",
    priority: 11,
    searchTerms: ["medical", "médical", "طبي", "prescription", "medicine", "health"]
  },
  {
    code: "LUGGAGE",
    labels: {
      en: "Luggage & Bags",
      fr: "Bagages et Sacs",
      ar: "حقائب السفر"
    },
    color: "#795548",
    isActive: true,
    description: "Suitcases, backpacks, travel bags",
    priority: 12,
    searchTerms: ["luggage", "bagage", "حقيبة", "suitcase", "backpack", "bag", "travel"]
  },
  {
    code: "PERSON",
    labels: {
      en: "Missing Persons",
      fr: "Personnes disparues",
      ar: "أشخاص مفقودون"
    },
    color: "#2196F3",
    isActive: true,
    description: "Missing person reports",
    priority: 13,
    searchTerms: ["person", "personne", "شخص", "missing", "disparu", "مفقود"]
  },
  {
    code: "SHOPPING",
    labels: {
      en: "Shopping Items",
      fr: "Articles de magasinage",
      ar: "مشتريات"
    },
    color: "#9C27B0",
    isActive: true,
    description: "Shopping bags, purchased items",
    priority: 14,
    searchTerms: ["shopping", "magasinage", "تسوق", "purchase", "buy", "store"]
  },
  {
    code: "WORK",
    labels: {
      en: "Work Items",
      fr: "Articles de travail",
      ar: "أدوات العمل"
    },
    color: "#607D8B",
    isActive: true,
    description: "Work-related items, office equipment",
    priority: 15,
    searchTerms: ["work", "travail", "عمل", "office", "business", "professional"]
  },
  {
    code: "SPORTS",
    labels: {
      en: "Sports Equipment",
      fr: "Équipement sportif",
      ar: "معدات رياضية"
    },
    color: "#4CAF50",
    isActive: true,
    description: "Sports gear, athletic equipment",
    priority: 16,
    searchTerms: ["sports", "sport", "رياضة", "athletic", "fitness", "gym", "ball"]
  },
  {
    code: "MUSIC",
    labels: {
      en: "Musical Instruments",
      fr: "Instruments de musique",
      ar: "آلات موسيقية"
    },
    color: "#9C27B0",
    isActive: true,
    description: "Musical instruments and accessories",
    priority: 17,
    searchTerms: ["music", "musique", "موسيقى", "instrument", "guitar", "piano"]
  },
  {
    code: "TOYS",
    labels: {
      en: "Toys",
      fr: "Jouets",
      ar: "ألعاب"
    },
    color: "#FF9800",
    isActive: true,
    description: "Children's toys and games",
    priority: 18,
    searchTerms: ["toys", "jouets", "لعبة", "children", "kids", "play"]
  },
  {
    code: "BEAUTY",
    labels: {
      en: "Beauty & Cosmetics",
      fr: "Beauté et cosmétiques",
      ar: "مستحضرات التجميل"
    },
    color: "#E91E63",
    isActive: true,
    description: "Makeup, skincare, beauty products",
    priority: 19,
    searchTerms: ["beauty", "beauté", "تجميل", "makeup", "cosmetics", "skincare"]
  },
  {
    code: "CAMERA",
    labels: {
      en: "Cameras & Photography",
      fr: "Appareils photo",
      ar: "كاميرات"
    },
    color: "#2196F3",
    isActive: true,
    description: "Cameras, lenses, photography equipment",
    priority: 20,
    searchTerms: ["camera", "appareil photo", "كاميرا", "photography", "lens", "photo"]
  },
  {
    code: "TOOLS",
    labels: {
      en: "Tools & Equipment",
      fr: "Outils et équipement",
      ar: "أدوات ومعدات"
    },
    color: "#607D8B",
    isActive: true,
    description: "Hand tools, power tools, equipment",
    priority: 21,
    searchTerms: ["tools", "outils", "أدوات", "equipment", "hardware", "repair"]
  },
  {
    code: "GARDEN",
    labels: {
      en: "Garden Items",
      fr: "Articles de jardin",
      ar: "أدوات الحديقة"
    },
    color: "#4CAF50",
    isActive: true,
    description: "Gardening tools and supplies",
    priority: 22,
    searchTerms: ["garden", "jardin", "حديقة", "plant", "flower", "outdoor"]
  },
  {
    code: "HOME",
    labels: {
      en: "Home Items",
      fr: "Articles de maison",
      ar: "أدوات منزلية"
    },
    color: "#8BC34A",
    isActive: true,
    description: "Household items and appliances",
    priority: 23,
    searchTerms: ["home", "maison", "منزل", "household", "appliance", "furniture"]
  },
  {
    code: "FOOD",
    labels: {
      en: "Food & Beverages",
      fr: "Nourriture et boissons",
      ar: "طعام ومشروبات"
    },
    color: "#FF9800",
    isActive: true,
    description: "Food items, beverages, lunch boxes",
    priority: 24,
    searchTerms: ["food", "nourriture", "طعام", "beverage", "drink", "lunch"]
  },
  {
    code: "OTHER",
    labels: {
      en: "Other Items",
      fr: "Autres articles",
      ar: "أشياء أخرى"
    },
    color: "#9E9E9E",
    isActive: true,
    description: "Miscellaneous items not in other categories",
    priority: 25,
    searchTerms: ["other", "autre", "آخر", "misc", "miscellaneous", "various"]
  }
];

// Function to add missing categories
const addMissingCategories = async () => {
  try {
    console.log('\n🔄 Checking existing categories...\n');

    // Get existing categories
    const existingCategories = await Category.find({}).select('code');
    const existingCodes = existingCategories.map(cat => cat.code);
    
    console.log(`📊 Found ${existingCodes.length} existing categories:`);
    existingCodes.forEach(code => console.log(`   - ${code}`));
    console.log('');

    // Filter out categories that already exist
    const categoriesToAdd = missingCategories.filter(
      cat => !existingCodes.includes(cat.code)
    );

    if (categoriesToAdd.length === 0) {
      console.log('✅ All categories already exist! Nothing to add.\n');
      return;
    }

    console.log(`🔄 Adding ${categoriesToAdd.length} missing categories...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const categoryData of categoriesToAdd) {
      try {
        await Category.create(categoryData);
        console.log(`✅ Added: ${categoryData.code.padEnd(20)} - ${categoryData.labels.en}`);
        addedCount++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Skipped: ${categoryData.code} (already exists)`);
          skippedCount++;
        } else {
          console.error(`❌ Error adding ${categoryData.code}:`, error.message);
        }
      }
    }

    console.log('\n✨ Category addition completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Added: ${addedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   📋 Total: ${existingCodes.length + addedCount}`);

    // Display all categories
    console.log('\n📋 All categories in database:\n');
    const allCategories = await Category.find({ isActive: true })
      .sort({ priority: 1 })
      .select('code labels.en priority color');
    
    allCategories.forEach((cat, index) => {
      console.log(`${String(index + 1).padStart(2)}. ${cat.code.padEnd(20)} - ${cat.labels.en.padEnd(35)} (Priority: ${cat.priority}, Color: ${cat.color})`);
    });

    console.log(`\n🎉 Total active categories: ${allCategories.length}`);

  } catch (error) {
    console.error('❌ Error in category addition process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Main execution
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║    Adding Missing Categories to Database              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  await connectDB();
  await addMissingCategories();
  
  console.log('\n💡 Next steps:');
  console.log('   1. Restart your backend server to clear cache');
  console.log('   2. Refresh your dashboard to see all categories');
  console.log('   3. All icons are already configured in the frontend!\n');
};

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

