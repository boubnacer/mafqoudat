// Force deployment - PostsList dependencies fix applied - V11
// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import PublicPostsPage from "./components/PublicPostsPage";
import Login from "./features/auth/Login/Login";
import DashLayout from "./components/Layout/DashLayout";
import { themeSettings } from "./theme";
import PrefetchDependencies from "./features/PrefetchData/PrefetchDependencies";
import { LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";
import PrivacyPolicy from "./components/Pages/PrivacyPolicy";
import TermsOfUse from "./components/Pages/TermsOfUse";
import CookieNotice from "./components/Pages/CookieNotice";
import CommunityGuidelines from "./components/Pages/CommunityGuidelines";
import SafetyTips from "./components/Pages/SafetyTips";

// Lazy load heavy components
const PostsList = lazy(() => import("./features/posts/PostsList/PostsList"));
const UsersList = lazy(() => import("./features/userSettings/UserPage/UsersList"));
const EditUser = lazy(() => import("./features/userSettings/EditUser/EditUser"));
const EditPost = lazy(() => import("./features/posts/EditPost/EditPost"));
const NewPost = lazy(() => import("./features/posts/NewPost/NewPost"));
const Prefetch = lazy(() => import("./features/auth/PrefetchData/Prefetch"));
const NewUser = lazy(() => import("./features/auth/SingUp/NewUser"));
const PersistLogin = lazy(() => import("./features/auth/RefreshPage/PersistLogin"));
const SinglePost = lazy(() => import("./features/posts/PostPage/SinglePost"));

// Lazy load dashboard components
const Dash = lazy(() => import("./features/dashboard/Dash"));
const DependenciesManager = lazy(() => import("./features/MANAGER/Dependencies/DependenciesManager"));

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666'
  }}>
    Loading...
  </div>
);

// Inner App component that has access to language context
const AppContent = () => {
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
  // Debug Redux store
  console.log('AppContent: Redux store state:', {
    mode,
    currentLanguage,
    location: location.pathname
  });
  
  // Redirect logic is now handled directly in Login component
  console.log('🚀 AppContent: Redirect logic moved to Login component');
  
  console.log('AppContent: Current location:', location.pathname);
  console.log('AppContent: Current URL:', window.location.href);
  console.log('AppContent: Current pathname:', window.location.pathname);
  
  const theme = React.useMemo(() => {
    try {
      // Pass both mode and currentLanguage to theme settings
      return createTheme(themeSettings(mode, currentLanguage));
    } catch (error) {
      console.error("Theme creation error:", error);
      return createTheme(); // Fallback to a basic theme
    }
  }, [mode, currentLanguage]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Welcome page - first time access */}
        <Route path="/" element={<WelcomePage />} />
        
        {/* Public routes - no authentication required */}
        <Route path="/posts" element={<PublicPostsPage />} />
        
        {/* Legal and Information Pages - Public Access */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/cookies" element={<CookieNotice />} />
        <Route path="/guidelines" element={<CommunityGuidelines />} />
        <Route path="/safety" element={<SafetyTips />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<NewUser />} />

        {/* Dashboard layout - all dashboard routes go through this */}
        <Route path="dash" element={<DashLayout />}>
          {/* Dashboard home - public access */}
          <Route index element={
            <PrefetchDependencies>
              <Suspense fallback={<LoadingFallback />}>
                <Dash />
              </Suspense>
            </PrefetchDependencies>
          } />
          
          {/* Posts routes - public access with dependency prefetching */}
          <Route path="posts" element={
            <PrefetchDependencies>
              <Suspense fallback={<LoadingFallback />}>
                <PostsList />
              </Suspense>
            </PrefetchDependencies>
          } />
          <Route path="posts/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <SinglePost />
            </Suspense>
          } />
           
          {/* Protected routes - require authentication for creating/editing posts and admin actions */}
          <Route element={<PersistLogin />}>
            <Route element={<Prefetch />}>
              <Route path="posts/new" element={
                <Suspense fallback={<LoadingFallback />}>
                  <NewPost />
                </Suspense>
              } />
              <Route path="posts/edit/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <EditPost />
                </Suspense>
              } />
              <Route path="users">
                <Route index element={
                  <Suspense fallback={<LoadingFallback />}>
                    <UsersList />
                  </Suspense>
                } />
                <Route path=":id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EditUser />
                  </Suspense>
                } />
              </Route>
              <Route path="dependencies" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DependenciesManager />
                </Suspense>
              } />
            </Route>
          </Route>
        </Route>

        {/* Catch-all route for debugging */}
        <Route path="*" element={
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'red', color: 'white' }}>
            <h1>404 - Route Not Found</h1>
            <p>Path: {window.location.pathname}</p>
          </div>
        } />
      </Routes>
    </ThemeProvider>
  );
};

function App() {
  // useTitle("Dan D. Repairs");

  // Initialize localStorage (language is now handled by LanguageProvider)
  useEffect(() => {
    try {
      initializeLocalStorage();
      cleanupLocalStorage();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }, []);

  return (
    <LanguageProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AppContent />
      </Suspense>
    </LanguageProvider>
  );
}

export default App;
