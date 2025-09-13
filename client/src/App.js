// Force deployment - PostsList dependencies fix applied - V11
// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { themeSettings } from "./theme";
import { LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";

// Add CSS keyframes for loading animations (mirrorReflection from navbar)
const loadingStyles = `
@keyframes mirrorReflection {
  0% {
    left: 0px;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
  15% {
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  85% {
    left: 100%;
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  100% {
    left: 100%;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
}

@keyframes logoFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-logo-container {
  background-color: #f8f9fa;
  border-radius: 8px;
}

.loading-logo-image {
  opacity: 0;
  animation: logoFadeIn 0.3s ease-out 0.1s forwards;
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = loadingStyles;
  document.head.appendChild(styleSheet);
}

// Lazy load all major page components for better code splitting
const WelcomePage = lazy(() => import("./components/WelcomePage"));
const PublicPostsPage = lazy(() => import("./components/PublicPostsPage"));
const Login = lazy(() => import("./features/auth/Login/Login"));
const DashLayout = lazy(() => import("./components/Layout/DashLayout"));
const PrefetchDependencies = lazy(() => import("./features/PrefetchData/PrefetchDependencies"));

// Lazy load legal and information pages
const PrivacyPolicy = lazy(() => import("./components/Pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./components/Pages/TermsOfUse"));
const CookieNotice = lazy(() => import("./components/Pages/CookieNotice"));
const CommunityGuidelines = lazy(() => import("./components/Pages/CommunityGuidelines"));
const SafetyTips = lazy(() => import("./components/Pages/SafetyTips"));

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
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));

// Enhanced loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'white',
    position: 'relative'
  }}>
    <div className="loading-logo-container" style={{
      width: '150px',
      height: '150px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <img
        src="/maflogo.png"
        alt="Loading..."
        className="loading-logo-image"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 2
        }}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '0px',
        width: '30px',
        height: '80%',
        background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4), transparent)',
        transform: 'translateY(-50%) skew(-15deg)',
        borderRadius: '2px',
        zIndex: 3,
        animation: 'mirrorReflection 2s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
        pointerEvents: 'none',
      }} />
    </div>
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
        <Route path="/" element={
          <Suspense fallback={<LoadingFallback />}>
            <WelcomePage />
          </Suspense>
        } />
        
        {/* Public routes - no authentication required */}
        <Route path="/posts" element={
          <Suspense fallback={<LoadingFallback />}>
            <PublicPostsPage />
          </Suspense>
        } />
        
        {/* Legal and Information Pages - Public Access */}
        <Route path="/privacy" element={
          <Suspense fallback={<LoadingFallback />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<LoadingFallback />}>
            <TermsOfUse />
          </Suspense>
        } />
        <Route path="/cookies" element={
          <Suspense fallback={<LoadingFallback />}>
            <CookieNotice />
          </Suspense>
        } />
        <Route path="/guidelines" element={
          <Suspense fallback={<LoadingFallback />}>
            <CommunityGuidelines />
          </Suspense>
        } />
        <Route path="/safety" element={
          <Suspense fallback={<LoadingFallback />}>
            <SafetyTips />
          </Suspense>
        } />
        
        {/* Authentication routes */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<LoadingFallback />}>
            <NewUser />
          </Suspense>
        } />

        {/* Dashboard layout - all dashboard routes go through this */}
        <Route path="dash" element={
          <Suspense fallback={<LoadingFallback />}>
            <DashLayout />
          </Suspense>
        }>
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
          <Route element={
            <Suspense fallback={<LoadingFallback />}>
              <PersistLogin />
            </Suspense>
          }>
            <Route element={
              <Suspense fallback={<LoadingFallback />}>
                <Prefetch />
              </Suspense>
            }>
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
              <Route path="admin" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
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
