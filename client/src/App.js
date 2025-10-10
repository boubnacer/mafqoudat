// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { themeSettings } from "./theme";
import { LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";
import { validateAndRepairLocalStorage } from "./utils/localStorageValidator";
import { ensureGlobalStateAlwaysExists } from "./utils/globalStateInitializer";
import useAuthErrorHandler from "./hooks/useAuthErrorHandler";
import LanguageSwitchHandler from "./components/LanguageSwitchHandler";
import LanguageChangeHandler from "./components/LanguageChangeHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import CountryGuard from "./components/CountryGuard";

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
const CountrySelection = lazy(() => import("./features/auth/CountrySelection"));
const OAuthCallback = lazy(() => import("./features/auth/OAuthCallback"));
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
const SinglePost = lazy(() => import("./features/posts/PostPage/SinglePost"));
const UserProfile = lazy(() => import("./features/userSettings/UserProfile/UserProfile"));
const MyPostsPage = lazy(() => import("./features/posts/MyPostsPage/MyPostsPage"));


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
    width: '100vw',
    fontSize: '1.2rem',
    color: '#666',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  }}>
    <div style={{
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
        animation: 'mirrorReflection 1s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
        pointerEvents: 'none',
      }} />
    </div>
  </div>
);

// Inner App component that has access to language context
const AppContent = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
  // Initialize authentication error handler
  useAuthErrorHandler();
  
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
      <LanguageSwitchHandler />
      <LanguageChangeHandler />
      <Routes>
        {/* Welcome page - first time access */}
        <Route path="/" element={
          <Suspense fallback={<LoadingFallback />}>
            <WelcomePage />
          </Suspense>
        } />
        
        {/* Public routes - require country selection but no authentication */}
        <Route path="/posts" element={
          <CountryGuard allowAuthenticatedWithoutCountry={false}>
            <Suspense fallback={<LoadingFallback />}>
              <PublicPostsPage />
            </Suspense>
          </CountryGuard>
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
        <Route path="/auth/select-country" element={
          <Suspense fallback={<LoadingFallback />}>
            <CountrySelection />
          </Suspense>
        } />
        <Route path="/auth/callback" element={
          <Suspense fallback={<LoadingFallback />}>
            <OAuthCallback />
          </Suspense>
        } />

        {/* Dashboard layout - all dashboard routes go through this - require country selection */}
        <Route path="dash" element={
          <CountryGuard>
            <Suspense fallback={<LoadingFallback />}>
              <DashLayout />
            </Suspense>
          </CountryGuard>
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
            <ProtectedRoute requireAuth={true} requireCountry={true}>
              <Suspense fallback={<LoadingFallback />}>
                <Prefetch />
              </Suspense>
            </ProtectedRoute>
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
            <Route path="profile" element={
              <Suspense fallback={<LoadingFallback />}>
                <UserProfile />
              </Suspense>
            } />
            <Route path="myposts" element={
              <Suspense fallback={<LoadingFallback />}>
                <MyPostsPage />
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
      // Step 1: Ensure globalState ALWAYS exists (critical for app stability)
      ensureGlobalStateAlwaysExists();
      console.log('✓ GlobalState guaranteed to exist');
      
      // Step 2: Validate and repair localStorage before any other initialization
      const validationReport = validateAndRepairLocalStorage({
        autoRepair: true,
        logResults: true,
        preserveUserData: true
      });
      
      // Log validation results in development
      if (process.env.NODE_ENV === 'development') {
        console.log('localStorage Validation Report:', validationReport);
      }
      
      // Step 3: Initialize any missing default values
      initializeLocalStorage();
      
      // Step 4: Clean up any unused keys
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
