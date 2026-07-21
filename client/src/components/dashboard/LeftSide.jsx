import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import FoundLostStrip from "./FoundLostStrip";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
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
        return parsed;
      }
      return {};
    } catch (error) {
      console.error('Error initializing viewed notifications state:', error);
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
        
        // First, read today's value BEFORE cleanup to preserve it
        const todayValue = localStorage.getItem(todayKey);
        
        // Check all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('viewedNotifications_')) {
            const date = key.replace('viewedNotifications_', '');
            // Only remove keys that are NOT today's date
            if (date !== today) {
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
        
        // Restore today's value if it existed (in case cleanup accidentally removed it)
        if (todayValue && !localStorage.getItem(todayKey)) {
          localStorage.setItem(todayKey, todayValue);
        }
        
        // Always sync state with localStorage after cleanup (this ensures fresh read on mount/refresh)
        const currentViewed = getViewedNotifications();
        const storedValue = localStorage.getItem(todayKey);
        
        // Verify localStorage is working
        if (storedValue === null && todayValue !== null) {
          console.warn('localStorage value was lost! Restoring...');
          localStorage.setItem(todayKey, todayValue);
          const restored = JSON.parse(todayValue);
          setViewedNotifications(restored);
        } else {
          setViewedNotifications(currentViewed);
        }
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

  // Sync viewedNotifications state when counts change (to detect new posts)
  // This ensures we can detect when new posts are added (count increases)
  useEffect(() => {
    // Re-read from localStorage when counts change to ensure we have latest viewed counts
    // This is important when user adds a new post and comes back to dashboard
    const currentViewed = getViewedNotifications();
    
    // Always update state with latest from localStorage when counts change
    // This ensures we detect when new posts are added
    setViewedNotifications(prev => {
      const newState = {
        foundCount: currentViewed.foundCount ?? prev.foundCount ?? 0,
        lostCount: currentViewed.lostCount ?? prev.lostCount ?? 0,
      };
      
      // Only update if there are actual changes
      if (prev.foundCount !== newState.foundCount || prev.lostCount !== newState.lostCount) {
        return newState;
      }
      return prev;
    });
  }, [foundsToday, lostsToday]); // Re-sync when counts change (new posts added)

  // Compute notification visibility using state (which is synced from localStorage)
  // Show notification if current count is higher than the viewed count
  const showFoundNotification = useMemo(() => {
    const currentCount = foundsToday || 0;
    
    // Get viewed count from state (synced from localStorage)
    // Use count-based tracking, ignore old boolean values
    const viewedCount = (viewedNotifications.foundCount !== undefined && viewedNotifications.foundCount !== null) 
      ? viewedNotifications.foundCount 
      : 0;
    
    // Show notification if: current count >= 1 AND current count > viewed count
    const shouldShow = currentCount >= 1 && currentCount > viewedCount;
    
    return shouldShow;
  }, [foundsToday, viewedNotifications.foundCount]);

  const showLostNotification = useMemo(() => {
    const currentCount = lostsToday || 0;
    
    // Get viewed count from state (synced from localStorage)
    // Use count-based tracking, ignore old boolean values
    const viewedCount = (viewedNotifications.lostCount !== undefined && viewedNotifications.lostCount !== null)
      ? viewedNotifications.lostCount
      : 0;
    
    // Show notification if: current count >= 1 AND current count > viewed count
    const shouldShow = currentCount >= 1 && currentCount > viewedCount;
    
    return shouldShow;
  }, [lostsToday, viewedNotifications.lostCount]);

  // Handler for Found Items
  const handleFoundItemsClick = () => {
    // Always update the viewed count when clicked (even if count is 0, to reset tracking)
    try {
      const key = getTodayKey();
      const currentCount = foundsToday || 0;
      
      // Read current state from localStorage
      const stored = localStorage.getItem(key);
      const currentViewed = stored ? JSON.parse(stored) : {};
      
      // Store the current count when viewed
      currentViewed.foundCount = currentCount;
      const valueToStore = JSON.stringify(currentViewed);
      
      // Write to localStorage with error handling
      try {
        localStorage.setItem(key, valueToStore);
      } catch (storageError) {
        // Handle quota exceeded or other storage errors
        if (storageError.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded');
        } else {
          console.error('localStorage write error:', storageError);
        }
        // Continue navigation even if storage fails
      }
      
      // Update state immediately
      setViewedNotifications(prev => ({ ...prev, foundCount: currentCount }));
    } catch (error) {
      console.error('Error marking found notification as viewed:', error);
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
    // Always update the viewed count when clicked (even if count is 0, to reset tracking)
    try {
      const key = getTodayKey();
      const currentCount = lostsToday || 0;
      
      // Read current state from localStorage
      const stored = localStorage.getItem(key);
      const currentViewed = stored ? JSON.parse(stored) : {};
      
      // Store the current count when viewed
      currentViewed.lostCount = currentCount;
      const valueToStore = JSON.stringify(currentViewed);
      
      // Write to localStorage with error handling
      try {
        localStorage.setItem(key, valueToStore);
      } catch (storageError) {
        // Handle quota exceeded or other storage errors
        if (storageError.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded');
        } else {
          console.error('localStorage write error:', storageError);
        }
        // Continue navigation even if storage fails
      }
      
      // Update state immediately
      setViewedNotifications(prev => ({ ...prev, lostCount: currentCount }));
    } catch (error) {
      console.error('Error marking lost notification as viewed:', error);
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

      {/* Stats Grid — hero Found/Lost strip spans both columns, Total and
          Returned sit below it as smaller supporting stats */}
      <Box
        gap={isMobile ? "1rem" : "1.5rem"}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          alignItems: "stretch",
        }}
      >
        <FoundLostStrip
          totalFounds={totalFounds || 0}
          totalLosts={totalLosts || 0}
          foundsToday={foundsToday || 0}
          lostsToday={lostsToday || 0}
          showFoundNotification={showFoundNotification}
          showLostNotification={showLostNotification}
          onFoundClick={handleFoundItemsClick}
          onLostClick={handleLostItemsClick}
        />

        <TotalBox
          title={t('totalItems')}
          value={totalPosts || 0}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={{
            backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.14 : 0.08),
            border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
          }}
          titleStyle={{
            color: theme.custom.color.ink,
            fontSize: '1.1rem',
            fontWeight: 600
          }}
          valueStyle={{
            color: theme.custom.color.brandPrimary,
            fontSize: '2rem',
            fontWeight: 700
          }}
          descriptionStyle={{
            color: alpha(theme.custom.color.ink, 0.65),
            fontSize: isMobile ? '1rem' : '0.9rem'
          }}
          iconStyle={{
            background: alpha(theme.custom.color.brandPrimary, 0.15),
            color: theme.custom.color.brandPrimary
          }}
        />

        <TotalBox
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          onClick={handleReturnedItemsClick}
          sx={{
            backgroundColor: theme.custom.color.surfaceRaised,
            border: `1px solid ${alpha(theme.custom.status.found.main, 0.35)}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
          }}
          titleStyle={{
            color: theme.custom.color.ink,
            fontSize: '1.1rem',
            fontWeight: 600
          }}
          valueStyle={{
            color: theme.custom.status.found.main,
            fontSize: '2rem',
            fontWeight: 700
          }}
          descriptionStyle={{
            color: alpha(theme.custom.color.ink, 0.65),
            fontSize: isMobile ? '1rem' : '0.9rem'
          }}
          iconStyle={{
            background: alpha(theme.custom.status.found.main, 0.12),
            color: theme.custom.status.found.main
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;