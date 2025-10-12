# Categories System - Quick Reference Card

## 📍 Key Files

| Location | Purpose |
|----------|---------|
| `server/models/Category.js` | Database schema |
| `server/controllers/dependenciesController.js` | API controller (getCategories) |
| `server/routes/categoryRoute.js` | API route `/categories` |
| `client/src/config/categories.js` | **Icon & color mapping** |
| `client/src/components/dashboard/Categories.jsx` | Display component |
| `client/src/features/dependencies/dependenciesApiSlice.js` | API integration |

---

## 🔄 Data Flow (Simple)

```
MongoDB → Backend API → Redux Store → Categories Component → Display with Icons
```

---

## ⚡ Quick Add Process

### 1️⃣ Database (Choose one):

**A. Use Script:**
```bash
cd server
node scripts/add-category.js
```

**B. MongoDB Shell:**
```javascript
db.categories.insertOne({
  code: "YOUR_CODE",
  labels: { en: "English", fr: "French", ar: "Arabic" },
  color: "#HEX",
  isActive: true,
  priority: 26
})
```

### 2️⃣ Frontend Icon Config:

**File:** `client/src/config/categories.js`

```javascript
// 1. Add import
import { YourIconOutlined } from '@mui/icons-material';

// 2. Add to CATEGORY_CONFIG
YOUR_CODE: {
  icon: YourIconOutlined,
  color: '#HEX',
  backgroundColor: '#LIGHTHEX',
  priority: 26
}
```

### 3️⃣ Test:
```bash
# Restart backend
cd server && npm start

# View in browser
http://localhost:3000/dash
```

---

## 🎨 Icon Selection

**Browse:** https://mui.com/material-ui/material-icons/

**Popular Categories:**
- 📱 Electronics: `PhoneAndroidOutlined`
- 📚 Books: `MenuBookOutlined`
- 🪑 Furniture: `ChairOutlined`
- 👶 Baby: `ChildCareOutlined`
- 👟 Shoes: `DirectionsRunOutlined`
- 💼 Office: `BusinessCenterOutlined`
- 🎨 Art: `BrushOutlined`
- 🏕️ Outdoor: `OutdoorGrillOutlined`

---

## 🎨 Color Guidelines

**Main Color:** Primary icon color  
**Background:** 90% lighter tint of main color

**Examples:**
- Blue: `#2196F3` → `#E3F2FD`
- Green: `#4CAF50` → `#E8F5E9`
- Purple: `#9C27B0` → `#F3E5F5`

**Color Tool:** https://material.io/design/color/

---

## 🔍 Current Categories (25)

1. ELECTRONICS
2. DOCUMENTS
3. JEWELRY
4. CLOTHING
5. PETS
6. VEHICLES
7. KEYS
8. WALLET
9. WATCHES
10. GAMING
11. MEDICAL
12. LUGGAGE
13. PERSON
14. SHOPPING
15. WORK
16. SPORTS
17. MUSIC
18. TOYS
19. BEAUTY
20. CAMERA
21. TOOLS
22. GARDEN
23. HOME
24. FOOD
25. OTHER

---

## ✅ Success Checklist

- [ ] Category added to database
- [ ] Code is UPPERCASE
- [ ] Has labels in en, fr, ar
- [ ] Icon imported in categories.js
- [ ] Config added to CATEGORY_CONFIG
- [ ] Backend cache cleared/restarted
- [ ] Tested in dashboard
- [ ] Tested hover effects
- [ ] Tested all languages
- [ ] Tested category filtering

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Icon shows as "OTHER" | Code mismatch - check database code matches frontend config (case-sensitive) |
| Categories not showing | Clear cache, restart backend |
| Wrong colors | Check hex format: `#2196F3` |
| Import error | Verify icon name from Material-UI docs |

---

## 🔧 Helper Functions

```javascript
// Available in client/src/config/categories.js
getCategoryIcon(code)           // Returns icon component
getCategoryColor(code)          // Returns color string
getCategoryBackgroundColor(code) // Returns background color
getCategoryConfig(code)         // Returns full config
getSortedCategories()          // All categories by priority
```

---

## 📊 Database Schema

```javascript
{
  code: String,          // Required, unique, UPPERCASE
  labels: {
    en: String,         // Required
    fr: String,         // Required
    ar: String          // Required
  },
  color: String,        // Default: '#2196F3'
  isActive: Boolean,    // Default: true
  priority: Number,     // Default: 0
  searchTerms: [String] // Optional
}
```

---

## 🌐 API Endpoint

**URL:** `GET /categories`

**Query Params:**
- `language` (en/fr/ar) - default: 'en'
- `active` (true/false) - default: true

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "code": "ELECTRONICS",
      "label": "Electronics",
      "labels": {
        "en": "Electronics",
        "fr": "Électronique",
        "ar": "إلكترونيات"
      },
      "color": "#00BCD4",
      "isActive": true
    }
  ],
  "total": 25
}
```

---

## 📚 Full Documentation

| Document | Description |
|----------|-------------|
| `CATEGORIES_SYSTEM_ANALYSIS.md` | Complete system architecture |
| `client/ADDING_CATEGORY_ICONS_GUIDE.md` | Icon selection guide |
| `ADD_NEW_CATEGORIES_TUTORIAL.md` | Step-by-step tutorial |
| `server/scripts/add-category.js` | Database insertion script |

---

## 🎯 One-Line Commands

```bash
# Add categories to database
node server/scripts/add-category.js

# Check categories in MongoDB
mongo <connection-string> --eval "db.categories.find().pretty()"

# Clear Redis cache
redis-cli FLUSHDB

# Test API endpoint
curl "http://localhost:3500/categories?language=en"
```

---

## 🚀 Quick Start for New Category

1. Pick icon from Material-UI
2. Choose colors (main + light background)
3. Add to database with code, labels (en/fr/ar), color
4. Import icon in `categories.js`
5. Add to `CATEGORY_CONFIG`
6. Restart backend
7. Test in dashboard

**Time needed:** ~5 minutes per category

---

**💡 Pro Tip:** Always use UPPERCASE for category codes and keep them consistent between database and frontend!

