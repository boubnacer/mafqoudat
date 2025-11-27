import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Visibility,
  TrendingUp,
  CalendarToday,
  Refresh,
  DateRange
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetVisitorStatsQuery } from '../adminApiSlice';

const VisitorStats = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Get current date and calculate available months
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Generate list of months (current month and previous months)
  const availableMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i <= 11; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  }, [currentYear, currentMonth]);

  // State for selected month (default to current month)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const selectedMonth = availableMonths[selectedMonthIndex];
    const startDate = new Date(selectedMonth.year, selectedMonth.month, 1);
    startDate.setHours(0, 0, 0, 0);
    
    // If it's the current month, use current date as end date
    // Otherwise, use the last day of that month
    let endDate;
    if (selectedMonthIndex === 0) {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateFormatted: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDateFormatted: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }, [selectedMonthIndex, availableMonths, now]);

  const {
    data: visitorData,
    isLoading: loading,
    isError: hasError,
    error,
    refetch
  } = useGetVisitorStatsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const handleMonthChange = (event) => {
    setSelectedMonthIndex(event.target.value);
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
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* Month Selector */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="month-selector-label">Select Month</InputLabel>
            <Select
              labelId="month-selector-label"
              id="month-selector"
              value={selectedMonthIndex}
              label="Select Month"
              onChange={handleMonthChange}
            >
              {availableMonths.map((month, index) => (
                <MenuItem key={`${month.year}-${month.month}`} value={index}>
                  {month.label}
                </MenuItem>
              ))}
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

      {/* Date Range Display */}
      <Box mb={3}>
        <Chip
          icon={<DateRange />}
          label={`${dateRange.startDateFormatted} - ${dateRange.endDateFormatted}`}
          color="primary"
          variant="outlined"
          sx={{
            fontSize: '0.9rem',
            padding: '8px 12px',
            height: 'auto'
          }}
        />
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
                    Selected Period Visits
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(statistics.thisMonth)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMonthIndex === 0 
                      ? 'Unique sessions this month' 
                      : `Unique sessions in ${availableMonths[selectedMonthIndex].label}`}
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

