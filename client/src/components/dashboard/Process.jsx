import { useRef } from "react";
import { Box, Typography, useTheme, useMediaQuery, Link, alpha, lighten, darken } from "@mui/material";
import { Share, Campaign, Notifications } from "@mui/icons-material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { gsap, ScrollTrigger, useGSAP } from "../../utils/gsapSetup";
import { resolveScroller } from "../../features/dashboard/useDashboardMotion";

// Step icons still bypass RenderIcon, for the same reason as before: they sit
// on a light disc over a solid brand-ramp pill and take that pill's own colour,
// not RenderIcon's fixed brandPrimary fill.
const STEP_ICONS = { share: Share, ad: Campaign, notif: Notifications };

// The zig-zag is authored against a fixed pixel stage, because the dotted
// trail is a single SVG path whose curve has to pass exactly through each
// step's ring dot — that alignment only holds at 1:1 scale, so the stage
// renders at lg and up and the previous stacked layout serves everything
// narrower.
const STAGE_W = 844;
const STAGE_H = 620;
const PILL_W = 372;
const PILL_H = 130;
const DISC = 122;

// Per-row geometry on the stage. `lead` = the pill sits on the inline-start
// half (steps 1 and 3) and its notch points inline-end toward the trail;
// step 2 is the mirror. All offsets are logical (insetInlineStart), so RTL
// mirrors without a second copy of the markup.
const STAGE_ROWS = [
  { lead: true,  groupStart: 20,  top: 10,  pillStart: 0,  notchStart: 360, textStart: 34,  textTop: 26, discStart: 262, dotStart: 438, dotTop: 61,  numStart: 492, numTop: 36  },
  { lead: false, groupStart: 388, top: 175, pillStart: 64, notchStart: 42,  textStart: 188, textTop: 26, discStart: 52,  dotStart: 378, dotTop: 226, numStart: 212, numTop: 201 },
  { lead: true,  groupStart: 20,  top: 340, pillStart: 0,  notchStart: 360, textStart: 34,  textTop: 36, discStart: 262, dotStart: 438, dotTop: 391, numStart: 492, numTop: 366 },
];

const TRAIL_PATH =
  "M 418 6 C 452 26, 452 50, 452 75 C 452 130, 392 162, 392 240 C 392 318, 452 342, 452 405 C 452 468, 424 528, 418 592";

const Process = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isStage = useMediaQuery(theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const isDark = theme.palette.mode === "dark";
  const isRtl = theme.direction === "rtl";
  const { surfaceRaised, brandPrimary, brandLogo, ink } = theme.custom.color;

  // Three-stop ramp between the two existing brand tokens, so the steps read
  // as one progression and still follow the tokens into dark mode. brandLogo
  // is darkened in light mode purely for contrast: white pill text needs it.
  const ramp = [
    isDark ? brandLogo : darken(brandLogo, 0.2),
    lighten(brandPrimary, isDark ? 0.12 : 0.08),
    brandPrimary,
  ];

  const processSteps = [
    { icon: "share", text: t("shareToOurSocials"), description: t("shareToOurSocialsDesc"), color: ramp[0] },
    { icon: "ad", text: t("makeAdvertising"), description: t("makeAdvertisingDesc"), color: ramp[1] },
    { icon: "notif", text: t("wellNotifyYou"), description: t("wellNotifyYouDesc"), color: ramp[2] },
  ];

  const socialLinks = [
    { name: "face", url: "https://www.facebook.com/profile.php?id=100075968495897" },
    { name: "whats", url: "https://wa.me/212711621132" },
    { name: "insta", url: "https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu" },
  ];

  const tintedCard = (radius) => ({
    position: "relative",
    backgroundColor: alpha(brandPrimary, isDark ? 0.1 : 0.05),
    border: `1px solid ${alpha(brandPrimary, isDark ? 0.3 : 0.18)}`,
    borderRadius: radius,
  });

  const pillFace = (color) => ({
    position: "absolute",
    top: 0,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundImage: `linear-gradient(160deg, ${lighten(color, 0.12)} 0%, ${color} 55%, ${darken(color, 0.1)} 100%)`,
    boxShadow: `0 14px 28px ${alpha(color, isDark ? 0.45 : 0.32)}`,
  });

  // CSS triangle from LOGICAL borders, so it flips with direction.
  const notch = (color, pointsInlineEnd) => ({
    position: "absolute",
    top: 53,
    width: 0,
    height: 0,
    borderBlockStart: "12px solid transparent",
    borderBlockEnd: "12px solid transparent",
    ...(pointsInlineEnd
      ? { borderInlineStart: `22px solid ${darken(color, 0.1)}` }
      : { borderInlineEnd: `22px solid ${darken(color, 0.1)}` }),
  });

  const disc = (lead) => ({
    position: "absolute",
    top: 4,
    width: DISC,
    height: DISC,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `radial-gradient(120% 120% at 30% 25%, ${surfaceRaised} 0%, ${
      isDark ? lighten(surfaceRaised, 0.06) : darken(surfaceRaised, 0.05)
    } 100%)`,
    boxShadow: `${lead ? "-6px" : "6px"} 14px 26px ${alpha("#0F172A", isDark ? 0.5 : 0.22)}`,
  });

  const trailDot = (color) => ({
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: surfaceRaised,
    border: `3px solid ${color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const stepWordSx = {
    fontFamily: theme.custom.font.body,
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: ".16em",
    lineHeight: 1.2,
    color: alpha(ink, 0.55),
  };

  const stepNumSx = (color) => ({
    fontFamily: theme.custom.font.display,
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1,
    color,
  });

  const nodeSize = isMobile ? 56 : 64;

  const notifyHints = [
    { key: "lost", token: theme.custom.status.lost, text: t("notifyLostHint") },
    { key: "found", token: theme.custom.status.found, text: t("notifyFoundHint") },
  ];

  // Unchanged from the previous version, just extracted so both layouts use it.
  const NotifyHints = ({ width = "100%", mt = 0.5 }) => (
    <Box sx={{ width, display: "flex", flexDirection: "column", gap: 0.75, mt }}>
      {notifyHints.map((hint) => (
        <Box
          key={hint.key}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            p: 1,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: hint.token.bg,
            textAlign: "start",
          }}
        >
          <Box sx={{ width: 6, height: 6, mt: "6px", borderRadius: "50%", flexShrink: 0, backgroundColor: hint.token.main }} />
          <Typography
            variant="body2"
            sx={{ fontFamily: theme.custom.font.body, fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.45, color: hint.token.main }}
          >
            {hint.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  useGSAP(() => {
    if (!rootRef.current) return undefined;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(rootRef);
      const cards = q(".processCard");
      const nodes = q(".processNode");
      const trail = q(".processTrail");
      const social = q(".processSocial");
      const scroller = resolveScroller(rootRef.current);

      try {
        gsap.set(cards, { autoAlpha: 0, y: 24 });
        gsap.set(nodes, { scale: 0 });
        gsap.set(social, { autoAlpha: 0, y: 16 });
        if (trail.length) gsap.set(trail, { autoAlpha: 0 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: rootRef.current, scroller, start: "top 80%", once: true },
        });

        tl.to(cards, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12, clearProps: "transform" })
          .to(nodes, { scale: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.12, clearProps: "transform" }, "<0.1")
          .to(trail, { autoAlpha: 1, duration: 0.6 }, "<")
          .to(social, { autoAlpha: 1, y: 0, duration: 0.5, clearProps: "transform" }, "-=0.2");
      } catch (error) {
        console.error("Process motion failed to initialise:", error);
        gsap.set([...cards, ...nodes, ...trail, ...social], { clearProps: "all" });
      }

      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => cancelAnimationFrame(raf);
    });

    return () => mm.revert();
    // isStage swaps the whole subtree, so the timeline has to be rebuilt
    // against the new nodes.
  }, { scope: rootRef, dependencies: [isStage] });

  const renderStage = () => (
    <Box sx={{ position: "relative", width: STAGE_W, height: STAGE_H, mx: "auto", mt: 2 }}>
      {/* Decorative: mirrored wholesale in RTL since it carries no text. */}
      <Box
        className="processTrail"
        aria-hidden="true"
        component="svg"
        viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        width={STAGE_W}
        height={STAGE_H}
        sx={{
          position: "absolute",
          insetInlineStart: 0,
          top: 0,
          pointerEvents: "none",
          transform: isRtl ? "scaleX(-1)" : "none",
        }}
      >
        <path
          d={TRAIL_PATH}
          fill="none"
          stroke={alpha(ink, 0.3)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="0.5 19"
        />
        <circle cx="418" cy="6" r="9" fill={alpha(ink, 0.38)} />
        <circle cx="418" cy="592" r="9" fill={alpha(ink, 0.38)} />
      </Box>

      {processSteps.map((step, i) => {
        const g = STAGE_ROWS[i];
        const StepIcon = STEP_ICONS[step.icon];
        const pillText = theme.palette.getContrastText(step.color);
        const num = String(i + 1).padStart(2, "0");

        return (
          <Box key={step.icon} sx={{ display: "contents" }}>
            <Box
              className="processCard"
              sx={{ position: "absolute", insetInlineStart: g.groupStart, top: g.top, width: 436, height: PILL_H }}
            >
              <Box sx={{ ...pillFace(step.color), insetInlineStart: g.pillStart }} />
              <Box sx={{ ...notch(step.color, g.lead), insetInlineStart: g.notchStart }} />

              <Box
                sx={{
                  position: "absolute",
                  insetInlineStart: g.textStart,
                  top: g.textTop,
                  width: 214,
                  textAlign: g.lead ? "start" : "end",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontFamily: theme.custom.font.display, fontSize: "1.05rem", mb: 0.5, color: pillText }}
                >
                  {step.text}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: theme.custom.font.body, fontSize: "0.8rem", lineHeight: 1.5, color: pillText, textWrap: "pretty" }}
                >
                  {step.description}
                </Typography>
              </Box>

              <Box className="processNode" sx={{ ...disc(g.lead), insetInlineStart: g.discStart }}>
                <StepIcon sx={{ color: step.color, fontSize: 48 }} />
              </Box>
            </Box>

            <Box sx={{ ...trailDot(step.color), insetInlineStart: g.dotStart, top: g.dotTop }}>
              <Box sx={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: step.color }} />
            </Box>

            <Box
              sx={{
                position: "absolute",
                insetInlineStart: g.numStart,
                top: g.numTop,
                width: 140,
                display: "flex",
                flexDirection: "column",
                alignItems: g.lead ? "flex-start" : "flex-end",
                textAlign: g.lead ? "start" : "end",
              }}
            >
              <Typography sx={stepWordSx}>{t("step")}</Typography>
              <Typography sx={stepNumSx(step.color)}>{num}</Typography>
            </Box>

            {step.icon === "notif" && (
              <Box sx={{ position: "absolute", insetInlineStart: 20, top: 492, width: 352 }}>
                <NotifyHints mt={0} />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  // Narrower than lg: the same vocabulary (ramp colour, number, disc) in a
  // stacked column, no fixed stage and no trail.
  const renderStack = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
      {processSteps.map((step, i) => {
        const StepIcon = STEP_ICONS[step.icon];
        const num = String(i + 1).padStart(2, "0");
        return (
          <Box
            key={step.icon}
            className="processCard"
            sx={{
              ...tintedCard(`${theme.custom.radius.md}px`),
              display: "flex",
              alignItems: "flex-start",
              gap: { xs: 2, sm: 2.5 },
              p: { xs: 2.5, md: 3 },
              borderInlineStartWidth: 4,
              borderInlineStartColor: step.color,
              transition: "box-shadow 0.25s ease, transform 0.25s ease",
              "&:hover": {
                boxShadow: `0 0 24px ${alpha(brandPrimary, isDark ? 0.35 : 0.25)}`,
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box
              className="processNode"
              sx={{
                width: nodeSize,
                height: nodeSize,
                flexShrink: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: step.color,
                boxShadow: isDark ? `0 4px 16px ${alpha(step.color, 0.4)}` : theme.custom.elevation.e1,
              }}
            >
              <StepIcon sx={{ color: theme.palette.getContrastText(step.color), fontSize: 26 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, textAlign: "start" }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5 }}>
                <Typography sx={{ ...stepNumSx(step.color), fontSize: 28 }}>{num}</Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontFamily: theme.custom.font.display, fontSize: { xs: "1.1rem", md: "1.15rem" }, color: ink }}
                >
                  {step.text}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontFamily: theme.custom.font.body, fontSize: { xs: "0.95rem", md: "0.95rem" }, color: alpha(ink, 0.7), textWrap: "pretty" }}
              >
                {step.description}
              </Typography>
              {step.icon === "notif" && <NotifyHints />}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box
      ref={rootRef}
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: surfaceRaised,
        backgroundImage: `radial-gradient(120% 100% at 10% 0%, ${alpha(brandPrimary, isDark ? 0.16 : 0.07)} 0%, transparent 55%), radial-gradient(120% 100% at 90% 100%, ${alpha(brandLogo, isDark ? 0.14 : 0.06)} 0%, transparent 55%)`,
        border: `1px solid ${alpha(brandPrimary, isDark ? 0.35 : 0.18)}`,
        borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
        boxShadow: `${theme.custom.elevation.e2}, 0 0 32px ${alpha(brandPrimary, isDark ? 0.16 : 0.08)}`,
        padding: { xs: "1.5rem", sm: "2.5rem", md: "3rem" },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", maxWidth: 560, mx: "auto", mb: { xs: 4, md: 2 } }}>
          <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 1, color: alpha(ink, 0.6) }}>
            {t("whatWeDo")}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              mt: 0.5,
              display: "inline-block",
              backgroundImage: `linear-gradient(135deg, ${brandPrimary} 0%, ${lighten(brandPrimary, 0.45)} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("afterPostingInMafqoudat")}
          </Typography>
        </Box>

        {isStage ? renderStage() : renderStack()}

        <Box className="processSocial" sx={{ mt: { xs: 4, md: 3 } }}>
          <Typography
            variant="overline"
            sx={{ display: "block", textAlign: "center", fontWeight: 600, letterSpacing: 1, color: alpha(ink, 0.6), mb: 1.5 }}
          >
            {t("followUs")}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  ...tintedCard("50%"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
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
