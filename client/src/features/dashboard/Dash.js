import React, { useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme, Typography, Button, Paper, alpha } from "@mui/material";
import { setActiveLink, setCurrentCountry, setFoundOrLost, setOpenModal } from "../../app/state";
import { DashboardEmptyStates } from "../../components/LoadingStates";
import { Language } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { selectCurrentToken } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { authStorage } from "../../utils/authStorage";
import SeoMeta from "../../components/SeoMeta";

// Custom hook
import { useDashboard } from "../../hooks/useDashboard";
import { useDashboardMotion } from "./useDashboardMotion";
import { useGetflOptionsQuery } from "../dependencies/dependenciesApiSlice";

import LeftSide from "../../components/dashboard/LeftSide";
import WorldActivityMap from "../../components/dashboard/WorldActivityMap";
import SearchReportHub from "../../components/dashboard/SearchReportHub";
import Categories from "../../components/dashboard/Categories";
import Process from "../../components/dashboard/Process";
import RecentSection from "../../components/dashboard/RecentSection";
import HelpSupportSection from "../../components/dashboard/HelpSupportSection";
import DashRecents from "../../components/dashboard/DashRecents";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import CountryWelcomeDialog from "../../components/dashboard/CountryWelcomeDialog";
import CyberDotMatrix from "../../components/dashboard/CyberDotMatrix";


const Dash = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery("(max-width:600px)");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar' || theme.direction === 'rtl';
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
    showCountryWelcomeDialog,
    setShowCountryWelcomeDialog,
    detectedCountryCode,
  } = useDashboard();

  // The FoundLost options' own database ids, for the "see all" links below -
  // these used to be hardcoded ObjectIds copied from a database dump
  // ("Updated FoundLost IDs from the database"), which breaks silently the
  // moment that collection is ever reseeded (the DB, not this file, is what
  // actually assigns these ids). Read live instead, off the same query the
  // rest of the app already uses for this data.
  const { data: flOptionsData } = useGetflOptionsQuery({ language: currentLanguage });
  const foundsId = useMemo(() => (
    flOptionsData?.ids
      ?.map((id) => flOptionsData.entities[id])
      .find((option) => option?.code === 'FOUND')?.id
  ), [flOptionsData]);
  const lostsId = useMemo(() => (
    flOptionsData?.ids
      ?.map((id) => flOptionsData.entities[id])
      .find((option) => option?.code === 'LOST')?.id
  ), [flOptionsData]);

  // Root of the animated page. The reveal choreography lives in
  // useDashboardMotion and finds its targets through the data-reveal
  // attributes below, so nothing in this file has to import GSAP.
  const pageRef = useRef(null);

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


  // Keyed on the loading flag: while it is true this component returns
  // <DashboardSkeleton /> and none of the marked elements exist yet, so a
  // mount-only hook would find an empty page and never run again.
  useDashboardMotion(pageRef, {
    ready: Boolean(currentCountry) && !(isLoading && !data),
    dependencies: [isMobile],
  });

  const handleCreateNewPost = (type) => {
    const isUserLoggedIn = Boolean(user.username || authStorage.isAuthenticated());
    if (!isUserLoggedIn) {
      // Store the intended destination for redirect after login
      const intendedDestination = `/dash/posts/new?type=${type}`;
      authStorage.setRedirectAfterLoginWithMessage(intendedDestination, 'loginRequiredCreatePost');

      window.location.href = '/login';
    } else {
      window.location.href = `/dash/posts/new?type=${type}`;
    }
  };

  const handleConfirmCountry = (countryId) => {
    if (countryId) {
      dispatch(setCurrentCountry({ currentCountry: countryId }));
    }
    localStorage.setItem('countryConfirmed', 'true');
    setShowCountryWelcomeDialog(false);
  };

  const handleCloseCountryWelcome = (countryId) => {
    if (countryId) {
      dispatch(setCurrentCountry({ currentCountry: countryId }));
    }
    localStorage.setItem('countryConfirmed', 'true');
    setShowCountryWelcomeDialog(false);
  };

  const welcomeDialogElement = (
    <CountryWelcomeDialog
      open={Boolean(showCountryWelcomeDialog)}
      onConfirm={handleConfirmCountry}
      onClose={handleCloseCountryWelcome}
      countriesData={countriesData}
      detectedCountryCode={detectedCountryCode}
      currentCountryId={currentCountry}
    />
  );

  // Same glass-panel treatment QuickActions uses just below this section on
  // the page: the surfaceRaised gradient + blur it already had, now with a
  // pair of soft blurred brand-color blobs tucked behind the content so the
  // two adjoining sections read as one family instead of one plain panel
  // sitting next to one "colorful" one. Blob placement is mirrored (not
  // identical) — top-end/bottom-start here vs QuickActions' top-start/
  // bottom-end — so the two panels don't look like exact copies stacked
  // back to back.
  // Same glass-blob family, applied only to the Box that wraps the map (not
  // WorldActivityMap.jsx itself — that component's own edge-fade/vignette
  // treatment was already re-tuned and reverted twice per its own notes, so
  // a colored wash competing with it there is exactly the mistake to avoid).
  // This blob sits behind the absolutely-positioned map layer and shows
  // only where the map's own fill doesn't reach (the "ocean" gaps this
  // Box's surfaceBase fallback already covers), so it reads as a touch of
  // depth around the edges rather than a tint over the map.
  const mapBlob = (position) => ({
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(theme.custom.color.brandLogo, isDark ? 0.16 : 0.1)} 0%, ${alpha(theme.custom.color.brandLogo, 0)} 70%)`,
    filter: 'blur(24px)',
    pointerEvents: 'none',
    zIndex: 0,
    ...position,
  });

  // Mirrors LeftSide's panel chrome (theme.custom elevation/radius/ink)
  // instead of the old hardcoded-hex panel. Shared between the empty-state
  // and normal render paths below so the two never drift.
  // Shared divider between homepage sections — same treatment for every
  // gap on the page (header/RecentSection/QuickActions/Categories/Process/
  // HelpSupport) rather than a one-off between just two of them.
  const sectionDivider = (
    <Box
      data-reveal="divider"
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
  );

  const categoriesSection = (
    <Box mb={4} data-reveal="section">
      <DashRecents
        cate="cate"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
          boxShadow: 'none',
          mx: { xs: 1, sm: 2 },
        }}
      >
        {/* Cyber dot matrix SVG background matching category blobs */}
        <CyberDotMatrix
          idPrefix="dots-categories"
          colorTop={theme.custom.color.brandLogo}
          colorBottom={theme.custom.color.brandPrimary}
          inverted={true}
          zIndex={0}
        />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography
            fontWeight="700"
            align="center"
            sx={{
              fontSize: { xs: "20px", sm: "24px", md: "26px" },
              color: theme.custom.color.ink,
              textAlign: 'center',
              mb: 2
            }}
          >
            {t('browseByCategory')}
          </Typography>
          <Categories />
        </Box>
      </DashRecents>
    </Box>
  );









  // If no country is selected yet: while countriesData is loading or being resolved,
  // render the DashboardSkeleton so users and crawlers don't see a blocking "Please select country" gate.
  if (!currentCountry) {
    if (!countriesData || !countriesData.ids || countriesData.ids.length === 0) {
      return (
        <>
          <SeoMeta pageKey="home" />
          <Box
            pt={{ xs: "5rem", sm: "4rem" }}
            width="100%"
            sx={{
              background: `linear-gradient(180deg, ${theme.custom.color.surfaceBase} 0%, ${theme.custom.color.surfaceBase} 100%)`,
              minHeight: '100vh',
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
              overflowX: 'hidden',
            }}
          >
            <DashboardSkeleton />
          </Box>
          {welcomeDialogElement}
        </>
      );
    }

    return (
      <>
        <SeoMeta pageKey="home" />
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
            boxShadow: 'none',
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
      {welcomeDialogElement}
      </>
    );
  }

  // Show loading state while data is being fetched — mirrors mobile's
  // HomeScreen approach of rendering the real page shell with skeleton
  // placeholders in place, instead of blocking behind a full-page spinner.
  if (isLoading && !data) {
    return (
      <>
        <SeoMeta pageKey="home" />
        <Box
          pt={{ xs: "5rem", sm: "4rem" }}
          width="100%"
          sx={{
            background: `linear-gradient(180deg, ${theme.custom.color.surfaceBase} 0%, ${theme.custom.color.surfaceBase} 100%)`,
            minHeight: '100vh',
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
            overflowX: 'hidden',
          }}
        >
          <DashboardSkeleton />
        </Box>
        {welcomeDialogElement}
      </>
    );
  }
  
  // Check if all data is empty - show empty state but still show stats
  const hasNoData = !data?.totalFounds && !data?.totalLosts && !data?.totalPosts && 
                   (!data?.recentFounds || data?.recentFounds.length === 0) && 
                   (!data?.recentLosts || data?.recentLosts.length === 0);

  return (
    <>
      <SeoMeta pageKey="home" />
      <Box 
        ref={pageRef}
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
            boxShadow: 'none',
          }}
        >
          <Box sx={mapBlob({ top: -100, insetInlineEnd: -80 })} />
          {!hasNoData && (
            <Box data-reveal="map" sx={{ position: 'absolute', inset: 0 }}>
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={countriesData?.entities?.[currentCountry]?.code}
                countriesByCode={countriesByCode}
                isLoading={isLoading}
              />
            </Box>
          )}
          <Box sx={{ position: 'relative', p: 2, display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
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
                WorldActivityMap's mobile crop math). The grid gap above
                (36px, up from 20px) is the breathing room between the
                stats panel and the map beneath it — since the map is a
                full-bleed backdrop stretched to the whole header's height,
                widening this gap grows that height and pushes the map's
                fixed-% crop further down relative to LeftSide. */}
            {!hasNoData && (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  minHeight: 300,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: `${theme.custom.radius.lg}px`,
                  pointerEvents: 'none',
                }}
              >
                {/* Cyber dot matrix SVG background for Mobile Map - inversed from Statistics */}
                <Box
                  component="svg"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    opacity: isDark ? 0.5 : 0.85,
                    zIndex: 1,
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="dot-matrix-map-mobile" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
                      <circle cx="2.25" cy="2.25" r={isDark ? 0.72 : 0.9} fill={theme.custom.color.brandLogo} />
                    </pattern>
                    {/* For Map: inversed from Statistics.
                        In LTR: top-right (cx=100%, cy=0%) and bottom-left (cx=0%, cy=100%).
                        In RTL: top-left (cx=0%, cy=0%) and bottom-right (cx=100%, cy=100%). */}
                    <radialGradient
                      id="top-glow-map-mobile"
                      cx={isRTL ? "0%" : "100%"}
                      cy="0%"
                      r="48%"
                    >
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient
                      id="bottom-glow-map-mobile"
                      cx={isRTL ? "100%" : "0%"}
                      cy="100%"
                      r="48%"
                    >
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <mask id="top-mask-map-mobile">
                      <rect width="100%" height="100%" fill="url(#top-glow-map-mobile)" />
                    </mask>
                    <mask id="bottom-mask-map-mobile">
                      <rect width="100%" height="100%" fill="url(#bottom-glow-map-mobile)" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dot-matrix-map-mobile)" mask="url(#top-mask-map-mobile)" />
                  <rect width="100%" height="100%" fill="url(#dot-matrix-map-mobile)" mask="url(#bottom-mask-map-mobile)" />
                </Box>
              </Box>
            )}
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
            boxShadow: 'none',
          }}
        >
          <Box sx={mapBlob({ bottom: -110, insetInlineStart: -80 })} />
          {!hasNoData && (
            <Box data-reveal="map" sx={{ position: 'absolute', inset: 0 }}>
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={countriesData?.entities?.[currentCountry]?.code}
                countriesByCode={countriesByCode}
                isLoading={isLoading}
              />
            </Box>
          )}

          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'flex-start',
              p: { sm: 3, md: 4, lg: 5, xl: 6 },
            }}
          >
            <Box sx={{ width: '50%', minWidth: 0 }}>
              <LeftSide
                totalFounds={data?.totalFounds}
                totalLosts={data?.totalLosts}
                totalPosts={data?.totalPosts}
                totalReturned={data?.totalReturned}
                foundsToday={data?.createdToday?.todaysFoundPosts}
                lostsToday={data?.createdToday?.todaysLostPosts}
              />
            </Box>
            {!hasNoData && (
              <Box
                sx={{
                  width: '50%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  pointerEvents: 'none',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    flex: 1,
                    overflow: 'hidden',
                    borderRadius: `${theme.custom.radius.xl}px`,
                  }}
                >
                  {/* Cyber dot matrix SVG background for Desktop Map - inversed from Statistics */}
                  <Box
                    component="svg"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      opacity: isDark ? 0.5 : 0.85,
                      zIndex: 1,
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern id="dot-matrix-map-desktop" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
                        <circle cx="2.25" cy="2.25" r={isDark ? 0.72 : 0.9} fill={theme.custom.color.brandLogo} />
                      </pattern>
                      {/* For Map: inversed from Statistics.
                          In LTR: top-right (cx=100%, cy=0%) and bottom-left (cx=0%, cy=100%).
                          In RTL: top-left (cx=0%, cy=0%) and bottom-right (cx=100%, cy=100%). */}
                      <radialGradient
                        id="top-glow-map-desktop"
                        cx={isRTL ? "0%" : "100%"}
                        cy="0%"
                        r="48%"
                      >
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
                        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient
                        id="bottom-glow-map-desktop"
                        cx={isRTL ? "100%" : "0%"}
                        cy="100%"
                        r="48%"
                      >
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
                        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </radialGradient>
                      <mask id="top-mask-map-desktop">
                        <rect width="100%" height="100%" fill="url(#top-glow-map-desktop)" />
                      </mask>
                      <mask id="bottom-mask-map-desktop">
                        <rect width="100%" height="100%" fill="url(#bottom-glow-map-desktop)" />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dot-matrix-map-desktop)" mask="url(#top-mask-map-desktop)" />
                    <rect width="100%" height="100%" fill="url(#dot-matrix-map-desktop)" mask="url(#bottom-mask-map-desktop)" />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Show empty state if no posts, but still show stats above */}
      {hasNoData && (
        <>
          {sectionDivider}
          <SearchReportHub />
          {sectionDivider}
          <Box mb={4} data-reveal="section">
            <DashboardEmptyStates.NoPosts
              country={currentCountry}
              countriesData={countriesData}
              onCreatePost={handleCreateNewPost}
            />
          </Box>
        </>
      )}

      {/* Show Categories and Process sections when there are no posts */}
      {hasNoData && (
        <>
          {sectionDivider}

          {/* Categories Section - Show when no posts */}
          {categoriesSection}

          {sectionDivider}

          {/* Process Section - Show when no posts */}
          <Box mb={4} mx={{ xs: 1, sm: 2 }}>
            <Process />
          </Box>

          {sectionDivider}

          {/* Help &Support Section - Show when no posts */}
          <Box mb={4} data-reveal="section">
            <HelpSupportSection />
          </Box>

        </>
      )}

      {/* Only show content sections if there are posts */}
      {!hasNoData && (
        <>
          {sectionDivider}

          {/* Search & Report Hub */}
          <SearchReportHub />

          {sectionDivider}

          {/* Recent Founds / Recent Losts - paired panels inside a shared frosted shell with CyberDotMatrix */}
          <Box
            mb={4}
            mx={{ xs: 1, sm: 2 }}
            data-reveal="section"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
              boxShadow: 'none',
              p: { xs: 1.5, sm: 2, md: 2.5 },
            }}
          >
            {/* Cyber dot matrix SVG background on parent container with semantic status tone (found: green, lost: red) */}
            <CyberDotMatrix
              idPrefix="dots-recents-parent"
              colorTop={theme.custom.status.found.main}
              colorBottom={theme.custom.status.lost.main}
              glowRadius="60%"
              zIndex={0}
            />

            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gap: { xs: 2.5, md: 3 },
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
          </Box>

          {sectionDivider}

          {/* Categories Section */}
          {categoriesSection}

          {sectionDivider}

          {/* Process Section — deliberately not marked: Process runs its
              own local GSAP reveal, and a second one on the same nodes
              would fight it. */}
          <Box mb={4} mx={{ xs: 1, sm: 2 }}>
            <Process />
          </Box>

          {sectionDivider}

          {/*  Help &Support Section */}
          <Box mb={4} data-reveal="section">
            <HelpSupportSection />
          </Box>

        </>
      )}

      
    </Box>
    {welcomeDialogElement}
    </>
  );
};

export default Dash;
