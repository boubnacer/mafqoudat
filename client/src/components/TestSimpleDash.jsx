import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestSimpleDash = () => {
  const navigate = useNavigate();

  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="50vh"
      gap={2}
    >
      <Typography variant="h4" gutterBottom>
        🎉 Dashboard is Working!
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        This is a simple test dashboard without any API calls or authentication checks.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/dash/posts')}
        sx={{ mt: 2 }}
      >
        Go to Posts
      </Button>
      <Button 
        variant="outlined" 
        onClick={() => navigate('/')}
        sx={{ mt: 1 }}
      >
        Back to Welcome
      </Button>
    </Box>
  );
};

export default TestSimpleDash;
