import { Box } from "@mui/material";
import React, { useEffect } from "react";
import RecentPosts from "./RecentPosts";
import PulseLoader from "react-spinners/PulseLoader";

const Recent = ({ recent }) => {
  // useEffect(() => {
  //   if (!recent.length) return <PulseLoader color={"#FFF"} />;
  // }, []);

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
      {recent.map(({ _id, categoryname, region, image, createdAt }) => {
        return (
          <RecentPosts
            key={_id}
            _id={_id}
            categoryname={categoryname}
            region={region}
            createdAt={createdAt}
            image={image}
          />
        );
      })}
    </Box>
  );
};

export default Recent;
