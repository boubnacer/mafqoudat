import React, { useMemo, useState } from 'react';
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
  LinearProgress,
  Button
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
    isError: hasError,
    error,
    refetch
  } = useGetVisitorStatsQuery({ days: daysFilter });

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

  const { statistics, trends, topPages, visitorCountries } = visitorData.data;

  const trendsWithChanges = useMemo(() => {
    if (!Array.isArray(trends)) {
      return [];
    }

    return trends.map((trend, index) => {
      const previous = index > 0 ? trends[index - 1] : null;
      const change = previous ? trend.count - previous.count : null;

      return {
        ...trend,
        change,
        previousCount: previous?.count ?? null
      };
    });
  }, [trends]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Visibility sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h5" fontWeight="bold">
            Site Visit Statistics
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="visitor-days-filter-label">Time Range</InputLabel>
            <Select
              labelId="visitor-days-filter-label"
              value={daysFilter}
              label="Time Range"
              onChange={handleDaysFilterChange}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
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
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Site Visits
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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
                  <Typography variant="body2" color="text.secondary">
                    Distinct sessions
                  </Typography>
                </Box>
                <BarChart sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visitor Countries and Top Pages */}
      <Grid container spacing={3}>
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
                      const totalVisitors = statistics.total || 1;
                      const percentage = ((country.count / totalVisitors) * 100).toFixed(1);
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Pages
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {topPages && topPages.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Page</TableCell>
                        <TableCell align="right">Visits</TableCell>
                        <TableCell align="right">Unique Visitors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topPages.slice(0, 10).map((page, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap maxWidth={220}>
                              {page.path}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={formatNumber(page.count)} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(page.uniqueVisitors)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No page data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visit Trends */}
      <Box mt={3}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
              Visit Trends
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {trendsWithChanges.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Visits</TableCell>
                      <TableCell align="right">Unique Sessions</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trendsWithChanges.map((trend, index) => {
                      const changeColor = getTrendColor(trend.count, trend.previousCount);
                      const changeValue =
                        trend.change === null
                          ? '—'
                          : `${trend.change > 0 ? '+' : ''}${formatNumber(trend.change)}`;

                      return (
                        <TableRow key={index}>
                          <TableCell>{trend.date}</TableCell>
                          <TableCell align="right">{formatNumber(trend.count)}</TableCell>
                          <TableCell align="right">{formatNumber(trend.uniqueCount)}</TableCell>
                          <TableCell align="right">
                            <Typography color={changeColor} fontWeight={600}>
                              {changeValue}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Not enough data to display trends</Alert>
            )}
          </Box>
        </Paper>
      </Box>

    </Box>
  );
};

export default VisitorStats;
