import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { TrendingUpOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import { TrendingItemSkeleton } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import RecentPosts from "./RecentPosts";

// Shared chrome for the section — mirrors LeftSide's "Statistics" panel so
// the two halves of the dashboard header read as one paired system.
const SectionPanel = ({ isMobile, children }) => {
  const theme = useTheme();
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
      {children}
    </Box>
  );
};

const SectionTitle = ({ isMobile, children }) => {
  const theme = useTheme();
  return (
    <Box mb={isMobile ? 2 : 3} sx={{ textAlign: "center" }}>
      <Typography
        variant="h5"
        fontWeight="700"
        sx={{
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          color: theme.custom.color.ink,
          mb: 1,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

// Resolves the FOUND/LOST type string RecentPosts expects from whichever
// shape the trending aggregation returned (Floptions.code or floptionName).
const resolveType = (item) => {
  const code = item?.Floptions?.code || item?.floptionName;
  return code && code.toUpperCase() === "LOST" ? "lost" : "found";
};

const TrendingItem = ({ trend, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  const trendItems = useMemo(() => {
    const list = Array.isArray(trend) ? trend : trend ? [trend] : [];
    return list.filter((item) => item && item._id).slice(0, 3);
  }, [trend]);

  if (isLoading) {
    return (
      <SectionPanel isMobile={isMobile}>
        <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>
        <TrendingItemSkeleton />
      </SectionPanel>
    );
  }

  if (trendItems.length === 0) {
    return (
      <SectionPanel isMobile={isMobile}>
        <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 1.5,
            p: 4,
            minHeight: 220,
            borderRadius: `${theme.custom.radius.lg}px`,
            border: `1px dashed ${alpha(theme.custom.color.ink, 0.15)}`,
          }}
        >
          <TrendingUpOutlined sx={{ fontSize: 44, color: alpha(theme.custom.color.ink, 0.25) }} />
          <Typography sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
            {t("noTrendingItems")}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.6), maxWidth: 280 }}>
            {t("noTrendingItemsDescription")}
          </Typography>
        </Box>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel isMobile={isMobile}>
      <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>

      {/* 3-up row of the latest posts — layout only borrowed from the
          reference mock (badge-over-image, cards laid out side by side);
          the card itself is RecentPosts, same as the dashboard's Recent
          Founds/Losts panels, so the two sections share one visual language. */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gap: isMobile ? 1.5 : 2,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: `repeat(${trendItems.length}, 1fr)` },
        }}
      >
        {trendItems.map((item, index) => (
          <Box
            key={item._id}
            sx={{
              gridColumn: {
                xs: trendItems.length % 2 === 1 && index === trendItems.length - 1 ? "1 / -1" : "auto",
                md: "auto",
              },
            }}
          >
            <RecentPosts type={resolveType(item)} {...item} />
          </Box>
        ))}
      </Box>
    </SectionPanel>
  );
};

export default TrendingItem;
