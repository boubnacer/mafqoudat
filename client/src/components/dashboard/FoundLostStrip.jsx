import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts up from 0 to `target` once per mount/refetch — the hero numbers are
// the most load-bearing figures on the dashboard, worth a small flourish.
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
  const isDark = theme.palette.mode === 'dark';
  const displayValue = useCountUp(value);

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
        p: { xs: 2, sm: 3 },
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        outline: "none",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onClick ? {
          backgroundColor: isDark ? alpha(tone.main, 0.08) : alpha(tone.main, 0.05),
          "& .segment-icon-circle": {
            transform: "scale(1.08)",
            backgroundColor: isDark ? alpha(tone.main, 0.25) : alpha(tone.main, 0.18),
            borderColor: isDark ? alpha(tone.main, 0.5) : alpha(tone.main, 0.4),
          },
        } : undefined,
        "&:focus-visible": { outline: 'none' },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, width: '100%' }}>
        <Box
          className="segment-icon-circle"
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: isDark ? alpha(tone.main, 0.15) : alpha(tone.main, 0.10),
            border: `1px solid ${isDark ? alpha(tone.main, 0.35) : alpha(tone.main, 0.22)}`,
            boxShadow: isDark ? `0 0 12px ${alpha(tone.main, 0.25)}` : 'none',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: 'all 0.25s ease',
          }}
        >
          <Icon sx={{ fontSize: 20, color: tone.main }} />
        </Box>
        <Typography
          sx={{
            fontFamily: theme.custom.font.display,
            fontWeight: 700,
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
            color: isDark ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.01em',
            minWidth: 0,
            flex: 1,
            lineHeight: 1.25,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {label}
        </Typography>
        {hasNotification && (
          <Box
            sx={{
              width: 8,
              height: 8,
              flexShrink: 0,
              borderRadius: "50%",
              backgroundColor: tone.main,
              boxShadow: `0 0 8px ${tone.main}`,
              animation: "flStripPulse 2s ease-in-out infinite",
              "@keyframes flStripPulse": {
                "0%, 100%": { opacity: 1, transform: "scale(1)" },
                "50%": { opacity: 0.5, transform: "scale(1.3)" },
              },
            }}
          />
        )}
      </Box>

      <Typography
        sx={{
          fontFamily: theme.custom.font.display,
          fontWeight: 700,
          fontSize: { xs: "2rem", sm: "2.25rem" },
          lineHeight: 1.1,
          color: tone.main,
          fontVariantNumeric: "tabular-nums",
          textShadow: isDark ? `0 0 20px ${alpha(tone.main, 0.25)}` : 'none',
        }}
      >
        {displayValue}
      </Typography>

      <Typography
        sx={{
          fontFamily: theme.custom.font.body,
          fontSize: { xs: "0.85rem", sm: "0.875rem" },
          fontWeight: 500,
          color: isDark ? '#94a3b8' : '#475569',
          whiteSpace: 'nowrap',
        }}
      >
        {todayLabel}
      </Typography>
    </Box>
  );
};

// Found and Lost aren't independent metrics — they're two halves of the same
// duality the whole product is built on. Rendering them as one connected
// strip (instead of two identical cards) carries that relationship.
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
  const isDark = theme.palette.mode === 'dark';
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";

  return (
    <Box
      {...rest}
      sx={{
        gridColumn: "1 / -1",
        borderRadius: `${theme.custom.radius.lg}px`,
        background: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.82)',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.82)',
        backgroundImage: 'none',
        border: 'none',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : '0 4px 18px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        overflow: "hidden",
        position: 'relative',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: isRTL ? "row-reverse" : "row" },
        }}
      >
        <Segment
          tone={theme.custom.status.found}
          Icon={TaskAltOutlined}
          label={t("foundItems")}
          value={totalFounds}
          todayLabel={`+ ${foundsToday} ${t("today")}`}
          hasNotification={showFoundNotification}
          onClick={onFoundClick}
        />
        <Box
          sx={{
            alignSelf: "stretch",
            width: { xs: "100%", sm: "1px" },
            height: { xs: "1px", sm: "auto" },
            backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)',
            flexShrink: 0,
          }}
        />
        <Segment
          tone={theme.custom.status.lost}
          Icon={SearchOffOutlined}
          label={t("lostItems")}
          value={totalLosts}
          todayLabel={`+ ${lostsToday} ${t("today")}`}
          hasNotification={showLostNotification}
          onClick={onLostClick}
        />
      </Box>
    </Box>
  );
};

export default FoundLostStrip;
