import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { DashboardEmptyStates, RecentItemsSkeleton } from "../LoadingStates";
import Recent from "./Recent";
import SeeAll from "./SeeAll";
import CyberDotMatrix from "./CyberDotMatrix";

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
      data-reveal="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: "blur(10px)",
        border: 'none',
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : '20px',
        padding: isMobile ? { xs: "1.125rem 0.875rem", sm: "1.25rem 1rem" } : "1.65rem 1.75rem",
        boxShadow: 'none',
      }}
    >
      {/* Cyber dot matrix SVG background: classic circular dots for Recent Founds, new cyber star dots for Recent Losts */}
      {type === "found" ? (
        <CyberDotMatrix
          idPrefix={`dots-recent-${type}`}
          color={tone.main}
          inverted={false}
          hairlineGlow={false}
          zIndex={0}
        />
      ) : (
        <CyberDotMatrix
          idPrefix={`dots-recent-${type}`}
          color={tone.main}
          shape="star"
          placement="diagonal-standard"
          patternSpacing={5}
          dotRadius={0.85}
          glowRadius="48%"
          opacity={0.75}
          falloffCurve="soft"
          hairlineGlow={false}
          zIndex={0}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: isMobile ? 2 : 2.25,
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
    </Box>
  );
};

export default RecentSection;
