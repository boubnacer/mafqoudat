import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/translations';
import { isRTL } from '../../utils/languageUtils';
import {
  TaskAltOutlined,
  SearchOffOutlined,
  Search,
  ArrowForwardIosRounded,
  InfoOutlined,
} from '@mui/icons-material';
import GuidedSearchDialog from './GuidedSearchDialog';

const SearchReportHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();
  const isDark = theme.palette.mode === 'dark';
  const { surfaceRaised, ink, brandPrimary, brandLogo } = theme.custom.color;
  const white = theme.palette.common.white;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('lost');

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const goToAllListings = () => {
    navigate('/dash/posts');
  };

  // Glass panel styling
  const glassPanel = (radius) => ({
    position: 'relative',
    backgroundColor: alpha(surfaceRaised, isDark ? 0.55 : 0.7),
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${alpha(brandPrimary, isDark ? 0.28 : 0.18)}`,
    borderRadius: `${radius}px`,
    boxShadow: theme.custom.elevation.e1,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      insetInlineStart: 0,
      insetInlineEnd: 0,
      top: 0,
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${alpha(white, isDark ? 0.3 : 0.75)}, transparent)`,
    },
  });

  // Ambient blurred glow blobs
  const blob = (color, position) => ({
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(color, isDark ? 0.3 : 0.22)} 0%, ${alpha(color, 0)} 70%)`,
    filter: 'blur(20px)',
    pointerEvents: 'none',
    ...position,
  });

  // Touch gesture handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchMoved, setTouchMoved] = useState(false);

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    });
    setTouchMoved(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    if (deltaX > 10 || deltaY > 10) {
      setTouchMoved(true);
    }
  };

  const handleTouchEnd = (e, action) => {
    if (!touchStart) return;
    const touchDuration = Date.now() - touchStart.time;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);
    if (!touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 500) {
      action();
    }
    setTouchStart(null);
    setTouchMoved(false);
  };

  const handleKeyActivate = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const primaryActions = [
    {
      key: 'lost',
      title: t('iLostAnItem') || 'I Lost an Item',
      subtitle: t('tapHereToReport') || 'Search or report lost item',
      icon: SearchOffOutlined,
      tone: theme.custom.status.lost,
      action: () => handleOpenDialog('lost'),
    },
    {
      key: 'found',
      title: t('iFoundAnItem') || 'I Found an Item',
      subtitle: t('tapHereToReport') || 'Search or report found item',
      icon: TaskAltOutlined,
      tone: theme.custom.status.found,
      action: () => handleOpenDialog('found'),
    },
  ];

  return (
    <>
      <Box
        data-reveal="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 },
          background: `linear-gradient(135deg, ${alpha(surfaceRaised, 0.95)} 0%, ${alpha(surfaceRaised, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
          boxShadow: 'none',
          padding: isMobile ? '1.5rem' : '2rem',
        }}
      >
        <Box sx={blob(brandPrimary, { top: -90, insetInlineStart: -70 })} />
        <Box sx={blob(brandLogo, { bottom: -110, insetInlineEnd: -70 })} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: isMobile ? 2.5 : 3 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                fontFamily: theme.custom.font.display,
                fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' },
                color: ink,
                mb: 1,
              }}
            >
              {t('searchReportHubTitle') || 'Looking for an item, or found something?'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: theme.custom.font.body,
                color: alpha(ink, 0.68),
                fontSize: { xs: '0.9rem', sm: '1rem' },
                maxWidth: 580,
                mx: 'auto',
                lineHeight: 1.5,
              }}
            >
              {t('searchReportHubSubtitle') ||
                'Search our community posts before creating a new report to avoid duplicates.'}
            </Typography>
          </Box>

          {/* Search all listings prompt bar */}
          <Box
            sx={{
              ...glassPanel(theme.custom.radius.md),
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 1.25, sm: 1.5 },
              p: { xs: 1.25, sm: 1.5 },
              mb: { xs: 2, sm: 2.5 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: '1 1 220px', minWidth: 0 }}>
              <InfoOutlined sx={{ fontSize: 20, color: brandPrimary, flexShrink: 0, mt: '1px' }} />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: theme.custom.font.body,
                  color: alpha(ink, 0.8),
                  fontSize: { xs: '0.82rem', sm: '0.88rem' },
                  lineHeight: 1.4,
                }}
              >
                {t('browseBeforePostTip') ||
                  'Check existing listings first. Many lost items have already been found and reported!'}
              </Typography>
            </Box>

            <Box
              data-reveal-item=""
              role="button"
              tabIndex={0}
              onClick={goToAllListings}
              onKeyDown={(e) => handleKeyActivate(e, goToAllListings)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd(e, goToAllListings);
              }}
              sx={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: { xs: 1.75, sm: 2.25 },
                py: { xs: 0.75, sm: 0.9 },
                borderRadius: '999px',
                backgroundColor: brandPrimary,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: theme.custom.elevation.e1,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  boxShadow: theme.custom.elevation.e2,
                  transform: 'translateY(-2px)',
                },
                '&:focus-visible': {
                  boxShadow: `0 0 0 2px ${alpha(white, 0.6)}`,
                },
              }}
            >
              <Search sx={{ fontSize: 18, color: white }} />
              <Typography
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontWeight: 600,
                  fontSize: { xs: '0.82rem', sm: '0.88rem' },
                  color: white,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('searchAllListings') || 'Search all listings'}
              </Typography>
            </Box>
          </Box>

          {/* Two prominent action cards */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: isRTLMode ? 'row-reverse' : 'row' },
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            {primaryActions.map((item) => {
              const Icon = item.icon;
              return (
                <Box
                  key={item.key}
                  data-reveal-item=""
                  role="button"
                  tabIndex={0}
                  onClick={item.action}
                  onKeyDown={(e) => handleKeyActivate(e, item.action)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleTouchEnd(e, item.action);
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    p: { xs: 2.25, sm: 2.75 },
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: `${theme.custom.radius.lg}px`,
                    backgroundColor: alpha(item.tone.main, isDark ? 0.16 : 0.08),
                    border: `1px solid ${alpha(item.tone.main, isDark ? 0.4 : 0.28)}`,
                    boxShadow: theme.custom.elevation.e1,
                    transition:
                      'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(item.tone.main, isDark ? 0.24 : 0.14),
                      borderColor: item.tone.main,
                      boxShadow: theme.custom.elevation.e2,
                      transform: 'translateY(-3px)',
                    },
                    '&:focus-visible': {
                      boxShadow: `${theme.custom.elevation.e2}, inset 0 0 0 2px ${item.tone.main}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: { xs: 52, sm: 60 },
                      height: { xs: 52, sm: 60 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: item.tone.bg,
                      border: `2px solid ${alpha(item.tone.main, 0.35)}`,
                    }}
                  >
                    <Icon sx={{ fontSize: { xs: 26, sm: 30 }, color: item.tone.main }} />
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        fontFamily: theme.custom.font.display,
                        color: ink,
                        fontSize: { xs: '1.05rem', sm: '1.18rem' },
                        lineHeight: 1.3,
                        mb: 0.35,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: theme.custom.font.body,
                        color: alpha(ink, 0.72),
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        lineHeight: 1.3,
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <ArrowForwardIosRounded
                    sx={{
                      flexShrink: 0,
                      fontSize: 16,
                      color: item.tone.main,
                      opacity: 0.85,
                      transform: isRTLMode ? 'scaleX(-1)' : 'none',
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Guided Search Modal */}
      <GuidedSearchDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        initialType={dialogType}
      />
    </>
  );
};

export default SearchReportHub;
