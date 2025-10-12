# Frontend Maintenance Mode Integration Guide

## Overview
This guide explains how to integrate the `MaintenanceMode` component with your React application to automatically detect and display maintenance mode when the backend API returns a 503 status.

## Component Location
**File**: `client/src/components/MaintenanceMode.jsx`

## Features
✅ **Multilingual Support** - English, French, and Arabic translations
✅ **Theme-Aware** - Automatically adapts to light/dark mode
✅ **Responsive Design** - Works perfectly on all screen sizes
✅ **Professional Animations** - Smooth pulsing, floating, and rotating effects
✅ **Glassmorphism UI** - Modern frosted glass effect
✅ **RTL Support** - Full support for Arabic right-to-left layout

## Integration Methods

### Method 1: Global Error Interceptor (Recommended)

Create an Axios interceptor that detects maintenance mode globally:

#### Step 1: Create API Interceptor

Create `client/src/utils/maintenanceModeInterceptor.js`:

```javascript
import { store } from '../app/store';
import { setMaintenanceMode } from '../app/state/maintenanceSlice'; // You'll create this

export const setupMaintenanceModeInterceptor = (apiClient) => {
  // Response interceptor
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if the error is a 503 maintenance mode response
      if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
        console.log('🔧 Maintenance mode detected:', error.response.data);
        
        // Dispatch action to show maintenance mode
        store.dispatch(setMaintenanceMode({
          isActive: true,
          message: error.response.data.message,
          estimatedReturn: error.response.data.estimatedReturn
        }));
        
        // Prevent the error from propagating further
        return Promise.reject({
          ...error,
          maintenanceMode: true
        });
      }
      
      return Promise.reject(error);
    }
  );
};
```

#### Step 2: Create Redux Slice

Create `client/src/app/state/maintenanceSlice.js`:

```javascript
import { createSlice } from '@reduxjs/toolkit';

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: {
    isActive: false,
    message: '',
    estimatedReturn: 'soon'
  },
  reducers: {
    setMaintenanceMode: (state, action) => {
      state.isActive = action.payload.isActive;
      state.message = action.payload.message || '';
      state.estimatedReturn = action.payload.estimatedReturn || 'soon';
    },
    clearMaintenanceMode: (state) => {
      state.isActive = false;
      state.message = '';
      state.estimatedReturn = 'soon';
    }
  }
});

export const { setMaintenanceMode, clearMaintenanceMode } = maintenanceSlice.actions;
export const selectMaintenanceMode = (state) => state.maintenance;
export default maintenanceSlice.reducer;
```

#### Step 3: Add to Store

Update `client/src/app/store.js`:

```javascript
import maintenanceReducer from './state/maintenanceSlice';

export const store = configureStore({
  reducer: {
    // ... your existing reducers
    maintenance: maintenanceReducer,
  },
});
```

#### Step 4: Setup Interceptor in API Configuration

In your API slice or axios configuration file:

```javascript
import { setupMaintenanceModeInterceptor } from '../utils/maintenanceModeInterceptor';
import { apiSlice } from './apiSlice'; // Your existing API slice

// Setup the interceptor
setupMaintenanceModeInterceptor(apiSlice);
```

#### Step 5: Add to App Component

Update `client/src/App.js`:

```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { selectMaintenanceMode } from './app/state/maintenanceSlice';
import MaintenanceMode from './components/MaintenanceMode';
// ... other imports

function App() {
  const { isActive: isMaintenanceMode } = useSelector(selectMaintenanceMode);
  
  // Show maintenance mode if active
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return (
    // Your normal app content
    <div className="App">
      {/* ... your routes and components */}
    </div>
  );
}

export default App;
```

---

### Method 2: React Query Integration

If you're using React Query (TanStack Query):

#### Step 1: Create Query Client with Global Error Handler

```javascript
import { QueryClient } from '@tanstack/react-query';
import { store } from './app/store';
import { setMaintenanceMode } from './app/state/maintenanceSlice';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
          store.dispatch(setMaintenanceMode({
            isActive: true,
            message: error.response.data.message,
            estimatedReturn: error.response.data.estimatedReturn
          }));
        }
      },
    },
    mutations: {
      onError: (error) => {
        if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
          store.dispatch(setMaintenanceMode({
            isActive: true,
            message: error.response.data.message,
            estimatedReturn: error.response.data.estimatedReturn
          }));
        }
      },
    },
  },
});
```

---

### Method 3: RTK Query Integration (Current Setup)

Since your app uses RTK Query, here's the recommended approach:

#### Step 1: Add Base Query Error Handler

Update your `client/src/app/api/apiSlice.js` (or wherever your RTK Query base is):

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setMaintenanceMode } from '../state/maintenanceSlice';

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

const baseQueryWithMaintenanceCheck = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  // Check for maintenance mode
  if (result.error?.status === 503 && result.error?.data?.maintenanceMode) {
    console.log('🔧 Maintenance mode detected:', result.error.data);
    api.dispatch(setMaintenanceMode({
      isActive: true,
      message: result.error.data.message,
      estimatedReturn: result.error.data.estimatedReturn
    }));
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithMaintenanceCheck,
  // ... rest of your API slice configuration
});
```

#### Step 2: Add to App Component (Same as Method 1, Step 5)

---

## Component Usage

### Direct Usage (Manual)

If you want to manually show the maintenance mode:

```javascript
import MaintenanceMode from './components/MaintenanceMode';

function MyComponent() {
  const [showMaintenance, setShowMaintenance] = useState(false);
  
  if (showMaintenance) {
    return <MaintenanceMode />;
  }
  
  return <div>Normal content</div>;
}
```

---

## Testing

### Test Maintenance Mode Display

1. **Enable maintenance mode on backend**:
   ```bash
   # In server/.env
   MAINTENANCE_MODE=true
   ```

2. **Restart your backend server**:
   ```bash
   cd server
   npm start
   ```

3. **Test the frontend**:
   - Open your React app
   - Try to access any protected route
   - You should see the maintenance mode screen

4. **Test admin bypass** (should NOT show maintenance):
   - Login as an admin user
   - Access protected routes
   - Admin should see normal content, not maintenance screen

### Manual Testing Script

Create `client/src/utils/testMaintenanceMode.js`:

```javascript
import { store } from '../app/store';
import { setMaintenanceMode, clearMaintenanceMode } from '../app/state/maintenanceSlice';

// Test functions (for development only)
export const enableTestMaintenanceMode = () => {
  console.log('🔧 Enabling test maintenance mode...');
  store.dispatch(setMaintenanceMode({
    isActive: true,
    message: "Test maintenance mode",
    estimatedReturn: "In a few moments"
  }));
};

export const disableTestMaintenanceMode = () => {
  console.log('✅ Disabling test maintenance mode...');
  store.dispatch(clearMaintenanceMode());
};

// Make available in console for testing
if (process.env.NODE_ENV === 'development') {
  window.enableTestMaintenanceMode = enableTestMaintenanceMode;
  window.disableTestMaintenanceMode = disableTestMaintenanceMode;
}
```

Then in browser console:
```javascript
// Enable maintenance mode
enableTestMaintenanceMode();

// Disable maintenance mode
disableTestMaintenanceMode();
```

---

## Customization

### Change Colors

Edit the gradient backgrounds in `MaintenanceContainer` styled component:

```javascript
// Dark mode
background: 'linear-gradient(135deg, #your-colors-here)',

// Light mode  
background: 'linear-gradient(135deg, #your-colors-here)',
```

### Change Messages

Messages are automatically pulled from the current language. To modify:

Edit the `messages` object in `MaintenanceMode.jsx`:

```javascript
const messages = {
  en: {
    title: "Your custom English title",
    subtitle: "Your custom English subtitle",
    // ...
  },
  // ... fr and ar
};
```

### Change Animation Speed

Adjust the animation durations in keyframes:

```javascript
// Slower pulse
animation: `${pulse} 3s ease-in-out infinite`, // Changed from 2s

// Faster float
animation: `${float} 2s ease-in-out infinite`, // Changed from 3s
```

### Add More Languages

Add new language objects to the `messages` object:

```javascript
const messages = {
  en: { /* ... */ },
  fr: { /* ... */ },
  ar: { /* ... */ },
  es: {
    title: "Actualmente estamos realizando mantenimiento programado",
    subtitle: "¡Volveremos pronto! Gracias por su paciencia.",
    estimatedReturn: "Regreso estimado: Pronto",
    updating: "Actualizando y mejorando..."
  }
};
```

---

## Troubleshooting

### Issue: Maintenance mode shows even when backend is working

**Solution**: Check Redux state or clear maintenance mode:
```javascript
import { clearMaintenanceMode } from './app/state/maintenanceSlice';
store.dispatch(clearMaintenanceMode());
```

### Issue: Maintenance mode doesn't show when backend is in maintenance

**Solution**: 
1. Verify the interceptor is set up correctly
2. Check browser console for 503 responses
3. Verify the backend is returning the correct JSON format:
   ```json
   {
     "maintenanceMode": true,
     "message": "...",
     "estimatedReturn": "soon"
   }
   ```

### Issue: Logo doesn't display

**Solution**: 
1. Verify `/maflogo.png` exists in `client/public/` directory
2. Check browser console for image loading errors
3. Logo will gracefully hide if not found (no broken image icon)

### Issue: Wrong language displays

**Solution**: 
1. Check `currentLanguage` value in Redux/Context
2. Verify LanguageContext is properly set up
3. Add console.log to see what language is being used:
   ```javascript
   console.log('Current language:', currentLanguage);
   ```

---

## Production Checklist

Before deploying maintenance mode:

- [ ] Test maintenance mode display in all languages (en, fr, ar)
- [ ] Test in both light and dark themes
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify admin bypass works correctly
- [ ] Test that maintenance mode can be enabled/disabled via environment variable
- [ ] Verify logo displays correctly
- [ ] Check animations are smooth
- [ ] Test with real API 503 responses
- [ ] Document the maintenance procedure for your team
- [ ] Set up monitoring alerts for maintenance mode activation

---

## Best Practices

1. **Always test in staging first** - Never enable maintenance mode in production without testing
2. **Communicate early** - Notify users before enabling maintenance mode
3. **Set realistic timeframes** - Update `estimatedReturn` with accurate information
4. **Monitor in real-time** - Watch logs and user feedback during maintenance
5. **Have a rollback plan** - Know how to quickly disable maintenance mode if needed
6. **Document everything** - Keep notes on what maintenance was performed

---

## API Response Format

The backend maintenance mode middleware returns:

```json
{
  "maintenanceMode": true,
  "message": "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
  "estimatedReturn": "soon"
}
```

**Status Code**: 503 Service Unavailable

---

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review the component source code in `client/src/components/MaintenanceMode.jsx`
3. Test with the browser console testing functions
4. Verify backend maintenance mode is configured correctly (see server-side guide)

