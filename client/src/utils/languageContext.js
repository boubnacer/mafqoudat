import React, { createContext, useContext, useState, useEffect } from 'react';
import { languageStorage } from './authStorage';
import { safeLanguageRefetch } from './languageRefetchUtils';
import { migrateLanguageStorage } from './languageMigration';
import { SUPPORTED_LANGUAGES } from './seoConfig';

const getLanguageFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  return SUPPORTED_LANGUAGES.includes(langParam) ? langParam : null;
};

const applyDocumentLanguage = (language) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', language);

  if (language === 'ar') {
    document.body.setAttribute('dir', 'rtl');
    document.body.style.direction = 'rtl';
    document.body.style.textAlign = 'right';
  } else {
    document.body.setAttribute('dir', 'ltr');
    document.body.style.direction = 'ltr';
    document.body.style.textAlign = 'left';
  }
};

const resolveLanguage = (preferredLanguage) => {
  if (preferredLanguage && SUPPORTED_LANGUAGES.includes(preferredLanguage)) {
    return preferredLanguage;
  }
  return 'ar';
};

export const initializeLanguage = (language = null) => {
  try {
    const urlLanguage = getLanguageFromUrl();
    const storedLanguage = resolveLanguage(languageStorage.getCurrentLanguage());
    const desiredLanguage = resolveLanguage(language || urlLanguage || storedLanguage);

    if (typeof window === 'undefined') {
      return desiredLanguage;
    }

    const currentStored = resolveLanguage(languageStorage.getCurrentLanguage());

    if (desiredLanguage !== currentStored || urlLanguage) {
      languageStorage.setLanguage(desiredLanguage);
    } else {
      applyDocumentLanguage(desiredLanguage);
    }

    return desiredLanguage;
  } catch (error) {
    console.error('Error initializing language:', error);
    applyDocumentLanguage('ar');
    return 'ar';
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ar');
  const [isInitialized, setIsInitialized] = useState(false);

  const setLanguage = (language) => {
    try {
      if (SUPPORTED_LANGUAGES.includes(language)) {
        const success = languageStorage.setLanguage(language);

        if (success) {
          setCurrentLanguage(language);
          handleLanguageRefetch(language);
        }

        return success;
      }
      return false;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  const handleLanguageRefetch = async (language) => {
    try {
      await safeLanguageRefetch(language, {
        forceRefetch: true,
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error triggering language-dependent refetch:', error);
    }
  };

  useEffect(() => {
    try {
      const migrationResult = migrateLanguageStorage();
      if (migrationResult.success) {
      }
    } catch (error) {
    }

    try {
      const urlLanguage = getLanguageFromUrl();
      const savedLanguage = resolveLanguage(languageStorage.getCurrentLanguage());
      const initialLanguage = initializeLanguage(urlLanguage || savedLanguage);
      setCurrentLanguage(initialLanguage);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading saved language:', error);
      const fallbackLanguage = initializeLanguage('ar');
      setCurrentLanguage(fallbackLanguage);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const handleLanguageChanged = () => {
      setCurrentLanguage((prev) => {
        const newLanguage = resolveLanguage(languageStorage.getCurrentLanguage());
        if (prev !== newLanguage) {
          applyDocumentLanguage(newLanguage);
          return newLanguage;
        }
        return prev;
      });
    };

    window.addEventListener('languageChanged', handleLanguageChanged);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [isInitialized]);

  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 