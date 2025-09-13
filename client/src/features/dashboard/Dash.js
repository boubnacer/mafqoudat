import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Skeleton, useMediaQuery, useTheme, Typography, Chip, Button, Paper } from "@mui/material";
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
import QuickActions from "../../components/dashboard/QuickActions";
import SuccessStories from "../../components/dashboard/SuccessStories";
import Categories from "../../components/dashboard/Categories";
import Process from "../../components/dashboard/Process";
import Recent from "../../components/dashboard/Recent";
import SeeAll from "../../components/dashboard/SeeAll";
import HelpSupportSection from "../../components/dashboard/HelpSupportSection";
import DashRecents from "../../components/dashboard/DashRecents";

import "./dash.css";

// Updated FoundLost IDs from the database
const lostsId = "68b708a085dd243c40a90826"; // LOST
const foundsId = "68b708a085dd243c40a90825"; // FOUND

const Dash = () => {
  const theme = useTheme();
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

    currentCountry,
    countriesData,
  } = useDashboard();

  const handleCreateNewPost = (type) => {
    if (!user.username) {
      navigate('/login');
    } else {
      navigate(`/dash/posts/new?type=${type}`);
    }
  };









  // If no country is selected, show country selection prompt
  if (!currentCountry) {
    return (
      <Box 
        pt={{ xs: "5.5rem", sm: "6rem" }} 
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
              : 'linear-gradient(135deg, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.95) 100%)',
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
  
  // Check if all data is empty - show empty state but still show stats
  const hasNoData = !data?.totalFounds && !data?.totalLosts && !data?.totalPosts && 
                   (!data?.recentFounds || data?.recentFounds.length === 0) && 
                   (!data?.recentLosts || data?.recentLosts.length === 0);

  return (
    <Box 
      pt={{ xs: "4rem", sm: "4.5rem" }} 
      width="100%"
      sx={{
        transition: 'padding 0.3s ease',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(28,28,28,0.8) 100%)'
          : 'linear-gradient(180deg, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.95) 100%)',
        minHeight: '100vh',
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
        overflowX: 'hidden', // Prevent horizontal overflow
      }}
    >
      
      {/* Search Section */}
      {/* <Box mb={4}>
        <SearchSection
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          isSearching={isSearching}
          isSearchLoading={isSearchLoading}
          searchData={searchData}
          handleCreateNewPost={handleCreateNewPost}
        />
      </Box> */}

      {/* Header Section with Stats and Trending */}
      <Box
        mb={4}
        p={{ xs: 2, sm: 3, md: 4 }}
        gap="20px"
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: { xs: "repeat(1,1fr)", sm: "repeat(2,1fr)" },
          maxWidth: '100%',
          overflow: 'hidden',
          width: '100%', // Ensure full width
          alignItems: { xs: 'stretch', sm: 'stretch' }, // Ensure both components stretch to same height
        }}
      >
        <LeftSide
          totalFounds={data?.totalFounds}
          totalLosts={data?.totalLosts}
          totalPosts={data?.totalPosts}
          totalReturned={data?.totalReturned}
          foundsToday={data?.createdToday?.todaysFoundPosts}
          lostsToday={data?.createdToday?.todaysLostPosts}
        />
        
        {isLoading ? (
          <Skeleton variant="rounded" width={210} height={60} />
        ) : trend ? (
          <TrendingItem trend={trend} isLoading={isLoading} />
        ) : (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('noTrendingItems')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Show empty state if no posts, but still show stats above */}
      {hasNoData && (
        <Box mb={4}>
          <DashboardEmptyStates.NoPosts 
            country={currentCountry} 
            countriesData={countriesData}
            onCreatePost={handleCreateNewPost} 
          />
        </Box>
      )}

      {/* Only show content sections if there are posts */}
      {!hasNoData && (
        <>
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

          {/* Enhanced Recent Founds Section - Only show when there are posts */}
          {data?.totalFounds > 0 && (
            <Box mb={4}>
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                  borderRadius: { xs: '16px', sm: '20px' },
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 32px rgba(0,0,0,0.3)'
                    : '0 8px 32px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  mx: { xs: 1, sm: 2 },
                  maxWidth: '100%',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {/* Header Section */}
                <Box 
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                      : '#ffffff',
                    p: { xs: 2, sm: 3 },
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                        : 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                {/* Mobile Layout */}
                <Box
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 1, 
                    mb: 2,
                    flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                  }}>
                    <WhatshotOutlined sx={{ 
                      color: theme.palette.mode === 'dark' ? '#FFA500' : '#2c3e50', 
                      fontSize: '24px',
                      order: currentLanguage === 'ar' ? 2 : 1
                    }} />
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                        fontWeight: 700,
                        fontSize: '20px',
                        textAlign: 'center',
                        order: currentLanguage === 'ar' ? 1 : 2
                      }}
                    >
                      {t('recentFounds')}
                    </Typography>
                  </Box>
                  
                                     <Box sx={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     gap: 2,
                     flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                   }}>

                     {/* Show "+add" button inline only when there are posts */}
                     {data?.totalFounds > 0 && data?.totalFounds <= 4 && (
                       <SeeAll 
                         foundOrlostId={foundsId} 
                         totalItems={data?.totalFounds}
                         variant="mobile"
                       />
                     )}
                   </Box>
                </Box>

                {/* Desktop Layout */}
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    order: currentLanguage === 'ar' ? 2 : 1
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}>
                      <WhatshotOutlined sx={{ 
                        color: theme.palette.mode === 'dark' ? '#FFA500' : '#2c3e50', 
                        fontSize: '28px'
                      }} />
                      <Typography
                        variant="h5"
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                          fontWeight: 700,
                          fontSize: { sm: '22px', md: '24px' }
                        }}
                      >
                        {t('recentFounds')}
                      </Typography>
                    </Box>

                  </Box>
                  <Box sx={{ order: currentLanguage === 'ar' ? 1 : 2 }}>
                    {/* Only show SeeAll button when there are posts */}
                    {data?.totalFounds > 0 && (
                      <SeeAll 
                        foundOrlostId={foundsId} 
                        totalItems={data?.totalFounds}
                        variant="desktop"
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Content Section */}
              <Box 
                sx={{
                  p: { xs: 2, sm: 3 },
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#ffffff',
                  minHeight: '200px',
                  borderTop: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <Recent 
                  recent={data?.recentFounds}
                  isLoading={isLoading}
                  emptyState="NoRecentFounds"
                  maxItems={4}
                />
                 
                 {/* Mobile See All Button - Bottom (only when there are posts) */}
                 {(data?.totalFounds && data?.totalFounds > 4) && (
                   <Box
                     sx={{
                       display: { xs: 'flex', sm: 'none' },
                       justifyContent: 'center',
                       mt: 3,
                       pt: 2,
                       borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                     }}
                   >
                     <SeeAll 
                       foundOrlostId={foundsId} 
                       totalItems={data?.totalFounds}
                       variant="mobile"
                     />
                   </Box>
                 )}
              </Box>
            </Box>
          </Box>
          )}

          {/* Enhanced Recent Losts Section - Only show when there are posts */}
          {data?.totalLosts > 0 && (
            <Box mb={4}>
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                  borderRadius: { xs: '16px', sm: '20px' },
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 32px rgba(0,0,0,0.3)'
                    : '0 8px 32px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  mx: { xs: 1, sm: 2 },
                  maxWidth: '100%',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {/* Header Section */}
                <Box 
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                      : '#ffffff',
                    p: { xs: 2, sm: 3 },
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                        : 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  {/* Mobile Layout */}
                  <Box
                    sx={{
                      display: { xs: 'block', sm: 'none' },
                      textAlign: 'center'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 1, 
                      mb: 2,
                      flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                    }}>
                      <Search sx={{ 
                        color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50', 
                        fontSize: '24px',
                        order: currentLanguage === 'ar' ? 2 : 1
                      }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                          fontWeight: 700,
                          fontSize: '20px',
                          textAlign: 'center',
                          order: currentLanguage === 'ar' ? 1 : 2
                        }}
                      >
                        {t('recentLosts')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 2,
                      flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                    }}>
                      {/* Show "+add" button inline only when there are posts */}
                      {data?.totalLosts > 0 && data?.totalLosts <= 4 && (
                        <SeeAll 
                          foundOrlostId={lostsId} 
                          totalItems={data?.totalLosts}
                          variant="mobile"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Desktop Layout */}
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      order: currentLanguage === 'ar' ? 2 : 1
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1
                      }}>
                        <Search sx={{ 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50', 
                          fontSize: '28px'
                        }} />
                        <Typography
                          variant="h5"
                          sx={{
                            color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                            fontWeight: 700,
                            fontSize: { sm: '22px', md: '24px' }
                          }}
                        >
                          {t('recentLosts')}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ order: currentLanguage === 'ar' ? 1 : 2 }}>
                      {/* Show SeeAll button when there are posts */}
                      {data?.totalLosts > 0 && (
                        <SeeAll 
                          foundOrlostId={lostsId} 
                          totalItems={data?.totalLosts}
                          variant="desktop"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Content Section */}
                <Box 
                  sx={{
                    p: { xs: 2, sm: 3 },
                    backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#ffffff',
                    minHeight: '200px',
                  borderTop: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <Recent 
                    recent={data?.recentLosts}
                    isLoading={isLoading}
                    emptyState="NoRecentLosts"
                    maxItems={4}
                  />
                  
                  {/* Mobile See All Button - Bottom (only when there are posts) */}
                  {(data?.totalLosts && data?.totalLosts > 4) && (
                    <Box
                      sx={{
                        display: { xs: 'flex', sm: 'none' },
                        justifyContent: 'center',
                        mt: 3,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                      }}
                    >
                      <SeeAll 
                        foundOrlostId={lostsId} 
                        totalItems={data?.totalLosts}
                        variant="mobile"
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

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
          <QuickActions />

          {/* Categories Section */}
          <Box mb={4}>
            <DashRecents 
              cate="cate" 
              sx={{ 
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                borderRadius: { xs: '12px', sm: '16px' },
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.1)',
                mx: { xs: 1, sm: 2 },
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`
              }}
            >
              <Typography
                fontWeight="700"
                sx={{
                  fontSize: { xs: "20px", sm: "24px", md: "26px" },
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
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
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                borderRadius: { xs: '12px', sm: '16px' },
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.1)',
                mx: { xs: 1, sm: 2 },
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`
              }}
            >
              <Process />
            </DashRecents>
          </Box>

          {/*  Help &Support Section */}
          <Box mb={4}>
            <HelpSupportSection />
          </Box>
        </>
      )}

      
    </Box>
  );
};

export default Dash;
