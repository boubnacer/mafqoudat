import React from "react";
import { Box, Typography } from "@mui/material";

const Dash = () => {
  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      sx={{
        transition: 'padding 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}
    >
      <Typography variant="h4" textAlign="center">
        Dashboard is working! No authentication required.
      </Typography>
    </Box>
  );
};

export default Dash;
