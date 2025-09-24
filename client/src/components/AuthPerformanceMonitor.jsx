import React from 'react';
import { Card, CardContent, Typography, Chip, Box, Alert } from '@mui/material';
import useAuthPerformance from '../hooks/useAuthPerformance';

/**
 * AuthPerformanceMonitor Component
 * Displays authentication performance metrics in development mode
 */
const AuthPerformanceMonitor = () => {
  const performance = useAuthPerformance();

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ 
      position: 'fixed', 
      bottom: 16, 
      right: 16, 
      maxWidth: 350, 
      zIndex: 9999,
      opacity: 0.9
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Auth Performance
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Validation Latency: <strong>{performance.validationLatency}ms</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cache Hit: <Chip 
              size="small" 
              label={performance.cacheHit ? 'Yes' : 'No'} 
              color={performance.cacheHit ? 'success' : 'warning'}
            />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Status: <Chip 
              size="small" 
              label={performance.isPerformanceOptimal ? 'Optimal' : 'Suboptimal'} 
              color={performance.isPerformanceOptimal ? 'success' : 'warning'}
            />
          </Typography>
        </Box>

        {performance.recommendations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recommendations:
            </Typography>
            {performance.recommendations.map((rec, index) => (
              <Alert 
                key={index}
                severity={getPriorityColor(rec.priority)}
                sx={{ mb: 1, fontSize: '0.75rem' }}
              >
                {rec.message}
              </Alert>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthPerformanceMonitor;
