import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { DashboardEmptyStates, RecentItemsSkeleton } from "../LoadingStates";
import Recent from "./Recent";
import SeeAll from "./SeeAll";

const RecentSection = ({ type, items, totalItems, isLoading, onCreatePost, foundOrlostId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();

  const tone = type === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const Icon = type === "found" ? TaskAltOutlined : SearchOffOutlined;
  const title = type === "found" ? t("recentFounds") : t("recentLosts");
  const EmptyStateComponent =
    type === "found" ? DashboardEmptyStates.NoRecentFounds : DashboardEmptyStates.NoRecentLosts;

  const hasItems = !isLoading && items && items.length > 0;
  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.custom.color.surfaceRaised,
        border: `1px solid ${hairline}`,
        borderRadius: "16px",
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          px: { xs: 1.75, sm: 2 },
          py: 1.65,
          borderBottom: `1px solid ${hairline}`,
          minHeight: 56,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: alpha(tone.main, isDark ? 0.16 : 0.1),
              border: `1px solid ${alpha(tone.main, isDark ? 0.22 : 0.14)}`,
              color: tone.main,
            }}
          >
            <Icon sx={{ fontSize: 16 }} />
          </Box>
          <Typography
            sx={{
              fontFamily: theme.custom.font.body,
              fontWeight: 650,
              fontSize: { xs: "14px", sm: "14.5px" },
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              color: ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </Typography>
          {typeof totalItems === "number" && totalItems > 0 && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                px: 0.85,
                borderRadius: "999px",
                backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)",
                border: `1px solid ${hairline}`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: 1,
                  color: muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalItems}
              </Typography>
            </Box>
          )}
        </Box>
        {hasItems && <SeeAll foundOrlostId={foundOrlostId} totalItems={totalItems} type={type} />}
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: { xs: 1.5, sm: 1.75 },
          gap: 0,
        }}
      >
        {isLoading ? (
          <RecentItemsSkeleton />
        ) : hasItems ? (
          <Recent recent={items} type={type} maxItems={2} />
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 2 }}>
            <EmptyStateComponent onCreatePost={onCreatePost} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentSection;
