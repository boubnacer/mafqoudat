/**
 * MAINTENANCE MODE INTEGRATION EXAMPLE
 * 
 * This file demonstrates how to integrate the MaintenanceMode component
 * with your existing App.js structure.
 * 
 * DO NOT USE THIS FILE DIRECTLY - it's just an example reference.
 * Copy the patterns into your actual App.js file.
 */

import React, { Suspense, lazy, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Import maintenance mode components
import { selectIsMaintenanceActive } from '../app/state/maintenanceSlice';
import MaintenanceMode from '../components/MaintenanceMode';

// Your existing imports
import { selectMode } from '../app/state';
import { useLanguage } from '../utils/languageContext';
import { themeSettings } from '../theme';

// Example App Component with Maintenance Mode Integration
function AppWithMaintenanceMode() {
  // Get maintenance mode state
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  
  // Your existing theme setup
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  // Show maintenance mode BEFORE any other content
  // This ensures users see the maintenance screen immediately
  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  // Normal app content when not in maintenance mode
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Your existing routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/posts" element={<PostsPage />} />
            {/* ... more routes */}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Example with more sophisticated loading states
function AppWithMaintenanceModeAdvanced() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  const mode = useSelector(selectMode);
  const { currentLanguage, isInitialized } = useLanguage();
  
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  // Show loading while language is initializing
  if (!isInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingFallback />
      </ThemeProvider>
    );
  }

  // Show maintenance mode after initialization
  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  // Normal app
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Your app content */}
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Example: Conditional maintenance mode for specific routes
function AppWithSelectiveMaintenanceMode() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* These routes are always accessible */}
            <Route path="/health" element={<HealthCheck />} />
            <Route path="/status" element={<StatusPage />} />
            
            {/* Protected routes - show maintenance if active */}
            {isMaintenanceMode ? (
              <Route path="*" element={<MaintenanceMode />} />
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/posts" element={<PostsPage />} />
                {/* ... your other routes */}
              </>
            )}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Example: Custom hook for maintenance mode logic
function useMaintenanceMode() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  const message = useSelector(state => state.maintenance.message);
  const estimatedReturn = useSelector(state => state.maintenance.estimatedReturn);
  
  return {
    isMaintenanceMode,
    message,
    estimatedReturn
  };
}

// Example usage of custom hook
function AppWithCustomHook() {
  const { isMaintenanceMode } = useMaintenanceMode();
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Your app */}
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Example: Maintenance mode with analytics
function AppWithMaintenanceModeAnalytics() {
  const isMaintenanceMode = useSelector(selectIsMaintenanceActive);
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  // Track maintenance mode activation
  useEffect(() => {
    if (isMaintenanceMode) {
      // Log to your analytics service
      console.log('📊 Analytics: Maintenance mode displayed to user');
      
      // Example: Send to Google Analytics
      // if (window.gtag) {
      //   window.gtag('event', 'maintenance_mode_displayed', {
      //     event_category: 'system',
      //     event_label: 'maintenance_mode'
      //   });
      // }
      
      // Example: Send to custom analytics
      // trackEvent('maintenance_mode_displayed', {
      //   timestamp: new Date().toISOString(),
      //   userAgent: navigator.userAgent
      // });
    }
  }, [isMaintenanceMode]);

  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Your app */}
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Placeholder components for the example
const LoadingFallback = () => <div>Loading...</div>;
const HomePage = () => <div>Home Page</div>;
const PostsPage = () => <div>Posts Page</div>;
const HealthCheck = () => <div>Health Check</div>;
const StatusPage = () => <div>Status Page</div>;

// Export examples (for reference only)
export {
  AppWithMaintenanceMode,
  AppWithMaintenanceModeAdvanced,
  AppWithSelectiveMaintenanceMode,
  AppWithCustomHook,
  AppWithMaintenanceModeAnalytics,
  useMaintenanceMode
};

// Default export (basic pattern)
export default AppWithMaintenanceMode;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Choose the example pattern that best fits your app structure
 * 2. Copy the relevant code into your actual App.js
 * 3. Make sure you've added the maintenance slice to your Redux store
 * 4. Update your RTK Query base query with maintenance check
 * 5. Test with: enableTestMaintenanceMode() in browser console
 * 
 * REMEMBER:
 * - Maintenance mode check should be EARLY in your component tree
 * - Wrap it in ThemeProvider and LanguageProvider for proper styling
 * - The component handles all languages and themes automatically
 */

