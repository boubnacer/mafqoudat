/**
 * ALL-IN-ONE SCRIPT: Complete Category Setup for Lost & Found Website
 * 
 * This script sets up categories specifically for lost and found items
 * Based on research of most commonly lost/found items
 * 
 * Usage: node scripts/setup-lost-found-categories.js
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

// Lost & Found Categories - Based on most commonly lost items
const lostFoundCategories = [
  {
    code: "ELECTRONICS",
    labels: {
      en: "Electronics",
      fr: "Électronique",
      ar: "إلكترونيات"
    },
    color: "#00BCD4",
    description: "Mobile phones, tablets, laptops, and electronic devices",
    priority: 1,
    searchTerms: ["electronics", "électronique", "إلكترونيات", "phone", "mobile", "laptop", "tablet", "device"]
  },
  {
    code: "DOCUMENTS",
    labels: {
      en: "Documents & IDs",
      fr: "Documents et Pièces d'identité",
      ar: "وثائق وهويات"
    },
    color: "#795548",
    description: "ID cards, passports, licenses, certificates, papers",
    priority: 2,
    searchTerms: ["documents", "وثائق", "ID", "passport", "license", "certificate", "papers", "carte", "identité"]
  },
  {
    code: "JEWELRY",
    labels: {
      en: "Jewelry",
      fr: "Bijoux",
      ar: "مجوهرات"
    },
    color: "#9C27B0",
    description: "Rings, necklaces, bracelets, earrings",
    priority: 3,
    searchTerms: ["jewelry", "bijoux", "مجوهرات", "ring", "necklace", "bracelet", "earring", "bague", "collier"]
  },
  {
    code: "CLOTHING",
    labels: {
      en: "Clothing",
      fr: "Vêtements",
      ar: "ملابس"
    },
    color: "#4CAF50",
    description: "Coats, jackets, hats, scarves, clothes",
    priority: 4,
    searchTerms: ["clothing", "vêtements", "ملابس", "clothes", "coat", "jacket", "shirt", "pants", "manteau"]
  },
  {
    code: "PETS",
    labels: {
      en: "Pets & Animals",
      fr: "Animaux de compagnie",
      ar: "حيوانات أليفة"
    },
    color: "#FF6B6B",
    description: "Lost or found pets and animals",
    priority: 5,
    searchTerms: ["pets", "animaux", "حيوانات", "dog", "cat", "animal", "chien", "chat", "كلب", "قطة"]
  },
  {
    code: "VEHICLES",
    labels: {
      en: "Vehicles",
      fr: "Véhicules",
      ar: "مركبات"
    },
    color: "#607D8B",
    description: "Cars, motorcycles, bicycles, scooters",
    priority: 6,
    searchTerms: ["vehicles", "véhicules", "مركبات", "car", "bike", "bicycle", "motorcycle", "scooter", "voiture", "vélo"]
  },
  {
    code: "KEYS",
    labels: {
      en: "Keys",
      fr: "Clés",
      ar: "مفاتيح"
    },
    color: "#FF9800",
    description: "House keys, car keys, key chains",
    priority: 7,
    searchTerms: ["keys", "clés", "مفاتيح", "keychain", "house keys", "car keys", "clés de voiture", "clés de maison"]
  },
  {
    code: "WALLETS",
    labels: {
      en: "Wallets & Purses",
      fr: "Portefeuilles et Sacs à main",
      ar: "محافظ وحقائب يد"
    },
    color: "#FF5722",
    description: "Wallets, purses, money holders",
    priority: 8,
    searchTerms: ["wallet", "portefeuille", "محفظة", "purse", "money", "cash", "sac à main"]
  },
  {
    code: "BAGS",
    labels: {
      en: "Bags & Backpacks",
      fr: "Sacs et Sacs à dos",
      ar: "حقائب وحقائب ظهر"
    },
    color: "#8D6E63",
    description: "Backpacks, handbags, briefcases, luggage",
    priority: 9,
    searchTerms: ["bags", "sacs", "حقائب", "backpack", "handbag", "briefcase", "luggage", "sac à dos", "valise"]
  },
  {
    code: "WATCHES",
    labels: {
      en: "Watches",
      fr: "Montres",
      ar: "ساعات يد"
    },
    color: "#2196F3",
    description: "Wristwatches, smartwatches, fitness trackers",
    priority: 10,
    searchTerms: ["watch", "montre", "ساعة", "smartwatch", "wristwatch", "fitness tracker", "montre intelligente"]
  },
  {
    code: "GLASSES",
    labels: {
      en: "Glasses & Eyewear",
      fr: "Lunettes",
      ar: "نظارات"
    },
    color: "#3F51B5",
    description: "Eyeglasses, sunglasses, reading glasses",
    priority: 11,
    searchTerms: ["glasses", "lunettes", "نظارات", "eyeglasses", "sunglasses", "eyewear", "lunettes de soleil"]
  },
  {
    code: "HEADPHONES",
    labels: {
      en: "Headphones & Audio",
      fr: "Écouteurs et Audio",
      ar: "سماعات"
    },
    color: "#9C27B0",
    description: "Headphones, earbuds, speakers",
    priority: 12,
    searchTerms: ["headphones", "écouteurs", "سماعات", "earbuds", "earphones", "speaker", "audio", "airpods"]
  },
  {
    code: "UMBRELLAS",
    labels: {
      en: "Umbrellas",
      fr: "Parapluies",
      ar: "مظلات"
    },
    color: "#00BCD4",
    description: "Umbrellas and rain gear",
    priority: 13,
    searchTerms: ["umbrella", "parapluie", "مظلة", "rain", "pluie", "parasol"]
  },
  {
    code: "ACCESSORIES",
    labels: {
      en: "Accessories",
      fr: "Accessoires",
      ar: "إكسسوارات"
    },
    color: "#EC407A",
    description: "Hats, scarves, gloves, belts, ties",
    priority: 14,
    searchTerms: ["accessories", "accessoires", "إكسسوارات", "hat", "scarf", "gloves", "belt", "tie", "chapeau", "écharpe", "gants"]
  },
  {
    code: "BOOKS",
    labels: {
      en: "Books & Notebooks",
      fr: "Livres et Cahiers",
      ar: "كتب ودفاتر"
    },
    color: "#5E35B1",
    description: "Books, textbooks, notebooks, journals",
    priority: 15,
    searchTerms: ["books", "livres", "كتب", "notebook", "textbook", "journal", "cahier", "manuel", "دفتر"]
  },
  {
    code: "SPORTS",
    labels: {
      en: "Sports Equipment",
      fr: "Équipement sportif",
      ar: "معدات رياضية"
    },
    color: "#4CAF50",
    description: "Sports gear, balls, gym bags, bicycles",
    priority: 16,
    searchTerms: ["sports", "sport", "رياضة", "equipment", "ball", "bicycle", "gym", "équipement", "ballon", "vélo"]
  },
  {
    code: "TOYS",
    labels: {
      en: "Toys & Children's Items",
      fr: "Jouets et Articles pour enfants",
      ar: "ألعاب ومستلزمات أطفال"
    },
    color: "#FF9800",
    description: "Children's toys, games, stuffed animals",
    priority: 17,
    searchTerms: ["toys", "jouets", "ألعاب", "children", "kids", "games", "stuffed animal", "enfants", "jeux"]
  },
  {
    code: "CAMERAS",
    labels: {
      en: "Cameras & Photography",
      fr: "Appareils photo",
      ar: "كاميرات"
    },
    color: "#00897B",
    description: "Cameras, lenses, photography equipment",
    priority: 18,
    searchTerms: ["camera", "appareil photo", "كاميرا", "photography", "lens", "photo", "photographie", "objectif"]
  },
  {
    code: "BOTTLES",
    labels: {
      en: "Water Bottles & Containers",
      fr: "Bouteilles et Contenants",
      ar: "زجاجات وحاويات"
    },
    color: "#26A69A",
    description: "Water bottles, thermoses, food containers",
    priority: 19,
    searchTerms: ["bottle", "bouteille", "زجاجة", "water bottle", "thermos", "container", "gourde", "récipient"]
  },
  {
    code: "PERSON",
    labels: {
      en: "Missing Persons",
      fr: "Personnes disparues",
      ar: "أشخاص مفقودون"
    },
    color: "#F44336",
    description: "Missing person reports",
    priority: 20,
    searchTerms: ["person", "personne", "شخص", "missing", "lost person", "disparu", "مفقود"]
  },
  {
    code: "OTHER",
    labels: {
      en: "Other Items",
      fr: "Autres articles",
      ar: "أشياء أخرى"
    },
    color: "#9E9E9E",
    description: "Items not fitting other categories",
    priority: 21,
    searchTerms: ["other", "autre", "آخر", "misc", "miscellaneous", "various", "divers"]
  }
];

// Update or create categories
const setupCategories = async () => {
  try {
    console.log('\n📋 Setting up Lost & Found categories...\n');
    
    let updatedCount = 0;
    let addedCount = 0;
    let unchangedCount = 0;

    for (const categoryData of lostFoundCategories) {
      const existingCategory = await Category.findOne({ code: categoryData.code });
      
      if (existingCategory) {
        // Update existing category
        let hasChanges = false;
        
        if (existingCategory.priority !== categoryData.priority) {
          existingCategory.priority = categoryData.priority;
          hasChanges = true;
        }
        
        if (existingCategory.color !== categoryData.color) {
          existingCategory.color = categoryData.color;
          hasChanges = true;
        }
        
        if (existingCategory.description !== categoryData.description) {
          existingCategory.description = categoryData.description;
          hasChanges = true;
        }
        
        // Update labels if different
        if (JSON.stringify(existingCategory.labels) !== JSON.stringify(categoryData.labels)) {
          existingCategory.labels = categoryData.labels;
          hasChanges = true;
        }
        
        if (hasChanges) {
          existingCategory.searchTerms = categoryData.searchTerms;
          await existingCategory.save();
          console.log(`✅ Updated: ${categoryData.code.padEnd(20)} - ${categoryData.labels.en}`);
          updatedCount++;
        } else {
          console.log(`✓  OK:      ${categoryData.code.padEnd(20)} - ${categoryData.labels.en}`);
          unchangedCount++;
        }
      } else {
        // Create new category
        categoryData.isActive = true;
        await Category.create(categoryData);
        console.log(`➕ Added:   ${categoryData.code.padEnd(20)} - ${categoryData.labels.en}`);
        addedCount++;
      }
    }
    
    return { addedCount, updatedCount, unchangedCount };
  } catch (error) {
    console.error('❌ Error setting up categories:', error);
    throw error;
  }
};

// Deactivate removed categories
const deactivateOldCategories = async () => {
  console.log('\n📋 Checking for outdated categories...\n');
  
  const currentCodes = lostFoundCategories.map(cat => cat.code);
  const oldCategories = await Category.find({ 
    code: { $nin: currentCodes },
    isActive: true 
  });
  
  if (oldCategories.length === 0) {
    console.log('✓  No outdated categories found');
    return 0;
  }
  
  let deactivatedCount = 0;
  for (const oldCat of oldCategories) {
    oldCat.isActive = false;
    await oldCat.save();
    console.log(`⚠️  Deactivated: ${oldCat.code} (not relevant for Lost & Found)`);
    deactivatedCount++;
  }
  
  return deactivatedCount;
};

// Display final results
const displayResults = async () => {
  console.log('\n📋 FINAL RESULTS: All Active Lost & Found Categories\n');
  
  const allCats = await Category.find({ isActive: true })
    .sort({ priority: 1 })
    .select('code labels.en priority color');
  
  console.log('═'.repeat(85));
  allCats.forEach((cat, index) => {
    const num = String(index + 1).padStart(2);
    const code = cat.code.padEnd(20);
    const label = cat.labels.en.padEnd(35);
    const priority = String(cat.priority).padStart(2);
    console.log(`${num}. ${code} - ${label} (Priority: ${priority}, Color: ${cat.color})`);
  });
  console.log('═'.repeat(85));
  
  return allCats.length;
};

// Main execution
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Lost & Found Categories Setup                          ║');
  console.log('║    Optimized for commonly lost and found items            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await connectDB();
    
    // Setup categories
    const { addedCount, updatedCount, unchangedCount } = await setupCategories();
    
    // Deactivate old irrelevant categories
    const deactivatedCount = await deactivateOldCategories();
    
    // Display results
    const totalCount = await displayResults();
    
    // Summary
    console.log('\n✨ Setup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   ➕ Categories added: ${addedCount}`);
    console.log(`   ✅ Categories updated: ${updatedCount}`);
    console.log(`   ✓  Unchanged: ${unchangedCount}`);
    if (deactivatedCount > 0) {
      console.log(`   ⚠️  Deactivated (irrelevant): ${deactivatedCount}`);
    }
    console.log(`   📋 Total active categories: ${totalCount}`);
    
    console.log('\n🎯 Categories optimized for Lost & Found:');
    console.log('   ✅ Common lost items (keys, wallets, phones)');
    console.log('   ✅ Personal belongings (bags, glasses, umbrellas)');
    console.log('   ✅ Valuable items (jewelry, documents, electronics)');
    console.log('   ✅ Removed: Shopping-related categories');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend server to clear cache');
    console.log('   2. Refresh your dashboard');
    console.log('   3. All relevant categories will appear with icons!');
    console.log('   4. Icons are already configured in the frontend');
    
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

