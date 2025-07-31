import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
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
import { useGetCountriesQuery } from "./features/countries/countriesApiSlice";
import ReportPage from "./features/posts/ReportPage/ReportPage";
import Dash from "./features/dashboard/Dash";
import DependenciesManager from "./features/MANAGER/Dependencies/DependenciesManager";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { themeSettings } from "./theme";
import useAuth from "./hooks/useAuth";
import PrefetchDependencies from "./features/PrefetchData/PrefetchDependencies";
import { initializeLanguage } from "./utils/languageUtils";

function App() {
  // useTitle("Dan D. Repairs");

  // Initialize language settings
  useEffect(() => {
    initializeLanguage();
  }, []);

  const mode = useSelector((state) => state.global.mode);
  const theme = React.useMemo(() => {
    try {
      return createTheme(themeSettings(mode));
    } catch (error) {
      console.error("Theme creation error:", error);
      return createTheme(); // Fallback to a basic theme
    }
  }, [mode]);

  // const direction = useSelector((state) => state.global.direction);
  // document.body.setAttribute("dir", direction);

  // const { countries } = useGetCountriesQuery({
  //   language: getCurrentLanguage()
  // }, {
  //   selectFromResult: ({ data }) => ({
  //     countries: data?.ids.map((id) => data?.entities[id]),
  //   }),
  // });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<PrefetchDependencies />}>
          <Route path="/" element={<Layout />}>
            {/* public routes */}

            
            <Route index element={<Login />} />
            <Route path="signup" element={< NewUser />} />

            <Route element={<PersistLogin />}>
              <Route element={<Prefetch />}>
                {/* Protected routes */}
                <Route path="dash" element={<DashLayout />}>
                  <Route index element={<Dash />} />

                  <Route path="posts">
                    <Route index element={<PostsList />} />
                    <Route path=":id" element={<SinglePost />} />
                    <Route path="new" element={<NewPost />} />
                    <Route path="edit/:id" element={<EditPost />} />
                    <Route path="report/:id" element={<ReportPage />} />
                  </Route>

                  <Route path="users">
                    <Route index element={<UsersList />} />
                    <Route path=":id" element={<EditUser />} />
                  </Route>

                  <Route path="dependencies" element={<DependenciesManager />} />
                </Route>
                {/* End Dash */}
              </Route>
              {/* End Protected Routes */}
            </Route>
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
