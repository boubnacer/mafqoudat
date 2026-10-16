import React from "react";
import { Box } from "@mui/material";

const DashRecents = ({ cate, sx, children, ...otherProps }) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        py: { xs: 2, sm: 2.5, md: 3 },
        px: { xs: 1, sm: 1.5, md: 2 },
        ...sx,
      }}
      {...otherProps}
    >
      {children}
    </Box>
  );
};

export default DashRecents;
