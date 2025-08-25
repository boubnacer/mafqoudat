// Force deployment - PostsList dependencies fix applied - V11
// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import PublicPostsPage from "./components/PublicPostsPage";
import Login from "./features/auth/Login/Login";
import DashLayout from "./components/Layout/DashLayout";

import PostsList from "./features/posts/PostsList/PostsList";
import UsersList from "./features/userSettings/UserPage/UsersList";
import EditUser from "./features/userSettings/EditUser/EditUser";
import EditPost from "./features/posts/EditPost/EditPost";
import NewPost from "./features/posts/NewPost/NewPost";
import Prefetch from "./features/auth/PrefetchData/Prefetch";
import NewUser from "./features/auth/SingUp/NewUser";
import PersistLogin from "./features/auth/RefreshPage/PersistLogin";
import SinglePost from "./features/posts/PostPage/SinglePost";


import Dash from "./features/dashboard/Dash";

import DependenciesManager from "./features/MANAGER/Dependencies/DependenciesManager";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { themeSettings } from "./theme";
import PrefetchDependencies from "./features/PrefetchData/PrefetchDependencies";
import { LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";
import { useLocation } from "react-router-dom";
// Redirect logic moved to Login component

// Import new page components
import PrivacyPolicy from "./components/Pages/PrivacyPolicy";
import TermsOfUse from "./components/Pages/TermsOfUse";
import CookieNotice from "./components/Pages/CookieNotice";
import CommunityGuidelines from "./components/Pages/CommunityGuidelines";
import SafetyTips from "./components/Pages/SafetyTips";

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
              <Dash />
            </PrefetchDependencies>
          } />
          
          {/* Posts routes - public access with dependency prefetching */}
          <Route path="posts" element={
            <PrefetchDependencies>
              <PostsList />
            </PrefetchDependencies>
          } />
          <Route path="posts/:id" element={<SinglePost />} />
           
          {/* Protected routes - require authentication for creating/editing posts and admin actions */}
          <Route element={<PersistLogin />}>
            <Route element={<Prefetch />}>
              <Route path="posts/new" element={<NewPost />} />
              <Route path="posts/edit/:id" element={<EditPost />} />
              <Route path="users">
                <Route index element={<UsersList />} />
                <Route path=":id" element={<EditUser />} />
              </Route>
              <Route path="dependencies" element={<DependenciesManager />} />
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
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
