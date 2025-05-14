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
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '24px',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)',
      }}
    >
      <Box
        gap="1.5rem"
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
            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            borderRadius: '12px',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}
        />

        <TotalBox
          title="Lost Items"
          value={totalLosts}
          increase="+21%"
          description={`+ ${lostsToday} today`}
          icon={<RenderIcon name="Lost" />}
          sx={{
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            borderRadius: '12px',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}
        />

        <TotalBox
          title="Total Items"
          value={totalPosts}
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="total" />}
          sx={{
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            borderRadius: '12px',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}
        />

        <TotalBox
          title="Returned Items"
          value="0"
          increase="+5%"
          description="Since last month"
          icon={<RenderIcon name="returned" />}
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            borderRadius: '12px',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
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
