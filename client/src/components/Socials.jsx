import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import FlexBetween from "./FlexBetween";

const Socials = ({ title, value, increase, icon, description }) => {
  const theme = useTheme();
  return (
    <Box
      mt="1rem"
      p="0.5rem 1rem"
      backgroundColor={theme.palette.background.default}
      borderRadius="0.55rem"
    >
      <FlexBetween>
        <Typography variant="h6" sx={{ color: theme.palette.secondary.main }}>
          {title}
        </Typography>
        {icon}
      </FlexBetween>
      <FlexBetween gap="1rem">
        <Typography
          variant="h5"
          fontStyle="italic"
          fontWeight="400"
          mt="3rem"
          sx={{ color: theme.palette.secondary.main }}
        >
          {value}
        </Typography>
        <Typography>{description}</Typography>
      </FlexBetween>
    </Box>
  );
};

export default Socials;
