import { Box, useMediaQuery } from "@mui/material";
import React from "react";
import RecentPosts from "./RecentPosts";
import { RecentItemsSkeleton, DashboardEmptyStates } from "../LoadingStates";

const Recent = ({ recent, isLoading, emptyState = "NoRecentFounds", maxItems, sx }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  
  if (isLoading) return <RecentItemsSkeleton />;
  if (!recent || recent.length === 0) {
    // Return null instead of showing empty state - let only the header with add button show
    return null;
  }

  // Handle responsive maxItems
  let itemsLimit;
  if (typeof maxItems === 'object' && maxItems !== null) {
    // Responsive object like { xs: 2, sm: 4 }
    itemsLimit = isMobile ? maxItems.xs : maxItems.sm;
  } else {
    // Single number
    itemsLimit = maxItems;
  }

  // Limit the number of items to prevent overflow
  const displayItems = itemsLimit ? recent.slice(0, itemsLimit) : recent;

  return (
    <Box
      width="100%"
      display="grid"
      gap={3}
      sx={{
        backgroundColor: 'transparent',
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)", // Single column on mobile
          sm: "repeat(2, 1fr)", // Two columns on small tablets
          md: "repeat(3, 1fr)", // Three columns on medium screens
          lg: "repeat(4, 1fr)", // Four columns on large screens
          xl: "repeat(4, 1fr)", // Four columns on extra large screens
        },
        // Ensure proper card sizing without overflow
        '& > *': {
          minWidth: { xs: '100%', sm: '250px' },
          maxWidth: '100%',
          justifySelf: 'center',
        },
        // Prevent horizontal overflow
        overflow: 'hidden',
        ...sx
      }}
    >
      {displayItems.map(({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName, Category }) => {
        return (
          <RecentPosts
            key={_id}
            _id={_id}
            categoryname={categoryname}
            region={region}
            exactLocation={exactLocation}
            createdAt={createdAt}
            image={image}
            countryLabels={countryLabels}
            countryname={countryname}
            contact={contact}
            city={city}
            cityLabels={cityLabels}
            cityName={cityName}
            Category={Category}
          />
        );
      })}
    </Box>
  );
};

export default Recent;