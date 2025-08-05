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
import { useTranslation } from "../../utils/translations";

const LeftSide = ({
  totalFounds,
  totalLosts,
  totalPosts,
  foundsToday,
  lostsToday,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // if (!totalFounds || !totalLosts || !totalPosts || !foundsToday || !lostsToday)
  //   return <PulseLoader color={"#FFF"} />;

  return (
    <Box 
      flex={1}
      sx={{
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        padding: '2rem',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0,0,0,0.15)'
          : '0 8px 32px 0 rgba(0,0,0,0.05)',
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
          title={t('foundItems')}
          value={totalFounds}
          increase="+14%"
          description={`+ ${foundsToday} ${t('today')}`}
          icon={<RenderIcon name="Found" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(72, 187, 120, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(72, 187, 120, 0.15) 0%, rgba(72, 187, 120, 0.1) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(72, 187, 120, 0.3)'}`,
          }}
          titleStyle={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748' }}
          valueStyle={{ color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A' }}
          descriptionStyle={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568' }}
        />

        <TotalBox
          title={t('lostItems')}
          value={totalLosts}
          increase="+21%"
          description={`+ ${lostsToday} ${t('today')}`}
          icon={<RenderIcon name="Lost" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(245, 101, 101, 0.1) 0%, rgba(245, 101, 101, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(245, 101, 101, 0.15) 0%, rgba(245, 101, 101, 0.1) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(245, 101, 101, 0.2)' : 'rgba(245, 101, 101, 0.3)'}`,
          }}
          titleStyle={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748' }}
          valueStyle={{ color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030' }}
          descriptionStyle={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568' }}
        />

        <TotalBox
          title={t('totalItems')}
          value={totalPosts}
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(66, 153, 225, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(66, 153, 225, 0.1) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.3)'}`,
          }}
          titleStyle={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748' }}
          valueStyle={{ color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0' }}
          descriptionStyle={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568' }}
        />

        <TotalBox
          title={t('returnedItems')}
          value="0"
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(159, 122, 234, 0.1) 0%, rgba(159, 122, 234, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(159, 122, 234, 0.15) 0%, rgba(159, 122, 234, 0.1) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(159, 122, 234, 0.2)' : 'rgba(159, 122, 234, 0.3)'}`,
          }}
          titleStyle={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748' }}
          valueStyle={{ color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1' }}
          descriptionStyle={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568' }}
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