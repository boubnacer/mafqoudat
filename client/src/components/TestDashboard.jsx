import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestDashboard = () => {
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
      sx={{ p: 3 }}
    >
      <Typography variant="h4" gutterBottom>
        🎉 Dashboard is Working!
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
        The routing is working correctly. The issue was with the API calls.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
        >
          Back to Welcome
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Box>
    </Box>
  );
};

export default TestDashboard;
