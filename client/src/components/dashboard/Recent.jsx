import { Box } from "@mui/material";
import React from "react";
import RecentPosts from "./RecentPosts";
import { RecentItemsSkeleton, DashboardEmptyStates } from "../LoadingStates";

const Recent = ({ recent, isLoading, emptyState = "NoRecentFounds" }) => {
  if (isLoading) return <RecentItemsSkeleton />;
  if (!recent || recent.length === 0) {
    const EmptyStateComponent = DashboardEmptyStates[emptyState];
    return <EmptyStateComponent />;
  }

  return (
    <Box
      width="100%"
      display="grid"
      gap="1.5rem" // Increased gap for better spacing
      sx={{
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)", // Single column on mobile
          sm: "repeat(2, 1fr)", // Two columns on small tablets
          md: "repeat(3, 1fr)", // Three columns on medium screens
          lg: "repeat(4, 1fr)", // Four columns on large screens
          xl: "repeat(4, 1fr)", // Four columns on extra large screens
        },
        mt: {
          xs: "2rem",
        },
        // Ensure minimum card width for better readability
        '& > *': {
          minWidth: { xs: '280px', sm: '300px' },
          maxWidth: { xs: '100%', sm: '400px' },
          justifySelf: 'center',
        }
      }}
    >
      {recent.map(({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName }) => {
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