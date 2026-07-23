import { Box, Typography, useTheme, alpha } from "@mui/material";
import { TrendingUpOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import { TrendingItemSkeleton } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import RecentPosts from "./RecentPosts";

// Resolves the FOUND/LOST type string RecentPosts expects from whichever
// shape the trending aggregation returned (Floptions.code or floptionName).
const resolveType = (item) => {
  const code = item?.Floptions?.code || item?.floptionName;
  return code && code.toUpperCase() === "LOST" ? "lost" : "found";
};

const TrendingItem = ({ trend, isLoading }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const trendItems = useMemo(() => {
    const list = Array.isArray(trend) ? trend : trend ? [trend] : [];
    return list.filter((item) => item && item._id).slice(0, 3);
  }, [trend]);

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TrendingItemSkeleton />
      </Box>
    );
  }

  if (trendItems.length === 0) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* No panel chrome here — the cards themselves (RecentPosts, same DNA
          as the dashboard's Recent Founds/Losts) carry the visual weight,
          sitting directly inline next to LeftSide's boxed stats panel.
          fillHeight lets each card stretch to the row's full height instead
          of its usual fixed 3:4 aspect ratio, so this side visually matches
          LeftSide's stats panel height rather than leaving space below. */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gap: { xs: 2, md: 3 },
          alignItems: "stretch",
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
            <RecentPosts type={resolveType(item)} {...item} fillHeight />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TrendingItem;
