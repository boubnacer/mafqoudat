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
  const { data: flOptionsData, isError, isLoading } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isError, isLoading }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
      isError,
      isLoading
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
      navigate(`/posts?fl=${foundOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/posts');
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
      navigate(`/posts?fl=${lostOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/posts');
    }
  };

  // Handler for Returned Items
  const handleReturnedItemsClick = () => {
    // Navigate to posts list - returned items can be filtered on the posts page
    navigate('/posts?status=returned');
  };

  const isDark = theme.palette.mode === 'dark';
  const isRTL = currentLanguage === 'ar' || theme.direction === 'rtl';
  const dotColor = isDark ? '#C8E5F9' : '#1C699C';
  const dotRadius = isDark ? 0.72 : 0.9;
  const dotSize = dotRadius * 2;
  const dotOffset = 2.25 - dotRadius;

  if (isError) {
    return (
      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 4, textAlign: 'center' }}>
        <Typography color="error">{t("errorLoadingData") || "Error loading options"}</Typography>
      </Box>
    );
  }

  return (
    <Box
      data-reveal="hero"
      sx={{
        // Genuinely translucent on both breakpoints now that this floats
        // over Dash.js's full-bleed world-map backdrop instead of sitting
        // next to/above its own boxed card — a much lower fill so the map
        // actually shows through, with a heavier blur (10px -> 18px) so the
        // busier map detail behind it doesn't fight with the stat numbers'
        // legibility.
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.14)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.14)} 100%)`,
        backdropFilter: 'blur(18px)',
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        padding: isMobile ? '1.5rem' : '2rem',
        paddingBottom: isMobile ? 'calc(1.5rem + 0.5cm)' : 'calc(2rem + 0.5cm)',
        boxShadow: 'none',
        width: '100%',
        mx: 0,
        maxWidth: '100%', // Prevent overflow
        minWidth: 0, // Allow shrinking if needed
      }}
    >
      {/* Cyber dot matrix SVG background with Corner Clusters matching RTL/LTR theme */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: isDark ? 0.5 : 0.75,
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dot-matrix-stats" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
            <rect
              x={dotOffset}
              y={dotOffset}
              width={dotSize}
              height={dotSize}
              fill={dotColor}
            />
          </pattern>
          {/* In LTR: top-left (cx=0%, cy=0%) and bottom-right (cx=100%, cy=100%). In RTL: inversed to top-right (cx=100%, cy=0%) and bottom-left (cx=0%, cy=100%) */}
          <radialGradient
            id="top-glow-stats"
            cx={isRTL ? "100%" : "0%"}
            cy="0%"
            r="48%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="bottom-glow-stats"
            cx={isRTL ? "0%" : "100%"}
            cy="100%"
            r="48%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="top-mask-stats">
            <rect width="100%" height="100%" fill="url(#top-glow-stats)" />
          </mask>
          <mask id="bottom-mask-stats">
            <rect width="100%" height="100%" fill="url(#bottom-glow-stats)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-matrix-stats)" mask="url(#top-mask-stats)" />
        <rect width="100%" height="100%" fill="url(#dot-matrix-stats)" mask="url(#bottom-mask-stats)" />
      </Box>

      {/* Title Section */}
      <Box
        data-reveal-item=""
        mb={isMobile ? 2 : 3}
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Typography
          variant="h5"
          fontWeight="700"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            color: theme.custom.color.ink,
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
          position: 'relative',
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          alignItems: "stretch",
        }}
      >
        <FoundLostStrip
          data-reveal-item=""
          totalFounds={totalFounds || 0}
          totalLosts={totalLosts || 0}
          foundsToday={foundsToday || 0}
          lostsToday={lostsToday || 0}
          showFoundNotification={showFoundNotification}
          showLostNotification={showLostNotification}
          onFoundClick={handleFoundItemsClick}
          onLostClick={handleLostItemsClick}
          sx={{
            background: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backgroundColor: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backdropFilter: 'blur(12px)',
          }}
        />

        <TotalBox
          data-reveal-item=""
          countUp
          title={t('totalItems')}
          value={totalPosts || 0}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={{
            background: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backgroundColor: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backdropFilter: 'blur(12px)',
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
          data-reveal-item=""
          countUp
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          onClick={handleReturnedItemsClick}
          sx={{
            background: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backgroundColor: alpha(theme.custom.color.surfaceRaised, isDark ? 0.72 : 0.8),
            backdropFilter: 'blur(12px)',
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