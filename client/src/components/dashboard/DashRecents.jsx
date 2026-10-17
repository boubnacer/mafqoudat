import React from "react";
import { Box } from "@mui/material";

const DashRecents = ({ cate, sx, children, ...otherProps }) => {
  return (
    <Box
      data-cate={cate}
      sx={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        isolation: "isolate",
        py: { xs: 2.5, sm: 3, md: 3.5 },
        px: { xs: 1.5, sm: 2, md: 2.5 },
        ...sx,
      }}
      {...otherProps}
    >
      {children}
    </Box>
  );
};

export default DashRecents;

