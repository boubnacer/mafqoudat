import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import FoundLostStrip from "./FoundLostStrip";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TimelineOutlined } from "@mui/icons-material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

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
  const isMobile = useMediaQuery("(max-width:600px)");

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

  useEffect(() => {
    const syncNotifications = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayKey = getTodayKey();
        const keysToRemove = [];
        const todayValue = localStorage.getItem(todayKey);
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('viewedNotifications_')) {
            const date = key.replace('viewedNotifications_', '');
            if (date !== today) {
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach(key => {
          if (key !== todayKey) {
            localStorage.removeItem(key);
          }
        });
        if (todayValue && !localStorage.getItem(todayKey)) {
          localStorage.setItem(todayKey, todayValue);
        }
        const currentViewed = getViewedNotifications();
        const storedValue = localStorage.getItem(todayKey);
        if (storedValue === null && todayValue !== null) {
          localStorage.setItem(todayKey, todayValue);
          const restored = JSON.parse(todayValue);
          setViewedNotifications(restored);
        } else {
          setViewedNotifications(currentViewed);
        }
      } catch (error) {
        console.error('❌ Error syncing notifications:', error);
        try {
          setViewedNotifications(getViewedNotifications());
        } catch (e) {
          setViewedNotifications({});
        }
      }
    };
    syncNotifications();
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('viewedNotifications_')) {
        syncNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const handleFocus = () => {
      syncNotifications();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const currentViewed = getViewedNotifications();
    setViewedNotifications(prev => {
      const newState = {
        foundCount: currentViewed.foundCount ?? prev.foundCount ?? 0,
        lostCount: currentViewed.lostCount ?? prev.lostCount ?? 0,
      };
      if (prev.foundCount !== newState.foundCount || prev.lostCount !== newState.lostCount) {
        return newState;
      }
      return prev;
    });
  }, [foundsToday, lostsToday]);

  const showFoundNotification = useMemo(() => {
    const currentCount = foundsToday || 0;
    const viewedCount = (viewedNotifications.foundCount !== undefined && viewedNotifications.foundCount !== null)
      ? viewedNotifications.foundCount
      : 0;
    return currentCount >= 1 && currentCount > viewedCount;
  }, [foundsToday, viewedNotifications.foundCount]);

  const showLostNotification = useMemo(() => {
    const currentCount = lostsToday || 0;
    const viewedCount = (viewedNotifications.lostCount !== undefined && viewedNotifications.lostCount !== null)
      ? viewedNotifications.lostCount
      : 0;
    return currentCount >= 1 && currentCount > viewedCount;
  }, [lostsToday, viewedNotifications.lostCount]);

  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  // Google SaaS nested secondary surface styling
  const nestedCardSx = {
    backgroundColor: theme.custom.color.surfaceNested,
    background: theme.custom.color.surfaceNested,
    border: `1px solid ${hairline}`,
    borderRadius: "14px",
    boxShadow: "none",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s ease, background-color 0.2s ease",
  };

  const foundLostCardSx = {
    ...nestedCardSx,
  };

  const totalBoxCardSx = {
    ...nestedCardSx,
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    minHeight: { xs: "116px", sm: "128px" },
    p: isMobile ? "1.1rem 1.15rem" : "1.25rem 1.35rem",
    cursor: "default",
    "&:hover": {
      transform: "none",
      boxShadow: "none",
      borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(15, 23, 42, 0.12)",
    },
  };

  const returnedBoxCardSx = {
    ...nestedCardSx,
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    minHeight: { xs: "116px", sm: "128px" },
    p: isMobile ? "1.1rem 1.15rem" : "1.25rem 1.35rem",
    cursor: "default",
    "&:hover": {
      transform: "none",
      boxShadow: "none",
      borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(15, 23, 42, 0.12)",
    },
  };

  return (
    <Box
      data-reveal="hero"
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        backgroundColor: theme.custom.color.surfaceRaised,
        border: `1px solid ${hairline}`,
        borderRadius: { xs: "18px", sm: "20px" },
        boxShadow: isDark
          ? "0 4px 24px rgba(0, 0, 0, 0.25)"
          : "0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.04)",
        color: ink,
        p: isMobile ? "1.25rem 1rem 1.35rem" : "1.5rem 1.5rem",
        width: "100%",
        mx: 0,
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <Box
        data-reveal-item=""
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: { xs: 1.75, sm: 2 },
          direction: currentLanguage === "ar" ? "rtl" : "ltr",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: alpha(theme.custom.color.brandPrimary, isDark ? 0.16 : 0.08),
              border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.24 : 0.14)}`,
              color: theme.custom.color.brandPrimary,
            }}
          >
            <TimelineOutlined sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
              fontWeight: 600,
              fontSize: { xs: "15px", sm: "16px" },
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {t('statistics')}
          </Typography>
        </Box>

        {/* Timeframe pill badge */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            height: 24,
            px: 1.25,
            borderRadius: "999px",
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(15, 23, 42, 0.04)",
            border: `1px solid ${hairline}`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: theme.custom.status.found.main,
            }}
          />
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "11.5px",
              lineHeight: 1,
              color: muted,
              whiteSpace: "nowrap",
            }}
          >
            {t('sinceLastMonth') || "Updated today"}
          </Typography>
        </Box>
      </Box>

      {/* Grid of nested stat containers */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: { xs: 1.25, sm: 1.25 },
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

        <TotalBox
          data-reveal-item=""
          countUp
          title={t('totalItems')}
          value={totalPosts || 0}
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={totalBoxCardSx}
          titleStyle={{
            fontFamily: "'Inter', sans-serif",
            color: muted,
            fontSize: "12.5px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
          valueStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: ink,
            fontSize: { xs: "1.6rem", sm: "1.8rem" },
            fontWeight: 600,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.025em",
          }}
          descriptionStyle={{
            fontFamily: "'Inter', sans-serif",
            color: muted,
            fontSize: "11.5px",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
          iconStyle={{
            background: alpha(theme.custom.color.brandPrimary, isDark ? 0.16 : 0.08),
            border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.24 : 0.12)}`,
            boxShadow: "none",
            color: theme.custom.color.brandPrimary,
            borderRadius: "10px",
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
            fontFamily: "'Inter', sans-serif",
            color: muted,
            fontSize: "12.5px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
          valueStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: ink,
            fontSize: { xs: "1.6rem", sm: "1.8rem" },
            fontWeight: 600,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.025em",
          }}
          descriptionStyle={{
            fontFamily: "'Inter', sans-serif",
            color: muted,
            fontSize: "11.5px",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
          iconStyle={{
            background: alpha(theme.custom.status.found.main, isDark ? 0.16 : 0.08),
            border: `1px solid ${alpha(theme.custom.status.found.main, isDark ? 0.24 : 0.12)}`,
            boxShadow: "none",
            color: theme.custom.status.found.main,
            borderRadius: "10px",
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;
