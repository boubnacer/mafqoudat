/**
 * ALL-IN-ONE SCRIPT: Complete Category Setup
 * 
 * This script does everything:
 * 1. Fixes priorities of existing categories
 * 2. Adds missing categories
 * 3. Displays final result
 * 
 * Usage: node scripts/setup-all-categories.js
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

// Correct priorities for existing categories
const correctPriorities = {
  ELECTRONICS: 1,
  DOCUMENTS: 2,
  JEWELRY: 3,
  CLOTHING: 4,
  PETS: 5,
  VEHICLES: 6
};

// All categories with proper data
const allCategories = [
  {
    code: "ELECTRONICS",
    labels: { en: "Electronics", fr: "Électronique", ar: "إلكترونيات" },
    color: "#00BCD4",
    description: "Mobile phones, tablets, laptops, and electronic devices",
    priority: 1,
    searchTerms: ["electronics", "électronique", "إلكترونيات", "phone", "laptop", "tablet"]
  },
  {
    code: "DOCUMENTS",
    labels: { en: "Documents", fr: "Documents", ar: "وثائق" },
    color: "#795548",
    description: "ID cards, passports, certificates, papers",
    priority: 2,
    searchTerms: ["documents", "وثائق", "papers", "ID", "passport", "certificate"]
  },
  {
    code: "JEWELRY",
    labels: { en: "Jewelry", fr: "Bijoux", ar: "مجوهرات" },
    color: "#9C27B0",
    description: "Rings, necklaces, bracelets, precious items",
    priority: 3,
    searchTerms: ["jewelry", "bijoux", "مجوهرات", "ring", "necklace", "bracelet"]
  },
  {
    code: "CLOTHING",
    labels: { en: "Clothing & Apparel", fr: "Vêtements", ar: "ملابس" },
    color: "#4CAF50",
    description: "Clothes, shoes, accessories",
    priority: 4,
    searchTerms: ["clothing", "vêtements", "ملابس", "clothes", "apparel", "shirt"]
  },
  {
    code: "PETS",
    labels: { en: "Pets", fr: "Animaux de compagnie", ar: "حيوانات أليفة" },
    color: "#795548",
    description: "Lost or found pets",
    priority: 5,
    searchTerms: ["pets", "animaux", "حيوانات", "dog", "cat", "animal"]
  },
  {
    code: "VEHICLES",
    labels: { en: "Vehicles", fr: "Véhicules", ar: "مركبات" },
    color: "#607D8B",
    description: "Cars, motorcycles, and other vehicles",
    priority: 6,
    searchTerms: ["vehicles", "véhicules", "مركبات", "car", "motorcycle", "bike"]
  },
  {
    code: "KEYS",
    labels: { en: "Keys", fr: "Clés", ar: "مفاتيح" },
    color: "#FF9800",
    description: "House keys, car keys, key chains",
    priority: 7,
    searchTerms: ["keys", "clés", "مفاتيح", "keychain", "house keys", "car keys"]
  },
  {
    code: "WALLET",
    labels: { en: "Wallets & Purses", fr: "Portefeuilles et Sacs", ar: "محافظ وحقائب" },
    color: "#FF5722",
    description: "Wallets, purses, money holders",
    priority: 8,
    searchTerms: ["wallet", "portefeuille", "محفظة", "purse", "money", "cash"]
  },
  {
    code: "WATCHES",
    labels: { en: "Watches", fr: "Montres", ar: "ساعات" },
    color: "#2196F3",
    description: "Wristwatches, smartwatches",
    priority: 9,
    searchTerms: ["watch", "montre", "ساعة", "smartwatch", "wristwatch", "timepiece"]
  },
  {
    code: "GAMING",
    labels: { en: "Gaming Devices", fr: "Appareils de jeu", ar: "أجهزة الألعاب" },
    color: "#E91E63",
    description: "Game consoles, controllers, gaming accessories",
    priority: 10,
    searchTerms: ["gaming", "jeu", "ألعاب", "console", "playstation", "xbox", "nintendo"]
  },
  {
    code: "MEDICAL",
    labels: { en: "Medical Items", fr: "Articles médicaux", ar: "مستلزمات طبية" },
    color: "#F44336",
    description: "Medical devices, prescriptions, health items",
    priority: 11,
    searchTerms: ["medical", "médical", "طبي", "prescription", "medicine", "health"]
  },
  {
    code: "LUGGAGE",
    labels: { en: "Luggage & Bags", fr: "Bagages et Sacs", ar: "حقائب السفر" },
    color: "#795548",
    description: "Suitcases, backpacks, travel bags",
    priority: 12,
    searchTerms: ["luggage", "bagage", "حقيبة", "suitcase", "backpack", "bag", "travel"]
  },
  {
    code: "PERSON",
    labels: { en: "Missing Persons", fr: "Personnes disparues", ar: "أشخاص مفقودون" },
    color: "#2196F3",
    description: "Missing person reports",
    priority: 13,
    searchTerms: ["person", "personne", "شخص", "missing", "disparu", "مفقود"]
  },
  {
    code: "SHOPPING",
    labels: { en: "Shopping Items", fr: "Articles de magasinage", ar: "مشتريات" },
    color: "#9C27B0",
    description: "Shopping bags, purchased items",
    priority: 14,
    searchTerms: ["shopping", "magasinage", "تسوق", "purchase", "buy", "store"]
  },
  {
    code: "WORK",
    labels: { en: "Work Items", fr: "Articles de travail", ar: "أدوات العمل" },
    color: "#607D8B",
    description: "Work-related items, office equipment",
    priority: 15,
    searchTerms: ["work", "travail", "عمل", "office", "business", "professional"]
  },
  {
    code: "SPORTS",
    labels: { en: "Sports Equipment", fr: "Équipement sportif", ar: "معدات رياضية" },
    color: "#4CAF50",
    description: "Sports gear, athletic equipment",
    priority: 16,
    searchTerms: ["sports", "sport", "رياضة", "athletic", "fitness", "gym", "ball"]
  },
  {
    code: "MUSIC",
    labels: { en: "Musical Instruments", fr: "Instruments de musique", ar: "آلات موسيقية" },
    color: "#9C27B0",
    description: "Musical instruments and accessories",
    priority: 17,
    searchTerms: ["music", "musique", "موسيقى", "instrument", "guitar", "piano"]
  },
  {
    code: "TOYS",
    labels: { en: "Toys", fr: "Jouets", ar: "ألعاب" },
    color: "#FF9800",
    description: "Children's toys and games",
    priority: 18,
    searchTerms: ["toys", "jouets", "لعبة", "children", "kids", "play"]
  },
  {
    code: "BEAUTY",
    labels: { en: "Beauty & Cosmetics", fr: "Beauté et cosmétiques", ar: "مستحضرات التجميل" },
    color: "#E91E63",
    description: "Makeup, skincare, beauty products",
    priority: 19,
    searchTerms: ["beauty", "beauté", "تجميل", "makeup", "cosmetics", "skincare"]
  },
  {
    code: "CAMERA",
    labels: { en: "Cameras & Photography", fr: "Appareils photo", ar: "كاميرات" },
    color: "#2196F3",
    description: "Cameras, lenses, photography equipment",
    priority: 20,
    searchTerms: ["camera", "appareil photo", "كاميرا", "photography", "lens", "photo"]
  },
  {
    code: "TOOLS",
    labels: { en: "Tools & Equipment", fr: "Outils et équipement", ar: "أدوات ومعدات" },
    color: "#607D8B",
    description: "Hand tools, power tools, equipment",
    priority: 21,
    searchTerms: ["tools", "outils", "أدوات", "equipment", "hardware", "repair"]
  },
  {
    code: "GARDEN",
    labels: { en: "Garden Items", fr: "Articles de jardin", ar: "أدوات الحديقة" },
    color: "#4CAF50",
    description: "Gardening tools and supplies",
    priority: 22,
    searchTerms: ["garden", "jardin", "حديقة", "plant", "flower", "outdoor"]
  },
  {
    code: "HOME",
    labels: { en: "Home Items", fr: "Articles de maison", ar: "أدوات منزلية" },
    color: "#8BC34A",
    description: "Household items and appliances",
    priority: 23,
    searchTerms: ["home", "maison", "منزل", "household", "appliance", "furniture"]
  },
  {
    code: "FOOD",
    labels: { en: "Food & Beverages", fr: "Nourriture et boissons", ar: "طعام ومشروبات" },
    color: "#FF9800",
    description: "Food items, beverages, lunch boxes",
    priority: 24,
    searchTerms: ["food", "nourriture", "طعام", "beverage", "drink", "lunch"]
  },
  {
    code: "OTHER",
    labels: { en: "Other Items", fr: "Autres articles", ar: "أشياء أخرى" },
    color: "#9E9E9E",
    description: "Miscellaneous items not in other categories",
    priority: 25,
    searchTerms: ["other", "autre", "آخر", "misc", "miscellaneous", "various"]
  }
];

// Step 1: Fix priorities of existing categories
const fixPriorities = async () => {
  console.log('\n📋 STEP 1: Fixing priorities of existing categories...\n');
  
  let fixedCount = 0;
  
  for (const [code, correctPriority] of Object.entries(correctPriorities)) {
    const category = await Category.findOne({ code });
    
    if (category && category.priority !== correctPriority) {
      const oldPriority = category.priority;
      category.priority = correctPriority;
      await category.save();
      console.log(`✅ Fixed: ${code.padEnd(20)} - Priority ${oldPriority} → ${correctPriority}`);
      fixedCount++;
    }
  }
  
  if (fixedCount === 0) {
    console.log('✓  All existing categories have correct priorities');
  }
  
  return fixedCount;
};

// Step 2: Add missing categories
const addMissingCategories = async () => {
  console.log('\n📋 STEP 2: Adding missing categories...\n');
  
  const existingCategories = await Category.find({}).select('code');
  const existingCodes = existingCategories.map(cat => cat.code);
  
  console.log(`Found ${existingCodes.length} existing categories\n`);
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const categoryData of allCategories) {
    if (existingCodes.includes(categoryData.code)) {
      skippedCount++;
      continue;
    }
    
    try {
      categoryData.isActive = true;
      await Category.create(categoryData);
      console.log(`✅ Added: ${categoryData.code.padEnd(20)} - ${categoryData.labels.en}`);
      addedCount++;
    } catch (error) {
      console.error(`❌ Error adding ${categoryData.code}:`, error.message);
    }
  }
  
  return { addedCount, skippedCount };
};

// Display final results
const displayResults = async () => {
  console.log('\n📋 FINAL RESULTS: All Categories in Database\n');
  
  const allCats = await Category.find({ isActive: true })
    .sort({ priority: 1 })
    .select('code labels.en priority color');
  
  console.log('═'.repeat(80));
  allCats.forEach((cat, index) => {
    const num = String(index + 1).padStart(2);
    const code = cat.code.padEnd(20);
    const label = cat.labels.en.padEnd(30);
    const priority = String(cat.priority).padStart(2);
    console.log(`${num}. ${code} - ${label} (Priority: ${priority}, Color: ${cat.color})`);
  });
  console.log('═'.repeat(80));
  
  return allCats.length;
};

// Main execution
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║    Complete Category Setup - All-in-One Script        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    await connectDB();
    
    // Step 1: Fix priorities
    const fixedCount = await fixPriorities();
    
    // Step 2: Add missing categories
    const { addedCount, skippedCount } = await addMissingCategories();
    
    // Step 3: Display results
    const totalCount = await displayResults();
    
    // Summary
    console.log('\n✨ Setup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   🔧 Priorities fixed: ${fixedCount}`);
    console.log(`   ➕ Categories added: ${addedCount}`);
    console.log(`   ⏭️  Already existed: ${skippedCount}`);
    console.log(`   📋 Total categories: ${totalCount}`);
    
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh your dashboard');
    console.log('   3. All 25 categories should now appear with icons!');
    console.log('   4. Test in all languages (en, fr, ar)');
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
  }
};

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

