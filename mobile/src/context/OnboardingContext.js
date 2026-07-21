/**
 * Onboarding Context for Mobile App
 * Tracks whether the first-launch onboarding slider has been completed, so
 * AuthNavigator (App.js) knows whether to open on Onboarding or Welcome.
 * Mirrors: src/context/ThemeContext.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onboardingStorage } from '../utils/onboardingStorage';

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const seen = await onboardingStorage.getHasSeenOnboarding();
        setHasSeenOnboarding(seen);
      } catch (error) {
        console.error('Error initializing onboarding flag:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const completeOnboarding = async () => {
    await onboardingStorage.setHasSeenOnboarding();
    setHasSeenOnboarding(true);
  };

  if (!isInitialized) {
    // Avoids a flash of Welcome/Onboarding before the persisted flag loads.
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
