import { Outlet } from "react-router-dom";
import DashFooter from "../Footer/DashFooter";

import "./layout.css";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "../Navbar";
import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";

const DashLayout = () => {
  console.log('DashLayout: Component rendered');
  console.log('DashLayout: Current URL:', window.location.href);
  console.log('DashLayout: Current pathname:', window.location.pathname);
  
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add error boundary for debugging
    const handleError = (error) => {
      console.error('DashLayout: Error caught:', error);
      setError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <h2>Error in DashLayout</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </Box>
    );
  }

  return (
    <>
      {/* here we set things that's gonna apear in every single page
    now i'm going to remove the footer one because i don't want it to appear in some pages */}
      <Box width="100%" height="100%">
        <Sidebar />
        <Box sx={{ backgroundColor: theme.palette.background }}>
          <Navbar />
          <Outlet />
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};
export default DashLayout;
