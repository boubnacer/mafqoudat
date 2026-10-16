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

const SearchReportHub = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = currentLanguage === 'ar' || isRTL();
  const isDark = theme.palette.mode === 'dark';
  const { ink } = theme.custom.color;
  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "#94A3B8" : "#64748B";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('lost');

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

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
          position: 'relative',
          backgroundColor: theme.custom.color.surfaceRaised,
          border: `1px solid ${hairline}`,
          borderRadius: "16px",
          boxShadow: theme.custom.elevation.e1,
          overflow: 'hidden',
          direction: isRTLMode ? 'rtl' : 'ltr',
          mb: 4,
          px: { xs: 1.75, sm: 2.5, md: 2.5 },
          py: { xs: 2, sm: 2.25, md: 2.25 },
          color: theme.custom.color.ink,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 1.75, sm: 2 } }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: theme.custom.font.display,
                fontWeight: 650,
                fontSize: { xs: '15px', sm: '16px' },
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: ink,
                textAlign: 'center',
              }}
            >
              {t('searchReportHubTitle') || 'Start with these essential actions'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              direction: isRTLMode ? 'rtl' : 'ltr',
              gap: { xs: 1.25, sm: 1.5 },
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
                    minHeight: { xs: 86, sm: 112 },
                    display: 'flex',
                    flexDirection: 'row',
                    direction: isRTLMode ? 'rtl' : 'ltr',
                    alignItems: 'center',
                    textAlign: isRTLMode ? 'right' : 'left',
                    gap: 1.5,
                    p: { xs: '14px 14px', sm: '18px 18px' },
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: "12px",
                    backgroundColor: theme.custom.color.surfaceRaised,
                    border: `1px solid ${hairline}`,
                    boxShadow: theme.custom.elevation.e1,
                    transition: 'border-color 160ms ease, box-shadow 160ms ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: alpha(item.tone.main, 0.18),
                      boxShadow: theme.custom.elevation.e2,
                      '& .action-chevron': {
                        borderColor: alpha(item.tone.main, 0.22),
                        backgroundColor: alpha(item.tone.main, 0.08),
                      },
                    },
                    '&:active': {
                      transform: 'scale(0.99)',
                      boxShadow: theme.custom.elevation.e1,
                    },
                    '&:focus-visible': {
                      borderColor: alpha(theme.custom.color.brandPrimary, 0.35),
                      boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}, 0 0 0 4px ${alpha(theme.custom.color.brandPrimary, 0.28)}`,
                    },
                  }}
                >
                  <Box
                    className="action-icon-circle"
                    sx={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: "9px",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(item.tone.main, isDark ? 0.14 : 0.08),
                      border: `1px solid ${alpha(item.tone.main, isDark ? 0.18 : 0.12)}`,
                      color: item.tone.main,
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      textAlign: isRTLMode ? 'right' : 'left',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: theme.custom.font.body,
                        fontWeight: 650,
                        fontSize: "13.5px",
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                        color: ink,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: theme.custom.font.body,
                        fontWeight: 450,
                        fontSize: "12px",
                        lineHeight: 1.4,
                        color: muted,
                        mt: 0.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <Box
                    className="action-chevron"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      border: `1px solid ${hairline}`,
                      backgroundColor: "transparent",
                      flexShrink: 0,
                      transform: isRTLMode ? 'scaleX(-1)' : 'none',
                      transition: 'border-color 160ms ease, background-color 160ms ease',
                    }}
                  >
                    <ArrowForwardIosRounded sx={{ fontSize: 13, color: muted }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <GuidedSearchDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        initialType={dialogType}
      />
    </>
  );
};

export default SearchReportHub;
