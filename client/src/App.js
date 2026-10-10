// Fixed Vercel routing - added basename and removed homepage field
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
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
import useSessionBootstrap from "./hooks/useSessionBootstrap";
import useMaintenanceCheck from "./hooks/useMaintenanceCheck";
import LanguageSwitchHandler from "./components/LanguageSwitchHandler";
import LanguageChangeHandler from "./components/LanguageChangeHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import CountryGuard from "./components/CountryGuard";
import MaintenanceMode from "./components/MaintenanceMode";
import { initializeVisitorSession } from "./utils/visitorSessionSync";
import { getVisitorSessionId } from "./utils/visitorSession";
import { initializeGA, trackPageView } from "./utils/analytics";
import { initializeMetaPixel } from "./utils/metaPixel";
import { startConsentListener } from "./utils/consent";
import { applyDocumentTheme } from "./utils/documentTheme";
import InfoPageSkeleton from "./components/InfoPageSkeleton";
import PostFormSkeleton from "./components/PostFormSkeleton";
import SinglePostSkeleton from "./components/SinglePostSkeleton";
import AuthPageSkeleton from "./features/auth/AuthPageSkeleton";
import DashboardSkeleton from "./components/dashboard/DashboardSkeleton";
import PostsListSkeleton from "./features/posts/PostsList/PostsListSkeleton";
import LoadingFallback from "./components/LoadingFallback";
import SectionErrorBoundary from "./components/SectionErrorBoundary";

// Lazy load all major page components for better code splitting
const Login = lazy(() => import("./features/auth/Login/Login"));
const CountrySelection = lazy(() => import("./features/auth/CountrySelection"));
const OAuthCallback = lazy(() => import("./features/auth/OAuthCallback"));
const DashLayout = lazy(() => import("./components/Layout/DashLayout"));
const PrefetchDependencies = lazy(() => import("./features/PrefetchData/PrefetchDependencies"));

// Lazy load legal and information pages
const PrivacyPolicy = lazy(() => import("./components/Pages/PrivacyPolicy"));
const DeleteAccount = lazy(() => import("./components/Pages/DeleteAccount"));
const BlockedUsers = lazy(() => import("./components/Pages/BlockedUsers"));
const TermsOfUse = lazy(() => import("./components/Pages/TermsOfUse"));
const CookieNotice = lazy(() => import("./components/Pages/CookieNotice"));
const Disclaimer = lazy(() => import("./components/Pages/Disclaimer"));
const CommunityGuidelines = lazy(() => import("./components/Pages/CommunityGuidelines"));
const SafetyTips = lazy(() => import("./components/Pages/SafetyTips"));
const AboutUs = lazy(() => import("./components/Pages/AboutUs"));
const Blog = lazy(() => import("./components/Pages/Blog"));
const BlogPostPage = lazy(() => import("./components/Pages/BlogPostPage"));
const Contact = lazy(() => import("./components/Pages/Contact"));
const HelpCenter = lazy(() => import("./components/Pages/HelpCenter"));
const NotFoundPage = lazy(() => import("./components/Pages/NotFoundPage"));

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
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage"));


// Lazy load dashboard components
const Dash = lazy(() => import("./features/dashboard/Dash"));
const DependenciesManager = lazy(() => import("./features/MANAGER/Dependencies/DependenciesManager"));
// The admin panel is a nested section rather than one page: a shell holding
// nine routes, each lazily loaded on its own so opening /dash/admin does not
// pull the analytics charts and the city editor down with it.
const AdminLayout = lazy(() => import("./features/admin/AdminLayout"));
const AdminOverviewPage = lazy(() => import("./features/admin/pages/OverviewPage"));
const AdminModerationPage = lazy(() => import("./features/admin/pages/ModerationPage"));
const AdminPostsPage = lazy(() => import("./features/admin/pages/PostsPage"));
const AdminUsersPage = lazy(() => import("./features/admin/pages/UsersPage"));
const AdminPromotionsPage = lazy(() => import("./features/admin/pages/PromotionsPage"));
const AdminSupportPage = lazy(() => import("./features/admin/pages/SupportPage"));
const AdminAnalyticsPage = lazy(() => import("./features/admin/pages/AnalyticsPage"));
const AdminPlacesPage = lazy(() => import("./features/admin/pages/PlacesPage"));
const AdminSystemPage = lazy(() => import("./features/admin/pages/SystemPage"));
const AdminSocialReviewPage = lazy(() => import("./features/admin/pages/AdminSocialReviewPage"));



// Inner App component that has access to language context
const AppContent = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
  // Initialize authentication error handler
  useAuthErrorHandler();

  // One-shot silent token refresh at boot: revives an expired session via the
  // refresh cookie and upgrades legacy long-lived tokens to the refresh flow.
  useSessionBootstrap();

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

  // Mirror the active mode onto the document, for UI drawn outside the React
  // tree - the consent message, which Google renders into this document with
  // its own markup. public/index.html sets the same attribute from localStorage
  // before React mounts; this is what keeps it right after the mode toggle.
  useEffect(() => {
    applyDocumentTheme(mode);
  }, [mode]);

  // Track page views when route changes. No-ops until the CMP has reported
  // analytics consent and analytics.js has loaded gtag.js on the back of it.
  useEffect(() => {
    // Defer one frame so Helmet has committed the new title to the DOM
    const id = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 0);
    return () => clearTimeout(id);
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
        {/* Legal and Information Pages - Public Access */}
        <Route path="/privacy" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        {/* Deliberately public: this is the account-deletion URL declared in the
            Play Console, and Google requires it to be reachable without signing
            in (or installing the app). The page explains the process to
            everyone and only gates the form itself. */}
        <Route path="/delete-account" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <DeleteAccount />
          </Suspense>
        } />
        {/* Public like the page above, and for the same reason - it renders a
            sign-in prompt rather than a redirect when signed out, so the URL is
            always reachable. The list itself needs a session. */}
        <Route path="/blocked-users" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <BlockedUsers />
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
        <Route path="/disclaimer" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <Disclaimer />
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

        {/* Main Application Layout (shared chrome: navbar/sidebar/footer)
            Root '/' serves as the official, content-rich Homepage of Mafqoudat. */}
        <Route path="/" element={
          <Suspense fallback={<LoadingFallback />}>
            <DashLayout />
          </Suspense>
        }>
          {/* Official Homepage: Dashboard at root '/' */}
          <Route index element={
            <PrefetchDependencies>
              <Suspense fallback={<DashboardSkeleton />}>
                <Dash />
              </Suspense>
            </PrefetchDependencies>
          } />

          {/* Subroutes under /dash: bookmarks and legacy links redirect /dash to '/',
              while keeping sub-routes (/dash/posts, /dash/posts/:id, etc.) intact
              to protect API proxies and crawler OpenGraph rewrites. */}
          <Route path="dash">
            {/* Seamless redirect: /dash -> / */}
            <Route index element={<Navigate to="/" replace />} />

            {/* Post detail - public, and intentionally outside CountryGuard: a
                post already carries its own country (countryname/countryLabels
                come from the post itself), so no global country selection is
                needed to render it. */}
            <Route path="posts/:id" element={
              <Suspense fallback={<SinglePostSkeleton />}>
                <SinglePost />
              </Suspense>
            } />

            {/* Posts listing */}
            <Route path="posts" element={
              <PrefetchDependencies>
                <Suspense fallback={<PostsListSkeleton />}>
                  <PostsList />
                </Suspense>
              </PrefetchDependencies>
            } />

          {/* Everything below needs a country to filter its data by, and has
              no fallback UI of its own for a missing one. */}
          <Route element={<CountryGuard><Outlet /></CountryGuard>}>
            {/* Protected routes - require authentication for creating/editing posts and admin actions */}
            <Route element={
              <ProtectedRoute requireAuth={true} requireCountry={true}>
                <Suspense fallback={<LoadingFallback />}>
                  <Prefetch />
                </Suspense>
              </ProtectedRoute>
            }>
              <Route path="posts/new" element={
                <SectionErrorBoundary
                  title={currentLanguage === 'ar' ? 'حدث خطأ في نموذج نشر الإعلان' : 'Error in Post Creation Form'}
                  backUrl="/dash/posts"
                  backLabel={currentLanguage === 'ar' ? 'العودة إلى المنشورات' : 'Back to Posts'}
                >
                  <Suspense fallback={<PostFormSkeleton />}>
                    <NewPost />
                  </Suspense>
                </SectionErrorBoundary>
              } />
              <Route path="posts/edit/:id" element={
                <SectionErrorBoundary
                  title={currentLanguage === 'ar' ? 'حدث خطأ في نموذج تعديل الإعلان' : 'Error in Post Edit Form'}
                  backUrl="/dash/posts"
                  backLabel={currentLanguage === 'ar' ? 'العودة إلى المنشورات' : 'Back to Posts'}
                >
                  <Suspense fallback={<PostFormSkeleton />}>
                    <EditPost />
                  </Suspense>
                </SectionErrorBoundary>
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
              <Route path="notifications" element={
                <Suspense fallback={<LoadingFallback />}>
                  <NotificationsPage />
                </Suspense>
              } />
              {/* Admin-only. The server enforces this too (verifyAdmin on
                  /users, /admin/* and the dependency endpoints), so this guard
                  is about not sending a normal user to a screen that can only
                  answer them with a 403 - the router previously had no notion
                  that these routes were privileged at all. */}
              <Route element={<AdminRoute />}>
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
                  <SectionErrorBoundary
                    title={currentLanguage === 'ar' ? 'حدث خطأ في لوحة الإدارة' : 'Error in Admin Panel'}
                    backUrl="/"
                    backLabel={currentLanguage === 'ar' ? 'الرئيسية' : 'Home'}
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminLayout />
                    </Suspense>
                  </SectionErrorBoundary>
                }>
                  <Route index element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminOverviewPage />
                    </Suspense>
                  } />
                  <Route path="moderation" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminModerationPage />
                    </Suspense>
                  } />
                  <Route path="social-review" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminSocialReviewPage />
                    </Suspense>
                  } />
                  <Route path="posts" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminPostsPage />
                    </Suspense>
                  } />
                  <Route path="users" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminUsersPage />
                    </Suspense>
                  } />
                  <Route path="promotions" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminPromotionsPage />
                    </Suspense>
                  } />
                  <Route path="support" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminSupportPage />
                    </Suspense>
                  } />
                  <Route path="analytics" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminAnalyticsPage />
                    </Suspense>
                  } />
                  <Route path="places" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminPlacesPage />
                    </Suspense>
                  } />
                  <Route path="system" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminSystemPage />
                    </Suspense>
                  } />
                  {/* A stale bookmark to a tab that no longer exists lands on
                      the overview rather than on the dashboard's 404 box. */}
                  <Route path="*" element={<Navigate to="/dash/admin" replace />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

        {/* 404 fallback route */}
        <Route path="*" element={
          <Suspense fallback={<InfoPageSkeleton />}>
            <NotFoundPage />
          </Suspense>
        } />
      </Routes>
      )}
    </ThemeProvider>
  );
};

function App() {
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
    
    // Start listening for the consent manager's answer, then hand Google
    // Analytics and the Meta Pixel to it: both load nothing until consent is
    // reported. Started here rather than only from initializeGA so the
    // consent state is resolved even on a build with no GA measurement ID.
    startConsentListener();
    initializeGA();
    initializeMetaPixel();
  }, []);

  // Initialize localStorage (language is now handled by LanguageProvider)
  useEffect(() => {
    try {
      // Step 1: Ensure globalState ALWAYS exists (critical for app stability)
      ensureGlobalStateAlwaysExists();
      
      // Step 2: Validate and repair localStorage before any other initialization
      validateAndRepairLocalStorage({
        autoRepair: true,
        logResults: true,
        preserveUserData: true
      });
      
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
