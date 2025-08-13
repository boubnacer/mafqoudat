import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Skeleton, useMediaQuery, useTheme, Typography, Chip, Button } from "@mui/material";
import { setActiveLink, setFoundOrLost, setOpenModal } from "../../app/state";
import { LoadingState, DashboardEmptyStates } from "../LoadingStates";
import { WhatshotOutlined, Search, Language } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";

// Custom hook
import { useDashboard } from "../hooks/useDashboard";

// Components
import LeftSide from "./dashboard/LeftSide";
import TrendingItem from "./dashboard/TrendingItem";
import SearchSection from "./dashboard/SearchSection";
import QuickActions from "./dashboard/QuickActions";
import SuccessStories from "./dashboard/SuccessStories";
import CommunitySection from "./dashboard/CommunitySection";
import HelpSupportSection from "./dashboard/HelpSupportSection";
import Categories from "./dashboard/Categories";
import Process from "./dashboard/Process";
import Recent from "./dashboard/Recent";
import SeeAll from "./dashboard/SeeAll";
import FlexCenter from "../FlexCenter";
import DashRecents from "./dashboard/DashRecents";

import "../features/dashboard/dash.css";

const lostsId = "63cc3484bc901245d3a1cb5a";
const foundsId = "66e60c25420ca2a42499b924";

const SimpleOriginalDash = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");
  const { t, currentLanguage } = useTranslation();

  // Use custom hook for dashboard data and state
  const {
    searchQuery,
    isSearching,
    data,
    isError,
    error,
    isLoading,
    trend,
    searchData,
    isSearchLoading,
    handleSearchChange,
    currentCountry,
  } = useDashboard();

  const handleCreateNewPost = (type) => {
    // Always redirect to login for creating posts (no token check)
    navigate('/login');
  };

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    navigate("/dash/posts");
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  const hanldeAddNewPost = () => {
    // Always redirect to login for creating posts (no token check)
    navigate('/login');
  };

  if (isError) {
    console.log('Dashboard error:', error?.data?.message || error?.message || 'Unknown error');
  }

  if (!currentCountry) {
    return (
      <Box 
        pt={{ xs: "6.5rem", sm: "7rem" }} 
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Box textAlign="center">
          <Typography variant="h6" mb={2}>
            {t('pleaseSelectCountry')}
          </Typography>
          <Typography variant="body2" mb={3} color="text.secondary">
            {t('chooseCountryMessage')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Language />}
            onClick={() => dispatch(setOpenModal())}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            }}
          >
            {t('selectCountry')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!data) return <LoadingState message={t('loadingDashboardData')} size="large" />;
  
  // Check if all data is empty
  const hasNoData = !data.totalFounds && !data.totalLosts && !data.totalPosts && 
                   (!data.recentFounds || data.recentFounds.length === 0) && 
                   (!data.recentLosts || data.recentLosts.length === 0);
  
  if (hasNoData) {
    return (
      <Box 
        pt={{ xs: "6.5rem", sm: "7rem" }} 
        width="100%"
        sx={{
          transition: 'padding 0.3s ease',
        }}
      >
        <DashboardEmptyStates.NoPosts country={currentCountry} />
      </Box>
    );
  }

  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      sx={{
        transition: 'padding 0.3s ease',
      }}
    >
      
      {/* Search Section */}
      <SearchSection
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        isSearching={isSearching}
        isSearchLoading={isSearchLoading}
        searchData={searchData}
        handleCreateNewPost={handleCreateNewPost}
      />

      {/* Header Section with Stats and Trending */}
      <Box
        m="0 1rem"
        gap="20px"
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: { xs: "repeat(1,1fr)", sm: "repeat(2,1fr)" },
        }}
      >
        <LeftSide
          totalFounds={data?.totalFounds}
          totalLosts={data?.totalLosts}
          totalPosts={data?.totalPosts}
          foundsToday={data?.createdToday.todaysFoundPosts}
          lostsToday={data?.createdToday.todaysLostPosts}
        />
        {isLoading ? (
          <Skeleton variant="rounded" width={210} height={60} />
        ) : (
          <TrendingItem trend={trend} isLoading={isLoading} />
        )}
      </Box>

      {/* Enhanced Recent Founds Section */}
      <DashRecents 
        cate="recents" 
        sx={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderRadius: { xs: '8px', sm: '12px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          p={{ xs: "1rem", sm: "1.5rem" }}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
              : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2} 
            width={{ xs: '100%', sm: 'auto' }}
            sx={{
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "16px", sm: "20px", md: "22px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              <WhatshotOutlined sx={{ color: '#FFA500' }} />
              {t('recentFounds')}
            </Typography>
            <Chip 
              label={`${data?.totalFounds || 0} ${t('items')}`}
              color="primary"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                minWidth: 'auto',
                px: { xs: 1, sm: 1.5 }
              }}
            />
          </Box>
          <SeeAll 
            foundOrlostId={foundsId} 
            totalItems={data?.totalFounds}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' },
              fontSize: { xs: '0.8rem', sm: '1rem' },
              minHeight: { xs: '36px', sm: 'auto' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentFounds}
              isLoading={isLoading}
              emptyState="NoRecentFounds"
              sx={{
                '& .MuiCard-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#fff',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.1)'
                  },
                  height: { xs: 'auto', sm: '100%' },
                  display: 'flex',
                  flexDirection: 'column'
                },
                '& .MuiCardMedia-root': {
                  height: { xs: '140px', sm: '180px', md: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                }
              }}
            />
          </FlexCenter>
        </Box>
      </DashRecents>

      {/* Enhanced Recent Losts Section */}
      <DashRecents
        cate="recents"
        sx={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderRadius: { xs: '8px', sm: '12px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          p={{ xs: "1rem", sm: "1.5rem" }}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
              : 'linear-gradient(45deg, #FFA500 30%, #FFD700 90%)',
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2} 
            width={{ xs: '100%', sm: 'auto' }}
            sx={{
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "16px", sm: "20px", md: "22px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              <Search sx={{ color: '#fff' }} />
              {t('recentLosts')}
            </Typography>
            <Chip 
              label={`${data?.totalLosts || 0} ${t('items')}`}
              color="warning"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                minWidth: 'auto',
                px: { xs: 1, sm: 1.5 }
              }}
            />
          </Box>
          <SeeAll 
            foundOrlostId={lostsId} 
            totalItems={data?.totalLosts}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' },
              fontSize: { xs: '0.8rem', sm: '1rem' },
              minHeight: { xs: '36px', sm: 'auto' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentLosts}
              isLoading={isLoading}
              emptyState="NoRecentLosts"
              sx={{
                '& .MuiCard-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#fff',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.1)'
                  },
                  height: { xs: 'auto', sm: '100%' },
                  display: 'flex',
                  flexDirection: 'column'
                },
                '& .MuiCardMedia-root': {
                  height: { xs: '140px', sm: '180px', md: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                }
              }}
            />
          </FlexCenter>
        </Box>
      </DashRecents>

      {/* Quick Actions */}
      <QuickActions />

      {/* Categories Section */}
      <DashRecents cate="cate" sx={{ borderColor: theme.palette.primary.main }}>
        <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
                         {t('categories')}
          </Typography>
        <Categories />
      </DashRecents>

      {/* Help & Support Section */}
      <HelpSupportSection />

      {/* Process Section */}
      <DashRecents>
        <Process />
      </DashRecents>
    </Box>
  );
};

export default SimpleOriginalDash;
