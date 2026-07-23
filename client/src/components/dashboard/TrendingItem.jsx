import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
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

// Flex-grow shares for the "tall"/"short" card in a masonry column — not a
// literal ratio, just enough of a size difference to read as staggered.
const TALL_FLEX = 3;
const SHORT_FLEX = 2;

const TrendingItem = ({ trend, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  const trendItems = useMemo(() => {
    const list = Array.isArray(trend) ? trend : trend ? [trend] : [];
    return list.filter((item) => item && item._id).slice(0, 6);
  }, [trend]);

  // Desktop layout: 3 masonry columns (row-major fill, same order the old
  // grid auto-placement used), each column its own flex stack of up to 2
  // cards. Even columns go tall-then-short, odd columns short-then-tall, so
  // the row reads as a zigzag instead of a flat grid — same total column
  // height either way, since the tall/short flex shares just swap position.
  const columns = useMemo(() => {
    const cols = [[], [], []];
    trendItems.forEach((item, index) => cols[index % 3].push(item));
    return cols.filter((col) => col.length > 0);
  }, [trendItems]);

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

  // Mobile: LeftSide/TrendingItem stack vertically instead of sharing a
  // stretched row (see Dash.js), so there's no fixed height to match here —
  // fall back to a plain 2-up grid of normal aspect-ratio poster cards.
  if (isMobile) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
          {trendItems.map((item, index) => (
            <Box
              key={item._id}
              sx={{
                gridColumn: trendItems.length % 2 === 1 && index === trendItems.length - 1 ? "1 / -1" : "auto",
              }}
            >
              <RecentPosts type={resolveType(item)} {...item} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* No panel chrome here — the cards themselves (RecentPosts, same DNA
          as the dashboard's Recent Founds/Losts) carry the visual weight,
          sitting directly inline next to LeftSide's boxed stats panel. Each
          of the 3 columns is its own flex stack of up to 2 fillHeight cards
          (tall/short alternating per column) so the whole row's total height
          always matches LeftSide's, however the individual cards stagger. */}
      <Box sx={{ flex: 1, display: "flex", gap: 3 }}>
        {columns.map((columnItems, colIndex) => (
          <Box key={colIndex} sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {columnItems.map((item, rowIndex) => {
              const tallFirst = colIndex % 2 === 0;
              const isTall = columnItems.length === 1 || (tallFirst ? rowIndex === 0 : rowIndex === 1);
              return (
                <Box key={item._id} sx={{ flex: isTall ? TALL_FLEX : SHORT_FLEX, minHeight: 0 }}>
                  <RecentPosts type={resolveType(item)} {...item} fillHeight />
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TrendingItem;
