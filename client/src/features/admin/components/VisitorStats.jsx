import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  TrendingUp,
  CalendarToday,
  Public,
  BarChart,
  Refresh
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetVisitorStatsQuery } from '../adminApiSlice';

const VisitorStats = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [daysFilter, setDaysFilter] = useState(7);

  const {
    data: visitorData,
    isLoading: loading,
    isError: isError,
    error,
    refetch
  } = useGetVisitorStatsQuery({ days: daysFilter });

  // Debug logging
  console.log('VisitorStats component rendered');
  console.log('visitorData:', visitorData);
  console.log('loading:', loading);
  console.log('isError:', isError);
  console.log('error:', error);

  const handleDaysFilterChange = (event) => {
    setDaysFilter(event.target.value);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getTrendColor = (current, previous) => {
    if (!previous) return theme.palette.text.secondary;
    if (current > previous) return theme.palette.success.main;
    if (current < previous) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
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

  const { statistics, trends, topPages, visitorCountries } = visitorData.data;

  return (
    <Box>
      {/* Header with filter */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Visibility sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h5" fontWeight="bold">
            Visitor Statistics
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={daysFilter}
            label="Time Period"
            onChange={handleDaysFilterChange}
          >
            <MenuItem value={1}>Last 24 Hours</MenuItem>
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Visitors
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.total)}
                  </Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Today
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.today)}
                  </Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.thisMonth)}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Unique Visitors
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.unique)}
                  </Typography>
                </Box>
                <Public sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3}>
        {/* Top Pages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Pages
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Page</TableCell>
                      <TableCell align="right">Visits</TableCell>
                      <TableCell align="right">Unique</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPages?.slice(0, 5).map((page, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {page.path}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(page.count)} 
                            size="small" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(page.uniqueVisitors)} 
                            size="small" 
                            color="secondary"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Visitor Countries */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Public sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Countries
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell align="right">Visitors</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitorCountries?.slice(0, 5).map((country, index) => {
                      const percentage = ((country.count / statistics.total) * 100).toFixed(1);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {country._id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={formatNumber(country.count)} 
                              size="small" 
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {percentage}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={parseFloat(percentage)}
                                sx={{ width: 50, height: 4 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trends Chart Placeholder */}
      {trends && trends.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Visitor Trends (Last {daysFilter} Days)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" flexWrap="wrap" gap={2}>
              {trends.map((trend, index) => (
                <Box key={index} minWidth={120}>
                  <Typography variant="body2" color="text.secondary">
                    {trend.date}
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(trend.count)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatNumber(trend.uniqueCount)} unique
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VisitorStats;
