import React, { useRef } from "react";
import { Box, Typography, useTheme, useMediaQuery, Link, alpha, lighten } from "@mui/material";
import { Share, Campaign, Notifications, ArrowForwardOutlined } from "@mui/icons-material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";
import { gsap, ScrollTrigger, useGSAP } from "../../utils/gsapSetup";
import { resolveScroller } from "../../features/dashboard/useDashboardMotion";

// Step icons rendered directly (bypassing RenderIcon) because these sit on a
// solid brandPrimary disc and need contrast-text white, not RenderIcon's
// fixed brandPrimary fill — same reasoning FoundLostStrip/TrendingItem use to
// sidestep RenderIcon for Found/Lost (see RenderIcon's tokenization debt).
const STEP_ICONS = { share: Share, ad: Campaign, notif: Notifications };

const Process = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();
  const isRTLMode = isRTL();
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

  const nodeSize = isMobile ? 48 : 52;
  const iconContrastText = theme.palette.getContrastText(theme.custom.color.brandPrimary);

  // Same glass-blob family as QuickActions/Categories, toned down (gentle):
  // smaller blobs, lower opacity, since the step cards below now carry their
  // own elevation and don't need a loud backdrop competing with them.
  const processBlob = (color, position) => ({
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.14)} 0%, ${alpha(color, 0)} 70%)`,
    filter: 'blur(20px)',
    pointerEvents: 'none',
    ...position,
  });

  // Local GSAP rather than useDashboardMotion's data-reveal machinery: that
  // hook only ever animates y/scale/opacity generically, and this section
  // wants its own sequencing (card row, then each icon popping in on top of
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
      const reveal = q(".processReveal");
      const nodes = q(".processNode");
      const social = q(".processSocial");
      const scroller = resolveScroller(rootRef.current);

      try {
        gsap.set(reveal, { autoAlpha: 0, y: 24 });
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

        // .processReveal covers both the step cards and the arrows between
        // them, in DOM order — one stagger reads as "card, arrow, card,
        // arrow, card" instead of every card and arrow tweening as one group.
        // clearProps drops GSAP's own inline transform once each tween lands,
        // so the card's CSS `:hover` transform (its e1 -> e2 lift) isn't left
        // permanently outranked by a leftover inline style of equal specificity.
        tl.to(reveal, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12, clearProps: "transform" })
          .to(nodes, { scale: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.12, clearProps: "transform" }, "<0.1")
          .to(social, { autoAlpha: 1, y: 0, duration: 0.5, clearProps: "transform" }, "-=0.2");
      } catch (error) {
        // A reveal that fails to set itself up would otherwise leave real
        // content stuck at autoAlpha 0. Losing the animation is acceptable,
        // losing the section is not.
        console.error("Process motion failed to initialise:", error);
        gsap.set([...reveal, ...nodes, ...social], { clearProps: "all" });
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
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
        boxShadow: 'none',
        padding: { xs: '1.5rem', sm: '2.5rem', md: '3rem' },
      }}
    >
      <Box sx={processBlob(theme.custom.color.brandPrimary, { top: -80, insetInlineStart: -60 })} />
      <Box sx={processBlob(theme.custom.color.brandLogo, { bottom: -90, insetInlineEnd: -60 })} />

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

        {/* Step cards — three elevated surfaceRaised tiles (Post card DNA's
            e1 -> e2 hover-lift) connected by a small arrow instead of a line
            run through them, since a line reads awkwardly crossing a filled
            card. Arrow flips for RTL via a plain CSS mirror (static, not
            animated, so it needs no x-axis motion of its own). */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
          }}
        >
          {processSteps.map((step, index) => {
            const StepIcon = STEP_ICONS[step.icon];
            return (
              <React.Fragment key={step.icon}>
                <Box
                  className="processReveal"
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                    p: { xs: 2, md: 2.5 },
                    borderRadius: `${theme.custom.radius.lg}px`,
                    backgroundColor: theme.custom.color.surfaceRaised,
                    boxShadow: theme.custom.elevation.e1,
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    '&:hover': {
                      boxShadow: theme.custom.elevation.e2,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                        backgroundColor: theme.custom.color.brandPrimary,
                        boxShadow: theme.custom.elevation.e1,
                      }}
                    >
                      <StepIcon sx={{ color: iconContrastText, fontSize: 22 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, textAlign: 'start' }}>
                      <Typography
                        variant="overline"
                        sx={{ display: 'block', lineHeight: 1, fontWeight: 700, letterSpacing: 1, color: theme.custom.color.brandPrimary }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Typography>
                      <Typography
                        sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.05rem' }, color: theme.custom.color.ink }}
                      >
                        {step.text}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      textAlign: 'start',
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          p: 1,
                          borderRadius: `${theme.custom.radius.sm}px`,
                          backgroundColor: theme.custom.status.lost.bg,
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
                        <Typography sx={{ textAlign: 'start', fontSize: '0.85rem', fontWeight: 600, color: theme.custom.status.lost.main }}>
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
                        <Typography sx={{ textAlign: 'start', fontSize: '0.85rem', fontWeight: 600, color: theme.custom.status.found.main }}>
                          {t('notifyFoundHint')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {index < processSteps.length - 1 && (
                  <Box
                    className="processReveal"
                    aria-hidden="true"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: '100%', md: 48 },
                      height: { xs: 32, md: 'auto' },
                      flexShrink: 0,
                    }}
                  >
                    <ArrowForwardOutlined
                      sx={{
                        fontSize: 20,
                        color: alpha(theme.custom.color.brandPrimary, 0.5),
                        transform: {
                          xs: 'rotate(90deg)',
                          md: isRTLMode ? 'scaleX(-1)' : 'none',
                        },
                      }}
                    />
                  </Box>
                )}
              </React.Fragment>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e1,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: theme.custom.elevation.e2,
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
