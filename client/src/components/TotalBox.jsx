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
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 40px 0 rgba(0,0,0,0.15)',
        },
        ...sx
      }}
    >
      <FlexBetween>
        <Typography 
          fontWeight="600" 
          fontSize="1rem"
          sx={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            letterSpacing: '0.5px',
            ...titleStyle 
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            background: 'rgba(255,255,255,0.1)',
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

      <Box mt="1.5rem">
        <Typography
          fontSize="2rem"
          fontWeight="700"
          sx={{
            background: 'linear-gradient(90deg, #E0E0E0 0%, #A0AEC0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            ...valueStyle
          }}
        >
          {value}
        </Typography>
        
        <Typography
          mt="0.5rem"
          fontSize="0.875rem"
          sx={{
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            ...descriptionStyle
          }}
        >
          {description}
          {increase && (
            <span style={{ 
              color: '#48BB78',
              background: 'rgba(72, 187, 120, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              {increase}
            </span>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;
