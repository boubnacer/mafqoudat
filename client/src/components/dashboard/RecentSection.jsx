import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";
import { DashboardEmptyStates, RecentItemsSkeleton } from "../LoadingStates";
import Recent from "./Recent";
import SeeAll from "./SeeAll";

const RecentSection = ({
  type,
  items,
  totalItems,
  isLoading,
  onCreatePost,
  foundOrlostId,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = currentLanguage === "ar" || isRTL(currentLanguage);

  const tone =
    type === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const title = type === "found" ? t("recentFounds") : t("recentLosts");
  const EmptyStateComponent =
    type === "found"
      ? DashboardEmptyStates.NoRecentFounds
      : DashboardEmptyStates.NoRecentLosts;

  const hasItems = !isLoading && items && items.length > 0;
  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.85)";
  const ink = theme.custom.color.ink;

  return (
    <Box
      data-reveal="card"
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.custom.color.surfaceRaised || (isDark ? "#18181B" : "#FFFFFF"),
        border: `1px solid ${hairline}`,
        borderRadius: { xs: "18px", sm: "20px", md: "22px" },
        boxShadow: isDark
          ? "0 4px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px -4px rgba(15, 23, 42, 0.05)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          px: { xs: "14px", sm: "20px", md: "24px" },
          py: { xs: "12px", md: "16px" },
          borderBottom: `1px solid ${hairline}`,
          minHeight: { xs: 50, md: 54 },
          direction: isRTLMode ? "rtl" : "ltr",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.25, sm: 1.5 },
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* Status Dot matching the "type: found/lost" field */}
          <Box
            sx={{
              width: { xs: 8, md: 8 },
              height: { xs: 8, md: 8 },
              borderRadius: "50%",
              backgroundColor: tone.main,
              boxShadow: `0 0 0 3px ${alpha(tone.main, isDark ? 0.3 : 0.2)}`,
              flexShrink: 0,
            }}
          />
          <Typography
            component="h2"
            sx={{
              fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
              fontWeight: 700,
              fontSize: { xs: "1.05rem", sm: "1.1875rem", md: "1.25rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              color: ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </Typography>
        </Box>
        {hasItems && (
          <SeeAll foundOrlostId={foundOrlostId} totalItems={totalItems} type={type} />
        )}
      </Box>

      {/* Body — Optimized padding so cards have generous width on mobile */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: { xs: "12px", sm: "16px", md: "24px" },
          gap: 0,
        }}
      >
        {isLoading ? (
          <RecentItemsSkeleton />
        ) : hasItems ? (
          <Recent recent={items} type={type} maxItems={2} />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: { xs: 3, md: 4 },
            }}
          >
            <EmptyStateComponent onCreatePost={onCreatePost} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentSection;
