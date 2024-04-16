import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import FlexBetween from "./FlexBetween";
import { TrendingUpOutlined } from "@mui/icons-material";

const StatBox = ({ title, value, increase, icon, description }) => {
  const theme = useTheme();
  return (
    <Box
      p="1rem"
      // backgroundColor={theme.palette.primary.main}

      borderRadius="0.55rem"
      position="relative"
      sx={{
        boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
        border: "1px solid #333333",
        backgroundColor: "#242526",
      }}
    >
      <FlexBetween>
        <Typography fontWeight="500" fontSize="15px" sx={{ color: "#FFFFFF" }}>
          {title}
        </Typography>
        {icon}
      </FlexBetween>

      <Box
        position="absolute"
        bottom="1rem"
        left="0"
        width="100%"
        padding="0 1.2rem"
      >
        <FlexBetween>
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{ color: "#CCCCCC", fontSize: "24px" }}
          >
            {value}
          </Typography>
          <Box
            sx={{
              backgroundColor: theme.palette.action.back,
              borderRadius: "50px",
              padding: "0 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              fontWeight="300"
              fontSize="13px"
              sx={{ fontStyle: "italic", color: "#ffffff" }}
            >
              {description}
            </Typography>
          </Box>
        </FlexBetween>
      </Box>
    </Box>
  );
};

export default StatBox;
