import React, { useState, useEffect, useMemo } from "react";
import TotalBox from "../TotalBox";
import FoundLostStrip from "./FoundLostStrip";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TimelineOutlined, LayersOutlined, AssignmentTurnedInOutlined } from "@mui/icons-material";
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

  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.88)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  // Modern SaaS nested secondary surface styling with refined transparency and no shadow
  const nestedCardSx = {
    backgroundColor: isDark ? "rgba(39, 39, 42, 0.45)" : "rgba(248, 250, 252, 0.75)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.88)"}`,
    borderRadius: { xs: "14px", sm: "16px" },
    boxShadow: "none",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const foundLostCardSx = {
    ...nestedCardSx,
    boxShadow: "none",
    "&:hover": {
      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.14)",
      backgroundColor: isDark ? "rgba(39, 39, 44, 0.65)" : "rgba(255, 255, 255, 0.90)",
      boxShadow: "none",
    },
  };

  const totalBoxCardSx = {
    ...nestedCardSx,
    minHeight: { xs: "114px", sm: "118px", md: "122px" },
    p: { xs: "18px 18px", sm: "18px 20px", md: "20px 22px" },
    cursor: "default",
    boxShadow: "none",
    "&:hover": {
      transform: "translateY(-1px)",
      borderColor: isDark
        ? alpha(theme.custom.color.brandPrimary, 0.36)
        : alpha(theme.custom.color.brandPrimary, 0.30),
      backgroundColor: isDark ? "rgba(39, 39, 44, 0.65)" : "rgba(255, 255, 255, 0.90)",
      boxShadow: "none",
      "& .total-box-icon": {
        transform: "scale(1.06)",
      },
    },
    "&:active": {
      transform: "translateY(0)",
    },
  };

  const returnedBoxCardSx = {
    ...nestedCardSx,
    minHeight: { xs: "114px", sm: "118px", md: "122px" },
    p: { xs: "18px 18px", sm: "18px 20px", md: "20px 22px" },
    cursor: "default",
    boxShadow: "none",
    "&:hover": {
      transform: "translateY(-1px)",
      borderColor: isDark
        ? alpha(theme.custom.status.found.main, 0.40)
        : alpha(theme.custom.status.found.main, 0.32),
      backgroundColor: isDark ? "rgba(39, 39, 44, 0.65)" : "rgba(255, 255, 255, 0.90)",
      boxShadow: "none",
      "& .total-box-icon": {
        transform: "scale(1.06)",
      },
    },
    "&:active": {
      transform: "translateY(0)",
    },
  };

  return (
    <Box
      data-reveal="hero"
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.45)" : "rgba(255, 255, 255, 0.50)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.85)"}`,
        borderRadius: { xs: "18px", sm: "20px", md: "22px" },
        boxShadow: "none",
        color: ink,
        p: { xs: "20px", sm: "20px", md: "24px" }, // Generous card padding (p-5 md:p-6)
        width: "100%",
        mx: 0,
        maxWidth: "100%",
        minWidth: 0,
        transition: "border-color 0.2s ease",
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
          mb: { xs: 2, sm: 2.25, md: 2.5 },
          direction: currentLanguage === "ar" ? "rtl" : "ltr",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.25, sm: 1.5 },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 44, md: 38 },
              height: { xs: 44, md: 38 },
              minWidth: { xs: 44, md: 38 },
              minHeight: { xs: 44, md: 38 },
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: alpha(theme.custom.color.brandPrimary, isDark ? 0.16 : 0.08),
              border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.28 : 0.16)}`,
              color: theme.custom.color.brandPrimary,
              boxShadow: "none",
              transition: "transform 0.2s ease",
            }}
          >
            <TimelineOutlined sx={{ fontSize: { xs: 22, md: 20 } }} />
          </Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
              fontWeight: 700,
              fontSize: { xs: "1.125rem", sm: "1.1875rem", md: "1.25rem" }, // 18px mobile, md:text-xl (20px) desktop
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              color: ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {t('statistics')}
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
          gap: { xs: 1.5, sm: 1.5, md: 1.75 },
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
          icon={<LayersOutlined sx={{ fontSize: { xs: 20, md: 19 } }} />}
          iconStyle={{
            background: alpha(theme.custom.color.brandPrimary, isDark ? 0.16 : 0.08),
            border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.28 : 0.16)}`,
            boxShadow: "none",
            color: theme.custom.color.brandPrimary,
            borderRadius: "11px",
            width: "38px",
            height: "38px",
            minWidth: "38px",
            minHeight: "38px",
          }}
          sx={totalBoxCardSx}
          titleStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: muted,
            fontSize: { xs: "16px", sm: "16px", md: "15px" }, // 16px on mobile (text-base), clean md:text-base/sm on desktop
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          valueStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: ink,
            fontSize: { xs: "1.875rem", sm: "2rem", md: "2.125rem" },
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
          }}
        />

        <TotalBox
          data-reveal-item=""
          countUp
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          icon={<AssignmentTurnedInOutlined sx={{ fontSize: { xs: 20, md: 19 } }} />}
          iconStyle={{
            background: alpha(theme.custom.status.found.main, isDark ? 0.16 : 0.08),
            border: `1px solid ${alpha(theme.custom.status.found.main, isDark ? 0.28 : 0.16)}`,
            boxShadow: "none",
            color: theme.custom.status.found.main,
            borderRadius: "11px",
            width: "38px",
            height: "38px",
            minWidth: "38px",
            minHeight: "38px",
          }}
          sx={returnedBoxCardSx}
          titleStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: muted,
            fontSize: { xs: "16px", sm: "16px", md: "15px" }, // 16px on mobile (text-base), clean md:text-base/sm on desktop
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          valueStyle={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            color: ink,
            fontSize: { xs: "1.875rem", sm: "2rem", md: "2.125rem" },
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;

