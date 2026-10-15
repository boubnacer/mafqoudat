import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, alpha } from '@mui/material';
import { useTranslation } from '../../utils/translations';
import { isRTL } from '../../utils/languageUtils';
import {
  TaskAltOutlined,
  SearchOffOutlined,
  ArrowForwardIosRounded,
} from '@mui/icons-material';
import GuidedSearchDialog from './GuidedSearchDialog';
import CyberDotMatrix from './CyberDotMatrix';

const SearchReportHub = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = currentLanguage === 'ar' || isRTL();
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
      title: t('iLostAnItem') || 'Did you lose something?',
      subtitle: t('tapHereToReport') || 'Search or report lost item',
      icon: SearchOffOutlined,
      tone: theme.custom.status.lost,
      action: () => handleOpenDialog('lost'),
    },
    {
      key: 'found',
      title: t('iFoundAnItem') || 'Did you find something?',
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
        dir={isRTLMode ? 'rtl' : 'ltr'}
        sx={{
          ...theme.custom.sectionCard,
          isolation: 'isolate',
          direction: isRTLMode ? 'rtl' : 'ltr',
          mb: 4,
          padding: { xs: '2.4rem 1.25rem 2.8rem', sm: '2.5rem', md: '1.75rem 2rem 2rem' },
          color: theme.custom.color.ink,
        }}
      >
        {/* Cyber dot matrix SVG background — matches Process.jsx */}
        <CyberDotMatrix
          idPrefix="dots-search-hub"
          inverted={true}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3.2, sm: 2.8, md: 3.2 } }}>
            <Typography
              variant="h5"
              component="h2"
              align="center"
              sx={{
                fontFamily: theme.custom.font.display,
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.65rem', md: '1.95rem' },
                lineHeight: { xs: 1.25, sm: 1.2 },
                color: isDark ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.025em',
                textAlign: 'center',
              }}
            >
              {t('searchReportHubTitle') || 'Start with these essential actions'}
            </Typography>
            <Box
              sx={{
                width: { xs: 52, sm: 56 },
                height: 3.5,
                borderRadius: 99,
                mx: 'auto',
                mt: 1.25,
                background: `linear-gradient(90deg, ${brandPrimary}, ${brandLogo})`,
                boxShadow: `0 2px 10px ${alpha(brandPrimary, 0.28)}`,
              }}
            />
          </Box>

          {/* Two prominent action buttons: horizontal row on mobile, vertical cards on desktop */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              direction: isRTLMode ? 'rtl' : 'ltr',
              gap: { xs: 2.4, sm: 2.5 },
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
                  aria-label={`${item.title} - ${item.subtitle}`}
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
                    minHeight: { xs: 126, sm: 'auto' },
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    direction: isRTLMode ? 'rtl' : 'ltr',
                    alignItems: 'center',
                    textAlign: { xs: isRTLMode ? 'right' : 'left', sm: 'center' },
                    gap: { xs: 2.2, sm: 0 },
                    p: { xs: '24px 20px', sm: 2.5, md: 3 },
                    pt: { sm: 2.8, md: 3.2 },
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: { xs: '20px', sm: '28px' },
                    backgroundColor: isDark
                      ? 'rgba(16, 25, 44, 0.88)'
                      : '#F1F5F9',
                    backdropFilter: 'blur(20px) saturate(1.15)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.15)',
                    border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(226, 232, 240, 0.95)'}`,
                    boxShadow: 'none',
                    transition: 'transform 0.28s cubic-bezier(0.34, 1.26, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease, background-color 0.28s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(22, 34, 58, 0.95)'
                        : '#ffffff',
                      borderColor: isDark ? alpha(item.tone.main, 0.8) : item.tone.main,
                      boxShadow: isDark
                        ? '0 18px 42px rgba(0, 0, 0, 0.52), 0 6px 16px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                        : '0 18px 40px rgba(15, 23, 42, 0.10), 0 6px 16px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)',
                      transform: 'translateY(-4px)',
                      '& .action-icon-circle': {
                        transform: { sm: 'scale(1.06)' },
                        boxShadow: isDark
                          ? `0 10px 24px ${alpha(item.tone.main, 0.28)}`
                          : `0 8px 20px ${alpha(item.tone.main, 0.18)}`,
                      },
                      '& .action-button-pill': {
                        borderColor: item.tone.main,
                        backgroundColor: item.tone.main,
                        color: '#ffffff',
                        boxShadow: `0 6px 18px ${alpha(item.tone.main, 0.36)}`,
                        transform: 'translateY(-1px)',
                      },
                      '& .action-chevron': {
                        transform: isRTLMode ? 'scaleX(-1) translateX(4px)' : 'translateX(4px)',
                        borderColor: item.tone.main,
                        backgroundColor: isDark ? alpha(item.tone.main, 0.22) : alpha(item.tone.main, 0.14),
                      },
                    },
                    '&:active': {
                      transform: 'translateY(-1px) scale(0.99)',
                      boxShadow: isDark
                        ? '0 6px 18px rgba(0, 0, 0, 0.40)'
                        : '0 4px 14px rgba(15, 23, 42, 0.05)',
                    },
                    '&:focus-visible': {
                      borderColor: item.tone.main,
                      outline: 'none',
                      boxShadow: `0 0 0 3px ${alpha(item.tone.main, 0.24)}, 0 12px 30px rgba(15, 23, 42, 0.10)`,
                    },
                  }}
                >
                  {/* Cyber dot matrix: top-bottom on mobile, left-right-edges on desktop */}
                  <CyberDotMatrix
                    idPrefix={`dots-hub-${item.key}`}
                    placement={isMobile ? 'top-bottom' : 'left-right-edges'}
                    colorTop={item.tone.main}
                    colorBottom={item.tone.main}
                    dotRadius={isDark ? 0.75 : 0.9}
                    opacity={isDark ? (isMobile ? 0.75 : 0.68) : (isMobile ? 0.88 : 0.82)}
                  />

                  {/* Icon Bubble */}
                  <Box
                    className="action-icon-circle"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      flexShrink: 0,
                      width: { xs: 66, sm: 64 },
                      height: { xs: 66, sm: 64 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#ffffff',
                      border: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)',
                      boxShadow: isDark
                        ? '0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                        : '0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
                      mb: { xs: 0, sm: 1.8 },
                      transition: 'transform 0.30s cubic-bezier(0.34, 1.26, 0.64, 1), box-shadow 0.30s ease',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `linear-gradient(180deg, ${alpha(white, isDark ? 0.08 : 0.85)} 0%, transparent 54%)`,
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <Icon sx={{ position: 'relative', fontSize: { xs: 34, sm: 30 }, color: item.tone.main }} />
                  </Box>

                  {/* Text Block */}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      minWidth: 0,
                      flex: { xs: 1, sm: 'none' },
                      textAlign: { xs: isRTLMode ? 'right' : 'left', sm: 'center' },
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        fontFamily: theme.custom.font.display,
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: { xs: '1.24rem', sm: '1.18rem', md: '1.25rem' },
                        lineHeight: { xs: 1.35, sm: 1.25 },
                        letterSpacing: '-0.02em',
                        mb: { xs: 0.55, sm: 0.45 },
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: theme.custom.font.body,
                        color: isDark ? '#cbd5e1' : '#475569',
                        fontSize: { xs: '0.92rem', sm: '0.86rem', md: '0.90rem' },
                        lineHeight: { xs: 1.5, sm: 1.4 },
                        maxWidth: { sm: 320 },
                        mx: { sm: 'auto' },
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  {/* Mobile Chevron Badge */}
                  <Box
                    className="action-chevron"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: { xs: 'flex', sm: 'none' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: isDark ? alpha(item.tone.main, 0.12) : alpha(item.tone.main, 0.08),
                      border: `1px solid ${alpha(item.tone.main, isDark ? 0.28 : 0.18)}`,
                      flexShrink: 0,
                      transform: isRTLMode ? 'scaleX(-1)' : 'none',
                      transition: 'transform 0.22s ease, background-color 0.22s ease, border-color 0.22s ease',
                    }}
                  >
                    <ArrowForwardIosRounded
                      sx={{
                        fontSize: 15,
                        color: item.tone.main,
                      }}
                    />
                  </Box>

                  {/* Desktop Action Pill Button */}
                  <Box
                    className="action-button-pill"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: { xs: 'none', sm: 'inline-flex' },
                      mt: { sm: 1.8, md: 2.2 },
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.65,
                      px: { sm: 2.2, md: 2.6 },
                      py: { sm: 0.65, md: 0.72 },
                      borderRadius: '999px',
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#ffffff',
                      border: isDark
                        ? '1px solid rgba(51, 65, 85, 0.6)'
                        : '1px solid rgba(226, 232, 240, 0.9)',
                      color: isDark ? '#ffffff' : '#0f172a',
                      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: theme.custom.font.body,
                        fontWeight: 800,
                        fontSize: { sm: '0.80rem', md: '0.84rem' },
                        letterSpacing: '0.01em',
                        color: 'inherit',
                        lineHeight: 1,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <ArrowForwardIosRounded
                      sx={{
                        fontSize: { sm: 10, md: 10.5 },
                        color: item.tone.main,
                        transform: isRTLMode ? 'scaleX(-1)' : 'none',
                      }}
                    />
                  </Box>
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
