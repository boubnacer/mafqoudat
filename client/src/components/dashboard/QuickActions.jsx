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
  InfoOutlined,
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
  const isDark = theme.palette.mode === 'dark';
  const { surfaceRaised, ink, brandPrimary, brandLogo } = theme.custom.color;
  const white = theme.palette.common.white;

  // Glassmorphism, requested for this section only: the outer shell keeps
  // the same alpha(surfaceRaised, 0.95) + blur(10px) wash every other
  // dashboard panel uses (RecentSection/Process/HelpSupportSection/LeftSide)
  // so it still reads as "one of this page's panels" rather than a
  // differently-colored block — the earlier version painted the whole
  // section in a solid brand-blue gradient instead, which is what stood out
  // against its neutral siblings. The "colorful background" the glass
  // panels float over is now two soft, blurred brand-color blobs tucked
  // behind the content (contained by the shell's own rounded corners), and
  // the frosted panels themselves tint off surfaceRaised/brandPrimary
  // rather than raw white, so their text stays the site's normal ink color
  // instead of the white needed against the old vivid backdrop. Phase 8's
  // border removal still doesn't apply to these panels — a hairline edge is
  // what makes them read as glass.
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

  // Soft blurred color blobs behind the glass panels — the "colorful
  // background" the frosted look needs, kept low-opacity and clipped to the
  // section's own rounded corners so it reads as a subtle accent, not a
  // loud block that clashes with the neutral panels around it.
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
      data-reveal="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mb: 4,
        mx: { xs: 1, sm: 2 },
        background: `linear-gradient(135deg, ${alpha(surfaceRaised, 0.95)} 0%, ${alpha(surfaceRaised, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        boxShadow: 'none',
        padding: isMobile ? '1.5rem' : '2rem',
      }}
    >
      <Box sx={blob(brandPrimary, { top: -90, insetInlineStart: -70 })} />
      <Box sx={blob(brandLogo, { bottom: -110, insetInlineEnd: -70 })} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Section title */}
        <Box sx={{ textAlign: 'center', mb: isMobile ? 2.5 : 3 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              fontFamily: theme.custom.font.display,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              color: ink,
              mb: 1,
            }}
          >
            {t('quickActions')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: theme.custom.font.body,
              color: alpha(ink, 0.65),
              fontSize: { xs: '0.9rem', sm: '1rem' },
              maxWidth: 520,
              mx: 'auto',
            }}
          >
            {t('quickActionsDesc')}
          </Typography>
        </Box>

        {/* Nudge to search before posting — avoids duplicate reports of the
            same item by another user */}
        <Box
          sx={{
            ...glassPanel(theme.custom.radius.md),
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: { xs: 1.25, sm: 1.5 },
            mb: { xs: 2, sm: 2.5 },
          }}
        >
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
            {t('browseBeforePostTip')}
          </Typography>
        </Box>

        {/* Primary pair — Report Lost / Report Found, one connected shape */}
        <Box sx={glassPanel(theme.custom.radius.lg)}>
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
                      p: { xs: 2.5, sm: 3 },
                      cursor: 'pointer',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(item.tone.main, isDark ? 0.14 : 0.08),
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
                          color: ink,
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
                          color: alpha(ink, 0.65),
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
                        opacity: 0.8,
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
                        backgroundColor: alpha(ink, 0.08),
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
                  ...glassPanel(999),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1, sm: 1.15 },
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(brandPrimary, isDark ? 0.22 : 0.12),
                    boxShadow: theme.custom.elevation.e2,
                  },
                  '&:focus-visible': {
                    boxShadow: `0 0 0 2px ${alpha(brandPrimary, 0.5)}`,
                  },
                }}
              >
                <Icon sx={{ fontSize: 18, color: brandPrimary }} />
                <Typography
                  sx={{
                    fontFamily: theme.custom.font.body,
                    fontWeight: 600,
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    color: brandPrimary,
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
    </Box>
  );
};

export default QuickActions;
