import { Box } from "@mui/material";
import { styled } from "@mui/material";
import React from "react";

const BodyBox = styled(Box)({
  mt: "2rem",
  width: "98%",
  p: "1rem",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "1.5rem",
  //   gridTemplateColumns: {
  //     xs: "repeat(1, 1fr)",
  //     md: "repeat(2, 1fr)",
  //     lg: "repeat(4, 1fr)",
  //   },
});

export default BodyBox;
