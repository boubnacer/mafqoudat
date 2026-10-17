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

/**
 * SearchReportHub
 * Flagship SaaS Bento action hub:
 * - Color Palette: Modern SaaS (Trust Blue, Rose for Lost, Emerald for Found, Slate for Ink & Muted)
 * - Style Direction: Bento Box Grid (modular cards, soft tonal icon containers, pill badges, ambient depth)
 * - Micro-interactions: hover:-translate-y-0.5, active:scale-[0.98], smooth cubic-bezier transitions
 */
const SearchReportHub = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isRTLMode = currentLanguage === 'ar' || isRTL();
  const isDark = theme.palette.mode === 'dark';

  // Cohesive SaaS Color Tokens
  const ink = theme.custom?.color?.ink || (isDark ? '#F8FAFC' : '#0F172A');
  const muted = isDark ? '#94A3B8' : '#475569';
  const hairline = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)';

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
      ctaText:
        currentLanguage === 'ar'
          ? 'انقر هنا للإبلاغ عما فقدته'
          : currentLanguage === 'fr'
          ? 'Appuyez ici pour signaler ce que vous avez perdu'
          : 'Tap here to report what you lost',
      title:
        currentLanguage === 'ar'
          ? 'هل فقدت شيئاً؟'
          : currentLanguage === 'fr'
          ? 'Avez-vous perdu un objet ?'
          : 'Did you lose something?',
      subtitle:
        currentLanguage === 'ar'
          ? 'سنتأكد أولاً من عدم وجود بلاغ مسبق يفيد بالعثور على ما فقدته.'
          : currentLanguage === 'fr'
          ? "Nous vérifierons d'abord si quelqu'un n'a pas déjà signalé avoir trouvé ce que vous avez perdu."
          : "We'll make sure first that someone didn't report that he found what you lost.",
      icon: SearchOffOutlined,
      // Rose tonal accent for Lost
      tone: {
        main: isDark ? '#FB7185' : '#E11D48',
        tailwind: 'rose',
      },
      action: () => handleOpenDialog('lost'),
    },
    {
      key: 'found',
      ctaText:
        currentLanguage === 'ar'
          ? 'انقر هنا للإبلاغ عما وجدته'
          : currentLanguage === 'fr'
          ? 'Appuyez ici pour signaler ce que vous avez trouvé'
          : 'Tap here to report what you found',
      title:
        currentLanguage === 'ar'
          ? 'هل عثرت على شيء؟'
          : currentLanguage === 'fr'
          ? 'Avez-vous trouvé un objet ?'
          : 'Did you find something?',
      subtitle:
        currentLanguage === 'ar'
          ? 'سنتأكد أولاً من عدم وجود بلاغ مسبق يفيد بفقدان ما عثرت عليه.'
          : currentLanguage === 'fr'
          ? "Nous vérifierons d'abord si quelqu'un n'a pas déjà signalé la perte de ce que vous avez trouvé."
          : "We'll make sure first that someone didn't report that he lost what you found.",
      icon: TaskAltOutlined,
      // Emerald tonal accent for Found
      tone: {
        main: isDark ? '#34D399' : '#059669',
        tailwind: 'emerald',
      },
      action: () => handleOpenDialog('found'),
    },
  ];

  const headerTitle =
    currentLanguage === 'ar'
      ? 'ابدأ بهذه الإجراءات الأساسية'
      : currentLanguage === 'fr'
      ? 'Commencez par ces actions essentielles'
      : 'Start with these essential actions';

  return (
    <>
      <Box
        data-reveal="section"
        dir={isRTLMode ? 'rtl' : 'ltr'}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-8"
        sx={{
          width: '100%',
          maxWidth: { sm: '100%', md: '100%', lg: '1400px', xl: '1600px' },
          mx: 'auto',
          px: { xs: 1.5, sm: 2, md: 3 },
          mb: 4,
          direction: isRTLMode ? 'rtl' : 'ltr',
        }}
      >
        {/* Main Hub Shell: Layered Glass Background with Crisp 1px Inner Border */}
        <Box
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
          sx={{
            position: 'relative',
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${hairline}`,
            borderRadius: { xs: '20px', md: '24px' },
            boxShadow: isDark
              ? '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 1px 3px rgba(15, 23, 42, 0.03), 0 10px 25px -5px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            overflow: 'hidden',
            p: { xs: 2.5, sm: 3, md: 3.5 },
            color: ink,
          }}
        >
          {/* Subtle Ambient Radial Highlight in corner */}
          <Box
            sx={{
              position: 'absolute',
              top: '-40px',
              right: isRTLMode ? 'auto' : '-40px',
              left: isRTLMode ? '-40px' : 'auto',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.09) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(36px)',
              zIndex: 0,
            }}
          />

          {/* Section Header: Structured SaaS Header without Badge */}
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: { xs: 2.5, sm: 3 } }}>
            <Typography
              component="h2"
              className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              sx={{
                fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || 'sans-serif'}, sans-serif`,
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
                lineHeight: 1.3,
                letterSpacing: '-0.025em',
                color: ink,
                textAlign: 'center',
              }}
            >
              {headerTitle}
            </Typography>
          </Box>

          {/* Action Cards Bento Grid */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 2, sm: 2.5 },
              direction: isRTLMode ? 'rtl' : 'ltr',
            }}
          >
            {primaryActions.map((item) => {
              const Icon = item.icon;
              const toneMain = item.tone.main;
              const iconBg = isDark ? alpha(toneMain, 0.14) : alpha(toneMain, 0.08);
              const iconBorder = isDark ? alpha(toneMain, 0.28) : alpha(toneMain, 0.18);

              // Subtle layered card background
              const cardBg = isDark
                ? 'linear-gradient(180deg, rgba(39, 39, 42, 0.55) 0%, rgba(24, 24, 27, 0.8) 100%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, rgba(248, 250, 252, 0.85) 100%)';
              const cardBorder = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(226, 232, 240, 0.85)';
              const cardHoverBorder = isDark
                ? alpha(toneMain, 0.45)
                : alpha(toneMain, 0.35);

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
                  className="group relative flex flex-col justify-between rounded-xl md:rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-white/[0.08] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  sx={{
                    minWidth: 0,
                    minHeight: { xs: '160px', sm: '170px', md: '165px' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: isRTLMode ? 'right' : 'left',
                    p: { xs: 2.5, sm: 2.75, md: 3 },
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: { xs: '16px', md: '18px' },
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: isDark
                      ? '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                      : '0 1px 2px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.02), inset 0 1px 0 #FFFFFF',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: cardHoverBorder,
                      boxShadow: isDark
                        ? `0 12px 28px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px ${alpha(toneMain, 0.2)}`
                        : `0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 0 0 1px ${alpha(toneMain, 0.15)}`,
                      '& .action-icon-container': {
                        transform: 'scale(1.05)',
                        borderColor: alpha(toneMain, isDark ? 0.45 : 0.3),
                        backgroundColor: alpha(toneMain, isDark ? 0.2 : 0.12),
                      },
                      '& .action-cta-arrow': {
                        transform: isRTLMode ? 'scaleX(-1) translateX(4px)' : 'translateX(4px)',
                        backgroundColor: toneMain,
                        color: '#FFFFFF',
                        borderColor: toneMain,
                      },
                      '& .action-cta-label': {
                        color: toneMain,
                      },
                    },
                    '&:active': {
                      transform: 'scale(0.985)',
                      boxShadow: 'none',
                      transition: 'transform 80ms ease',
                    },
                    '&:focus-visible': {
                      borderColor: '#0B57D0',
                      boxShadow: `0 0 0 2px ${theme.custom?.color?.surfaceRaised || '#FFFFFF'}, 0 0 0 4px #0B57D0`,
                    },
                  }}
                >
                  {/* Top Bar: Icon Squircle + Card Title Placed Side-by-Side */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1.5, sm: 1.75 },
                      mb: { xs: 1.5, sm: 1.75 },
                    }}
                  >
                    {/* Soft Tonal Icon Container (rounded-xl bg-tone/10 p-2.5) */}
                    <Box
                      className="action-icon-container rounded-xl p-2.5 transition-all duration-200"
                      sx={{
                        flexShrink: 0,
                        width: { xs: 44, sm: 46, md: 44 },
                        height: { xs: 44, sm: 46, md: 44 },
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: iconBg,
                        border: `1px solid ${iconBorder}`,
                        color: toneMain,
                        transition: 'all 200ms ease',
                        boxShadow: isDark
                          ? '0 2px 6px rgba(0, 0, 0, 0.25)'
                          : `0 2px 6px ${alpha(toneMain, 0.12)}`,
                      }}
                    >
                      <Icon sx={{ fontSize: { xs: 23, sm: 24, md: 23 } }} />
                    </Box>

                    {/* Card Title placed next to the Icon at top */}
                    <Typography
                      component="h3"
                      className="text-base sm:text-lg md:text-base font-bold text-slate-900 dark:text-slate-100"
                      sx={{
                        fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || 'sans-serif'}, sans-serif`,
                        fontWeight: 700,
                        fontSize: { xs: '16.5px', sm: '17.5px', md: '16.5px' },
                        lineHeight: 1.3,
                        letterSpacing: '-0.015em',
                        color: ink,
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>

                  {/* Middle: Workflow Guidance Subtitle */}
                  <Box sx={{ mb: { xs: 2, sm: 2.25 }, flex: 1 }}>
                    <Typography
                      className="text-sm sm:text-base md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
                      sx={{
                        fontFamily: `'Inter', ${theme.custom?.font?.body || 'sans-serif'}, sans-serif`,
                        fontWeight: 400,
                        fontSize: { xs: '14.5px', sm: '14px', md: '13.5px' },
                        lineHeight: 1.55,
                        color: muted,
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  {/* Bottom: Interactive CTA Row with 44px Minimum Touch Height */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 1.5,
                      borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.75)'}`,
                      minHeight: '44px',
                    }}
                  >
                    <Typography
                      className="action-cta-label text-sm sm:text-base md:text-sm font-semibold transition-colors duration-200"
                      sx={{
                        fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || 'sans-serif'}, sans-serif`,
                        fontWeight: 650,
                        fontSize: { xs: '14.5px', sm: '14px', md: '13.5px' },
                        color: toneMain,
                        transition: 'color 200ms ease',
                      }}
                    >
                      {item.ctaText}
                    </Typography>

                    <Box
                      className="action-cta-arrow"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '34px',
                        minHeight: '34px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                        border: `1px solid ${hairline}`,
                        color: muted,
                        transform: isRTLMode ? 'scaleX(-1)' : 'none',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <ArrowForwardRounded sx={{ fontSize: 18, color: 'inherit' }} />
                    </Box>
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


