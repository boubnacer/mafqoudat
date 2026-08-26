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
  InfoOutlined,
} from "@mui/icons-material";

// Report Lost / Report Found render as two independent buttons (own
// fill/border/elevation each, status-toned) rather than one merged panel —
// they need to read as pressable buttons, not a list row. Search Items is
// folded into the "browse before you post" nudge above them, since that's
// the action the nudge is asking for; Get Help was dropped from this
// section entirely.
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

  const goToSearch = () => navigate('/dash/posts');

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
            same item by another user. Search Items sits right beside the
            nudge it acts on, instead of as a separate pill below the primary
            buttons. */}
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
              {t('browseBeforePostTip')}
            </Typography>
          </Box>

          <Box
            data-reveal-item=""
            role="button"
            tabIndex={0}
            onClick={goToSearch}
            onKeyDown={(e) => handleKeyActivate(e, goToSearch)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd(e, goToSearch);
            }}
            sx={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: { xs: 1.75, sm: 2 },
              py: { xs: 0.75, sm: 0.85 },
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
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                color: white,
                whiteSpace: 'nowrap',
              }}
            >
              {t('searchItems')}
            </Typography>
          </Box>
        </Box>

        {/* Primary pair — Report Lost / Report Found, split into two
            independent buttons (each own fill/border/elevation) rather than
            one merged panel row, so they read as pressable buttons instead
            of a plain list. */}
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
                  p: { xs: 2.5, sm: 3 },
                  cursor: 'pointer',
                  outline: 'none',
                  borderRadius: `${theme.custom.radius.lg}px`,
                  backgroundColor: alpha(item.tone.main, isDark ? 0.16 : 0.08),
                  border: `1px solid ${alpha(item.tone.main, isDark ? 0.4 : 0.3)}`,
                  boxShadow: theme.custom.elevation.e1,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(item.tone.main, isDark ? 0.24 : 0.14),
                    boxShadow: theme.custom.elevation.e2,
                    transform: 'translateY(-4px)',
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
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default QuickActions;
