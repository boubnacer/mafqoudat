# GlobalState Quick Reference

## 🎯 What You Need to Know

GlobalState is **always guaranteed to exist** in localStorage. You never need to check for null/undefined.

## 📦 Import Utilities

```javascript
// Core utilities
import { 
  ensureGlobalStateAlwaysExists,
  ensureGlobalStateWithUserCountry,
  getGlobalState,
  initializeGlobalState
} from './utils/globalStateInitializer';

// React hook
import useGlobalStateInitializer from './hooks/useGlobalStateInitializer';
```

## 🚀 Common Use Cases

### 1. Safely Access GlobalState
```javascript
import { getGlobalState } from './utils/globalStateInitializer';

const state = getGlobalState();
console.log(state.currentCountry); // Always defined
```

### 2. Use in Components
```javascript
import useGlobalStateInitializer from './hooks/useGlobalStateInitializer';

function MyComponent() {
  const { getCurrentGlobalState } = useGlobalStateInitializer();
  
  const handleClick = () => {
    const state = getCurrentGlobalState();
    // Use state safely
  };
}
```

### 3. After Login (Automatic)
```javascript
// This is already handled automatically in authSlice
// When you dispatch setCredentials, globalState is initialized with user's country
dispatch(setCredentials({ accessToken, user }));
// ✅ globalState.currentCountry is now set
```

### 4. Manual Initialization (Rare)
```javascript
import { initializeGlobalState } from './utils/globalStateInitializer';

// Only if you need specific initialization
initializeGlobalState({
  currentCountry: 'Morocco',
  mode: 'dark'
});
```

## 🏗️ Structure

```javascript
{
  currentCountry: null,     // User's country (set on login)
  mode: "light",           // "light" | "dark"
  isSidebarOpen: false,    // boolean
  openModal: false,        // boolean
  activeLink: "",          // string
  foundOrlost: "",        // "found" | "lost" | ""
  direction: "ltr",       // "ltr" | "rtl"
  categoryFilter: "all"   // string
}
```

## ✅ What's Automatic

1. **On App Startup:** globalState is guaranteed to exist
2. **On Login:** User's country is set automatically
3. **On Page Refresh:** globalState persists
4. **If Corrupted:** Auto-repairs to valid state

## ❌ What NOT to Do

```javascript
// ❌ Don't check for existence
if (localStorage.getItem('globalState')) {
  // This check is unnecessary
}

// ✅ Just use it
const state = getGlobalState();
```

```javascript
// ❌ Don't manually set country on login
localStorage.setItem('currentCountry', user.country);

// ✅ It's automatic when you set credentials
dispatch(setCredentials({ accessToken, user }));
```

## 🔍 Debugging

```javascript
// Check current state in console
JSON.parse(localStorage.getItem('globalState'))

// Get state programmatically
import { getGlobalState } from './utils/globalStateInitializer';
console.log(getGlobalState());
```

## 📱 Key Files

- **Core Logic:** `client/src/utils/globalStateInitializer.js`
- **React Hook:** `client/src/hooks/useGlobalStateInitializer.js`
- **Redux Slice:** `client/src/app/state/index.js`
- **Auth Integration:** `client/src/features/auth/authSlice.js`
- **Full Guide:** `GLOBALSTATE_INITIALIZATION_GUIDE.md`

## 💡 Remember

> GlobalState is **always** there. Use it confidently without null checks.

## 🆘 Issues?

See full documentation in `GLOBALSTATE_INITIALIZATION_GUIDE.md`

