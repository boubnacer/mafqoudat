import { Box } from "@mui/material";
import React from "react";
import RecentPosts from "./RecentPosts";
import { RecentItemsSkeleton, DashboardEmptyStates } from "../LoadingStates";

const Recent = ({ recent, isLoading, emptyState = "NoRecentFounds", maxItems, sx }) => {
  // Debug logging to see what data is received
  console.log('Recent component received:', { recent, isLoading, emptyState, maxItems });
  
  if (isLoading) return <RecentItemsSkeleton />;
  if (!recent || recent.length === 0) {
    console.log('Recent component: No data or empty array');
    const EmptyStateComponent = DashboardEmptyStates[emptyState];
    return <EmptyStateComponent />;
  }

  // Limit the number of items to prevent overflow
  const displayItems = maxItems ? recent.slice(0, maxItems) : recent;

  return (
    <Box
      width="100%"
      display="grid"
      gap={3}
      sx={{
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)", // Single column on mobile
          sm: "repeat(2, 1fr)", // Two columns on small tablets
          md: "repeat(3, 1fr)", // Three columns on medium screens
          lg: "repeat(4, 1fr)", // Four columns on large screens
          xl: "repeat(4, 1fr)", // Four columns on extra large screens
        },
        // Ensure proper card sizing without overflow
        '& > *': {
          minWidth: { xs: '280px', sm: '250px' },
          maxWidth: '100%',
          justifySelf: 'center',
        },
        // Prevent horizontal overflow
        overflow: 'hidden',
        ...sx
      }}
    >
      {displayItems.map(({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName }) => {
        // Debug logging to see what data is being mapped
        console.log('Recent component mapping item:', { _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName });
        
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
          />
        );
      })}
    </Box>
  );
};

export default Recent;