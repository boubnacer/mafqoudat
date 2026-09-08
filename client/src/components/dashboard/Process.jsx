import { useRef } from "react";
import { Box, Typography, useTheme, useMediaQuery, Link, alpha, lighten } from "@mui/material";
import { Share, Campaign, Notifications } from "@mui/icons-material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { gsap, ScrollTrigger, useGSAP } from "../../utils/gsapSetup";
import { resolveScroller } from "../../features/dashboard/useDashboardMotion";

// Step icons rendered directly (bypassing RenderIcon) because these sit on a
// solid brandLogo disc (the logo's own blue, matching public/maflogoSVG.svg —
// see designTokens.js) and need contrast-text white, not RenderIcon's fixed
// brandPrimary fill — same reasoning FoundLostStrip/TrendingItem use to
// sidestep RenderIcon for Found/Lost (see RenderIcon's tokenization debt).
const STEP_ICONS = { share: Share, ad: Campaign, notif: Notifications };

const Process = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const processSteps = [
    {
      icon: "share",
      text: t('shareToOurSocials'),
      description: t('shareToOurSocialsDesc'),
    },
    {
      icon: "ad",
      text: t('makeAdvertising'),
      description: t('makeAdvertisingDesc'),
    },
    {
      icon: "notif",
      text: t('wellNotifyYou'),
      description: t('wellNotifyYouDesc'),
    },
  ];

  const socialLinks = [
    { name: "face", url: "https://www.facebook.com/profile.php?id=100075968495897" },
    { name: "whats", url: "https://wa.me/212711621132" },
    { name: "insta", url: "https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu" },
  ];

  const nodeSize = isMobile ? 56 : 64;
  const iconContrastText = theme.palette.getContrastText(theme.custom.color.brandLogo);
  const isDark = theme.palette.mode === 'dark';
  const { surfaceRaised, brandPrimary, brandLogo } = theme.custom.color;

  // Card treatment lifted from SocialReach.jsx's "SaaS panel" look (the
  // detail-page reach card) instead of the glass-blob formula this section
  // used before: a brand-tinted flat fill + brand-alpha border, no
  // backdrop-filter/blur and no separate blob elements — the section's own
  // radial-gradient glow (below) does the job the blobs did.
  const tintedCard = (radius) => ({
    position: 'relative',
    backgroundColor: alpha(brandPrimary, isDark ? 0.10 : 0.05),
    border: `1px solid ${alpha(brandPrimary, isDark ? 0.3 : 0.18)}`,
    borderRadius: radius,
  });

  // Local GSAP rather than useDashboardMotion's data-reveal machinery: that
  // hook only ever animates y/scale/opacity generically, and this section
  // wants its own sequencing (cards, then each icon disc popping in on top of
  // its card, then the social row) — a second reveal on the same nodes would
  // fight the shared one anyway, so this stays unmarked and self-contained,
  // same as the world-map's pulsing ring.
  useGSAP(() => {
    if (!rootRef.current) return undefined;

    const mm = gsap.matchMedia();

    // A visitor who prefers reduced motion gets the section in its final
    // state with no tween ever created — matchMedia reverts this cleanly if
    // the OS preference changes while the page is open.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(rootRef);
      const cards = q(".processCard");
      const nodes = q(".processNode");
      const social = q(".processSocial");
      const scroller = resolveScroller(rootRef.current);

      try {
        gsap.set(cards, { autoAlpha: 0, y: 24 });
        gsap.set(nodes, { scale: 0 });
        gsap.set(social, { autoAlpha: 0, y: 16 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            scroller,
            start: "top 80%",
            once: true,
          },
        });

        // clearProps drops GSAP's own inline transform once each tween lands,
        // so the card's CSS `:hover` transform (its e1 -> e2 lift) isn't left
        // permanently outranked by a leftover inline style of equal specificity.
        tl.to(cards, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12, clearProps: "transform" })
          .to(nodes, { scale: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.12, clearProps: "transform" }, "<0.1")
          .to(social, { autoAlpha: 1, y: 0, duration: 0.5, clearProps: "transform" }, "-=0.2");
      } catch (error) {
        // A reveal that fails to set itself up would otherwise leave real
        // content stuck at autoAlpha 0. Losing the animation is acceptable,
        // losing the section is not.
        console.error("Process motion failed to initialise:", error);
        gsap.set([...cards, ...nodes, ...social], { clearProps: "all" });
      }

      // Cairo/IBM Plex Sans Arabic can still be loading when the trigger is
      // first measured, which shifts card height and the trigger position
      // with it — re-measure once the frame settles.
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => cancelAnimationFrame(raf);
    });

    return () => mm.revert();
  }, { scope: rootRef, dependencies: [] });

  return (
    <Box
      ref={rootRef}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        // Same container recipe as SocialReach.jsx: flat surfaceRaised fill,
        // a brand-alpha border and one radial-gradient glow (no separate
        // blurred blob elements, no backdrop-filter) — elevation.e2 plus a
        // brand-tinted glow shadow, both modes.
        backgroundColor: surfaceRaised,
        backgroundImage: `radial-gradient(120% 100% at 10% 0%, ${alpha(brandPrimary, isDark ? 0.16 : 0.07)} 0%, transparent 55%), radial-gradient(120% 100% at 90% 100%, ${alpha(brandLogo, isDark ? 0.14 : 0.06)} 0%, transparent 55%)`,
        border: `1px solid ${alpha(brandPrimary, isDark ? 0.35 : 0.18)}`,
        borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
        boxShadow: `${theme.custom.elevation.e2}, 0 0 32px ${alpha(brandPrimary, isDark ? 0.16 : 0.08)}`,
        padding: { xs: '1.5rem', sm: '2.5rem', md: '3rem' },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Heading — title takes Phase 17's brand gradient (brandPrimary ->
            lighten(brandPrimary)), the one gradient in the app, so it stays
            token-driven into dark mode instead of a picked hex pair. */}
        <Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 600, letterSpacing: 1, color: alpha(theme.custom.color.ink, 0.6) }}
          >
            {t('whatWeDo')}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              mt: 0.5,
              display: 'inline-block',
              backgroundImage: `linear-gradient(135deg, ${theme.custom.color.brandPrimary} 0%, ${lighten(theme.custom.color.brandPrimary, 0.45)} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t('afterPostingInMafqoudat')}
          </Typography>
        </Box>

        {/* Step cards — brand-tinted flat tiles, same recipe as SocialReach's
            PlatformBlock (tinted fill + brand-alpha border, no blur/glass),
            with a brand-glow hover in place of the old e1 -> e2 lift. No step
            numbers or connecting arrows: reading order alone (which
            auto-mirrors in RTL, since flexbox's row axis follows
            inline-start/end) already says "first, second, third" without
            needing to spell it out, and a number badge or a chevron between
            cards read as filler rather than information. */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            gap: { xs: 3, md: 4 },
          }}
        >
          {processSteps.map((step) => {
            const StepIcon = STEP_ICONS[step.icon];
            return (
              <Box
                key={step.icon}
                className="processCard"
                sx={{
                  ...tintedCard(`${theme.custom.radius.md}px`),
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 1.25,
                  p: { xs: 3, md: 3.5 },
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': {
                    boxShadow: `0 0 24px ${alpha(brandPrimary, isDark ? 0.35 : 0.25)}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  className="processNode"
                  sx={{
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: brandLogo,
                    // Dark mode: glowing disc via brandLogo-tinted shadow;
                    // light mode keeps the original flat elevation.e1.
                    boxShadow: isDark
                      ? `0 4px 16px ${alpha(brandLogo, 0.4)}`
                      : theme.custom.elevation.e1,
                  }}
                >
                  <StepIcon sx={{ color: iconContrastText, fontSize: 26 }} />
                </Box>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    fontFamily: theme.custom.font.display,
                    fontSize: { xs: '1.15rem', md: '1.1rem' },
                    color: theme.custom.color.ink,
                  }}
                >
                  {step.text}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: theme.custom.font.body,
                    fontSize: { xs: '1rem', md: '0.95rem' },
                    color: alpha(theme.custom.color.ink, 0.7),
                  }}
                >
                  {step.description}
                </Typography>

                {/* Lost/Found-specific clarifier — the notify step genuinely
                    differs by post type, so it's worth spelling out. Each
                    line takes its status token's bg/main pairing instead of
                    a bare dot, the same tint-plus-solid-text pairing
                    theme.custom.status uses everywhere else. */}
                {step.icon === 'notif' && (
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1,
                        borderRadius: `${theme.custom.radius.sm}px`,
                        backgroundColor: theme.custom.status.lost.bg,
                        textAlign: 'start',
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          mt: '6px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          backgroundColor: theme.custom.status.lost.main,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: theme.custom.font.body, fontSize: '0.85rem', fontWeight: 600, color: theme.custom.status.lost.main }}
                      >
                        {t('notifyLostHint')}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1,
                        borderRadius: `${theme.custom.radius.sm}px`,
                        backgroundColor: theme.custom.status.found.bg,
                        textAlign: 'start',
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          mt: '6px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          backgroundColor: theme.custom.status.found.main,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: theme.custom.font.body, fontSize: '0.85rem', fontWeight: 600, color: theme.custom.status.found.main }}
                      >
                        {t('notifyFoundHint')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Social links */}
        <Box className="processSocial" sx={{ mt: { xs: 4, md: 5 } }}>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              textAlign: 'center',
              fontWeight: 600,
              letterSpacing: 1,
              color: alpha(theme.custom.color.ink, 0.6),
              mb: 1.5,
            }}
          >
            {t('followUs')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  ...tintedCard('50%'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 0 24px ${alpha(brandPrimary, isDark ? 0.35 : 0.25)}`,
                  },
                }}
              >
                <RenderIcon name={social.name} />
              </Link>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Process;
