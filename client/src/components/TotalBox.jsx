import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import FlexBetween from "./FlexBetween";

const StatBox = ({ title, value, increase, icon, description, titleStyle, valueStyle, descriptionStyle, sx }) => {
  const theme = useTheme();
  return (
    <Box
      p="1.5rem"
      borderRadius="16px"
      position="relative"
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0,0,0,0.1)'
          : '0 8px 32px 0 rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 40px 0 rgba(0,0,0,0.15)'
            : '0 12px 40px 0 rgba(0,0,0,0.1)',
        },
        ...sx
      }}
    >
      <FlexBetween>
        <Typography 
          fontWeight="600" 
          fontSize="1rem"
          sx={{ 
            letterSpacing: '0.5px',
            ...titleStyle 
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.1)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </FlexBetween>

      <Box mt="1rem">
        <Typography
          fontWeight="600"
          fontSize="2rem"
          sx={valueStyle}
        >
          {value}
        </Typography>
        <Typography
          fontSize="0.875rem"
          sx={descriptionStyle}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;
