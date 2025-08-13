import { Outlet } from "react-router-dom";
import { Box, useTheme } from "@mui/material";

const SimpleDashLayout = () => {
  const theme = useTheme();

  return (
    <Box 
      width="100%" 
      height="100vh"
      sx={{ 
        backgroundColor: theme.palette.background,
        pt: { xs: "1rem", sm: "2rem" }
      }}
    >
      <Outlet />
    </Box>
  );
};

export default SimpleDashLayout;
