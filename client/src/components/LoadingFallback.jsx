import React from 'react';
import { Box, CircularProgress } from '@mui/material';

// Minimal fallback for routes that don't have a page-shaped skeleton yet
// (admin/manager tools, profile, myposts, the dash layout shell, auth callback)
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '40vh',
      width: '100%',
      py: 8,
    }}
  >
    <CircularProgress />
  </Box>
);

export default LoadingFallback;
