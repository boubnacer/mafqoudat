import { Outlet } from "react-router-dom";
import DashFooter from "../Footer/DashFooter";

import "./layout.css";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "../Navbar";
import { useState } from "react";
import Sidebar from "../Sidebar";

const DashLayout = () => {
  console.log('DashLayout: Component rendered');
  console.log('DashLayout: Current URL:', window.location.href);
  console.log('DashLayout: Current pathname:', window.location.pathname);
  
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();

  return (
    <>
      {/* here we set things that's gonna apear in every single page
    now i'm going to remove the footer one because i don't want it to appear in some pages */}
      <Box width="100%" height="100%">
        <Sidebar />
        <Box sx={{ backgroundColor: theme.palette.background }}>
          <Navbar />
          <Sidebar />
          <Outlet />
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};
export default DashLayout;
