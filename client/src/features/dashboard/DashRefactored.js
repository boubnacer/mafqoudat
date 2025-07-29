import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Skeleton, useMediaQuery, useTheme } from "@mui/material";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import PulseLoader from "react-spinners/PulseLoader";

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

// Constants
const lostsId = "63cc3484bc901245d3a1cb5a";
const foundsId = "66e60c25420ca2a42499b924";

const DashRefactored = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");

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
  } = useDashboard();

  const handleCreateNewPost = (type) => {
    navigate(`/dash/posts/new?type=${type}`);
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

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  if (isError) console.log(data?.error?.message);

  if (!data) return <PulseLoader color={"#FFF"} />;

  if (!data.currentCountry) return <PulseLoader color={"#FFF"}/>

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

      {/* Quick Actions */}
      <QuickActions />

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

      {/* Success Stories Section */}
      <SuccessStories />

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
          mx: { xs: 1, sm: 2 }
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
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', sm: 'auto' }}>
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <WhatshotOutlined sx={{ color: '#FFA500' }} />
              RECENT FOUNDS
            </Typography>
            <Chip 
              label={`${data?.totalFounds || 0} items`}
              color="primary"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff'
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
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentFounds} 
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
                  height: { xs: '140px', sm: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
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
          mx: { xs: 1, sm: 2 }
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
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', sm: 'auto' }}>
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Search sx={{ color: '#fff' }} />
              RECENT LOSTS
            </Typography>
            <Chip 
              label={`${data?.totalLosts || 0} items`}
              color="warning"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff'
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
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentLosts}
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
                  height: { xs: '140px', sm: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </FlexCenter>
        </Box>
      </DashRecents>

      {/* Community Section */}
      <CommunitySection />

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
            CATEGORIES
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

export default DashRefactored; 