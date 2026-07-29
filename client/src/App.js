// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Box, CircularProgress, CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { themeSettings } from "./theme";
import { LanguageProvider, useLanguage } from "./utils/languageContext";
import { selectIsMaintenanceActive } from "./app/state/maintenanceSlice";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";
import { validateAndRepairLocalStorage } from "./utils/localStorageValidator";
import { ensureGlobalStateAlwaysExists } from "./utils/globalStateInitializer";
import useAuthErrorHandler from "./hooks/useAuthErrorHandler";
import useMaintenanceCheck from "./hooks/useMaintenanceCheck";
import LanguageSwitchHandler from "./components/LanguageSwitchHandler";
import LanguageChangeHandler from "./components/LanguageChangeHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import CountryGuard from "./components/CountryGuard";
import MaintenanceMode from "./components/MaintenanceMode";
import { initializeVisitorSession } from "./utils/visitorSessionSync";
import { getVisitorSessionId } from "./utils/visitorSession";
import { initializeGA, trackPageView } from "./utils/analytics";
import WelcomePageSkeleton from "./components/WelcomePageSkeleton";
import InfoPageSkeleton from "./components/InfoPageSkeleton";
import PostFormSkeleton from "./components/PostFormSkeleton";
import SinglePostSkeleton from "./components/SinglePostSkeleton";
import AuthPageSkeleton from "./features/auth/AuthPageSkeleton";
import DashboardSkeleton from "./components/dashboard/DashboardSkeleton";
import PostsListSkeleton from "./features/posts/PostsList/PostsListSkeleton";

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
const AboutUs = lazy(() => import("./components/Pages/AboutUs"));
const Blog = lazy(() => import("./components/Pages/Blog"));
const BlogPostPage = lazy(() => import("./components/Pages/BlogPostPage"));
const Contact = lazy(() => import("./components/Pages/Contact"));
const HelpCenter = lazy(() => import("./components/Pages/HelpCenter"));

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

// Minimal fallback for the handful of routes that don't have a page-shaped
// skeleton yet (admin/manager tools, profile, myposts, the dash layout
// shell, auth callback) — a small centered spinner rather than the old
// full-viewport logo splash, which never matched the destination page.
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '40vh',
      width: '100%',
      py: 8,
    }}
  >
    <CircularProgress />
  </Box>
);

// Inner App component that has access to language context
const AppContent = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
  // Initialize authentication error handler
  useAuthErrorHandler();
  
  // Check maintenance mode status from hook
  const { isMaintenanceMode: hookMaintenanceMode, isLoading: isCheckingMaintenance, isAdmin } = useMaintenanceCheck();
  
  // Also check Redux state (in case maintenance mode was detected from ANY API call)
  const reduxMaintenanceMode = useSelector(selectIsMaintenanceActive);
  
  // Maintenance mode is active if EITHER hook OR Redux state says it is
  const isMaintenanceMode = hookMaintenanceMode || reduxMaintenanceMode;
  
  const theme = React.useMemo(() => {
    try {
      // Pass both mode and currentLanguage to theme settings
      return createTheme(themeSettings(mode, currentLanguage));
    } catch (error) {
      console.error("Theme creation error:", error);
      return createTheme(); // Fallback to a basic theme
    }
  }, [mode, currentLanguage]);

  // Track page views when route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageSwitchHandler />
      <LanguageChangeHandler />
      
      {/* Show loading during initial maintenance check */}
      {isCheckingMaintenance ? (
        <LoadingFallback />
      ) : isMaintenanceMode && !isAdmin ? (
        /* Show maintenance mode for non-admin users */
        <MaintenanceMode />
      ) : (
        /* Show normal app routes */
        <Routes>
        {/* Welcome page - first time access */}
        <Route path="/" element={
          <Suspense fallback={<WelcomePageSkeleton />}>
            <WelcomePage />
          </Suspense>
        } />

        {/* Public routes - require country selection but no authentication */}
        <Route path="/posts" element={
          <CountryGuard allowAuthenticatedWithoutCountry={false}>
            <Suspense fallback={<PostsListSkeleton />}>
              <PublicPostsPage />
            </Suspense>
          </CountryGuard>
        } />

        {/* Legal and Information Pages - Public Access */}
        <Route path="/privacy" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <TermsOfUse />
          </Suspense>
        } />
        <Route path="/cookies" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <CookieNotice />
          </Suspense>
        } />
        <Route path="/guidelines" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <CommunityGuidelines />
          </Suspense>
        } />
        <Route path="/safety" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <SafetyTips />
          </Suspense>
        } />
        <Route path="/about" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <AboutUs />
          </Suspense>
        } />
        <Route path="/blog" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <Blog />
          </Suspense>
        } />
        <Route path="/blog/:slug" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <BlogPostPage />
          </Suspense>
        } />
        <Route path="/help" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <HelpCenter />
          </Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <Contact />
          </Suspense>
        } />

        {/* Authentication routes */}
        <Route path="/login" element={
          <Suspense fallback={<AuthPageSkeleton fields={2} />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<AuthPageSkeleton fields={5} />}>
            <NewUser />
          </Suspense>
        } />
        <Route path="/auth/select-country" element={
          <Suspense fallback={<AuthPageSkeleton fields={1} />}>
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
              <Suspense fallback={<DashboardSkeleton />}>
                <Dash />
              </Suspense>
            </PrefetchDependencies>
          } />

          {/* Posts routes - public access with dependency prefetching */}
          <Route path="posts" element={
            <PrefetchDependencies>
              <Suspense fallback={<PostsListSkeleton />}>
                <PostsList />
              </Suspense>
            </PrefetchDependencies>
          } />
          <Route path="posts/:id" element={
            <Suspense fallback={<SinglePostSkeleton />}>
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
              <Suspense fallback={<PostFormSkeleton />}>
                <NewPost />
              </Suspense>
            } />
            <Route path="posts/edit/:id" element={
              <Suspense fallback={<PostFormSkeleton />}>
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
      )}
    </ThemeProvider>
  );
};

function App() {
  // useTitle("Dan D. Repairs");

  // Initialize visitor session on app load
  // This MUST run first, before any other API calls
  // The session ID is created synchronously in getVisitorSessionId(),
  // so even if this async call hasn't completed, other API calls will use the same ID
  useEffect(() => {
    // Create session ID synchronously first (ensures it exists immediately)
    // This is critical - all API calls will use this same session ID
    getVisitorSessionId();
    
    // Then sync with server (this will update the ID if server has a different one)
    // This is async but doesn't block - other API calls will use the localStorage ID
    initializeVisitorSession();
    
    // Initialize Google Analytics
    initializeGA();
  }, []);

  // Initialize localStorage (language is now handled by LanguageProvider)
  useEffect(() => {
    try {
      // Step 1: Ensure globalState ALWAYS exists (critical for app stability)
      ensureGlobalStateAlwaysExists();
      
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
    <HelmetProvider>
      <LanguageProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AppContent />
        </Suspense>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
