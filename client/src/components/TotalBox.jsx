import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import FlexBetween from "./FlexBetween";

const StatBox = ({ title, value, increase, icon, description, titleStyle, valueStyle, descriptionStyle, iconStyle, sx }) => {
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
        height: { xs: '220px', sm: 'auto' }, // Same height for all boxes on mobile
        minHeight: { xs: '220px', sm: 'fit-content' }, // Same minimum height for all boxes on mobile
        width: { xs: '100%', sm: 'auto' }, // Same width for all boxes on mobile
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      {/* Title */}
      <Typography 
        fontWeight="600" 
        fontSize="1rem"
        sx={{ 
          letterSpacing: '0.5px',
          paddingRight: { xs: '50px', sm: 0 }, // Add right padding on mobile to avoid icon overlap (LTR)
          paddingLeft: { xs: 0, sm: 0 }, // No left padding needed (LTR)
          // RTL support for padding
          '[dir="rtl"] &': {
            paddingRight: { xs: 0, sm: 0 }, // No right padding in RTL
            paddingLeft: { xs: '50px', sm: 0 }, // Add left padding on mobile in RTL to avoid icon overlap
          },
          ...titleStyle 
        }}
      >
        {title}
      </Typography>

      {/* Icon positioned absolutely */}
      <Box
        sx={{
          position: 'absolute',
          top: '12px',
          right: '12px', // Top-right in LTR
          background: iconStyle?.background || (theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)'),
          borderRadius: '12px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          width: '40px', // Fixed width for uniform sizing
          height: '40px', // Fixed height for uniform sizing
          minWidth: '40px', // Ensure minimum width
          minHeight: '40px', // Ensure minimum height
          '& svg': {
            color: iconStyle?.color || (theme.palette.mode === 'dark' ? '#B0BEC5' : '#4A5568'),
            transition: 'color 0.3s ease',
            fontSize: '20px', // Fixed icon size for consistency
            width: '20px',
            height: '20px'
          },
          // RTL support
          '[dir="rtl"] &': {
            right: 'auto',
            left: '12px', // Top-left in RTL
          }
        }}
      >
        {icon}
      </Box>

      <Box mt="1rem" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
