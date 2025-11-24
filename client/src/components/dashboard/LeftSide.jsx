import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setFoundOrLost } from "../../app/state";
import { useGetflOptionsQuery } from "../../features/dependencies/dependenciesApiSlice";

// Utility functions for managing viewed notifications
const getTodayKey = () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return `viewedNotifications_${dateStr}`;
};

const getViewedNotifications = () => {
  try {
    const key = getTodayKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
    return {};
  } catch (error) {
    console.error('Error reading viewed notifications:', error);
    return {};
  }
};

const markNotificationAsViewed = (boxType) => {
  try {
    const key = getTodayKey();
    const viewed = getViewedNotifications();
    viewed[boxType] = true;
    localStorage.setItem(key, JSON.stringify(viewed));
  } catch (error) {
    console.error('Error marking notification as viewed:', error);
  }
};

const isNotificationViewed = (boxType) => {
  const viewed = getViewedNotifications();
  return viewed[boxType] === true;
};

const LeftSide = ({
  totalFounds,
  totalLosts,
  totalPosts,
  totalReturned,
  foundsToday,
  lostsToday,
}) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get found/lost options for navigation
  const { data: flOptionsData } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });

  // State to track viewed notifications (synced with localStorage)
  // Initialize from localStorage immediately - this runs synchronously before first render
  const [viewedNotifications, setViewedNotifications] = useState(() => {
    try {
      const key = getTodayKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📋 [Notifications] Initial state from localStorage:', parsed);
        return parsed;
      }
      return {};
    } catch (error) {
      console.error('❌ Error initializing viewed notifications state:', error);
      return {};
    }
  });

  // Clean up old notification data and sync state with localStorage on mount
  useEffect(() => {
    const syncNotifications = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayKey = getTodayKey();
        const keysToRemove = [];
        
        // Check all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('viewedNotifications_')) {
            const date = key.replace('viewedNotifications_', '');
            // Only remove keys that are NOT today's date
            if (date !== today && key !== todayKey) {
              keysToRemove.push(key);
            }
          }
        }
        
        // Remove old keys (but never remove today's key)
        keysToRemove.forEach(key => {
          if (key !== todayKey) {
            localStorage.removeItem(key);
          }
        });
        
        // Always sync state with localStorage after cleanup (this ensures fresh read on mount/refresh)
        const currentViewed = getViewedNotifications();
        const storedValue = localStorage.getItem(todayKey);
        
        // Debug logging
        console.log('📋 [Notifications] On mount/refresh:');
        console.log('  - Today key:', todayKey);
        console.log('  - Stored value:', storedValue);
        console.log('  - Parsed viewed:', currentViewed);
        console.log('  - Found viewed:', currentViewed.found);
        console.log('  - Lost viewed:', currentViewed.lost);
        
        setViewedNotifications(currentViewed);
      } catch (error) {
        console.error('❌ Error syncing notifications:', error);
        // Even on error, try to get current viewed state
        try {
          setViewedNotifications(getViewedNotifications());
        } catch (e) {
          setViewedNotifications({});
        }
      }
    };

    // Sync on mount
    syncNotifications();

    // Listen for storage changes (in case localStorage is updated from another tab/window)
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('viewedNotifications_')) {
        console.log('📦 [Notifications] Storage changed:', e.key, e.newValue);
        syncNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also sync when window regains focus (helps with refresh scenarios)
    const handleFocus = () => {
      syncNotifications();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Compute notification visibility using state (which is synced from localStorage)
  // Use useMemo to ensure it updates when state or counts change
  const showFoundNotification = useMemo(() => {
    const hasItemsToday = (foundsToday || 0) >= 1;
    if (!hasItemsToday) return false;
    
    // Check state first (synced from localStorage in useEffect)
    const isViewed = viewedNotifications.found === true;
    
    // Also double-check localStorage as fallback
    if (!isViewed) {
      try {
        const key = getTodayKey();
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.found === true) {
            // State is out of sync, update it
            setViewedNotifications(prev => ({ ...prev, found: true }));
            return false; // Don't show notification
          }
        }
      } catch (error) {
        console.error('❌ Error reading found notification from localStorage:', error);
      }
    }
    
    return !isViewed;
  }, [foundsToday, viewedNotifications.found]);

  const showLostNotification = useMemo(() => {
    const hasItemsToday = (lostsToday || 0) >= 1;
    if (!hasItemsToday) return false;
    
    // Check state first (synced from localStorage in useEffect)
    const isViewed = viewedNotifications.lost === true;
    
    // Also double-check localStorage as fallback
    if (!isViewed) {
      try {
        const key = getTodayKey();
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lost === true) {
            // State is out of sync, update it
            setViewedNotifications(prev => ({ ...prev, lost: true }));
            return false; // Don't show notification
          }
        }
      } catch (error) {
        console.error('❌ Error reading lost notification from localStorage:', error);
      }
    }
    
    return !isViewed;
  }, [lostsToday, viewedNotifications.lost]);

  // Handler for Found Items
  const handleFoundItemsClick = () => {
    // Mark notification as viewed when clicked
    if ((foundsToday || 0) >= 1) {
      try {
        const key = getTodayKey();
        const currentViewed = getViewedNotifications();
        currentViewed.found = true;
        const valueToStore = JSON.stringify(currentViewed);
        
        // Write to localStorage
        localStorage.setItem(key, valueToStore);
        
        // Double-check: read it back immediately to ensure it persisted
        const verify = localStorage.getItem(key);
        if (verify) {
          const verified = JSON.parse(verify);
          if (verified.found === true) {
            // Update state immediately
            setViewedNotifications({ ...verified });
            console.log('✅ Found notification marked as viewed and persisted');
          } else {
            console.warn('⚠️ Found notification write verification failed - found flag not set');
          }
        } else {
          console.warn('⚠️ Found notification write verification failed - no data in localStorage');
        }
      } catch (error) {
        console.error('❌ Error marking found notification as viewed:', error);
      }
    }
    
    const foundOption = flOptionsData?.find(option => option.code === 'FOUND');
    if (foundOption) {
      dispatch(setFoundOrLost({ foundOrlost: foundOption.code }));
      navigate(`/dash/posts?fl=${foundOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/dash/posts');
    }
  };

  // Handler for Lost Items
  const handleLostItemsClick = () => {
    // Mark notification as viewed when clicked
    if ((lostsToday || 0) >= 1) {
      try {
        const key = getTodayKey();
        const currentViewed = getViewedNotifications();
        currentViewed.lost = true;
        const valueToStore = JSON.stringify(currentViewed);
        
        // Write to localStorage
        localStorage.setItem(key, valueToStore);
        
        // Double-check: read it back immediately to ensure it persisted
        const verify = localStorage.getItem(key);
        if (verify) {
          const verified = JSON.parse(verify);
          if (verified.lost === true) {
            // Update state immediately
            setViewedNotifications({ ...verified });
            console.log('✅ Lost notification marked as viewed and persisted');
          } else {
            console.warn('⚠️ Lost notification write verification failed - lost flag not set');
          }
        } else {
          console.warn('⚠️ Lost notification write verification failed - no data in localStorage');
        }
      } catch (error) {
        console.error('❌ Error marking lost notification as viewed:', error);
      }
    }
    
    const lostOption = flOptionsData?.find(option => option.code === 'LOST');
    if (lostOption) {
      dispatch(setFoundOrLost({ foundOrlost: lostOption.code }));
      navigate(`/dash/posts?fl=${lostOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/dash/posts');
    }
  };

  // Handler for Returned Items
  const handleReturnedItemsClick = () => {
    // Navigate to posts list - returned items can be filtered on the posts page
    navigate('/dash/posts?status=returned');
  };

  return (
    <Box 
      sx={{
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '16px' : '24px',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'}`,
        padding: isMobile ? '1.5rem' : '2rem',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0,0,0,0.15)'
          : '0 8px 32px 0 rgba(0,0,0,0.05)',
        height: '100%', // Allow stretching to match container
        minHeight: 'fit-content', // Ensure minimum content height
        width: isMobile ? '100%' : 'auto', // Full width on mobile
        mx: isMobile ? 0 : 'auto', // Remove horizontal margin on mobile
        maxWidth: '100%', // Prevent overflow
        minWidth: 0, // Allow shrinking if needed
      }}
    >
      {/* Title Section */}
      <Box 
        mb={isMobile ? 2 : 3}
        sx={{
          textAlign: 'center',
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Typography
          variant="h5"
          fontWeight="700"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
            mb: 1
          }}
        >
          {t('statistics')}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box
        gap={isMobile ? "1rem" : "1.5rem"}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "calc(50% - 0.5rem) calc(50% - 0.5rem)", // Fixed equal columns accounting for gap
            sm: "repeat(2, 1fr)", // 2 columns on tablet
            md: "repeat(2, 1fr)", // 2 columns on desktop
          },
          gridTemplateRows: {
            xs: "repeat(2, 240px)", // Increased height rows on mobile - exactly 240px each
            sm: "auto", // Auto rows on desktop
            md: "auto", // Auto rows on desktop
          },
          height: "auto", // Let content determine height
          minHeight: "fit-content", // Ensure minimum content height
          alignContent: "start", // Align content to top
          alignItems: "stretch", // Ensure all grid items have same height
        }}
      >
        <TotalBox
          title={t('foundItems')}
          value={totalFounds || 0}
          increase="+14%"
          description={`+ ${foundsToday || 0} ${t('today')}`}
          icon={<RenderIcon name="Found" />}
          hasNotification={showFoundNotification}
          notificationColor={theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A'}
          onClick={handleFoundItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.15) 0%, rgba(72, 187, 120, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(72, 187, 120, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(72, 187, 120, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(72, 187, 120, 0.2)'
              : 'rgba(72, 187, 120, 0.15)',
            color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A'
          }}
        />

        <TotalBox
          title={t('lostItems')}
          value={totalLosts || 0}
          increase="+21%"
          description={`+ ${lostsToday || 0} ${t('today')}`}
          icon={<RenderIcon name="Lost" />}
          hasNotification={showLostNotification}
          notificationColor={theme.palette.mode === 'dark' ? '#F56565' : '#C53030'}
          onClick={handleLostItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(245, 101, 101, 0.15) 0%, rgba(245, 101, 101, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(245, 101, 101, 0.2) 0%, rgba(245, 101, 101, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(245, 101, 101, 0.3)' : 'rgba(245, 101, 101, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(245, 101, 101, 0.2)'
              : 'rgba(245, 101, 101, 0.15)',
            color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030'
          }}
        />

        <TotalBox
          title={t('totalItems')}
          value={totalPosts || 0}
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(66, 153, 225, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(66, 153, 225, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(66, 153, 225, 0.2)'
              : 'rgba(66, 153, 225, 0.15)',
            color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0'
          }}
        />

        <TotalBox
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          onClick={handleReturnedItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(159, 122, 234, 0.15) 0%, rgba(159, 122, 234, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(159, 122, 234, 0.2) 0%, rgba(159, 122, 234, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(159, 122, 234, 0.3)' : 'rgba(159, 122, 234, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(159, 122, 234, 0.2)'
              : 'rgba(159, 122, 234, 0.15)',
            color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1'
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;