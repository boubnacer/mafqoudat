import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to debounce language changes and prevent multiple API calls
 * This helps prevent 429 rate limit errors when switching languages
 */
export const useLanguageDebounce = (language, delay = 500) => {
  const [debouncedLanguage, setDebouncedLanguage] = useState(language);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // If language is changing, set the changing state
    if (language !== debouncedLanguage) {
      setIsChanging(true);
    }

    const handler = setTimeout(() => {
      setDebouncedLanguage(language);
      setIsChanging(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [language, delay, debouncedLanguage]);

  const forceUpdate = useCallback(() => {
    setDebouncedLanguage(language);
    setIsChanging(false);
  }, [language]);

  return {
    debouncedLanguage,
    isChanging,
    forceUpdate
  };
};

/**
 * Hook to manage language-dependent API calls with debouncing
 */
export const useLanguageAwareQuery = (queryHook, queryParams, options = {}) => {
  const { debouncedLanguage, isChanging } = useLanguageDebounce(
    queryParams.language || 'en',
    options.debounceDelay || 500
  );

  // Skip query while language is changing to prevent multiple simultaneous calls
  const shouldSkip = isChanging || options.skip;

  const queryResult = queryHook(
    {
      ...queryParams,
      language: debouncedLanguage
    },
    {
      ...options,
      skip: shouldSkip
    }
  );

  return {
    ...queryResult,
    isLanguageChanging: isChanging
  };
};
