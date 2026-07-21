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
        p: { xs: 2.5, sm: 3 },
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        outline: "none",
        transition: "background-color 0.2s ease",
        "&:hover": onClick ? { backgroundColor: alpha(tone.main, 0.06) } : undefined,
        "&:focus-visible": { boxShadow: `inset 0 0 0 2px ${tone.main}` },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: tone.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 18, color: tone.main }} />
        </Box>
        <Typography
          sx={{
            fontFamily: theme.custom.font.body,
            fontWeight: 600,
            fontSize: "0.95rem",
            color: theme.custom.color.ink,
          }}
        >
          {label}
        </Typography>
        {hasNotification && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: tone.main,
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
          lineHeight: 1,
          color: tone.main,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {displayValue}
      </Typography>

      <Typography
        sx={{
          fontFamily: theme.custom.font.body,
          fontSize: "0.8rem",
          color: alpha(theme.custom.color.ink, 0.6),
        }}
      >
        {todayLabel}
      </Typography>
    </Box>
  );
};

// Found and Lost aren't independent metrics — they're two halves of the same
// duality the whole product is built on. Rendering them as one connected
// strip with a proportional fill (instead of two identical cards) lets the
// shape itself carry the found:lost balance, not just the two numbers.
const FoundLostStrip = ({
  totalFounds = 0,
  totalLosts = 0,
  foundsToday = 0,
  lostsToday = 0,
  showFoundNotification = false,
  showLostNotification = false,
  onFoundClick,
  onLostClick,
}) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";

  const total = totalFounds + totalLosts;
  const foundPct = total > 0 ? (totalFounds / total) * 100 : 50;
  const lostPct = 100 - foundPct;

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        borderRadius: `${theme.custom.radius.lg}px`,
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: theme.custom.elevation.e1,
        overflow: "hidden",
        transition: "box-shadow 0.3s ease",
        "&:hover": { boxShadow: theme.custom.elevation.e2 },
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
            backgroundColor: alpha(theme.custom.color.ink, 0.08),
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

      <Box
        sx={{
          display: "flex",
          flexDirection: isRTL ? "row-reverse" : "row",
          height: 6,
          backgroundColor: alpha(theme.custom.color.ink, 0.06),
        }}
      >
        <Box
          sx={{
            flex: `0 0 ${foundPct}%`,
            backgroundColor: theme.custom.status.found.main,
            transition: "flex-basis 0.6s ease",
          }}
        />
        <Box
          sx={{
            flex: `0 0 ${lostPct}%`,
            backgroundColor: theme.custom.status.lost.main,
            transition: "flex-basis 0.6s ease",
          }}
        />
      </Box>
    </Box>
  );
};

export default FoundLostStrip;
