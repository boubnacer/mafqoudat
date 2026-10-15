import React from "react";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { DashboardEmptyStates, RecentItemsSkeleton } from "../LoadingStates";
import Recent from "./Recent";
import SeeAll from "./SeeAll";

// Paired panel container for "Recent Founds" / "Recent Losts".
// Matches the Cyber-Obsidian / Light Frosted Glass aesthetics of GuidedSearchDialog.jsx & QuickActions.jsx,
// without an outer border.
const RecentSection = ({ type, items, totalItems, isLoading, onCreatePost, foundOrlostId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  const tone = type === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const Icon = type === "found" ? TaskAltOutlined : SearchOffOutlined;
  const title = type === "found" ? t("recentFounds") : t("recentLosts");
  const EmptyStateComponent = type === "found"
    ? DashboardEmptyStates.NoRecentFounds
    : DashboardEmptyStates.NoRecentLosts;

  const hasItems = !isLoading && items && items.length > 0;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "rgba(16, 25, 44, 0.88)" : "#F1F5F9",
        backdropFilter: "blur(20px) saturate(1.15)",
        WebkitBackdropFilter: "blur(20px) saturate(1.15)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,0.9)"}`,
        borderRadius: isMobile ? `${theme.custom.radius.sm}px` : `${theme.custom.radius.md}px`,
        padding: isMobile ? { xs: "1.25rem 1rem", sm: "1.5rem 1.25rem" } : "1.75rem 2rem",
        boxShadow: "none",
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Header with Icon Circle Bubble & Section Title */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: isMobile ? 2 : 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 42, sm: 48 },
                height: { xs: 42, sm: 48 },
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "#ffffff",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid rgba(226, 232, 240, 0.9)",
                flexShrink: 0,
                boxShadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.25)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Icon sx={{ color: tone.main, fontSize: { xs: 22, sm: 26 } }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight="700"
              sx={{
                fontFamily: theme.custom.font.display,
                fontSize: { xs: "1.25rem", sm: "1.45rem", md: "1.65rem" },
                color: isDark ? "#ffffff" : "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>
          </Box>
          {hasItems && <SeeAll foundOrlostId={foundOrlostId} totalItems={totalItems} type={type} />}
        </Box>

        {isLoading ? (
          <RecentItemsSkeleton />
        ) : hasItems ? (
          <Recent recent={items} type={type} maxItems={2} />
        ) : (
          <EmptyStateComponent onCreatePost={onCreatePost} />
        )}
      </Box>
    </Box>
  );
};

export default RecentSection;
