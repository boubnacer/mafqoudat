import React from "react";
import TotalBox from "../TotalBox";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setFoundOrLost } from "../../app/state";
import { useGetflOptionsQuery } from "../../features/dependencies/dependenciesApiSlice";

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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get found/lost options for navigation
  const { data: flOptionsData } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });

  // Handler for Found Items
  const handleFoundItemsClick = () => {
    const foundOption = flOptionsData?.find(option => option.code === 'FOUND');
    if (foundOption) {
      dispatch(setFoundOrLost({ foundOrlost: foundOption.code }));
      navigate(`/dash/posts?fl=${foundOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/dash/posts');
    }
  };

  // Handler for Lost Items
  const handleLostItemsClick = () => {
    const lostOption = flOptionsData?.find(option => option.code === 'LOST');
    if (lostOption) {
      dispatch(setFoundOrLost({ foundOrlost: lostOption.code }));
      navigate(`/dash/posts?fl=${lostOption._id}`);
    } else {
      // Fallback if options not loaded yet
      navigate('/dash/posts');
    }
  };

  // Handler for Returned Items
  const handleReturnedItemsClick = () => {
    // Navigate to posts list - returned items can be filtered on the posts page
    navigate('/dash/posts?status=returned');
  };

  return (
    <Box 
      sx={{
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '16px' : '24px',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'}`,
        padding: isMobile ? '1.5rem' : '2rem',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0,0,0,0.15)'
          : '0 8px 32px 0 rgba(0,0,0,0.05)',
        height: '100%', // Allow stretching to match container
        minHeight: 'fit-content', // Ensure minimum content height
        width: isMobile ? '100%' : 'auto', // Full width on mobile
        mx: isMobile ? 0 : 'auto', // Remove horizontal margin on mobile
        maxWidth: '100%', // Prevent overflow
        minWidth: 0, // Allow shrinking if needed
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
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
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
            xs: "calc(50% - 0.5rem) calc(50% - 0.5rem)", // Fixed equal columns accounting for gap
            sm: "repeat(2, 1fr)", // 2 columns on tablet
            md: "repeat(2, 1fr)", // 2 columns on desktop
          },
          gridTemplateRows: {
            xs: "repeat(2, 240px)", // Increased height rows on mobile - exactly 240px each
            sm: "auto", // Auto rows on desktop
            md: "auto", // Auto rows on desktop
          },
          height: "auto", // Let content determine height
          minHeight: "fit-content", // Ensure minimum content height
          alignContent: "start", // Align content to top
          alignItems: "stretch", // Ensure all grid items have same height
        }}
      >
        <TotalBox
          title={t('foundItems')}
          value={totalFounds || 0}
          increase="+14%"
          description={`+ ${foundsToday || 0} ${t('today')}`}
          icon={<RenderIcon name="Found" />}
          hasNotification={(foundsToday || 0) >= 1}
          notificationColor={theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A'}
          onClick={handleFoundItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.15) 0%, rgba(72, 187, 120, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(72, 187, 120, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(72, 187, 120, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
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
          hasNotification={(lostsToday || 0) >= 1}
          notificationColor={theme.palette.mode === 'dark' ? '#F56565' : '#C53030'}
          onClick={handleLostItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(245, 101, 101, 0.15) 0%, rgba(245, 101, 101, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(245, 101, 101, 0.2) 0%, rgba(245, 101, 101, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(245, 101, 101, 0.3)' : 'rgba(245, 101, 101, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#F56565' : '#C53030',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
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
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#4299E1' : '#2B6CB0',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
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
          onClick={handleReturnedItemsClick}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(159, 122, 234, 0.15) 0%, rgba(159, 122, 234, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(159, 122, 234, 0.2) 0%, rgba(159, 122, 234, 0.15) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(159, 122, 234, 0.3)' : 'rgba(159, 122, 234, 0.4)'}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            // minHeight handled by TotalBox component for consistency
          }}
          titleStyle={{ 
            color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
            fontSize: isMobile ? '1.1rem' : '1.1rem', // Increased for mobile
            fontWeight: 600
          }}
          valueStyle={{ 
            color: theme.palette.mode === 'dark' ? '#9F7AEA' : '#6B46C1',
            fontSize: isMobile ? '2rem' : '2rem', // Increased for mobile
            fontWeight: 700
          }}
          descriptionStyle={{ 
            color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
            fontSize: isMobile ? '1rem' : '0.9rem' // Increased for mobile
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