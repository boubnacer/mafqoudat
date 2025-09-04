import React from "react";
import TotalBox from "../TotalBox";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

const LeftSide = ({
  totalFounds,
  totalLosts,
  totalPosts,
  totalReturned,
  foundsToday,
  lostsToday,
}) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:600px)");

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
        padding: isMobile ? '1.5rem' : '2rem',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0,0,0,0.15)'
          : '0 8px 32px 0 rgba(0,0,0,0.05)',
        height: 'fit-content', // Fix height issue
        maxHeight: '100%', // Prevent overflow
      }}
    >
      {/* Title Section */}
      <Box 
        mb={isMobile ? 2 : 3}
        sx={{
          textAlign: 'center',
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Typography
          variant="h5"
          fontWeight="700"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            mb: 1
          }}
        >
          {t('statistics')}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box
        gap={isMobile ? "1rem" : "1.5rem"}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)", // Single column on mobile
            sm: "repeat(2, 1fr)", // 2 columns on tablet
            md: "repeat(2, 1fr)", // 2 columns on desktop
          },
          height: "auto", // Fix height issue
        }}
      >
        <TotalBox
          title={t('foundItems')}
          value={totalFounds || 0}
          increase="+14%"
          description={`+ ${foundsToday || 0} ${t('today')}`}
          icon={<RenderIcon name="Found" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.15) 0%, rgba(72, 187, 120, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(72, 187, 120, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(72, 187, 120, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            minHeight: isMobile ? '120px' : '140px', // Increased height
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1rem' : '1.1rem', // Bigger title
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A',
            fontSize: isMobile ? '1.75rem' : '2rem', // Bigger value
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '0.875rem' : '0.9rem' // Bigger description
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(72, 187, 120, 0.2)'
              : 'rgba(72, 187, 120, 0.15)',
            color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A'
          }}
        />

        <TotalBox
          title={t('lostItems')}
          value={totalLosts || 0}
          increase="+21%"
          description={`+ ${lostsToday || 0} ${t('today')}`}
          icon={<RenderIcon name="Lost" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(245, 101, 101, 0.15) 0%, rgba(245, 101, 101, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(245, 101, 101, 0.2) 0%, rgba(245, 101, 101, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(245, 101, 101, 0.3)' : 'rgba(245, 101, 101, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            minHeight: isMobile ? '120px' : '140px', // Increased height
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1rem' : '1.1rem', // Bigger title
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030',
            fontSize: isMobile ? '1.75rem' : '2rem', // Bigger value
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '0.875rem' : '0.9rem' // Bigger description
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(245, 101, 101, 0.2)'
              : 'rgba(245, 101, 101, 0.15)',
            color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030'
          }}
        />

        <TotalBox
          title={t('totalItems')}
          value={totalPosts || 0}
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="total" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(66, 153, 225, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(66, 153, 225, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            minHeight: isMobile ? '120px' : '140px', // Increased height
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1rem' : '1.1rem', // Bigger title
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0',
            fontSize: isMobile ? '1.75rem' : '2rem', // Bigger value
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '0.875rem' : '0.9rem' // Bigger description
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(66, 153, 225, 0.2)'
              : 'rgba(66, 153, 225, 0.15)',
            color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0'
          }}
        />

        <TotalBox
          title={t('returnedItems')}
          value={totalReturned?.toString() || "0"}
          increase="+5%"
          description={t('sinceLastMonth')}
          icon={<RenderIcon name="returned" />}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(159, 122, 234, 0.15) 0%, rgba(159, 122, 234, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(159, 122, 234, 0.2) 0%, rgba(159, 122, 234, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(159, 122, 234, 0.3)' : 'rgba(159, 122, 234, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            minHeight: isMobile ? '120px' : '140px', // Increased height
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1rem' : '1.1rem', // Bigger title
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1',
            fontSize: isMobile ? '1.75rem' : '2rem', // Bigger value
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '0.875rem' : '0.9rem' // Bigger description
          }}
          iconStyle={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(159, 122, 234, 0.2)'
              : 'rgba(159, 122, 234, 0.15)',
            color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1'
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftSide;