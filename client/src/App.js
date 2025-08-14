// Force deployment - PostsList dependencies fix applied - V2
// Testing routing issue - added catch-all route and test routes
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
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
import useTitle from "./hooks/useTitle";
import NewUser from "./features/auth/SingUp/NewUser";
import PersistLogin from "./features/auth/RefreshPage/PersistLogin";
import SinglePost from "./features/posts/PostPage/SinglePost";

import ReportPage from "./features/posts/ReportPage/ReportPage";
import Dash from "./features/dashboard/Dash";

import TestDashboard from "./components/TestDashboard";

import DependenciesManager from "./features/MANAGER/Dependencies/DependenciesManager";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { themeSettings } from "./theme";
import useAuth from "./hooks/useAuth";
import PrefetchDependencies from "./features/PrefetchData/PrefetchDependencies";
import { initializeLanguage, LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";
import { useLocation } from "react-router-dom";

// Test component to debug routing
const TestPostsRoute = () => {
  console.log('TestPostsRoute: Component rendered');
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Test Posts Route</h1>
      <p>This is a test route to debug the routing issue.</p>
      <p>If you can see this, the routing is working.</p>
    </div>
  );
};

// Very simple test component
const SimpleTest = () => {
  console.log('SimpleTest: Component rendered');
  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'yellow' }}>
      <h1>Simple Test Component</h1>
      <p>This is a very simple test component.</p>
      <p>If you can see this yellow background, the routing is working.</p>
    </div>
  );
};

// Test component that mimics PostsList but simpler
const PostsTest = () => {
  console.log('PostsTest: Component function called - START');
  console.log('PostsTest: Current URL:', window.location.href);
  console.log('PostsTest: Current pathname:', window.location.pathname);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log('PostsTest: useEffect triggered');
    
    // Simulate loading
    const timer = setTimeout(() => {
      console.log('PostsTest: Loading complete');
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    console.log('PostsTest: Showing loading state');
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'lightblue' }}>
        <h1>PostsTest Loading...</h1>
        <p>This simulates the PostsList loading state.</p>
        <p>If you see this on refresh, the issue is with PostsList, not routing.</p>
      </div>
    );
  }
  
  console.log('PostsTest: Rendering content');
  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'lightgreen' }}>
      <h1>PostsTest Content</h1>
      <p>This simulates the PostsList content.</p>
      <p>If you see this on refresh, the routing is working fine.</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};

// Inner App component that has access to language context
const AppContent = () => {
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
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
        
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<NewUser />} />

        {/* Dashboard and posts - public access with dependency prefetching */}
        <Route path="dash" element={<DashLayout />}>
          <Route index element={
            <PrefetchDependencies>
              <Dash />
            </PrefetchDependencies>
          } />
          {/* Test routes first to debug routing */}
          <Route path="simpletest" element={<SimpleTest />} />
          <Route path="poststest" element={<PostsTest />} />
          <Route path="poststestwithprefetch" element={
            <PrefetchDependencies>
              <PostsTest />
            </PrefetchDependencies>
          } />
          {/* Posts route */}
          <Route path="posts" element={
            <PrefetchDependencies>
              <PostsList />
            </PrefetchDependencies>
          } />
          <Route path="posts/:id" element={<SinglePost />} />
        </Route>

        {/* Protected routes - require authentication for admin actions */}
        <Route element={<PersistLogin />}>
          <Route element={<Prefetch />}>
            <Route path="dash/posts/new" element={<NewPost />} />
            <Route path="dash/posts/edit/:id" element={<EditPost />} />
            <Route path="dash/posts/report/:id" element={<ReportPage />} />
            <Route path="dash/users">
              <Route index element={<UsersList />} />
              <Route path=":id" element={<EditUser />} />
            </Route>
            <Route path="dash/dependencies" element={<DependenciesManager />} />
          </Route>
        </Route>

        {/* Catch-all route for debugging */}
        <Route path="*" element={
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'red', color: 'white' }}>
            <h1>404 - Route Not Found</h1>
            <p>Current path: {window.location.pathname}</p>
            <p>This route is not defined in the router.</p>
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
