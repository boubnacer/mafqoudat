import { Outlet } from "react-router-dom";
import { Box, useTheme } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DashFooter from "./Footer/DashFooter";

const Layout = () => {
  const theme = useTheme();

  return (
    <Box width="100%" height="100%">
      <Navbar />
      <Sidebar />
      <Box sx={{ backgroundColor: theme.palette.background }}>
        <Outlet />
        <DashFooter />
      </Box>
    </Box>
  );
};

export default Layout;
