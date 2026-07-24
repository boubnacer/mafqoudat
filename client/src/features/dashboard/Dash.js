import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme, Typography, Button, Paper, alpha } from "@mui/material";
import { setActiveLink, setFoundOrLost, setOpenModal } from "../../app/state";
import { LoadingState, DashboardEmptyStates } from "../../components/LoadingStates";
import { Language } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { selectCurrentToken } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { authStorage } from "../../utils/authStorage";
import SeoMeta from "../../components/SeoMeta";

// Custom hook
import { useDashboard } from "../../hooks/useDashboard";

// Components
import LeftSide from "../../components/dashboard/LeftSide";
import WorldActivityMap from "../../components/dashboard/WorldActivityMap";
import QuickActions from "../../components/dashboard/QuickActions";
import Categories from "../../components/dashboard/Categories";
import Process from "../../components/dashboard/Process";
import RecentSection from "../../components/dashboard/RecentSection";
import HelpSupportSection from "../../components/dashboard/HelpSupportSection";
import DashRecents from "../../components/dashboard/DashRecents";

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
    currentCountry,
    countriesData,
  } = useDashboard();

  // Keyed by ISO2 code (rather than countriesData's default _id keying) so
  // WorldActivityMap can look up a localized country name from the
  // aggregation's { code, count } rows without a linear search.
  const countriesByCode = useMemo(() => {
    const map = {};
    Object.values(countriesData?.entities || {}).forEach((c) => {
      if (c?.code) map[c.code] = c;
    });
    return map;
  }, [countriesData]);


  const handleCreateNewPost = (type) => {
    if (!user.username) {
      // Store the intended destination for redirect after login
      const intendedDestination = `/dash/posts/new?type=${type}`;
      authStorage.setRedirectAfterLoginWithMessage(intendedDestination, 'loginRequiredCreatePost');

      navigate('/login');
    } else {
      navigate(`/dash/posts/new?type=${type}`);
    }
  };

  // Mirrors LeftSide's panel chrome (theme.custom elevation/radius/ink)
  // instead of the old hardcoded-hex panel. Shared between the empty-state
  // and normal render paths below so the two never drift.
  const categoriesSection = (
    <Box mb={4}>
      <DashRecents
        cate="cate"
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
          boxShadow: theme.custom.elevation.e1,
          mx: { xs: 1, sm: 2 },
          border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
        }}
      >
        <Typography
          fontWeight="700"
          sx={{
            fontSize: { xs: "20px", sm: "24px", md: "26px" },
            color: theme.custom.color.ink,
            textAlign: 'center',
            mb: 2
          }}
        >
          {t('categories')}
        </Typography>
        <Categories />
      </DashRecents>
    </Box>
  );









  // If no country is selected, show country selection prompt
  if (!currentCountry) {
    return (
      <>
        <SeoMeta pageKey="dash" />
        <Box 
          pt={{ xs: "5.5rem", sm: "5.5rem" }} 
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          px={2}
        >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: `${theme.custom.radius.xl}px`,
            textAlign: 'center',
            maxWidth: 400,
            background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
            backdropFilter: 'blur(10px)',
            boxShadow: theme.custom.elevation.e2,
            border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
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
              backgroundColor: theme.custom.color.brandPrimary,
              color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
              boxShadow: theme.custom.elevation.e1,
              borderRadius: `${theme.custom.radius.md}px`,
              px: 3,
              py: 1.5,
              '&:hover': {
                backgroundColor: theme.custom.color.brandPrimary,
                opacity: 0.9,
                boxShadow: theme.custom.elevation.e2,
              }
            }}
          >
            {t('selectCountry')}
          </Button>
        </Paper>
      </Box>
      </>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading && !data) {
    return (
      <>
        <SeoMeta pageKey="dash" />
        <LoadingState message={t('loadingDashboardData')} size="large" />
      </>
    );
  }
  
  // Check if all data is empty - show empty state but still show stats
  const hasNoData = !data?.totalFounds && !data?.totalLosts && !data?.totalPosts && 
                   (!data?.recentFounds || data?.recentFounds.length === 0) && 
                   (!data?.recentLosts || data?.recentLosts.length === 0);

  return (
    <>
      <SeoMeta pageKey="dash" />
      <Box 
        pt={{ xs: "5rem", sm: "4rem" }} 
        width="100%"
        sx={{
          transition: 'padding 0.3s ease',
        background: `linear-gradient(180deg, ${theme.custom.color.surfaceBase} 0%, ${theme.custom.color.surfaceBase} 100%)`,
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

      {/* Header Section with Stats and World Activity Map. Two genuinely
          different layouts (branched in JS via the existing `isMobile`,
          not CSS display toggling) rather than mounting WorldActivityMap
          twice — both unify LeftSide and the map into one section where
          the map is a full-bleed backdrop behind a translucent LeftSide
          panel: side by side on desktop, stacked (LeftSide above a
          reserved spacer row) on mobile. */}
      {isMobile ? (
        <Box
          mb={4}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            borderRadius: `${theme.custom.radius.lg}px`,
            backgroundColor: theme.custom.color.surfaceBase,
            border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
            boxShadow: theme.custom.elevation.e1,
          }}
        >
          {!hasNoData && (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={countriesData?.entities?.[currentCountry]?.code}
                countriesByCode={countriesByCode}
                isLoading={isLoading}
              />
            </Box>
          )}
          <Box sx={{ position: 'relative', p: 2, display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <LeftSide
              totalFounds={data?.totalFounds}
              totalLosts={data?.totalLosts}
              totalPosts={data?.totalPosts}
              totalReturned={data?.totalReturned}
              foundsToday={data?.createdToday?.todaysFoundPosts}
              lostsToday={data?.createdToday?.todaysLostPosts}
            />
            {/* Reserves the vertical space the map's own visual area used
                to occupy as its own square card — the actual map now
                renders behind this (and behind LeftSide) via the
                absolutely-positioned layer above, panned/cropped to land
                the country back in roughly this spot (see
                WorldActivityMap's mobile crop math). */}
            {!hasNoData && <Box sx={{ width: '100%', aspectRatio: '1 / 1', minHeight: 300 }} />}
          </Box>
        </Box>
      ) : (
        <Box
          mb={4}
          sx={{
            position: 'relative',
            maxWidth: { sm: '100%', md: '100%', lg: '1400px', xl: '1600px' },
            overflow: 'hidden',
            width: '100%',
            margin: '0 auto',
            borderRadius: `${theme.custom.radius.xl}px`,
            // Fallback tone for the map's "ocean" — the SVG has no fill of
            // its own outside the country shapes, so without this the gaps
            // would just show the plain page background.
            backgroundColor: theme.custom.color.surfaceBase,
            border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
            boxShadow: theme.custom.elevation.e1,
          }}
        >
          {!hasNoData && (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={countriesData?.entities?.[currentCountry]?.code}
                countriesByCode={countriesByCode}
                isLoading={isLoading}
              />
            </Box>
          )}

          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'flex-start' }}>
            <Box sx={{ width: '50%', minWidth: 0, p: { sm: 3, md: 4, lg: 5, xl: 6 } }}>
              <LeftSide
                totalFounds={data?.totalFounds}
                totalLosts={data?.totalLosts}
                totalPosts={data?.totalPosts}
                totalReturned={data?.totalReturned}
                foundsToday={data?.createdToday?.todaysFoundPosts}
                lostsToday={data?.createdToday?.todaysLostPosts}
              />
            </Box>
          </Box>
        </Box>
      )}

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

      {/* Show Categories and Process sections when there are no posts */}
      {hasNoData && (
        <>
          {/* Categories Section - Show when no posts */}
          {categoriesSection}

          {/* Process Section - Show when no posts */}
          <Box mb={4} mx={{ xs: 1, sm: 2 }}>
            <Process />
          </Box>

          {/* Help &Support Section - Show when no posts */}
          <Box mb={4}>
            <HelpSupportSection />
          </Box>
        </>
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

          {/* Recent Founds / Recent Losts - paired panels, side by side on
              desktop, stacked on mobile. Rendered together whenever the
              country has any data at all; each panel independently falls
              back to its own empty state + CTA when that type's count is 0,
              rather than the whole panel disappearing. */}
          <Box
            mb={4}
            mx={{ xs: 1, sm: 2 }}
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 4 },
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <RecentSection
              type="found"
              items={data?.recentFounds}
              totalItems={data?.totalFounds}
              isLoading={isLoading}
              onCreatePost={handleCreateNewPost}
              foundOrlostId={foundsId}
            />
            <RecentSection
              type="lost"
              items={data?.recentLosts}
              totalItems={data?.totalLosts}
              isLoading={isLoading}
              onCreatePost={handleCreateNewPost}
              foundOrlostId={lostsId}
            />
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
          <QuickActions />

          {/* Categories Section */}
          {categoriesSection}

          {/* Process Section */}
          <Box mb={4} mx={{ xs: 1, sm: 2 }}>
            <Process />
          </Box>

          {/*  Help &Support Section */}
          <Box mb={4}>
            <HelpSupportSection />
          </Box>
        </>
      )}

      
    </Box>
    </>
  );
};

export default Dash;
