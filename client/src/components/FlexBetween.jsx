import { Box } from "@mui/material";
import { styled } from "@mui/system";

// styled component
const FlexBetween = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  // flexDirection: "row-reverse",
});

export default FlexBetween;
