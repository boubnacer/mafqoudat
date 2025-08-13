import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import WelcomePage from "./components/WelcomePage";
import PublicPostsPage from "./components/PublicPostsPage";
import Login from "./features/auth/Login/Login";
import DashLayout from "./components/Layout/DashLayout";
import SimpleDashLayout from "./components/SimpleDashLayout";
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
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { themeSettings } from "./theme";
import useAuth from "./hooks/useAuth";
import PrefetchDependencies from "./features/PrefetchData/PrefetchDependencies";
import { initializeLanguage, LanguageProvider, useLanguage } from "./utils/languageContext";
import { cleanupLocalStorage, initializeLocalStorage } from "./utils/localStorageUtils";



// Inner App component that has access to language context
const AppContent = () => {
  const mode = useSelector((state) => state.global.mode);
  const { currentLanguage } = useLanguage();
  
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
        {/* Public routes - no authentication required */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/posts" element={<PublicPostsPage />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<NewUser />} />

        {/* Public dashboard routes - no authentication required */}
        <Route path="dash" element={<SimpleDashLayout />}>
          <Route index element={<TestDashboard />} />
          <Route path="posts">
            <Route index element={<PostsList />} />
            <Route path=":id" element={<SinglePost />} />
          </Route>
        </Route>

        {/* Protected routes - require authentication for actions */}
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
