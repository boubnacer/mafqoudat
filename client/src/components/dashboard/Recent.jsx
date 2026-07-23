import { Box, useMediaQuery } from "@mui/material";
import React from "react";
import RecentPosts from "./RecentPosts";

const Recent = ({ recent, type, maxItems }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isLargeScreen = useMediaQuery("(min-width:1920px)");

  if (!recent || recent.length === 0) return null;

  // Handle responsive maxItems
  let itemsLimit;
  if (typeof maxItems === 'object' && maxItems !== null) {
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
      width="100%"
      display="grid"
      gap={2}
      sx={{
        // Found/Lost panels sit side-by-side from `md` up (see RecentSection's
        // parent grid in Dash.js), so each panel only ever gets ~half the
        // viewport width there — 2 columns still reads fine. Below `sm` each
        // panel is already full-width and stacked, but squeezing 2 cards into
        // that single narrow column made every card (image + text) tiny, so
        // stack to 1 column there instead — same 2 posts, just full-width and
        // legible.
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      }}
    >
      {displayItems.map((post) => (
        <RecentPosts key={post._id} type={type} {...post} />
      ))}
    </Box>
  );
};

export default Recent;
