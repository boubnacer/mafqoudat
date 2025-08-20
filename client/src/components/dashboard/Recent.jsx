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
      gridTemplateColumns="repeat(4, 1fr)"
      gap="1rem"
      sx={{
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        mt: {
          xs: "2rem",
          // sm: "2rem",
        },
      }}
    >
      {recent.map(({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact, city }) => {
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
          />
        );
      })}
    </Box>
  );
};

export default Recent;