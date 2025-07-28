import { Box } from "@mui/material";
import { styled } from "@mui/system";

const DashRecents = styled(Box)((props) => ({
  position: "relative",
  margin:
    props.cate === "cate"
      ? "1% 0%"
      : props.cate === "recents"
      ? "1% 0% 0%"
      : props.cate === "roadmap"
      ? "2% 0% 0%"
      : "",
  padding:
    props.cate === "cate"
      ? "2rem 2.5rem"
      : props.cate === "recents"
      ? "2rem 2.5rem"
      : props.cate === "roadmap"
      ? "2rem 2.5rem"
      : "",

  // borderBottom: "1px solid #333333",
  // borderTop: "1px solid #333333",
}));

export default DashRecents;
