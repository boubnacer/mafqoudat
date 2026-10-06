import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Paper, Skeleton, Button, Chip, Stack } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';
import useAuth from '../../hooks/useAuth';

const StorageQuotaMonitor = () => {
  const theme = useTheme();
  const { role, token } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/db-health/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin' && token) {
      fetchStats();
    }
  }, [role, token]);

  // Only render for admins
  if (role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: `${theme.custom?.radius?.md || 8}px` }}>
        <Typography variant="h6" gutterBottom><Skeleton width="40%" /></Typography>
        <Skeleton variant="rectangular" height={10} sx={{ mb: 2, borderRadius: 1 }} />
        <Stack direction="row" spacing={2}>
          <Skeleton width="20%" />
          <Skeleton width="20%" />
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: `${theme.custom?.radius?.md || 8}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
        <Typography color="error" gutterBottom>Failed to load storage quota stats</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchStats}>
          Retry
        </Button>
      </Paper>
    );
  }

  if (!stats) return null;

  // Parse strings like "1.23 MB" to floats
  const dataSizeFloat = parseFloat(stats.database.dataSize) || 0;
  const indexSizeFloat = parseFloat(stats.database.indexSize) || 0;
  const totalStorageMB = dataSizeFloat + indexSizeFloat;

  // Free tier is 512 MB
  const maxStorageMB = 512;
  const percentageUsed = Math.min((totalStorageMB / maxStorageMB) * 100, 100);
  const isWarning = totalStorageMB >= 409.6; // 80% of 512MB

  // Node.js memory
  const heapUsedMB = stats.memoryUsage ? (stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2) : 0;
  const heapTotalMB = stats.memoryUsage ? (stats.memoryUsage.heapTotal / 1024 / 1024).toFixed(2) : 0;

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: `${theme.custom?.radius?.md || 8}px` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <StorageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6" fontWeight="bold">
          MongoDB Free Tier Storage (M0)
        </Typography>
      </Box>

      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {totalStorageMB.toFixed(2)} MB / {maxStorageMB} MB
        </Typography>
        <Typography variant="body2" color={isWarning ? 'error.main' : 'text.secondary'} fontWeight={isWarning ? 'bold' : 'normal'}>
          {percentageUsed.toFixed(1)}% Used
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentageUsed}
        color={isWarning ? 'error' : 'primary'}
        sx={{
          height: 10,
          borderRadius: 5,
          mb: 3,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}
      />

      {isWarning && (
        <Box sx={{ mb: 3, p: 1.5, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
          <ErrorOutlineIcon sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="bold">
            Warning: Storage usage has reached {percentageUsed.toFixed(1)}% of the 512 MB free tier limit.
          </Typography>
        </Box>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
        <Chip
          icon={<StorageIcon />}
          label={`Data: ${stats.database.dataSize}`}
          variant="outlined"
          color="primary"
          size="medium"
        />
        <Chip
          icon={<StorageIcon />}
          label={`Index: ${stats.database.indexSize}`}
          variant="outlined"
          color="secondary"
          size="medium"
        />
        {stats.memoryUsage && (
          <Chip
            icon={<MemoryIcon />}
            label={`Heap: ${heapUsedMB} MB / ${heapTotalMB} MB`}
            variant="outlined"
            color="info"
            size="medium"
          />
        )}
      </Stack>
    </Paper>
  );
};

export default StorageQuotaMonitor;
