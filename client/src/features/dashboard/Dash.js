import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Skeleton, useMediaQuery, useTheme, Typography, Chip, Button, Divider, Paper } from "@mui/material";
import { setActiveLink, setFoundOrLost, setOpenModal } from "../../app/state";
import { LoadingState, DashboardEmptyStates } from "../../components/LoadingStates";
import { WhatshotOutlined, Search, Language } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { selectCurrentToken } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";

// Custom hook
import { useDashboard } from "../../hooks/useDashboard";

// Components
import LeftSide from "../../components/dashboard/LeftSide";
import TrendingItem from "../../components/dashboard/TrendingItem";
import SearchSection from "../../components/dashboard/SearchSection";
import QuickActions from "../../components/dashboard/QuickActions";
import SuccessStories from "../../components/dashboard/SuccessStories";
import CommunitySection from "../../components/dashboard/CommunitySection";
import HelpSupportSection from "../../components/dashboard/HelpSupportSection";
import Categories from "../../components/dashboard/Categories";
import Process from "../../components/dashboard/Process";
import Recent from "../../components/dashboard/Recent";
import SeeAll from "../../components/dashboard/SeeAll";
import FlexCenter from "../../components/FlexCenter";
import DashRecents from "../../components/dashboard/DashRecents";

import "./dash.css";

const lostsId = "63cc3484bc901245d3a1cb5a";
const foundsId = "66e60c25420ca2a42499b924";

const Dash = () => {
  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");
  const isMobile = useMediaQuery("(max-width:600px)");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const token = useSelector(selectCurrentToken);
  const user = useAuth();

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
    if (!user.username) {
      navigate('/login');
    } else {
      navigate(`/dash/posts/new?type=${type}`);
    }
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
    if (!user.username) {
      navigate('/login');
    } else {
      navigate("/dash/posts/new");
    }
  };

  // Show error if there's an API error, but don't block the UI
  if (isError) {
    console.log('Dashboard error:', error?.data?.message || error?.message || 'Unknown error');
  }

  // If no country is selected, show country selection prompt
  if (!currentCountry) {
    return (
      <Box 
        pt={{ xs: "6.5rem", sm: "7rem" }} 
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        px={2}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            maxWidth: 400,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(45,45,45,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <Typography variant="h5" mb={2} fontWeight={600}>
            {t('pleaseSelectCountry')}
          </Typography>
          <Typography variant="body1" mb={3} color="text.secondary">
            {t('chooseCountryMessage')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Language />}
            onClick={() => dispatch(setOpenModal())}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 4px 15px rgba(33, 150, 243, 0.3)",
              borderRadius: 2,
              px: 3,
              py: 1.5,
              '&:hover': {
                background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                transform: 'translateY(-2px)',
                boxShadow: "0 6px 20px rgba(33, 150, 243, 0.4)",
              }
            }}
          >
            {t('selectCountry')}
          </Button>
        </Paper>
      </Box>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading && !data) {
    return <LoadingState message={t('loadingDashboardData')} size="large" />;
  }
  
  // Check if all data is empty - show empty state
  const hasNoData = !data?.totalFounds && !data?.totalLosts && !data?.totalPosts && 
                   (!data?.recentFounds || data?.recentFounds.length === 0) && 
                   (!data?.recentLosts || data?.recentLosts.length === 0);
  
  if (hasNoData) {
    return (
      <Box 
        pt={{ xs: "6.5rem", sm: "7rem" }} 
        width="100%"
        sx={{
          transition: 'padding 0.3s ease',
        }}
      >
        <DashboardEmptyStates.NoPosts country={currentCountry} onCreatePost={handleCreateNewPost} />
      </Box>
    );
  }

  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      sx={{
        transition: 'padding 0.3s ease',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(28,28,28,0.8) 100%)'
          : 'linear-gradient(180deg, rgba(248,249,250,0.8) 0%, rgba(255,255,255,0.8) 100%)',
        minHeight: '100vh'
      }}
    >
      
      {/* Search Section */}
      <Box mb={4}>
        <SearchSection
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          isSearching={isSearching}
          isSearchLoading={isSearchLoading}
          searchData={searchData}
          handleCreateNewPost={handleCreateNewPost}
        />
      </Box>

      {/* Header Section with Stats and Trending */}
      <Box
        m={{ xs: "0 1rem", sm: "0 2rem" }}
        mb={4}
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
          foundsToday={data?.createdToday?.todaysFoundPosts}
          lostsToday={data?.createdToday?.todaysLostPosts}
        />
        {isLoading ? (
          <Skeleton variant="rounded" width={210} height={60} />
        ) : (
          <TrendingItem trend={trend} isLoading={isLoading} />
        )}
      </Box>

      {/* Section Divider */}
      <Box 
        mx={{ xs: 2, sm: 3, md: 4 }} 
        mb={4}
        sx={{
          height: 2,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          borderRadius: 1
        }}
      />

      {/* Enhanced Recent Founds Section */}
      <Box mb={4}>
        <DashRecents 
          cate="recents" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: { xs: '12px', sm: '16px' },
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            mx: { xs: 1, sm: 2 },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            p={{ xs: "1.5rem", sm: "2rem" }}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
                : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              borderBottom: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 0 },
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              sx={{
                flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                flex: { xs: '0 0 auto', sm: '0 0 auto' }
              }}
            >
              <Typography
                fontWeight="700"
                sx={{
                  fontSize: { xs: "18px", sm: "22px", md: "24px" },
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                <WhatshotOutlined sx={{ color: '#FFA500', fontSize: { xs: '20px', sm: '24px' } }} />
                {t('recentFounds')}
              </Typography>
              <Chip 
                label={`${data?.totalFounds || 0} ${t('items')}`}
                color="primary"
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: { xs: 1.5, sm: 2 },
                  height: { xs: '28px', sm: '32px' },
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Box>
            <SeeAll 
              foundOrlostId={foundsId} 
              totalItems={data?.totalFounds}
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)'
                },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                minHeight: { xs: '40px', sm: 'auto' },
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                flex: { xs: '1 1 auto', sm: '0 0 auto' }
              }}
            />
          </Box>
          <Box p={{ xs: 1.5, sm: 2 }}>
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
                    flexDirection: 'column',
                    borderRadius: 2
                  },
                  '& .MuiCardMedia-root': {
                    height: { xs: '160px', sm: '200px', md: '220px' },
                    objectFit: 'cover'
                  },
                  '& .MuiCardContent-root': {
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2 }
                  },
                  '& .MuiTypography-h6': {
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                    mb: { xs: 0.5, sm: 1 }
                  },
                  '& .MuiTypography-body2': {
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                  }
                }}
              />
            </FlexCenter>
          </Box>
        </DashRecents>
      </Box>

      {/* Enhanced Recent Losts Section */}
      <Box mb={4}>
        <DashRecents
          cate="recents"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: { xs: '12px', sm: '16px' },
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            mx: { xs: 1, sm: 2 },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            p={{ xs: "1.5rem", sm: "2rem" }}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
                : 'linear-gradient(45deg, #FFA500 30%, #FFD700 90%)',
              borderBottom: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 0 },
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              sx={{
                flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                flex: { xs: '0 0 auto', sm: '0 0 auto' }
              }}
            >
              <Typography
                fontWeight="700"
                sx={{
                  fontSize: { xs: "18px", sm: "22px", md: "24px" },
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row',
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                <Search sx={{ color: '#fff', fontSize: { xs: '20px', sm: '24px' } }} />
                {t('recentLosts')}
              </Typography>
              <Chip 
                label={`${data?.totalLosts || 0} ${t('items')}`}
                color="warning"
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: { xs: 1.5, sm: 2 },
                  height: { xs: '28px', sm: '32px' },
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Box>
            <SeeAll 
              foundOrlostId={lostsId} 
              totalItems={data?.totalLosts}
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)'
                },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                minHeight: { xs: '40px', sm: 'auto' },
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                flex: { xs: '1 1 auto', sm: '0 0 auto' }
              }}
            />
          </Box>
          <Box p={{ xs: 1.5, sm: 2 }}>
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
                    flexDirection: 'column',
                    borderRadius: 2
                  },
                  '& .MuiCardMedia-root': {
                    height: { xs: '160px', sm: '200px', md: '220px' },
                    objectFit: 'cover'
                  },
                  '& .MuiCardContent-root': {
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2 }
                  },
                  '& .MuiTypography-h6': {
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                    mb: { xs: 0.5, sm: 1 }
                  },
                  '& .MuiTypography-body2': {
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                  }
                }}
              />
            </FlexCenter>
          </Box>
        </DashRecents>
      </Box>

      {/* Section Divider */}
      <Box 
        mx={{ xs: 2, sm: 3, md: 4 }} 
        mb={4}
        sx={{
          height: 2,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          borderRadius: 1
        }}
      />

      {/* Quick Actions */}
      <Box mb={4}>
        <QuickActions />
      </Box>

      {/* Categories Section */}
      <Box mb={4}>
        <DashRecents 
          cate="cate" 
          sx={{ 
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: { xs: '12px', sm: '16px' },
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            mx: { xs: 1, sm: 2 },
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}
        >
          <Typography
            fontWeight="700"
            sx={{
              fontSize: { xs: "20px", sm: "24px", md: "26px" },
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: 'center',
              mb: 2
            }}
          >
            {t('categories')}
          </Typography>
          <Categories />
        </DashRecents>
      </Box>

      {/* Process Section */}
      <Box mb={4}>
        <DashRecents
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: { xs: '12px', sm: '16px' },
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            mx: { xs: 1, sm: 2 },
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}
        >
          <Process />
        </DashRecents>
      </Box>

      {/* Help & Support Section */}
      <Box mb={4}>
        <HelpSupportSection />
      </Box>

      
    </Box>
  );
};

export default Dash;
