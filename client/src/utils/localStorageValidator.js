/**
 * localStorage State Validator
 * Checks and fixes inconsistencies in localStorage on app startup
 */

// Required localStorage keys
const REQUIRED_KEYS = {
  language: 'en',
  isLoggedIn: 'false'
};

// Optional keys that may exist
const OPTIONAL_KEYS = ['accessToken', 'globalState', 'currentCountry'];

/**
 * Check if all required keys exist in localStorage
 * @returns {Object} - { valid: boolean, missing: string[] }
 */
export const checkRequiredKeys = () => {
  const missing = [];
  
  Object.keys(REQUIRED_KEYS).forEach(key => {
    if (localStorage.getItem(key) === null) {
      missing.push(key);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Validate globalState structure
 * @returns {Object} - { valid: boolean, issues: string[], state: Object|null }
 */
export const validateGlobalState = () => {
  const issues = [];
  let state = null;
  
  const globalStateStr = localStorage.getItem('globalState');
  
  if (!globalStateStr) {
    issues.push('globalState not found');
    return { valid: false, issues, state: null };
  }
  
  try {
    state = JSON.parse(globalStateStr);
    
    // Check required properties in globalState
    const requiredProps = ['currentCountry', 'mode', 'isSidebarOpen', 'openModal', 'activeLink', 'foundOrlost', 'direction', 'categoryFilter'];
    
    requiredProps.forEach(prop => {
      if (!(prop in state)) {
        issues.push(`Missing property: ${prop}`);
      }
    });
    
    // Validate types
    if (state.mode && !['light', 'dark'].includes(state.mode)) {
      issues.push('Invalid mode value');
    }
    
    if (state.direction && !['ltr', 'rtl'].includes(state.direction)) {
      issues.push('Invalid direction value');
    }
    
    if (typeof state.isSidebarOpen !== 'boolean') {
      issues.push('isSidebarOpen should be boolean');
    }
    
    if (typeof state.openModal !== 'boolean') {
      issues.push('openModal should be boolean');
    }
    
  } catch (error) {
    issues.push(`JSON parse error: ${error.message}`);
    return { valid: false, issues, state: null };
  }
  
  return {
    valid: issues.length === 0,
    issues,
    state
  };
};

/**
 * Check language key consistency
 * Looks for multiple language keys and consolidates to single 'language' key
 * @returns {Object} - { valid: boolean, issues: string[], duplicates: string[] }
 */
export const checkLanguageConsistency = () => {
  const languageKeys = ['language', 'lang', 'locale', 'i18n', 'currentLanguage'];
  const found = [];
  const issues = [];
  
  languageKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      found.push(key);
    }
  });
  
  if (found.length > 1) {
    issues.push(`Multiple language keys found: ${found.join(', ')}`);
  }
  
  if (found.length === 0) {
    issues.push('No language key found');
  }
  
  return {
    valid: found.length === 1 && found[0] === 'language',
    issues,
    duplicates: found.filter(key => key !== 'language')
  };
};

/**
 * Check auth state consistency
 * isLoggedIn must match presence of accessToken
 * @returns {Object} - { valid: boolean, issues: string[] }
 */
export const checkAuthStateConsistency = () => {
  const issues = [];
  
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const accessToken = localStorage.getItem('accessToken');
  
  // Convert isLoggedIn to boolean
  const isLoggedInBool = isLoggedIn === 'true';
  const hasToken = accessToken !== null && accessToken !== '';
  
  if (isLoggedInBool && !hasToken) {
    issues.push('isLoggedIn is true but no accessToken found');
  }
  
  if (!isLoggedInBool && hasToken) {
    issues.push('isLoggedIn is false but accessToken exists');
  }
  
  // Check if isLoggedIn is a valid boolean string
  if (isLoggedIn && isLoggedIn !== 'true' && isLoggedIn !== 'false') {
    issues.push('isLoggedIn has invalid value (not "true" or "false")');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Auto-repair function that fixes common issues
 * @param {Object} options - Repair options
 * @returns {Object} - { repaired: boolean, actions: string[] }
 */
export const autoRepairLocalStorage = (options = {}) => {
  const actions = [];
  const { preserveUserData = true } = options;
  
  try {
    // 1. Fix auth state inconsistency
    const authCheck = checkAuthStateConsistency();
    if (!authCheck.valid) {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const accessToken = localStorage.getItem('accessToken');
      
      if (isLoggedIn === 'true' && (!accessToken || accessToken === '')) {
        localStorage.setItem('isLoggedIn', 'false');
        actions.push('Set isLoggedIn to false (no accessToken)');
      }
      
      if (isLoggedIn !== 'true' && isLoggedIn !== 'false') {
        localStorage.setItem('isLoggedIn', 'false');
        actions.push('Fixed invalid isLoggedIn value');
      }
    }
    
    // 2. Ensure required keys exist
    const requiredCheck = checkRequiredKeys();
    if (!requiredCheck.valid) {
      requiredCheck.missing.forEach(key => {
        localStorage.setItem(key, REQUIRED_KEYS[key]);
        actions.push(`Added missing key: ${key}`);
      });
    }
    
    // 3. Fix globalState if needed
    const globalStateCheck = validateGlobalState();
    if (!globalStateCheck.valid) {
      // Migration: Check for legacy 'theme' in localStorage
      const legacyTheme = localStorage.getItem('theme');
      
      if (!globalStateCheck.state) {
        // Create new globalState
        const defaultState = {
          currentCountry: null,
          mode: legacyTheme || 'light',
          isSidebarOpen: false,
          openModal: false,
          activeLink: "",
          foundOrlost: "",
          direction: "ltr",
          categoryFilter: "all"
        };
        
        localStorage.setItem('globalState', JSON.stringify(defaultState));
        actions.push('Created default globalState');
        
        // Remove legacy 'theme' key after migration
        if (legacyTheme) {
          localStorage.removeItem('theme');
          actions.push('Migrated legacy theme to globalState.mode');
        }
      } else {
        // Fix existing globalState
        const state = globalStateCheck.state;
        const defaultState = {
          currentCountry: state.currentCountry || null,
          mode: state.mode || legacyTheme || 'light',
          isSidebarOpen: state.isSidebarOpen ?? false,
          openModal: state.openModal ?? false,
          activeLink: state.activeLink || "",
          foundOrlost: state.foundOrlost || "",
          direction: state.direction || "ltr",
          categoryFilter: state.categoryFilter || "all"
        };
        
        localStorage.setItem('globalState', JSON.stringify(defaultState));
        actions.push('Repaired globalState structure');
        
        // Remove legacy 'theme' key after migration
        if (legacyTheme) {
          localStorage.removeItem('theme');
          actions.push('Migrated legacy theme to globalState.mode');
        }
      }
    } else {
      // Even if globalState is valid, clean up legacy 'theme' key
      const legacyTheme = localStorage.getItem('theme');
      if (legacyTheme) {
        localStorage.removeItem('theme');
        actions.push('Removed legacy theme key');
      }
    }
    
    // 4. Consolidate language keys
    const langCheck = checkLanguageConsistency();
    if (!langCheck.valid) {
      let languageValue = localStorage.getItem('language');
      
      // If no 'language' key exists, try to get from duplicates
      if (!languageValue && langCheck.duplicates.length > 0) {
        languageValue = localStorage.getItem(langCheck.duplicates[0]);
      }
      
      // Set the correct language key
      if (!languageValue) {
        languageValue = 'en'; // Default
      }
      
      localStorage.setItem('language', languageValue);
      
      // Remove duplicate language keys
      langCheck.duplicates.forEach(key => {
        localStorage.removeItem(key);
        actions.push(`Removed duplicate language key: ${key}`);
      });
      
      if (languageValue) {
        actions.push(`Consolidated language to: ${languageValue}`);
      }
    }
    
    // 5. Clean up unknown keys (optional, based on preserveUserData)
    if (!preserveUserData) {
      const allowedKeys = [...Object.keys(REQUIRED_KEYS), ...OPTIONAL_KEYS];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!allowedKeys.includes(key)) {
          localStorage.removeItem(key);
          actions.push(`Removed unknown key: ${key}`);
        }
      });
    }
    
    return {
      repaired: actions.length > 0,
      actions
    };
    
  } catch (error) {
    console.error('Error during auto-repair:', error);
    return {
      repaired: false,
      actions: [`Error: ${error.message}`]
    };
  }
};

/**
 * Run full validation and return report
 * @returns {Object} - Validation report
 */
export const validateLocalStorage = () => {
  const report = {
    timestamp: new Date().toISOString(),
    valid: true,
    checks: {}
  };
  
  // Run all checks
  report.checks.requiredKeys = checkRequiredKeys();
  report.checks.globalState = validateGlobalState();
  report.checks.languageConsistency = checkLanguageConsistency();
  report.checks.authState = checkAuthStateConsistency();
  
  // Overall validity
  report.valid = Object.values(report.checks).every(check => check.valid);
  
  return report;
};

/**
 * Main validation and repair function to be called on app startup
 * @param {Object} options - Options for validation and repair
 * @returns {Object} - Report with validation and repair results
 */
export const validateAndRepairLocalStorage = (options = {}) => {
  const {
    autoRepair = true,
    logResults = true,
    preserveUserData = true
  } = options;
  
  // Run validation
  const validationReport = validateLocalStorage();
  
  let repairReport = null;
  
  // Auto-repair if needed and enabled
  if (!validationReport.valid && autoRepair) {
    repairReport = autoRepairLocalStorage({ preserveUserData });
  }
  
  const finalReport = {
    validation: validationReport,
    repair: repairReport,
    success: autoRepair ? (repairReport?.repaired || validationReport.valid) : validationReport.valid
  };
  
  // Log results if enabled
  if (logResults) {
    if (!validationReport.valid) {
      console.warn('localStorage validation issues detected:', validationReport);
      
      if (repairReport) {
        console.info('Auto-repair completed:', repairReport);
      }
    } else {
      console.log('localStorage validation: All checks passed ✓');
    }
  }
  
  return finalReport;
};

// Export all functions
export default {
  checkRequiredKeys,
  validateGlobalState,
  checkLanguageConsistency,
  checkAuthStateConsistency,
  autoRepairLocalStorage,
  validateLocalStorage,
  validateAndRepairLocalStorage
};

