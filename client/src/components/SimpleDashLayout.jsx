import { Outlet } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SimpleNavbar from "./SimpleNavbar";
import SimpleSidebar from "./SimpleSidebar";

const SimpleDashLayout = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();

  return (
    <>
      <SimpleSidebar />
      <Box 
        width="100%" 
        height="100%"
        sx={{ 
          backgroundColor: theme.palette.background,
          marginLeft: isNonMobile ? "250px" : "0px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <SimpleNavbar />
        <Box
          sx={{
            pt: { xs: "6.5rem", sm: "7rem" },
            px: { xs: 2, sm: 3 },
            pb: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </>
  );
};

export default SimpleDashLayout;
