import { Outlet } from "react-router-dom";
import DashFooter from "../Footer/DashFooter";

import "./layout.css";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "../Navbar";
import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import { useTranslation } from "../../utils/translations";

const DashLayout = () => {
  
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const { currentLanguage } = useTranslation();
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
      {/* Only overflowX is set here, but per the CSS overflow spec, setting one
          axis to non-visible while leaving the other unset computes the other
          to 'auto' too - combined with the explicit height="100%", that makes
          THIS box (not window/body/html, which never overflow) the real
          scroll container for every /dash/* route. The id lets route-level
          effects (e.g. NewPost.js's scroll-to-top-on-mount) target the
          element that's actually scrolling. */}
      <Box
        id="dash-scroll-container"
        width="100%"
        height="100%"
        sx={{
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          overflowX: 'hidden', // Prevent horizontal overflow
        }}
      >
        <Sidebar />
        <Box 
          sx={{ 
            backgroundColor: theme.custom.color.surfaceBase,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Navbar />
          <Outlet />
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};
export default DashLayout;
