# Database Seeding Guide

## 🗄️ **Populate Your Database with Essential Data**

Your app needs countries, categories, and found/lost options to function properly. Here's how to add them:

## 📋 **Step 1: Update the MongoDB URI**

1. **Open `seed-database.js`**
2. **Find this line:**
   ```javascript
   const MONGODB_URI = 'mongodb+srv://mafqoudat:your_password@cluster0.mongodb.net/mafqoudat?retryWrites=true&w=majority';
   ```
3. **Replace `your_password` with your actual MongoDB password**
4. **If your password contains `@`, encode it as `%40`**

**Example:**
```javascript
const MONGODB_URI = 'mongodb+srv://mafqoudat:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority';
```

## 🚀 **Step 2: Run the Seed Script**

```bash
node seed-database.js
```

## 📊 **What Will Be Added:**

### **🌍 Countries (25 countries):**
- Morocco, Algeria, Tunisia, Egypt
- Saudi Arabia, UAE, Qatar, Kuwait
- Bahrain, Oman, Jordan, Lebanon
- Syria, Iraq, Palestine, Libya
- Sudan, Somalia, Djibouti, Comoros
- Mauritania, Mali, Niger, Chad
- Central African Republic

### **🏷️ Post Types (2 types):**
- **FOUND** - Items that have been found
- **LOST** - Items that have been lost

### **📂 Categories (6 categories):**
- **ELECTRONICS** - Electronic devices and gadgets
- **DOCUMENTS** - Important documents and papers
- **JEWELRY** - Jewelry and accessories
- **CLOTHING** - Clothing and fashion items
- **PETS** - Lost or found pets
- **VEHICLES** - Cars, motorcycles, and other vehicles

## ✅ **Expected Output:**

```
🌱 Starting database seeding...
Connecting to MongoDB...
✅ Connected to MongoDB
🧹 Clearing existing data...
✅ Cleared existing data
🌍 Seeding countries...
✅ Seeded 25 countries
🏷️  Seeding post types...
✅ Seeded 2 post types
📂 Seeding categories...
✅ Seeded 6 categories

🎉 Database seeding completed successfully!

📊 Summary:
Countries: 25 (MA, DZ, TN, EG, SA, AE, QA, KW, BH, OM, JO, LB, SY, IQ, PS, LY, SD, SO, DJ, KM, MR, ML, NE, TD, CF)
Post Types: 2 (FOUND, LOST)
Categories: 6 (ELECTRONICS, DOCUMENTS, JEWELRY, CLOTHING, PETS, VEHICLES)
🔌 Disconnected from MongoDB
```

## 🔧 **Troubleshooting:**

### **Connection Error:**
- Check your MongoDB password is correct
- Make sure `@` is encoded as `%40`
- Verify your MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### **Permission Error:**
- Make sure your MongoDB user has read/write permissions
- Check that the database name is correct

## 🎯 **After Seeding:**

1. **Test your app** - Users should now be able to:
   - Select countries when registering
   - Choose categories when creating posts
   - Select Found/Lost when posting

2. **Verify in MongoDB Atlas:**
   - Go to your MongoDB Atlas dashboard
   - Check the collections: `countries`, `foundlosts`, `categories`
   - You should see the seeded data

## 📝 **Note:**
This script will **clear existing data** and add fresh data. If you have important data in your database, make sure to backup first.
