import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import FoundLostStrip from "./FoundLostStrip";
import CyberDotMatrix from "./CyberDotMatrix";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

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
  const isDark = theme.palette.mode === 'dark';
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const isMobile = useMediaQuery("(max-width:600px)");

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


  const boxBg = isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.82)';
  const boxBorderColor = isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)';

  const baseCardSx = {
    background: boxBg,
    backgroundColor: boxBg,
    backgroundImage: 'none',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: 'none',
    boxShadow: isDark
      ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      : '0 4px 18px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    borderRadius: `${theme.custom.radius.lg}px`,
    position: 'relative',
    overflow: 'hidden',
  };

  const foundLostCardSx = {
    ...baseCardSx,
    borderRadius: { xs: 0, sm: `${theme.custom.radius.lg}px` },
    border: 'none',
    boxShadow: { xs: 'none', sm: baseCardSx.boxShadow },
  };

  const totalBoxCardSx = {
    ...baseCardSx,
    padding: isMobile ? '1rem 1.25rem' : '1.5rem',
    borderRadius: { xs: 0, sm: `${theme.custom.radius.lg}px` },
    border: 'none',
    boxShadow: { xs: 'none', sm: baseCardSx.boxShadow },
    cursor: 'default',
    '&:hover': {
      transform: 'none',
      boxShadow: { xs: 'none', sm: baseCardSx.boxShadow },
    },
  };

  const returnedBoxCardSx = {
    ...baseCardSx,
    padding: isMobile ? '1rem 1.25rem' : '1.5rem',
    borderRadius: { xs: 0, sm: `${theme.custom.radius.lg}px` },
    border: 'none',
    boxShadow: { xs: 'none', sm: baseCardSx.boxShadow },
    cursor: 'default',
    '&:hover': {
      transform: 'none',
      boxShadow: { xs: 'none', sm: baseCardSx.boxShadow },
    },
  };

  return (
    <Box
      data-reveal="hero"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: theme.custom.color.statsCard,
        backgroundColor: theme.custom.color.statsCard,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        border: 'none',
        boxShadow: 'none',
        color: isDark ? '#ffffff' : '#0f172a',
        padding: isMobile ? '1.25rem 1rem' : '2rem',
        paddingBottom: isMobile ? 'calc(1.25rem + 0.5cm)' : 'calc(2rem + 0.5cm)',
        width: '100%',
        mx: 0,
        maxWidth: '100%', // Prevent overflow
        minWidth: 0, // Allow shrinking if needed
      }}
    >
      {/* Cyber dot matrix SVG background: bottom-right in LTR, bottom-left in RTL */}
      <CyberDotMatrix
        idPrefix="dot-matrix-stats"
        placement={isRTL ? "bottom-left" : "bottom-right"}
      />

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
            fontFamily: theme.custom.font.display,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            color: isDark ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.02em',
            mb: 1
          }}
        >
          {t('statistics')}
        </Typography>
      </Box>

      {/* Stats Grid — on mobile, all 4 boxes are seamlessly attached into one unified card with 1px dividers; on desktop, hero Found/Lost strip sits above 2 separate stat boxes */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: { xs: 0, sm: "1.5rem" },
          borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: 0 },
          overflow: { xs: 'hidden', sm: 'visible' },
          boxShadow: { xs: baseCardSx.boxShadow, sm: 'none' },
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
          sx={foundLostCardSx}
        />

        {/* Split line between Found/Lost boxes and bottom boxes in mobile view */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            width: '100%',
            height: '1px',
            backgroundColor: boxBorderColor,
            flexShrink: 0,
          }}
        />

        <TotalBox
          data-reveal-item=""
          countUp
          title={t('totalItems')}
          value={totalPosts || 0}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={totalBoxCardSx}
          titleStyle={{
            fontFamily: theme.custom.font.display,
            color: isDark ? '#ffffff' : '#0f172a',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
          valueStyle={{
            fontFamily: theme.custom.font.display,
            color: isDark ? '#00F2FE' : theme.custom.color.brandPrimary,
            fontSize: { xs: '2rem', sm: '2.25rem' },
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: isDark ? '0 0 20px rgba(0, 242, 254, 0.25)' : 'none',
          }}
          descriptionStyle={{
            fontFamily: theme.custom.font.body,
            color: isDark ? '#94a3b8' : '#475569',
            fontSize: isMobile ? '0.85rem' : '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
          iconStyle={{
            background: isDark ? 'rgba(0, 242, 254, 0.15)' : 'rgba(0, 114, 255, 0.10)',
            border: `1px solid ${isDark ? 'rgba(0, 242, 254, 0.35)' : 'rgba(0, 114, 255, 0.20)'}`,
            boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
            color: isDark ? '#00F2FE' : theme.custom.color.brandPrimary,
            borderRadius: '50%',
          }}
        />

        {/* Split line between Total and Returned boxes in mobile view */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            width: '100%',
            height: '1px',
            backgroundColor: boxBorderColor,
            flexShrink: 0,
          }}
        />

        <TotalBox
          data-reveal-item=""
          countUp
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          sx={returnedBoxCardSx}
          titleStyle={{
            fontFamily: theme.custom.font.display,
            color: isDark ? '#ffffff' : '#0f172a',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
          valueStyle={{
            fontFamily: theme.custom.font.display,
            color: theme.custom.status.found.main,
            fontSize: { xs: '2rem', sm: '2.25rem' },
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: isDark ? `0 0 20px ${alpha(theme.custom.status.found.main, 0.25)}` : 'none',
          }}
          descriptionStyle={{
            fontFamily: theme.custom.font.body,
            color: isDark ? '#94a3b8' : '#475569',
            fontSize: isMobile ? '0.85rem' : '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
          iconStyle={{
            background: isDark ? alpha(theme.custom.status.found.main, 0.15) : alpha(theme.custom.status.found.main, 0.10),
            border: `1px solid ${isDark ? alpha(theme.custom.status.found.main, 0.35) : alpha(theme.custom.status.found.main, 0.22)}`,
            boxShadow: isDark ? `0 0 12px ${alpha(theme.custom.status.found.main, 0.25)}` : 'none',
            color: theme.custom.status.found.main,
            borderRadius: '50%',
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;