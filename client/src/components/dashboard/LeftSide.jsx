import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import FoundLostStrip from "./FoundLostStrip";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
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

  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const hairlineStrong = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  const baseCardSx = {
    backgroundColor: theme.custom.color.surfaceRaised,
    border: `1px solid ${hairline}`,
    boxShadow: theme.custom.elevation.e1,
    borderRadius: "12px",
    position: "relative",
    overflow: "hidden",
  };

  const foundLostCardSx = {
    ...baseCardSx,
  };

  const totalBoxCardSx = {
    ...baseCardSx,
    padding: isMobile ? "1.1rem 1.2rem" : "1.35rem 1.4rem",
    cursor: "default",
    "&:hover": { transform: "none", boxShadow: theme.custom.elevation.e1 },
  };

  const returnedBoxCardSx = {
    ...baseCardSx,
    padding: isMobile ? "1.1rem 1.2rem" : "1.35rem 1.4rem",
    cursor: "default",
    "&:hover": { transform: "none", boxShadow: theme.custom.elevation.e1 },
  };

  return (
    <Box
      data-reveal="hero"
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: theme.custom.color.surfaceRaised,
        border: `1px solid ${hairline}`,
        borderRadius: "16px",
        boxShadow: theme.custom.elevation.e1,
        color: ink,
        padding: isMobile ? "1.35rem 1rem 1.4rem" : "1.75rem 1.75rem 1.6rem",
        width: "100%",
        mx: 0,
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <Box
        data-reveal-item=""
        sx={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          direction: currentLanguage === "ar" ? "rtl" : "ltr",
          mb: isMobile ? 1.75 : 2,
        }}
      >
        <Typography
          sx={{
            fontFamily: theme.custom.font.display,
            fontWeight: 650,
            fontSize: { xs: "14.5px", sm: "15px" },
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            color: ink,
          }}
        >
          {t('statistics')}
        </Typography>
        <Typography
          sx={{
            fontFamily: theme.custom.font.body,
            fontWeight: 450,
            fontSize: "12px",
            lineHeight: 1.4,
            color: muted,
            mt: 0.5,
          }}
        >
          {t('sinceLastMonth') || "Updated today"}
        </Typography>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: { xs: 1, sm: 1.1 },
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
            fontFamily: theme.custom.font.body,
            color: muted,
            fontSize: "12.5px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
          valueStyle={{
            fontFamily: theme.custom.font.display,
            color: ink,
            fontSize: { xs: "1.55rem", sm: "1.7rem" },
            fontWeight: 700,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
          descriptionStyle={{
            fontFamily: theme.custom.font.body,
            color: muted,
            fontSize: "12px",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
          iconStyle={{
            background: alpha(theme.custom.color.brandPrimary, isDark ? 0.12 : 0.08),
            border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.18 : 0.12)}`,
            boxShadow: "none",
            color: theme.custom.color.brandPrimary,
            borderRadius: "8px",
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
            fontFamily: theme.custom.font.body,
            color: muted,
            fontSize: "12.5px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
          valueStyle={{
            fontFamily: theme.custom.font.display,
            color: ink,
            fontSize: { xs: "1.55rem", sm: "1.7rem" },
            fontWeight: 700,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
          descriptionStyle={{
            fontFamily: theme.custom.font.body,
            color: muted,
            fontSize: "12px",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
          iconStyle={{
            background: alpha(theme.custom.status.found.main, isDark ? 0.12 : 0.08),
            border: `1px solid ${alpha(theme.custom.status.found.main, isDark ? 0.18 : 0.12)}`,
            boxShadow: "none",
            color: theme.custom.status.found.main,
            borderRadius: "8px",
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;
