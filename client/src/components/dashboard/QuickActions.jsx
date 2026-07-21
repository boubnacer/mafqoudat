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
  HelpOutline,
  ArrowForwardIosRounded,
} from "@mui/icons-material";

// Reporting a Lost or Found item is the same duality FoundLostStrip and
// RecentSection already render elsewhere on this page (one connected shape,
// not two independent boxes) — here it's the action version of that pair,
// so it reuses the same status tones/icons rather than inventing new ones.
// Search/Help are secondary, lower-weight actions and sit below as pills.
const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();

  // Touch handling state — distinguishes a tap from a scroll gesture so
  // scrolling past this section on mobile doesn't accidentally fire a
  // navigation action.
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchMoved, setTouchMoved] = React.useState(false);

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
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
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const handleCreatePost = (type) => {
    if (!token) {
      const intendedDestination = `/dash/posts/new?type=${type}`;
      authStorage.setRedirectAfterLoginWithMessage(intendedDestination, 'loginRequiredCreatePost');
      navigate('/login');
    } else {
      navigate(`/dash/posts/new?type=${type}`);
    }
  };

  const scrollToHelpSection = () => {
    const helpSection = document.querySelector('[data-section="help"]');

    if (helpSection) {
      if (isMobile) {
        const navbar = document.querySelector('.MuiAppBar-root');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const elementRect = helpSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const scrollPosition = absoluteElementTop - navbarHeight - 20;
        const finalScrollPosition = Math.max(0, scrollPosition);
        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isRealMobile) {
          try {
            helpSection.focus();
          } catch (e) {
            // ignore focus failures on unsupported elements
          }

          try {
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
            const mainContainer = document.querySelector('main');
            if (mainContainer) mainContainer.scrollTop = finalScrollPosition;
            helpSection.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' });
          } catch (error) {
            // ignore, best-effort scroll
          }
        } else {
          try {
            helpSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            setTimeout(() => {
              const currentScroll = window.pageYOffset;
              if (Math.abs(currentScroll - finalScrollPosition) > 100) {
                const startPosition = window.pageYOffset;
                const distance = finalScrollPosition - startPosition;
                const duration = 500;
                let startTime = null;
                const animateScroll = (currentTime) => {
                  if (startTime === null) startTime = currentTime;
                  const timeElapsed = currentTime - startTime;
                  const progress = Math.min(timeElapsed / duration, 1);
                  const easeOut = 1 - Math.pow(1 - progress, 3);
                  const currentPosition = startPosition + (distance * easeOut);
                  window.scrollTo(0, currentPosition);
                  document.documentElement.scrollTop = currentPosition;
                  document.body.scrollTop = currentPosition;
                  if (progress < 1) requestAnimationFrame(animateScroll);
                };
                requestAnimationFrame(animateScroll);
              }
            }, 300);
          } catch (error) {
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
          }
        }
      } else {
        helpSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
    } else {
      const helpElements = document.querySelectorAll('*');
      let foundElement = null;
      for (let element of helpElements) {
        if (element.textContent && element.textContent.includes('Help & Support')) {
          foundElement = element;
          break;
        }
      }
      if (foundElement) {
        if (isMobile) {
          const navbar = document.querySelector('.MuiAppBar-root');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const elementRect = foundElement.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const scrollPosition = absoluteElementTop - navbarHeight - 20;
          const finalScrollPosition = Math.max(0, scrollPosition);
          try {
            window.scrollTo({ top: finalScrollPosition, behavior: 'smooth' });
            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                window.scrollTo(0, finalScrollPosition);
              }
            }, 100);
            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                document.documentElement.scrollTop = finalScrollPosition;
              }
            }, 200);
          } catch (error) {
            window.scrollTo(0, finalScrollPosition);
          }
        } else {
          foundElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
      }
    }
  };

  const primaryActions = [
    {
      key: 'lost',
      title: t('reportLostItem'),
      description: t('reportLostItemDesc'),
      icon: SearchOffOutlined,
      tone: theme.custom.status.lost,
      action: () => handleCreatePost('lost'),
    },
    {
      key: 'found',
      title: t('reportFoundItem'),
      description: t('reportFoundItemDesc'),
      icon: TaskAltOutlined,
      tone: theme.custom.status.found,
      action: () => handleCreatePost('found'),
    },
  ];

  const secondaryActions = [
    {
      key: 'search',
      title: t('searchItems'),
      icon: Search,
      action: () => navigate('/dash/posts'),
    },
    {
      key: 'help',
      title: t('getHelp'),
      icon: HelpOutline,
      action: scrollToHelpSection,
    },
  ];

  return (
    <Box
      sx={{
        mb: 4,
        mx: { xs: 1, sm: 2 },
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
        boxShadow: theme.custom.elevation.e1,
        padding: isMobile ? '1.5rem' : '2rem',
      }}
    >
      {/* Section title */}
      <Box sx={{ textAlign: 'center', mb: isMobile ? 2.5 : 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            fontFamily: theme.custom.font.display,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            color: theme.custom.color.ink,
            mb: 1,
          }}
        >
          {t('quickActions')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: theme.custom.font.body,
            color: alpha(theme.custom.color.ink, 0.65),
            fontSize: { xs: '0.9rem', sm: '1rem' },
            maxWidth: 520,
            mx: 'auto',
          }}
        >
          {t('quickActionsDesc')}
        </Typography>
      </Box>

      {/* Primary pair — Report Lost / Report Found, one connected shape */}
      <Box
        sx={{
          borderRadius: `${theme.custom.radius.lg}px`,
          border: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
          overflow: 'hidden',
          boxShadow: theme.custom.elevation.e1,
          transition: 'box-shadow 0.3s ease',
          '&:hover': { boxShadow: theme.custom.elevation.e2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: isRTLMode ? 'row-reverse' : 'row' },
          }}
        >
          {primaryActions.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.key}>
                <Box
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
                    p: { xs: 2.5, sm: 3 },
                    cursor: 'pointer',
                    outline: 'none',
                    backgroundColor: alpha(item.tone.main, theme.palette.mode === 'dark' ? 0.07 : 0.045),
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(item.tone.main, theme.palette.mode === 'dark' ? 0.16 : 0.09),
                    },
                    '&:focus-visible': {
                      boxShadow: `inset 0 0 0 2px ${item.tone.main}`,
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

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        fontFamily: theme.custom.font.display,
                        color: theme.custom.color.ink,
                        fontSize: { xs: '1.05rem', sm: '1.15rem' },
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: theme.custom.font.body,
                        color: alpha(theme.custom.color.ink, 0.65),
                        fontSize: { xs: '0.82rem', sm: '0.88rem' },
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>

                  <ArrowForwardIosRounded
                    sx={{
                      flexShrink: 0,
                      fontSize: 16,
                      color: item.tone.main,
                      opacity: 0.55,
                      transform: isRTLMode ? 'scaleX(-1)' : 'none',
                    }}
                  />
                </Box>

                {index === 0 && (
                  <Box
                    sx={{
                      alignSelf: 'stretch',
                      width: { xs: '100%', sm: '1px' },
                      height: { xs: '1px', sm: 'auto' },
                      backgroundColor: alpha(theme.custom.color.ink, 0.08),
                      flexShrink: 0,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>

      {/* Secondary actions — lighter weight, pill treatment */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 1.25, sm: 1.5 },
          mt: { xs: 2.5, sm: 3 },
        }}
      >
        {secondaryActions.map((item) => {
          const Icon = item.icon;
          return (
            <Box
              key={item.key}
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.15 },
                borderRadius: '999px',
                cursor: 'pointer',
                outline: 'none',
                border: `1.5px solid ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
                backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.2 : 0.12),
                  borderColor: theme.custom.color.brandPrimary,
                },
                '&:focus-visible': {
                  boxShadow: `0 0 0 2px ${alpha(theme.custom.color.brandPrimary, 0.45)}`,
                },
              }}
            >
              <Icon sx={{ fontSize: 18, color: theme.custom.color.brandPrimary }} />
              <Typography
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  color: theme.custom.color.brandPrimary,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default QuickActions;
