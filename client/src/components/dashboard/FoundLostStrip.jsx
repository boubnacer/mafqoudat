import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
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

const Segment = ({ tone, Icon, label, value, todayLabel, hasNotification, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const displayValue = useCountUp(value);
  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)";
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
        p: { xs: 1.75, sm: 2 },
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        outline: "none",
        borderRadius: "10px",
        transition: "background-color 160ms ease",
        "&:hover": onClick ? { backgroundColor: alpha(tone.main, isDark ? 0.07 : 0.04) } : undefined,
        "&:focus-visible": { boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}, 0 0 0 4px ${alpha(theme.custom.color.brandPrimary, 0.35)}` },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "8px",
            backgroundColor: alpha(tone.main, isDark ? 0.14 : 0.08),
            border: `1px solid ${alpha(tone.main, isDark ? 0.18 : 0.12)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 15, color: tone.main }} />
        </Box>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "12.5px",
            letterSpacing: "-0.01em",
            color: muted,
            minWidth: 0,
            flex: 1,
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
        {hasNotification && (
          <Box sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: "50%", backgroundColor: tone.main, boxShadow: `0 0 0 4px ${alpha(tone.main, 0.14)}` }} />
        )}
      </Box>

      <Typography
        sx={{
          fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
          fontWeight: 600,
          fontSize: { xs: "1.6rem", sm: "1.8rem" },
          lineHeight: 1,
          color: theme.custom.color.ink,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.025em",
        }}
      >
        {displayValue.toLocaleString()}
      </Typography>

      <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "11.5px", fontWeight: 500, color: muted, lineHeight: 1 }}>
        {todayLabel}
      </Typography>
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
  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";

  return (
    <Box
      {...rest}
      sx={{
        gridColumn: "1 / -1",
        borderRadius: "14px",
        backgroundColor: theme.custom.color.surfaceNested,
        border: `1px solid ${hairline}`,
        boxShadow: "none",
        overflow: "hidden",
        p: 0.5,
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: isRTL ? "row-reverse" : "row" }, gap: 0.5 }}>
        <Segment
          tone={theme.custom.status.found}
          Icon={TaskAltOutlined}
          label={t("foundItems")}
          value={totalFounds}
          todayLabel={`+${foundsToday} ${t("today")}`}
          hasNotification={showFoundNotification}
          onClick={onFoundClick}
        />
        <Box sx={{ alignSelf: "stretch", width: { xs: "100%", sm: "1px" }, height: { xs: "1px", sm: "auto" }, backgroundColor: hairline, flexShrink: 0, mx: { xs: 1.5, sm: 0 } }} />
        <Segment
          tone={theme.custom.status.lost}
          Icon={SearchOffOutlined}
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
