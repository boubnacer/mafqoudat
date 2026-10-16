import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import RecentPosts from "./RecentPosts";

const Recent = ({ recent, type, maxItems }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isLargeScreen = useMediaQuery("(min-width:1920px)");

  if (!recent || recent.length === 0) return null;

  // Handle responsive maxItems
  let itemsLimit;
  if (typeof maxItems === "object" && maxItems !== null) {
    if (isLargeScreen && maxItems.xxl !== undefined) {
      itemsLimit = maxItems.xxl;
    } else if (isMobile) {
      itemsLimit = maxItems.xs || maxItems.sm;
    } else {
      itemsLimit = maxItems.sm || maxItems.md || maxItems.lg || maxItems.xl;
    }
  } else {
    itemsLimit = maxItems;
  }

  const displayItems = itemsLimit ? recent.slice(0, itemsLimit) : recent;

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: { xs: 1.5, sm: 2 },
        alignItems: "stretch",
      }}
    >
      {displayItems.map((post) => (
        <RecentPosts key={post._id} type={type} {...post} />
      ))}
    </Box>
  );
};

export default Recent;
