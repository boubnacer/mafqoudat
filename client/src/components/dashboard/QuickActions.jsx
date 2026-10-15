import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import { isRTL } from "../../utils/languageUtils";
import { authStorage } from "../../utils/authStorage";
import {
  TaskAltOutlined,
  SearchOffOutlined,
  Search,
  ArrowForwardIosRounded,
} from "@mui/icons-material";
import CyberDotMatrix from './CyberDotMatrix';

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();
  const isDark = theme.palette.mode === 'dark';
  const { ink, brandPrimary, brandLogo } = theme.custom.color;
  const white = theme.palette.common.white;

  const [touchStart, setTouchStart] = React.useState(null);
  const [touchMoved, setTouchMoved] = React.useState(false);

  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
    setTouchMoved(false);
  };
  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const dX = Math.abs(e.touches[0].clientX - touchStart.x);
    const dY = Math.abs(e.touches[0].clientY - touchStart.y);
    if (dX > 10 || dY > 10) setTouchMoved(true);
  };
  const handleTouchEnd = (e, action) => {
    if (!touchStart) return;
    const dur = Date.now() - touchStart.time;
    const dX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
    const dY = Math.abs(e.changedTouches[0].clientY - touchStart.y);
    if (!touchMoved && dX < 10 && dY < 10 && dur < 500) action();
    setTouchStart(null);
    setTouchMoved(false);
  };
  const handleKeyActivate = (e, action) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); }
  };
  const handleCreatePost = (type) => {
    if (!token) {
      authStorage.setRedirectAfterLoginWithMessage(`/posts/new?type=${type}`, 'loginRequiredCreatePost');
      navigate('/login');
    } else navigate(`/posts/new?type=${type}`);
  };

  const primaryActions = [
    { key: 'lost', title: t('quickActionLostTitle'), subtitle: t('tapHereToReport'), description: t('reportLostItemDesc'), icon: SearchOffOutlined, tone: theme.custom.status.lost, action: () => handleCreatePost('lost'), accent: theme.custom.status.lost.main },
    { key: 'found', title: t('quickActionFoundTitle'), subtitle: t('tapHereToReport'), description: t('reportFoundItemDesc'), icon: TaskAltOutlined, tone: theme.custom.status.found, action: () => handleCreatePost('found'), accent: theme.custom.status.found.main },
  ];
  const goToSearch = () => navigate('/posts');

  return (
    <Box
      data-reveal="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        mb: 4,
        width: '100%',
        borderRadius: 0,
        py: { xs: 2.5, sm: 3, md: 3.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        backgroundColor: isDark ? 'rgba(16, 25, 44, 0.88)' : '#F1F5F9',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'}`,
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.25)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 16px rgba(15, 23, 42, 0.04)',
      }}
    >
      <CyberDotMatrix
        idPrefix="dots-quick-actions"
        shape="circle"
        color={brandLogo}
        dotRadius={isDark ? 0.72 : 0.9}
        opacity={isDark ? 0.5 : 0.85}
        glowRadius="28%"
        falloffCurve="rapid"
        inverted={false}
        zIndex={0}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: { sm: '100%', md: '100%', lg: '1400px', xl: '1600px' }, mx: 'auto' }}>

        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 2.5, md: 2.75 } }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.85,
            mb: { xs: 1, sm: 1.25 },
            px: { xs: 1.25, sm: 1.55 },
            py: { xs: 0.45, sm: 0.55 },
            borderRadius: '999px',
            backgroundColor: isDark ? alpha(brandPrimary, 0.14) : alpha(brandPrimary, 0.08),
            border: `1px solid ${alpha(brandPrimary, isDark ? 0.28 : 0.18)}`,
            boxShadow: isDark ? `0 2px 8px ${alpha(brandPrimary, 0.16)}` : `0 2px 6px ${alpha(brandPrimary, 0.08)}`,
          }}>
            <Box sx={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: brandPrimary, boxShadow: `0 0 10px ${alpha(brandPrimary, 0.75)}`, flexShrink: 0 }} />
            <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 800, fontSize: { xs: '0.65rem', sm: '0.70rem' }, letterSpacing: '0.14em', textTransform: 'uppercase', color: isDark ? '#e2e8f0' : brandPrimary, lineHeight: 1 }}>{t('quickActions')}</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} align="center" sx={{ fontFamily: theme.custom.font.display, fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.15rem' }, color: ink, lineHeight: { xs: 1.2, sm: 1.15 }, letterSpacing: '-0.03em', textAlign: 'center' }}>
            {t('quickActions')}
          </Typography>

          <Box sx={{ width: { xs: 48, sm: 60 }, height: 3, borderRadius: 99, mx: 'auto', mt: { xs: 1, sm: 1.2 }, mb: { xs: 1, sm: 1.25 }, background: `linear-gradient(90deg, ${brandPrimary}, ${brandLogo})`, boxShadow: `0 2px 10px ${alpha(brandPrimary, 0.28)}` }} />

          <Typography variant="body1" align="center" sx={{ fontFamily: theme.custom.font.body, color: alpha(ink, isDark ? 0.70 : 0.64), fontSize: { xs: '0.84rem', sm: '0.92rem', md: '0.98rem' }, maxWidth: 520, mx: 'auto', lineHeight: { xs: 1.55, sm: 1.65 }, textAlign: 'center', px: { xs: 1, sm: 0 } }}>
            {t('quickActionsDesc')}
          </Typography>
        </Box>

        <Box sx={{ mb: { xs: 2.2, sm: 2.8 }, display: 'flex', justifyContent: 'center' }}>
          <Box
            data-reveal-item=""
            role="button"
            tabIndex={0}
            aria-label={t('searchItems')}
            onClick={goToSearch}
            onKeyDown={(e) => handleKeyActivate(e, goToSearch)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(e, goToSearch); }}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              display: 'inline-flex',
              alignItems: 'center',
              gap: { xs: 0.85, sm: 1.1 },
              px: { xs: 2.2, sm: 2.8 },
              py: { xs: 0.82, sm: 0.98 },
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${brandPrimary} 0%, #0ea5b5 100%)`,
              border: `1px solid ${alpha(white, 0.24)}`,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: `0 8px 24px ${alpha(brandPrimary, 0.32)}, 0 2px 8px ${alpha(ink, isDark ? 0.28 : 0.08)}, inset 0 1px 0 ${alpha(white, 0.32)}`,
              transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, filter 0.22s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: `linear-gradient(180deg, ${alpha(white, 0.22)} 0%, transparent 60%)`,
                pointerEvents: 'none'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                left: '-44%',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(white, 0.24)} 50%, transparent 100%)`,
                transform: 'skewX(-16deg)',
                transition: 'left 0.5s ease',
                pointerEvents: 'none'
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.015)',
                boxShadow: `0 14px 32px ${alpha(brandPrimary, 0.42)}, 0 4px 12px ${alpha(ink, 0.12)}, inset 0 1px 0 ${alpha(white, 0.36)}`,
                filter: 'brightness(1.04)',
                '&::after': { left: '108%' }
              },
              '&:active': {
                transform: 'translateY(0px) scale(0.98)',
                boxShadow: `0 4px 14px ${alpha(brandPrimary, 0.28)}`,
              },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: `0 0 0 3px ${alpha(brandPrimary, 0.38)}, 0 10px 24px ${alpha(brandPrimary, 0.35)}`,
              },
            }}
          >
            <Box sx={{
              position: 'relative',
              width: { xs: 26, sm: 30 },
              height: { xs: 26, sm: 30 },
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(white, 0.20),
              border: `1px solid ${alpha(white, 0.28)}`,
              flexShrink: 0,
              boxShadow: `inset 0 1px 0 ${alpha(white, 0.32)}`
            }}>
              <Search sx={{ fontSize: { xs: 15, sm: 16.5 }, color: white }} />
            </Box>
            <Typography sx={{
              position: 'relative',
              fontFamily: theme.custom.font.body,
              fontWeight: 800,
              fontSize: { xs: '0.84rem', sm: '0.94rem' },
              color: white,
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em'
            }}>
              {t('searchItems')}
            </Typography>
            <Box sx={{
              position: 'relative',
              width: { xs: 20, sm: 22 },
              height: { xs: 20, sm: 22 },
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(white, 0.15),
              border: `1px solid ${alpha(white, 0.20)}`,
              flexShrink: 0,
              ml: 0.15
            }}>
              <ArrowForwardIosRounded sx={{ fontSize: { xs: 8.5, sm: 9.5 }, color: white, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: isRTLMode ? 'row-reverse' : 'row' }, gap: { xs: 1.4, sm: 1.9 } }}>
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
                onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(e, item.action); }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: { xs: isRTLMode ? 'row-reverse' : 'row', sm: 'column' },
                  alignItems: 'center',
                  textAlign: { xs: isRTLMode ? 'right' : 'left', sm: 'center' },
                  gap: { xs: 1.4, sm: 0 },
                  p: { xs: 1.5, sm: 2.25, md: 2.75 },
                  pt: { sm: 2.6, md: 3 },
                  cursor: 'pointer',
                  outline: 'none',
                  borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
                  backgroundColor: isDark ? 'rgba(22, 33, 51, 0.82)' : '#ffffff',
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 50% 0%, ${alpha(item.accent, 0.08)} 0%, transparent 75%)`
                    : `linear-gradient(180deg, #ffffff 0%, ${alpha(item.accent, 0.04)} 100%)`,
                  border: `1px solid ${alpha(item.accent, isDark ? 0.22 : 0.18)}`,
                  boxShadow: isDark
                    ? '0 10px 28px rgba(0, 0, 0, 0.38), 0 2px 8px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                    : '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 1)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'transform 0.28s cubic-bezier(0.34, 1.26, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease, background-color 0.28s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    top: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${item.accent} 0%, ${alpha(item.accent, 0.32)} 100%)`,
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(28, 42, 64, 0.90)' : '#ffffff',
                    borderColor: alpha(item.accent, isDark ? 0.42 : 0.32),
                    boxShadow: isDark
                      ? `0 18px 42px rgba(0, 0, 0, 0.52), 0 6px 16px rgba(0, 0, 0, 0.34), 0 0 0 1px ${alpha(item.accent, 0.24)}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                      : `0 18px 40px ${alpha(item.accent, 0.12)}, 0 6px 16px rgba(15, 23, 42, 0.06), 0 0 0 1px ${alpha(item.accent, 0.16)}, inset 0 1px 0 rgba(255, 255, 255, 1)`,
                    transform: 'translateY(-4px)',
                    '& .action-icon-circle': {
                      transform: { sm: 'scale(1.06)' },
                      boxShadow: `0 12px 26px ${alpha(item.accent, isDark ? 0.32 : 0.20)}, 0 4px 10px ${alpha(item.accent, 0.16)}`
                    },
                    '& .action-icon-ring': {
                      borderColor: alpha(item.accent, 0.26),
                      transform: { sm: 'scale(1.04)' }
                    },
                    '& .action-button-pill': {
                      backgroundColor: item.accent,
                      borderColor: item.accent,
                      color: white,
                      boxShadow: `0 8px 18px ${alpha(item.accent, 0.36)}`,
                      transform: 'translateY(-1px)',
                    },
                    '& .action-chevron': {
                      opacity: 1,
                      transform: isRTLMode ? 'scaleX(-1) translateX(3px)' : 'translateX(3px)'
                    },
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.99)',
                    boxShadow: isDark
                      ? '0 6px 18px rgba(0, 0, 0, 0.40)'
                      : '0 4px 14px rgba(15, 23, 42, 0.05)',
                  },
                  '&:focus-visible': {
                    borderColor: alpha(item.accent, 0.55),
                    outline: 'none',
                    boxShadow: `0 0 0 3px ${alpha(item.accent, 0.24)}, 0 12px 30px rgba(15, 23, 42, 0.10)`,
                  },
                }}
              >
                <Box aria-hidden sx={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', top: -28, insetInlineEnd: -28, background: `radial-gradient(circle at 50% 50%, ${alpha(item.accent, isDark ? 0.14 : 0.07)} 0%, transparent 70%)`, filter: 'blur(14px)', pointerEvents: 'none', display: { xs: 'none', sm: 'block' } }} />

                <Box sx={{ position: 'relative', flexShrink: 0, width: { xs: 52, sm: 68 }, height: { xs: 52, sm: 68 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box className="action-icon-ring" sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${alpha(item.accent, isDark ? 0.13 : 0.10)}`, background: alpha(item.accent, isDark ? 0.06 : 0.04), transition: 'transform 0.30s ease, border-color 0.30s ease', pointerEvents: 'none' }} />
                  <Box className="action-icon-circle" sx={{
                    position: 'relative', flexShrink: 0,
                    width: { xs: 48, sm: 62 }, height: { xs: 48, sm: 62 },
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDark ? `radial-gradient(circle at 30% 26%, ${alpha(item.accent, 0.20)} 0%, ${alpha('#0f172a', 0.96)} 68%)` : `radial-gradient(circle at 30% 26%, ${alpha(item.accent, 0.14)} 0%, ${white} 68%)`,
                    border: `1px solid ${alpha(item.accent, isDark ? 0.20 : 0.14)}`,
                    boxShadow: isDark ? `0 8px 20px ${alpha(item.accent, 0.16)}, inset 0 1px 0 ${alpha(white, 0.06)}` : `0 8px 20px ${alpha(item.accent, 0.12)}, inset 0 1px 0 ${alpha(white, 1)}`,
                    transition: 'transform 0.30s cubic-bezier(0.34,1.26,0.64,1), box-shadow 0.30s ease',
                    overflow: 'hidden',
                    '&::before': { content: '""', position: 'absolute', inset: 0, borderRadius: '50%', background: `linear-gradient(180deg, ${alpha(white, isDark ? 0.07 : 0.88)} 0%, transparent 54%)`, pointerEvents: 'none' }
                  }}>
                    <Icon sx={{ position: 'relative', fontSize: { xs: 24, sm: 30 }, color: item.accent }} />
                  </Box>
                </Box>

                <Box sx={{ position: 'relative', minWidth: 0, flex: { xs: 1, sm: 'none' }, textAlign: { xs: isRTLMode ? 'right' : 'left', sm: 'center' }, mt: { xs: 0, sm: 1.6 } }}>
                  <Typography variant="h6" fontWeight={800} sx={{ fontFamily: theme.custom.font.display, color: isDark ? white : '#0f172a', fontSize: { xs: '0.98rem', sm: '1.10rem', md: '1.20rem' }, lineHeight: 1.25, letterSpacing: '-0.02em', mb: { xs: 0.25, sm: 0.42 } }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: theme.custom.font.body, color: item.accent, fontWeight: 800, fontSize: { xs: '0.78rem', sm: '0.82rem', md: '0.86rem' }, lineHeight: 1.35, letterSpacing: '0.01em' }}>
                    {item.subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontFamily: theme.custom.font.body, color: alpha(ink, isDark ? 0.65 : 0.58), fontSize: { sm: '0.80rem', md: '0.84rem' }, lineHeight: 1.55, maxWidth: 300, mx: 'auto', mt: 0.5 }}>
                    {item.description}
                  </Typography>
                </Box>

                <ArrowForwardIosRounded className="action-chevron" sx={{ display: { xs: 'block', sm: 'none' }, flexShrink: 0, fontSize: 15, color: item.accent, opacity: 0.78, transform: isRTLMode ? 'scaleX(-1)' : 'none', transition: 'transform 0.22s ease, opacity 0.22s ease' }} />

                <Box
                  className="action-button-pill"
                  sx={{
                    position: 'relative',
                    display: { xs: 'none', sm: 'inline-flex' },
                    mt: { sm: 1.6, md: 1.8 },
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.65,
                    px: { sm: 2.2, md: 2.5 },
                    py: { sm: 0.68, md: 0.75 },
                    borderRadius: '999px',
                    backgroundColor: isDark ? alpha(item.accent, 0.14) : alpha(item.accent, 0.09),
                    border: `1.5px solid ${alpha(item.accent, isDark ? 0.28 : 0.22)}`,
                    color: item.accent,
                    cursor: 'pointer',
                    transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 2px 6px ${alpha(item.accent, 0.08)}`,
                    '&:hover': {
                      backgroundColor: item.accent,
                      borderColor: item.accent,
                      color: white,
                      boxShadow: `0 8px 18px ${alpha(item.accent, 0.36)}`,
                    },
                  }}
                >
                  <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 800, fontSize: { sm: '0.80rem', md: '0.84rem' }, letterSpacing: '0.01em', color: 'inherit', lineHeight: 1 }}>{item.title}</Typography>
                  <ArrowForwardIosRounded sx={{ fontSize: { sm: 10, md: 10.5 }, color: 'inherit', transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default QuickActions;
