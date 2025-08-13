import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

const SimpleSidebar = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <>
      {isNonMobile ? (
        <Box
          component="aside"
          sx={{
            width: isSidebarOpen ? "250px" : "80px",
            minHeight: "100vh",
            backgroundColor: theme.palette.background.alt,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: "width 0.3s ease",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        >
          {/* Simple sidebar content - can be expanded later */}
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: theme.palette.secondary.main,
            }}
          >
            {/* Placeholder content */}
          </Box>
        </Box>
      ) : null}
    </>
  );
};

export default SimpleSidebar;
