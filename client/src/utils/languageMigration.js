/**
 * Language Storage Migration Utility
 * 
 * This utility handles the migration from multiple language storage keys
 * (language, app_language, currentLanguage) to a single unified key (language).
 * 
 * It provides backward compatibility during the transition period.
 */

const DEBUG_MIGRATION = false;

// Storage keys
const PRIMARY_KEY = 'language';
const DEPRECATED_KEYS = ['app_language', 'currentLanguage'];
const MIGRATION_FLAG = 'languageMigrationCompleted';

/**
 * Log migration activity
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
const logMigration = (message, data = null) => {
  if (DEBUG_MIGRATION) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔄 [LANG-MIGRATION] ${message}`, { timestamp, ...data });
    } else {
      console.log(`🔄 [LANG-MIGRATION] ${message} - ${timestamp}`);
    }
  }
};

/**
 * Migrate language storage from old keys to new unified key
 * This should be called once on app initialization
 * 
 * @returns {Object} Migration result with status and details
 */
export const migrateLanguageStorage = () => {
  try {
    logMigration('Starting language storage migration');
    
    // Check if migration has already been completed
    const migrationCompleted = localStorage.getItem(MIGRATION_FLAG);
    if (migrationCompleted === 'true') {
      logMigration('Migration already completed, skipping');
      return {
        success: true,
        alreadyMigrated: true,
        message: 'Migration was already completed'
      };
    }
    
    // Get current values from all keys
    const languageValue = localStorage.getItem(PRIMARY_KEY);
    const appLanguageValue = localStorage.getItem('app_language');
    const currentLanguageValue = localStorage.getItem('currentLanguage');
    
    logMigration('Current storage state:', {
      language: languageValue,
      app_language: appLanguageValue,
      currentLanguage: currentLanguageValue
    });
    
    // Determine the correct language value to use
    // Priority: language > app_language > currentLanguage > default 'en'
    let finalLanguage = languageValue || appLanguageValue || currentLanguageValue || 'en';
    
    // Validate the language value
    const validLanguages = ['en', 'ar', 'fr'];
    if (!validLanguages.includes(finalLanguage)) {
      logMigration('Invalid language value detected, defaulting to "en"', {
        invalidValue: finalLanguage
      });
      finalLanguage = 'en';
    }
    
    logMigration('Selected final language:', { finalLanguage });
    
    // Set the unified language key
    localStorage.setItem(PRIMARY_KEY, finalLanguage);
    
    // Remove deprecated keys
    DEPRECATED_KEYS.forEach(key => {
      const oldValue = localStorage.getItem(key);
      if (oldValue !== null) {
        localStorage.removeItem(key);
        logMigration(`Removed deprecated key: ${key}`, { oldValue });
      }
    });
    
    // Mark migration as completed
    localStorage.setItem(MIGRATION_FLAG, 'true');
    
    logMigration('✅ Migration completed successfully', {
      finalLanguage,
      removedKeys: DEPRECATED_KEYS.filter(key => 
        appLanguageValue !== null || currentLanguageValue !== null
      )
    });
    
    return {
      success: true,
      alreadyMigrated: false,
      finalLanguage,
      message: 'Migration completed successfully'
    };
  } catch (error) {
    logMigration('❌ Migration failed:', { error: error.message });
    console.error('Language migration error:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Migration failed'
    };
  }
};

/**
 * Reset migration flag (for testing purposes)
 * This will allow migration to run again
 */
export const resetMigrationFlag = () => {
  try {
    localStorage.removeItem(MIGRATION_FLAG);
    logMigration('Migration flag reset');
    return true;
  } catch (error) {
    console.error('Failed to reset migration flag:', error);
    return false;
  }
};

/**
 * Check if migration has been completed
 * @returns {boolean} True if migration was completed
 */
export const isMigrationCompleted = () => {
  try {
    return localStorage.getItem(MIGRATION_FLAG) === 'true';
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return false;
  }
};

/**
 * Get migration status information
 * @returns {Object} Migration status details
 */
export const getMigrationStatus = () => {
  try {
    const migrationCompleted = isMigrationCompleted();
    const languageValue = localStorage.getItem(PRIMARY_KEY);
    const appLanguageValue = localStorage.getItem('app_language');
    const currentLanguageValue = localStorage.getItem('currentLanguage');
    
    return {
      migrationCompleted,
      currentState: {
        language: languageValue,
        app_language: appLanguageValue,
        currentLanguage: currentLanguageValue
      },
      hasDeprecatedKeys: appLanguageValue !== null || currentLanguageValue !== null
    };
  } catch (error) {
    console.error('Failed to get migration status:', error);
    return {
      migrationCompleted: false,
      error: error.message
    };
  }
};

/**
 * Force cleanup of deprecated keys (can be used for maintenance)
 */
export const cleanupDeprecatedKeys = () => {
  try {
    logMigration('Cleaning up deprecated language keys');
    
    DEPRECATED_KEYS.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        logMigration(`Removed deprecated key: ${key}`);
      }
    });
    
    logMigration('✅ Cleanup completed');
    return true;
  } catch (error) {
    console.error('Failed to cleanup deprecated keys:', error);
    return false;
  }
};

export default {
  migrateLanguageStorage,
  resetMigrationFlag,
  isMigrationCompleted,
  getMigrationStatus,
  cleanupDeprecatedKeys
};

