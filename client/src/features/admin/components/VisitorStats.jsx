import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  Button
} from '@mui/material';
import {
  Visibility,
  TrendingUp,
  CalendarToday,
  Refresh
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetVisitorStatsQuery } from '../adminApiSlice';

const VisitorStats = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const {
    data: visitorData,
    isLoading: loading,
    isError: hasError,
    error,
    refetch
  } = useGetVisitorStatsQuery();

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Alert 
        severity="error" 
        action={
          <Refresh 
            onClick={refetch} 
            style={{ cursor: 'pointer' }}
          />
        }
      >
        {error?.data?.message || error?.message || 'Failed to fetch visitor statistics'}
      </Alert>
    );
  }

  if (!visitorData?.data) {
    return (
      <Alert severity="info">
        No visitor data available
      </Alert>
    );
  }

  const { statistics } = visitorData.data;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Visibility sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h5" fontWeight="bold">
            Visitor Statistics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refetch}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Visits
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.total)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time
                  </Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Today's Visits
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.today)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique sessions today
                  </Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    This Month's Visits
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.thisMonth)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique sessions this month
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VisitorStats;

