import React, { useState } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { useTranslation } from '../../utils/translations';
import { isRTL } from '../../utils/languageUtils';
import {
  TaskAltOutlined,
  SearchOffOutlined,
  ArrowForwardRounded,
} from '@mui/icons-material';
import GuidedSearchDialog from './GuidedSearchDialog';

const SearchReportHub = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isRTLMode = currentLanguage === 'ar' || isRTL();
  const isDark = theme.palette.mode === 'dark';
  const ink = theme.custom.color.ink;
  const muted = isDark ? '#94A3B8' : '#64748B';
  const hairline = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';

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
          width: '100%',
          maxWidth: { sm: '100%', md: '100%', lg: '1400px', xl: '1600px' },
          mx: 'auto',
          px: { xs: 1.5, sm: 2, md: 3 },
          mb: 4,
          direction: isRTLMode ? 'rtl' : 'ltr',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: theme.custom.color.surfaceRaised,
            border: `1px solid ${hairline}`,
            borderRadius: { xs: '18px', sm: '22px' },
            boxShadow: isDark
              ? '0 4px 24px rgba(0, 0, 0, 0.25)'
              : '0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
            px: { xs: 2, sm: 2.75, md: 3 },
            py: { xs: 2.25, sm: 2.75, md: 3 },
            color: ink,
          }}
        >
          {/* Header Title */}
          <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 2.5 } }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
                fontWeight: 600,
                fontSize: { xs: '15px', sm: '17px' },
                lineHeight: 1.3,
                letterSpacing: '-0.015em',
                color: ink,
                textAlign: 'center',
              }}
            >
              {t('searchReportHubTitle') || 'Start with these essential actions'}
            </Typography>
          </Box>

          {/* Action Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 1.5, sm: 2 },
              direction: isRTLMode ? 'rtl' : 'ltr',
            }}
          >
            {primaryActions.map((item) => {
              const Icon = item.icon;
              const cardBg = isDark
                ? alpha(item.tone.main, 0.06)
                : alpha(item.tone.main, 0.035);
              const cardBorder = isDark
                ? alpha(item.tone.main, 0.18)
                : alpha(item.tone.main, 0.14);

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
                    minWidth: 0,
                    minHeight: { xs: 80, sm: 94 },
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    textAlign: isRTLMode ? 'right' : 'left',
                    gap: { xs: 1.5, sm: 1.75 },
                    p: { xs: '14px 16px', sm: '16px 18px' },
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: '16px',
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: isDark
                      ? '0 2px 10px rgba(0, 0, 0, 0.18)'
                      : '0 1px 2px rgba(15, 23, 42, 0.02)',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      backgroundColor: alpha(item.tone.main, isDark ? 0.1 : 0.06),
                      borderColor: alpha(item.tone.main, isDark ? 0.35 : 0.28),
                      boxShadow: isDark
                        ? `0 6px 20px ${alpha(item.tone.main, 0.2)}`
                        : `0 6px 20px ${alpha(item.tone.main, 0.08)}`,
                      '& .action-chevron': {
                        backgroundColor: alpha(item.tone.main, isDark ? 0.22 : 0.14),
                        borderColor: alpha(item.tone.main, isDark ? 0.35 : 0.25),
                        color: item.tone.main,
                        transform: isRTLMode ? 'scaleX(-1) translateX(3px)' : 'translateX(3px)',
                      },
                      '& .action-icon-circle': {
                        transform: 'scale(1.05)',
                        borderColor: alpha(item.tone.main, isDark ? 0.35 : 0.25),
                      },
                    },
                    '&:active': {
                      transform: 'scale(0.985)',
                      boxShadow: 'none',
                    },
                    '&:focus-visible': {
                      borderColor: '#0B57D0',
                      boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}, 0 0 0 4px #0B57D0`,
                    },
                  }}
                >
                  {/* Icon Squircle */}
                  <Box
                    className="action-icon-circle"
                    sx={{
                      flexShrink: 0,
                      width: { xs: 42, sm: 46 },
                      height: { xs: 42, sm: 46 },
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(item.tone.main, isDark ? 0.18 : 0.1),
                      border: `1px solid ${alpha(item.tone.main, isDark ? 0.26 : 0.16)}`,
                      color: item.tone.main,
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Icon sx={{ fontSize: { xs: 21, sm: 23 } }} />
                  </Box>

                  {/* Text Content */}
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      textAlign: isRTLMode ? 'right' : 'left',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
                        fontWeight: 600,
                        fontSize: { xs: '14.5px', sm: '15.5px' },
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                        color: ink,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: `'Inter', ${theme.custom.font.body}, sans-serif`,
                        fontWeight: 400,
                        fontSize: { xs: '12.5px', sm: '13px' },
                        lineHeight: 1.4,
                        color: muted,
                        mt: 0.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  {/* Action Arrow Pill */}
                  <Box
                    className="action-chevron"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                      border: `1px solid ${hairline}`,
                      color: muted,
                      flexShrink: 0,
                      transform: isRTLMode ? 'scaleX(-1)' : 'none',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ArrowForwardRounded sx={{ fontSize: 17, color: 'inherit' }} />
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
