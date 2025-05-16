import React from "react";
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
  const theme = useTheme();

  // if (!totalFounds || !totalLosts || !totalPosts || !foundsToday || !lostsToday)
  //   return <PulseLoader color={"#FFF"} />;

  return (
    <Box 
      flex={1}
      sx={{
        background: 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '2rem',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)',
      }}
    >
      <Box
        gap="2rem"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(2, 1fr)",
          },
          height: "100%",
        }}
      >
        <TotalBox
          title="Found Items"
          value={totalFounds}
          increase="+14%"
          description={`+ ${foundsToday} today`}
          icon={<RenderIcon name="Found" />}
          sx={{
            background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(72, 187, 120, 0.05) 100%)',
            border: '1px solid rgba(72, 187, 120, 0.2)',
          }}
        />

        <TotalBox
          title="Lost Items"
          value={totalLosts}
          increase="+21%"
          description={`+ ${lostsToday} today`}
          icon={<RenderIcon name="Lost" />}
          sx={{
            background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.1) 0%, rgba(245, 101, 101, 0.05) 100%)',
            border: '1px solid rgba(245, 101, 101, 0.2)',
          }}
        />

        <TotalBox
          title="Total Items"
          value={totalPosts}
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="total" />}
          sx={{
            background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(66, 153, 225, 0.05) 100%)',
            border: '1px solid rgba(66, 153, 225, 0.2)',
          }}
        />

        <TotalBox
          title="Returned Items"
          value="0"
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="returned" />}
          sx={{
            background: 'linear-gradient(135deg, rgba(159, 122, 234, 0.1) 0%, rgba(159, 122, 234, 0.05) 100%)',
            border: '1px solid rgba(159, 122, 234, 0.2)',
          }}
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