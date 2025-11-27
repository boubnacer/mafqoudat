import React, { useState, useMemo, useEffect } from 'react';
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

  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // First, fetch initial stats to get first visit date
  const {
    data: initialData,
    isLoading: initialLoading
  } = useGetVisitorStatsQuery({});

  // Get first visit date from initial data
  const firstVisitDate = initialData?.data?.statistics?.firstVisitDate 
    ? new Date(initialData.data.statistics.firstVisitDate)
    : null;

  // Generate list of months from first visit date to current month
  const availableMonths = useMemo(() => {
    if (!firstVisitDate) {
      // If no first visit date yet, show last 12 months as fallback
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
    }

    const months = [];
    const firstYear = firstVisitDate.getFullYear();
    const firstMonth = firstVisitDate.getMonth();
    
    // Calculate months from first visit to current month
    // Build array from current month backwards to first visit month
    let year = currentYear;
    let month = currentMonth;
    
    while (year > firstYear || (year === firstYear && month >= firstMonth)) {
      const date = new Date(year, month, 1);
      months.unshift({ // Use unshift to add to beginning, so current month is at index 0
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
      
      // Move to previous month
      if (month === 0) {
        month = 11;
        year--;
      } else {
        month--;
      }
    }
    
    return months; // Current month is at index 0, oldest at last index
  }, [currentYear, currentMonth, firstVisitDate]);

  // State for selected month (default to current month - index 0)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  // Update selectedMonthIndex when availableMonths changes (e.g., when first visit date is loaded)
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonthIndex >= availableMonths.length) {
      // If current selection is out of bounds, reset to current month (index 0)
      setSelectedMonthIndex(0);
    }
  }, [availableMonths.length, selectedMonthIndex]);

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    if (!availableMonths[selectedMonthIndex]) {
      // Fallback if month not available yet
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateFormatted: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDateFormatted: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    }

    const selectedMonth = availableMonths[selectedMonthIndex];
    const startDate = new Date(selectedMonth.year, selectedMonth.month, 1);
    startDate.setHours(0, 0, 0, 0);
    
    // Check if it's the current month (index 0 after reverse, which means it's the most recent)
    const isCurrentMonth = selectedMonthIndex === 0 && 
      selectedMonth.year === currentYear && 
      selectedMonth.month === currentMonth;
    
    // If it's the current month, use current date as end date
    // Otherwise, use the last day of that month
    let endDate;
    if (isCurrentMonth) {
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
  }, [selectedMonthIndex, availableMonths, now, currentYear, currentMonth]);

  const queryArgs = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  }), [dateRange.startDate, dateRange.endDate]);

  const {
    data: visitorData,
    isLoading: loading,
    isError: hasError,
    error,
    refetch
  } = useGetVisitorStatsQuery(
    queryArgs,
    {
      // Skip if we don't have date range yet or if initial data is still loading
      skip: !dateRange.startDate || !dateRange.endDate || initialLoading || availableMonths.length === 0,
      // Force refetch when arguments change (when month changes)
      refetchOnMountOrArgChange: true
    }
  );

  // Debug: Log when query data changes
  useEffect(() => {
    if (visitorData?.data?.statistics) {
      console.log('📊 [VISITOR-STATS] Query data received:', {
        thisMonth: visitorData.data.statistics.thisMonth,
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate
        }
      });
    }
  }, [visitorData, dateRange]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const handleMonthChange = (event) => {
    const newIndex = event.target.value;
    console.log('📊 [VISITOR-STATS] Month changed:', {
      oldIndex: selectedMonthIndex,
      newIndex,
      month: availableMonths[newIndex]?.label,
      dateRange: dateRange
    });
    setSelectedMonthIndex(newIndex);
  };

  // Debug: Log when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      console.log('📊 [VISITOR-STATS] Date range updated:', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        startDateFormatted: dateRange.startDateFormatted,
        endDateFormatted: dateRange.endDateFormatted,
        selectedMonthIndex,
        selectedMonth: availableMonths[selectedMonthIndex]?.label
      });
    }
  }, [dateRange.startDate, dateRange.endDate, selectedMonthIndex, availableMonths]);

  if (initialLoading || loading) {
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
      <Box mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
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
        {firstVisitDate && (
          <Chip
            label={`First Visit: ${firstVisitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            color="secondary"
            variant="outlined"
            size="small"
            sx={{
              fontSize: '0.85rem',
              padding: '6px 10px',
              height: 'auto'
            }}
          />
        )}
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
                    {selectedMonthIndex === 0 && availableMonths[0]?.year === currentYear && availableMonths[0]?.month === currentMonth
                      ? 'Unique sessions this month' 
                      : `Unique sessions in ${availableMonths[selectedMonthIndex]?.label || 'selected period'}`}
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

