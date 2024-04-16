import React, { useEffect } from "react";
import TotalBox from "../TotalBox";
import { Box, Typography, useTheme } from "@mui/material";
import {
  ArrowDropDownOutlined,
  ArrowDropUpOutlined,
  Email,
  Facebook,
  FacebookOutlined,
  FileDownloadDoneOutlined,
  MoreHorizOutlined,
  PersonAdd,
  PointOfSaleOutlined,
  SelfImprovementOutlined,
  SwitchLeftOutlined,
} from "@mui/icons-material";
import sear from "../../img/sear.svg";
import Socials from "../Socials";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";

const LeftSide = ({
  totalFounds,
  totalLosts,
  totalPosts,
  foundsToday,
  lostsToday,
}) => {
  // useEffect(() => {
  //   if (!totalFounds || !totalLosts || !totalPosts)
  //     return <PulseLoader color={"#FFF"} />;
  // }, []);

  const theme = useTheme();

  return (
    <Box flex={1}>
      <Box
        gap="1rem"
        sx={{
          display: { xs: "flex", sm: "grid" },
          gridTemplateColumns: "repeat(2, 1fr)",
          height: "100%",
        }}
      >
        <TotalBox
          title="Total of Found things"
          value={totalFounds}
          increase="+14%"
          // backgroundCol={theme.palette.floptions.back}
          description={`+ ${foundsToday} today`}
          icon={<RenderIcon name="roadmapf" />}
        />

        <TotalBox
          title="Total of Lost things"
          value={totalLosts}
          increase="+21%"
          description={`+ ${lostsToday} today`}
          icon={<RenderIcon name="roadmapl" />}
        />

        <TotalBox
          title="Total"
          value={totalPosts}
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="total" />}
        />

        <TotalBox
          title="Returned to its owner"
          value="0"
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="returned" />}
        />
      </Box>

      {/* <Box mt="2rem">
        <Typography>Socials</Typography>
        <Socials
          title="Facebook"
          value="+50k followers"
          increase="+50k followers%"
          description="Mafkoudat"
          icon={<FacebookOutlined sx={{ fontSize: "26px" }} />}
        />
      </Box> */}
    </Box>
  );
};

export default LeftSide;
