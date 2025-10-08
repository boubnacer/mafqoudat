# Language Storage - Quick Developer Reference

## ✅ DO's

### Reading Language
```javascript
// ✅ Correct - Use unified key
import { languageStorage } from './utils/authStorage';
const currentLang = languageStorage.getCurrentLanguage();

// ✅ Also correct - Using languageUtils
import { getCurrentLanguage } from './utils/languageUtils';
const currentLang = getCurrentLanguage();

// ✅ Direct access (if necessary)
const currentLang = localStorage.getItem('language') || 'en';
```

### Setting Language
```javascript
// ✅ Correct - Use LanguageStorageManager
import { languageStorage } from './utils/authStorage';
languageStorage.setLanguage('ar');

// ✅ Also correct - Using languageUtils
import { setCurrentLanguage } from './utils/languageUtils';
setCurrentLanguage('ar');

// ✅ In React components - Use language context
import { useLanguage } from './utils/languageContext';
const { setLanguage } = useLanguage();
setLanguage('ar');
```

## ❌ DON'Ts

### Reading Language
```javascript
// ❌ WRONG - Deprecated keys
localStorage.getItem('app_language');
localStorage.getItem('currentLanguage');
```

### Setting Language
```javascript
// ❌ WRONG - Don't set deprecated keys
localStorage.setItem('app_language', 'ar');
localStorage.setItem('currentLanguage', 'ar');

// ❌ WRONG - Don't set multiple keys
localStorage.setItem('language', 'ar');
localStorage.setItem('app_language', 'ar'); // Redundant!
```

## Storage Key Reference

| Key | Status | Description |
|-----|--------|-------------|
| `language` | ✅ **ACTIVE** | Single source of truth for language |
| `app_language` | ⚠️ **DEPRECATED** | Old key - DO NOT USE |
| `currentLanguage` | ⚠️ **DEPRECATED** | Old key - DO NOT USE |

## Common Patterns

### 1. Component Language Display
```javascript
import { useLanguage } from './utils/languageContext';

function MyComponent() {
  const { currentLanguage, setLanguage } = useLanguage();
  
  return (
    <div>
      <p>Current: {currentLanguage}</p>
      <button onClick={() => setLanguage('ar')}>Arabic</button>
    </div>
  );
}
```

### 2. API Calls with Language
```javascript
import { getCurrentLanguage } from './utils/languageUtils';

const fetchData = async () => {
  const lang = getCurrentLanguage();
  const response = await fetch(`/api/data?lang=${lang}`);
  return response.json();
};
```

### 3. Conditional Rendering by Language
```javascript
import { useLanguage } from './utils/languageContext';

function MyComponent() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Content */}
    </div>
  );
}
```

## Migration

### Checking Migration Status
```javascript
import { getMigrationStatus } from './utils/languageMigration';

// Check if migration has run
const status = getMigrationStatus();
console.log('Migration completed:', status.migrationCompleted);
console.log('Has deprecated keys:', status.hasDeprecatedKeys);
```

### Force Migration (Testing Only)
```javascript
import { migrateLanguageStorage, resetMigrationFlag } from './utils/languageMigration';

// Reset and re-run migration
resetMigrationFlag();
migrateLanguageStorage();
```

### Cleanup Deprecated Keys
```javascript
import { cleanupDeprecatedKeys } from './utils/languageMigration';

// Manually remove old keys
cleanupDeprecatedKeys();
```

## Debugging

### Check Current State
```javascript
// In browser console
console.log('Language:', localStorage.getItem('language'));
console.log('App Language (deprecated):', localStorage.getItem('app_language'));
console.log('Current Language (deprecated):', localStorage.getItem('currentLanguage'));

// Check if deprecated keys exist
const hasDeprecated = 
  localStorage.getItem('app_language') !== null || 
  localStorage.getItem('currentLanguage') !== null;

if (hasDeprecated) {
  console.warn('⚠️ Deprecated language keys detected!');
}
```

### Test Language Persistence
```javascript
// Use built-in test utilities
import { languageReset } from './utils/languageReset';

// Run full test cycle
languageReset.testPersistence();

// Check current state
languageReset.checkCurrent();
```

## Testing Checklist

When testing language features:

- [ ] Language persists after page refresh
- [ ] Only `language` key is set in localStorage
- [ ] No `app_language` or `currentLanguage` keys exist
- [ ] Language switching works correctly
- [ ] RTL/LTR direction updates properly
- [ ] All components read from the unified key

## Important Files

| File | Purpose |
|------|---------|
| `utils/languageMigration.js` | Migration logic |
| `utils/authStorage.js` | LanguageStorageManager class |
| `utils/languageUtils.js` | Language utility functions |
| `utils/languageContext.js` | React language context provider |

## Valid Language Codes

- `'en'` - English
- `'ar'` - Arabic (RTL)
- `'fr'` - French

## Questions?

If you see any code using `app_language` or `currentLanguage`:
1. Check if it's in a test file (may be checking for deprecated keys)
2. If in production code, update it to use `language` instead
3. If unsure, refer to this guide or the main consolidation summary

---

**Last Updated:** October 8, 2025  
**See also:** `LANGUAGE_STORAGE_CONSOLIDATION_SUMMARY.md`

