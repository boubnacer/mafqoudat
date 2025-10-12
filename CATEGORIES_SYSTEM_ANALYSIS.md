# Categories System Analysis

## Overview
The Categories system in your dashboard follows a **three-tier architecture**: Database → Backend API → Frontend Display with icon mapping.

---

## 📊 Data Flow Architecture

```
MongoDB (Category Model)
        ↓
Backend API (/categories endpoint)
        ↓
Redux RTK Query (useGetCategoriesQuery)
        ↓
Frontend Component (Categories.jsx)
        ↓
Icon Mapping (categories.js config)
        ↓
Display with Icons
```

---

## 1. 🗄️ Database Layer (Backend)

### Category Model
**Location:** `server/models/Category.js`

#### Schema Structure:
```javascript
{
  code: String,          // Unique identifier (e.g., "ELECTRONICS", "PETS")
  labels: {
    en: String,          // English label
    fr: String,          // French label
    ar: String           // Arabic label
  },
  color: String,         // Optional color (default: '#2196F3')
  isActive: Boolean,     // Active/inactive status (default: true)
  description: String,   // Optional description
  priority: Number,      // Display order priority (default: 0)
  searchTerms: [String], // Search optimization
  iconName: String       // Reference only (not used for rendering)
}
```

#### Key Features:
- Multilingual support (English, French, Arabic)
- Text search indexes for efficient searching
- Compound indexes for performance optimization
- Active/inactive status for showing/hiding categories

---

## 2. 🔌 Backend API Layer

### Controller
**Location:** `server/controllers/dependenciesController.js`

#### Endpoint: `GET /categories`

**Query Parameters:**
- `language` (default: 'en') - Language for labels
- `active` (default: true) - Filter by active status

**Features:**
- Redis caching (24-hour cache)
- Automatic language-specific label selection
- Backward compatibility for old data format
- Returns transformed data with proper structure

**Response Format:**
```javascript
{
  success: true,
  data: [
    {
      _id: "...",
      code: "ELECTRONICS",
      label: "Electronics",        // Language-specific
      labels: {
        en: "Electronics",
        fr: "Électronique",
        ar: "إلكترونيات"
      },
      icon: null,
      color: "#2196F3",
      isActive: true,
      description: null
    }
  ],
  total: 10
}
```

### Route
**Location:** `server/routes/categoryRoute.js`

```javascript
router.route("/").get(optimizedStaticDataCache('categories'), getCategories);
```

---

## 3. 🎨 Frontend Layer

### A. API Integration
**Location:** `client/src/features/dependencies/dependenciesApiSlice.js`

#### Redux RTK Query Hook: `useGetCategoriesQuery`

```javascript
const { categories, isLoading } = useGetCategoriesQuery({
  language: currentLanguage
}, {
  selectFromResult: ({ data, isLoading, isFetching }) => ({
    categories: data?.ids.map((id) => data?.entities[id]),
    isLoading,
    isFetching
  }),
});
```

**Features:**
- Automatic caching
- Retry logic for rate limits (3 retries)
- Normalized data structure (entities by ID)
- Language-based cache keys

---

### B. Icon Configuration
**Location:** `client/src/config/categories.js`

This is the **KEY FILE** for icon mapping. It maps category codes to Material-UI icons.

#### Current Categories (25 total):

| Code | Icon | Color | Priority |
|------|------|-------|----------|
| ELECTRONICS | PhoneAndroidOutlined | #00BCD4 | 1 |
| DOCUMENTS | ArticleOutlined | #795548 | 2 |
| JEWELRY | AttachMoneyOutlined | #9C27B0 | 3 |
| CLOTHING | LuggageOutlined | #4CAF50 | 4 |
| PETS | PetsOutlined | #795548 | 5 |
| VEHICLES | DirectionsCarOutlined | #607D8B | 6 |
| KEYS | KeyOutlined | #FF9800 | 7 |
| WALLET | CreditCardOutlined | #FF5722 | 8 |
| WATCHES | WatchOutlined | #2196F3 | 9 |
| GAMING | SportsEsportsOutlined | #E91E63 | 10 |
| MEDICAL | LocalHospitalOutlined | #F44336 | 11 |
| LUGGAGE | LuggageOutlined | #795548 | 12 |
| PERSON | PersonOutlined | #2196F3 | 13 |
| SHOPPING | ShoppingBagOutlined | #9C27B0 | 14 |
| WORK | WorkOutlineOutlined | #607D8B | 15 |
| SPORTS | SportsSoccerOutlined | #4CAF50 | 16 |
| MUSIC | MusicNoteOutlined | #9C27B0 | 17 |
| TOYS | ToysOutlined | #FF9800 | 18 |
| BEAUTY | FaceOutlined | #E91E63 | 19 |
| CAMERA | CameraAltOutlined | #2196F3 | 20 |
| TOOLS | BuildOutlined | #607D8B | 21 |
| GARDEN | LocalFloristOutlined | #4CAF50 | 22 |
| HOME | HomeOutlined | #8BC34A | 23 |
| FOOD | RestaurantOutlined | #FF9800 | 24 |
| OTHER | MoreHorizOutlined | #9E9E9E | 25 |

#### Helper Functions:
```javascript
getCategoryIcon(code)           // Returns icon component
getCategoryColor(code)          // Returns primary color
getCategoryBackgroundColor(code) // Returns background color
getCategoryConfig(code)         // Returns full config object
getSortedCategories()          // Returns all categories sorted by priority
```

---

### C. Display Component
**Location:** `client/src/components/dashboard/Categories.jsx`

#### How It Works:

1. **Fetch Categories** from API with current language
2. **Map through categories** and extract `code` and `labels`
3. **Get icon configuration** using `getCategoryIcon(code)`
4. **Render** in responsive grid with animations
5. **Handle clicks** to navigate to filtered posts

#### Key Features:
- Shows first 4 categories by default
- "Show All/Show Less" toggle button
- Hover animations with color transitions
- RTL support for Arabic
- Click to filter posts by category
- Responsive grid layout (2 cols mobile → 6 cols desktop)

#### Rendering Logic:
```javascript
{categoriesToShow.map(({ _id, code, labels }, index) => {
  const IconComponent = getCategoryIcon(code);      // Get icon
  const iconColor = getCategoryColor(code);         // Get color
  const backgroundColor = getCategoryBackgroundColor(code); // Get bg color
  
  return (
    <Card onClick={() => handleCategoryClick(_id)}>
      <IconComponent />
      <Typography>
        {labels[currentLanguage] || labels.en}
      </Typography>
    </Card>
  );
})}
```

---

## 🎯 How to Add More Categories

### Step 1: Add to Database
Use MongoDB shell or a script to insert a new category:

```javascript
db.categories.insertOne({
  code: "BOOKS",
  labels: {
    en: "Books",
    fr: "Livres",
    ar: "كتب"
  },
  color: "#3F51B5",
  isActive: true,
  priority: 26,
  searchTerms: ["books", "livres", "كتب", "reading", "literature"]
});
```

### Step 2: Add Icon Mapping in Frontend
**File:** `client/src/config/categories.js`

1. **Import the icon** at the top:
```javascript
import { MenuBookOutlined } from '@mui/icons-material';
```

2. **Add to CATEGORY_CONFIG** object:
```javascript
BOOKS: {
  icon: MenuBookOutlined,
  color: '#3F51B5',
  backgroundColor: '#E8EAF6',
  priority: 26
}
```

### Step 3: Clear Cache (if needed)
The backend caches categories for 24 hours. To see changes immediately:
- Restart the backend server, OR
- Clear Redis cache, OR
- Wait 24 hours for cache expiration

### Step 4: Verify
1. Check dashboard → Categories section
2. Category should appear with its icon
3. Click to verify filtering works
4. Test in all languages (en, fr, ar)

---

## 🔍 Important Notes

### Icon Selection
The system uses **code-based mapping**:
- Database stores only the `code` (e.g., "ELECTRONICS")
- Frontend `categories.js` maps code → icon component
- If code not found, falls back to "OTHER" category with `MoreHorizOutlined` icon

### Language Handling
- Backend returns labels in all languages
- Frontend displays label based on `currentLanguage`
- Falls back to English if translation missing

### Cache Strategy
- Backend: 24-hour Redis cache
- Frontend: RTK Query cache with automatic invalidation
- Language-specific cache keys ensure proper translations

### Icon Library
All icons come from **Material-UI Icons** (`@mui/icons-material`):
- Browse available icons: https://mui.com/material-ui/material-icons/
- Import pattern: `import { IconName } from '@mui/icons-material';`

---

## 📝 Example: Adding "FURNITURE" Category

### 1. Database Entry:
```javascript
{
  code: "FURNITURE",
  labels: {
    en: "Furniture",
    fr: "Meubles",
    ar: "أثاث"
  },
  color: "#8D6E63",
  isActive: true,
  priority: 27,
  searchTerms: ["furniture", "meubles", "أثاث", "table", "chair"]
}
```

### 2. Frontend Config (`client/src/config/categories.js`):

```javascript
// Add import
import { ChairOutlined } from '@mui/icons-material';

// Add to CATEGORY_CONFIG
FURNITURE: {
  icon: ChairOutlined,
  color: '#8D6E63',
  backgroundColor: '#EFEBE9',
  priority: 27
}
```

### 3. Result:
✅ New category appears in dashboard
✅ Shows chair icon with brown color
✅ Works in all languages
✅ Clickable to filter posts

---

## 🛠️ Maintenance Tips

1. **Keep Codes Consistent**: Use UPPERCASE codes in both database and frontend config
2. **Match Priorities**: Ensure priority in database matches frontend for consistent ordering
3. **Test All Languages**: Always test new categories in en, fr, and ar
4. **Icon Colors**: Choose contrasting colors for better visibility
5. **Background Colors**: Use light tints of the main color (lower opacity)

---

## 🚀 Quick Reference Scripts

### MongoDB Query - Get All Categories:
```javascript
db.categories.find({ isActive: true }).sort({ priority: 1 })
```

### MongoDB Query - Add Category:
```javascript
db.categories.insertOne({
  code: "YOUR_CODE",
  labels: { en: "English", fr: "French", ar: "Arabic" },
  color: "#COLOR",
  isActive: true,
  priority: 28
})
```

### Frontend - Available Icon Helper:
```javascript
import { getCategoryCodes } from './config/categories';
console.log(getCategoryCodes()); // Lists all configured categories
```

---

## 📞 Integration Points

Categories are used in:
1. **Dashboard** - Categories.jsx (display grid)
2. **New Post** - NewPost.js (category selection)
3. **Edit Post** - EditPost.js (category editing)
4. **Posts List** - PostsList.js (filtering)
5. **Search** - Category-based filtering

All components use the same `useGetCategoriesQuery` hook for consistency.

