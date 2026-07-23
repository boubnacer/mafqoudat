import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { DashboardEmptyStates, RecentItemsSkeleton } from "../LoadingStates";
import Recent from "./Recent";
import SeeAll from "./SeeAll";

// Paired panel for "Recent Founds" / "Recent Losts". Mirrors the same
// blurred-gradient surfaceRaised shell used by LeftSide/TrendingItem above it
// in Dash.js, so the stats row and this row read as one system, with a
// status-tone accent to distinguish the two halves of the pair.
const RecentSection = ({ type, items, totalItems, isLoading, onCreatePost, foundOrlostId }) => {
  const theme = useTheme();
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: "blur(10px)",
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.08 : 0.15)}`,
        padding: isMobile ? "1.5rem" : "2rem",
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: isMobile ? 2 : 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Icon sx={{ color: tone.main, fontSize: { xs: 24, sm: 28 }, flexShrink: 0 }} />
          <Typography
            variant="h5"
            fontWeight="700"
            sx={{
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.65rem" },
              color: theme.custom.color.ink,
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
  );
};

export default RecentSection;
