# Maintenance Mode - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### Step 1: Add Redux Slice to Store

Edit `client/src/app/store.js`:

```javascript
import { configureStore } from '@reduxjs/toolkit';
import maintenanceReducer from './state/maintenanceSlice'; // Add this
// ... other imports

export const store = configureStore({
  reducer: {
    // ... your existing reducers
    maintenance: maintenanceReducer, // Add this line
  },
});
```

### Step 2: Update RTK Query Base Query

Edit your API slice file (e.g., `client/src/app/api/apiSlice.js`):

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setMaintenanceMode } from '../state/maintenanceSlice'; // Add this

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3500',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Add this wrapper function
const baseQueryWithMaintenanceCheck = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  // Check for maintenance mode
  if (result.error?.status === 503 && result.error?.data?.maintenanceMode) {
    api.dispatch(setMaintenanceMode({
      isActive: true,
      message: result.error.data.message,
      estimatedReturn: result.error.data.estimatedReturn
    }));
  }
  
  return result;
};

// Update your API slice to use the new base query
export const apiSlice = createApi({
  baseQuery: baseQueryWithMaintenanceCheck, // Changed this line
  // ... rest of your configuration
});
```

### Step 3: Add MaintenanceMode to App Component

Edit `client/src/App.js`:

```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsMaintenanceActive } from './app/state/maintenanceSlice'; // Add this
import MaintenanceMode from './components/MaintenanceMode'; // Add this
// ... other imports

function App() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive); // Add this
  
  // Show maintenance mode if active
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return (
    // Your normal app content
    <ThemeProvider theme={theme}>
      <LanguageProvider>
        {/* ... your existing app structure */}
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Step 4: Load Test Utilities (Development)

Edit `client/src/index.js` (add at the bottom):

```javascript
// ... your existing code

// Load maintenance mode test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/testMaintenanceMode');
}
```

### Step 5: Test It

**In browser console:**
```javascript
// Enable maintenance mode
enableTestMaintenanceMode()

// Disable maintenance mode
disableTestMaintenanceMode()
```

**Or test with real backend:**
```bash
# In server/.env
MAINTENANCE_MODE=true

# Restart server
cd server && npm start
```

---

## 📋 Quick Reference

### Files Created
```
client/src/
├── components/
│   └── MaintenanceMode.jsx           ✅ Main component
├── app/state/
│   └── maintenanceSlice.js           ✅ Redux state management
└── utils/
    ├── maintenanceModeInterceptor.js ✅ Axios interceptor (optional)
    └── testMaintenanceMode.js        ✅ Testing utilities
```

### Console Commands (Development)
```javascript
// Enable test mode
enableTestMaintenanceMode()

// Disable test mode
disableTestMaintenanceMode()

// Toggle test mode
toggleTestMaintenanceMode()

// Check current state
getMaintenanceState()
```

### Backend Environment Variable
```bash
MAINTENANCE_MODE=true   # Enable
MAINTENANCE_MODE=false  # Disable
```

### Redux Selectors
```javascript
import { 
  selectMaintenanceMode,          // Full state object
  selectIsMaintenanceActive,      // Boolean
  selectMaintenanceMessage,       // Message string
  selectMaintenanceEstimatedReturn // Estimated return string
} from './app/state/maintenanceSlice';
```

---

## 🎨 Customization Quick Tips

### Change Colors
Edit `MaintenanceMode.jsx` around line 60:

```javascript
background: theme.palette.mode === 'dark'
  ? 'your-dark-gradient'
  : 'your-light-gradient'
```

### Change Messages
Edit `MaintenanceMode.jsx` around line 160:

```javascript
const messages = {
  en: { title: "Your custom title", ... },
  fr: { title: "Votre titre personnalisé", ... },
  ar: { title: "عنوانك المخصص", ... }
};
```

### Change Animation Speed
Edit animation duration values:

```javascript
animation: `${pulse} 2s ease-in-out infinite` // Change 2s to your preference
```

---

## 🧪 Testing Checklist

- [ ] Test in English language
- [ ] Test in French language  
- [ ] Test in Arabic language (RTL)
- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test on mobile
- [ ] Test on tablet
- [ ] Test on desktop
- [ ] Test with real API 503 response
- [ ] Verify admin users can bypass (on backend)

---

## 🚨 Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Component doesn't show | Check Redux state: `getMaintenanceState()` |
| Wrong language | Verify LanguageContext is set up |
| Wrong theme | Check `theme.palette.mode` value |
| Logo not showing | Ensure `/maflogo.png` exists in `public/` |
| Still shows after disabling | Run: `disableTestMaintenanceMode()` |

---

## 📚 Full Documentation

For complete documentation, see:
- `MAINTENANCE_MODE_INTEGRATION_GUIDE.md` - Full integration guide
- Backend guide: `server/MAINTENANCE_MODE_GUIDE.md`

---

## ⚡ Production Deployment

1. **Enable on backend:**
   ```bash
   railway variables set MAINTENANCE_MODE=true
   # or your hosting platform's method
   ```

2. **Test:**
   - Visit your app
   - Should see maintenance screen for non-admin users
   - Admin users should still have access

3. **Disable when done:**
   ```bash
   railway variables set MAINTENANCE_MODE=false
   ```

---

## 📞 Support

- Check browser console for logs (look for 🔧 emoji)
- Use `getMaintenanceState()` to debug state
- Review network tab for 503 responses
- Verify backend returns correct JSON format

---

That's it! You're ready to use maintenance mode. 🎉

