import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import RenderIcon from "../RenderIcon";

const RoadMap = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        borderColor: theme.palette.primary.main,

        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "3rem",
        mt: "2rem",
        padding: "2rem 0",
      }}
    >
      <Box
        sx={{
          // backgroundColor: "#3C3C3C",
          backgroundColor: "#242526",

          position: "relative",
          width: "28%",
          border: "1px solid #3C3C3C",
          borderRadius: "5px",
          padding: "2rem",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#242526",
            borderTop: "1px solid #3C3C3C",

            position: "absolute",
            top: "-14px",
            padding: "0.4rem 0.5rem",
            // left: "9px",
            borderRadius: "50px",
          }}
        >
          <RenderIcon name="roadmapf" />
        </Box>
        <Typography fontWeight="500" fontSize="20px">
          if you have lost something please check founds list below than you can
          create post
        </Typography>
      </Box>

      <Box
        sx={{
          // backgroundColor: "#3C3C3C",
          backgroundColor: "#242526",

          position: "relative",
          width: "28%",
          border: "1px solid #333333",
          borderRadius: "5px",
          padding: "2rem",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#242526",
            borderTop: "1px solid #3C3C3C",

            position: "absolute",
            top: "-14px",
            padding: "0.4rem 0.5rem",
            // left: "9px",
            borderRadius: "50px",
          }}
        >
          <RenderIcon name="roadmapl" />
        </Box>
        <Typography fontWeight="500" fontSize="20px">
          if you have lost something please check founds list below than you can
          create post
        </Typography>
      </Box>

      <Box
        sx={{
          // backgroundColor: "#3C3C3C",
          backgroundColor: "#242526",

          position: "relative",
          width: "28%",
          border: "1px solid #333333",
          borderRadius: "5px",
          padding: "2rem",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#242526",
            borderTop: "1px solid #3C3C3C",

            position: "absolute",
            top: "-14px",
            padding: "0.4rem 0.5rem",
            // left: "9px",
            borderRadius: "50px",
          }}
        >
          <RenderIcon name="create" />
        </Box>
        <Typography fontWeight="500" fontSize="20px">
          if you have lost something please check founds list below than you can
          create post
        </Typography>
      </Box>
    </Box>
  );
};

export default RoadMap;
