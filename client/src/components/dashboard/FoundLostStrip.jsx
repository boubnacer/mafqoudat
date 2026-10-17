import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { useTranslation } from "../../utils/translations";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const useCountUp = (target, duration = 700) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
};

const Segment = ({ tone, label, value, todayLabel, hasNotification, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const displayValue = useCountUp(value);
  const muted = isDark ? "#94A3B8" : "#64748B";

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        flex: 1,
        minWidth: 0,
        p: { xs: "18px 18px", sm: "18px 20px", md: "20px 22px" },
        minHeight: { xs: "56px", sm: "56px", md: "48px" },
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1.25, sm: 1.25, md: 1.25 },
        outline: "none",
        borderRadius: "12px",
        transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onClick ? {
          backgroundColor: alpha(tone.main, isDark ? 0.09 : 0.05),
        } : undefined,
        "&:focus-visible": {
          boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}, 0 0 0 4px ${alpha(theme.custom.color.brandPrimary, 0.35)}`,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, width: "100%" }}>
        {/* Crisp dot / indicator accent */}
        <Box
          sx={{
            width: { xs: 9, md: 8 },
            height: { xs: 9, md: 8 },
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: tone.main,
            boxShadow: `0 0 0 3px ${alpha(tone.main, isDark ? 0.28 : 0.18)}`,
          }}
        />
        <Typography
          sx={{
            fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
            fontWeight: 600,
            fontSize: { xs: "16px", sm: "16px", md: "14px" }, // 16px mobile (text-base), md:text-sm desktop
            letterSpacing: "-0.01em",
            color: muted,
            minWidth: 0,
            flex: 1,
            lineHeight: 1.25,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
          fontWeight: 700,
          fontSize: { xs: "1.875rem", sm: "2rem", md: "2.125rem" },
          lineHeight: 1.1,
          color: theme.custom.color.ink,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          mt: { xs: 0.5, sm: 0.75, md: 0.75 },
        }}
      >
        {displayValue.toLocaleString()}
      </Typography>

      {/* Soft tonal badge fill for today's count */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: { xs: 1.25, md: 1 },
          py: { xs: 0.35, md: 0.2 },
          borderRadius: "999px",
          backgroundColor: hasNotification
            ? alpha(tone.main, isDark ? 0.22 : 0.12)
            : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.04)"),
          border: `1px solid ${hasNotification
            ? alpha(tone.main, isDark ? 0.38 : 0.24)
            : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.85)")}`,
          width: "fit-content",
          minHeight: { xs: "28px", md: "24px" },
          transition: "all 0.2s ease",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: { xs: "14px", sm: "14px", md: "12.5px" }, // 14px mobile (text-sm), md:text-xs desktop
            fontWeight: hasNotification ? 700 : 500,
            color: hasNotification
              ? tone.main
              : muted,
            lineHeight: 1.2,
          }}
        >
          {todayLabel}
        </Typography>
      </Box>
    </Box>
  );
};

const FoundLostStrip = ({
  totalFounds = 0,
  totalLosts = 0,
  foundsToday = 0,
  lostsToday = 0,
  showFoundNotification = false,
  showLostNotification = false,
  onFoundClick,
  onLostClick,
  sx,
  ...rest
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";
  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.88)";

  return (
    <Box
      {...rest}
      sx={{
        gridColumn: "1 / -1",
        borderRadius: { xs: "14px", sm: "16px" },
        backgroundColor: isDark ? "rgba(39, 39, 42, 0.45)" : "rgba(248, 250, 252, 0.75)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.88)"}`,
        boxShadow: "none",
        overflow: "hidden",
        p: 0.5,
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: isRTL ? "row-reverse" : "row" }, gap: 0.5 }}>
        <Segment
          tone={theme.custom.status.found}
          label={t("foundItems")}
          value={totalFounds}
          todayLabel={`+${foundsToday} ${t("today")}`}
          hasNotification={showFoundNotification}
          onClick={onFoundClick}
        />
        <Box sx={{ alignSelf: "stretch", width: { xs: "100%", sm: "1px" }, height: { xs: "1px", sm: "auto" }, backgroundColor: hairline, flexShrink: 0, mx: { xs: 1.5, sm: 0 } }} />
        <Segment
          tone={theme.custom.status.lost}
          label={t("lostItems")}
          value={totalLosts}
          todayLabel={`+${lostsToday} ${t("today")}`}
          hasNotification={showLostNotification}
          onClick={onLostClick}
        />
      </Box>
    </Box>
  );
};

export default FoundLostStrip;
