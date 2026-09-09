import { useMemo, useRef } from "react";
import { Box, Typography, useTheme, useMediaQuery, Link, alpha, lighten, darken } from "@mui/material";
import { ShareOutlined, CampaignOutlined, NotificationsNoneOutlined } from "@mui/icons-material";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { gsap, ScrollTrigger, useGSAP } from "../../utils/gsapSetup";
import { resolveScroller } from "../../features/dashboard/useDashboardMotion";

// Step icons still bypass RenderIcon, for the same reason as before: they sit
// on a light disc over a solid brand-ramp pill and take that pill's own colour,
// not RenderIcon's fixed brandPrimary fill. Outlined variants, because the disc
// is a large light field and a filled glyph reads as a blot on it.
const STEP_ICONS = { share: ShareOutlined, ad: CampaignOutlined, notif: NotificationsNoneOutlined };

// ---------------------------------------------------------------------------
// The desktop stage.
//
// Every number below is one measurement off the reference infographic this
// layout reproduces, divided by a single scale factor (the reference is 2044px
// wide, the stage is 820, so k = 0.55). Keeping them as one derived set is the
// point: the pill, the disc that overlaps it, the notch that points out of it,
// the ring the notch points AT and the numeral beside it are one composition,
// and changing any of them in isolation breaks the alignment the dotted trail
// depends on. Ratios worth naming: pill 2.56:1, disc 0.80 x pill height, row
// pitch 1.55 x pill height, numeral cap height 0.54 x pill height.
//
// The trail is a single SVG path whose curve has to pass exactly through each
// ring, and that alignment only holds at 1:1 scale — so the stage renders at lg
// and up, and the stacked rail below serves everything narrower.
// ---------------------------------------------------------------------------
const STAGE = {
  W: 820,
  PAD: 64, // clearance above the first pill / below the last, for the trail caps
  PILL_W: 491,
  PILL_H: 192,
  PITCH: 298, // top of one pill to the top of the next
  DISC: 153,
  DISC_CX: 397, // disc centre, from the pill's inline-start edge
  NOTCH_W: 12,
  NOTCH_H: 25,
  TEXT_START: 78, // text column, from the pill's outer edge
  TEXT_W: 224,
  TEXT_PAD: 34, // vertical inset of the text column inside the pill
  RING: 48,
  RING_BORDER: 4.5,
  RING_DOT: 23,
  RING_CX: 558, // from the stage's inline-start edge, on a lead row
  META_START: 628, // the STEP / numeral column, likewise
  META_W: 192,
  META_TOP: 26,
  TITLE_FS: 23,
  BODY_FS: 15,
  STEP_FS: 48,
  NUM_FS: 104,
  CAP: 150, // how far the trail runs past the first and last ring
  DOT_R: 3.9,
  DOT_GAP: 30,
  CAP_R: 8.5,
};

// A lead row puts its pill on the inline-start half and points its notch
// inline-end at the trail; the next row is the mirror. Every offset below is
// logical, so RTL mirrors without a second copy of the markup.
const isLead = (i) => i % 2 === 0;
const rowTop = (i) => STAGE.PAD + i * STAGE.PITCH;
const ringCy = (i) => rowTop(i) + STAGE.PILL_H / 2;
const ringCx = (i) => (isLead(i) ? STAGE.RING_CX : STAGE.W - STAGE.RING_CX);

// Both control-point ratios are fitted to the reference's own dot positions:
// 0.74 of the vertical gap is what flattens the middle of each S until it runs
// almost horizontally between two rows, and 0.55 is the quarter-turn each end
// cap makes from horizontal at the terminal dot to vertical at the first ring.
const S_EASE = 0.74;
const CAP_EASE = 0.55;

const buildTrail = (rows) => {
  const mid = STAGE.W / 2;
  const head = ringCy(0) - STAGE.CAP;
  const tail = ringCy(rows - 1) + STAGE.CAP;
  const last = rows - 1;

  const d = [
    `M ${mid} ${head}`,
    `C ${mid + CAP_EASE * (ringCx(0) - mid)} ${head}, ${ringCx(0)} ${ringCy(0) - CAP_EASE * STAGE.CAP}, ${ringCx(0)} ${ringCy(0)}`,
  ];
  for (let i = 0; i < last; i += 1) {
    const c = S_EASE * (ringCy(i + 1) - ringCy(i));
    d.push(`C ${ringCx(i)} ${ringCy(i) + c}, ${ringCx(i + 1)} ${ringCy(i + 1) - c}, ${ringCx(i + 1)} ${ringCy(i + 1)}`);
  }
  d.push(
    `C ${ringCx(last)} ${ringCy(last) + CAP_EASE * STAGE.CAP}, ${mid + CAP_EASE * (ringCx(last) - mid)} ${tail}, ${mid} ${tail}`
  );

  return { d: d.join(" "), head, tail, mid };
};

// index.css ships `body[dir="rtl"] * { text-align: inherit }`, which outranks a
// single Emotion class — so in Arabic every line on this stage would silently
// take the document's right alignment. The pill title is centred and the
// mirrored row's numeral column is end-aligned, and both have to say so at a
// specificity that global cannot override. Scoped to this stage on purpose:
// the globals are older than it, and fixing them is a pass of its own.
const alignText = (value) => ({ "&&&": { textAlign: value } });

const Process = () => {
  const theme = useTheme();
  const isStage = useMediaQuery(theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const isDark = theme.palette.mode === "dark";
  const isRtl = theme.direction === "rtl";
  const { surfaceRaised, brandPrimary, brandLogo, ink } = theme.custom.color;

  // Three-stop ramp between the two existing brand tokens, descending in
  // luminance the way the reference's does, so the steps read as one
  // progression. Each stop is a pill fill carrying white text, so each is
  // pinned below the luminance where getContrastText's white still clears
  // 4.5:1 — which is also why dark mode darkens brandPrimary first: its
  // dark-mode value is lightened for use as an accent ON a dark surface, not
  // as a field UNDER white text.
  const rampAnchor = isDark ? darken(brandPrimary, 0.2) : brandPrimary;
  const ramp = [darken(brandLogo, 0.22), rampAnchor, darken(rampAnchor, 0.3)];

  // The same tone as it has to read on the panel rather than under white pill
  // text — the ring, the numeral and the disc icon all sit on surfaceRaised,
  // where the deepest ramp stop would fall under 3:1 in dark mode.
  const onPanel = (color) => (isDark ? lighten(color, 0.3) : color);

  const processSteps = [
    { icon: "share", text: t("shareToOurSocials"), description: t("shareToOurSocialsDesc"), color: ramp[0] },
    { icon: "ad", text: t("makeAdvertising"), description: t("makeAdvertisingDesc"), color: ramp[1] },
    { icon: "notif", text: t("wellNotifyYou"), description: t("wellNotifyYouDesc"), color: ramp[2] },
  ];

  // The stage's height and its trail both come from the step count, so adding a
  // fourth step extends the curve rather than leaving it ending in mid-air.
  const stageHeight = STAGE.PAD * 2 + STAGE.PILL_H + (processSteps.length - 1) * STAGE.PITCH;
  const trailPath = useMemo(() => buildTrail(processSteps.length), [processSteps.length]);

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
    width: STAGE.PILL_W,
    height: STAGE.PILL_H,
    borderRadius: STAGE.PILL_H / 2,
    backgroundImage: `linear-gradient(180deg, ${lighten(color, 0.07)} 0%, ${color} 52%, ${darken(color, 0.07)} 100%)`,
    boxShadow: theme.custom.elevation.e3,
  });

  // CSS triangle from LOGICAL borders, so it flips with direction.
  const notch = (color, pointsInlineEnd) => ({
    position: "absolute",
    top: (STAGE.PILL_H - STAGE.NOTCH_H) / 2,
    width: 0,
    height: 0,
    borderBlockStart: `${STAGE.NOTCH_H / 2}px solid transparent`,
    borderBlockEnd: `${STAGE.NOTCH_H / 2}px solid transparent`,
    ...(pointsInlineEnd
      ? { borderInlineStart: `${STAGE.NOTCH_W}px solid ${darken(color, 0.07)}` }
      : { borderInlineEnd: `${STAGE.NOTCH_W}px solid ${darken(color, 0.07)}` }),
  });

  // The disc's shadow falls INWARD, onto the pill it overlaps, which is what
  // separates the two; an elevation token is centred and cannot say that. It's
  // tinted from the pill's own colour rather than a fixed slate, so it stays a
  // shadow on that surface in both modes instead of a white smear in dark. Its
  // offset is the one value on the stage that cannot be a logical property —
  // box-shadow has no inline-aware form — so it is mirrored by hand.
  const disc = (color, lead) => ({
    position: "absolute",
    top: (STAGE.PILL_H - STAGE.DISC) / 2,
    width: STAGE.DISC,
    height: STAGE.DISC,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `radial-gradient(120% 120% at 30% 25%, ${surfaceRaised} 0%, ${
      isDark ? lighten(surfaceRaised, 0.07) : darken(surfaceRaised, 0.05)
    } 100%)`,
    boxShadow: [
      `${lead !== isRtl ? "-7px" : "7px"} 12px 24px ${alpha(darken(color, 0.55), isDark ? 0.6 : 0.42)}`,
      `0 0 0 1px ${alpha(ink, isDark ? 0.14 : 0.05)}`,
      `inset 0 -3px 8px ${alpha(ink, isDark ? 0.14 : 0.06)}`,
    ].join(", "),
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

  const notifyHints = [
    { key: "lost", token: theme.custom.status.lost, text: t("notifyLostHint") },
    { key: "found", token: theme.custom.status.found, text: t("notifyFoundHint") },
  ];

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
    <Box sx={{ position: "relative", width: STAGE.W, height: stageHeight, mx: "auto", mt: 4.5 }}>
      {/* Decorative: mirrored wholesale in RTL since it carries no text. */}
      <Box
        className="processTrail"
        aria-hidden="true"
        component="svg"
        viewBox={`0 0 ${STAGE.W} ${stageHeight}`}
        width={STAGE.W}
        height={stageHeight}
        sx={{
          position: "absolute",
          insetInlineStart: 0,
          top: 0,
          pointerEvents: "none",
          transform: isRtl ? "scaleX(-1)" : "none",
        }}
      >
        <path
          d={trailPath.d}
          fill="none"
          stroke={alpha(ink, 0.34)}
          strokeWidth={STAGE.DOT_R * 2}
          strokeLinecap="round"
          strokeDasharray={`0.1 ${STAGE.DOT_GAP}`}
        />
        <circle cx={trailPath.mid} cy={trailPath.head} r={STAGE.CAP_R} fill={alpha(ink, 0.42)} />
        <circle cx={trailPath.mid} cy={trailPath.tail} r={STAGE.CAP_R} fill={alpha(ink, 0.42)} />
      </Box>

      {processSteps.map((step, i) => {
        const StepIcon = STEP_ICONS[step.icon];
        const lead = isLead(i);
        const marker = onPanel(step.color);
        const pillText = theme.palette.getContrastText(step.color);
        const num = String(i + 1).padStart(2, "0");

        // Mirror every inline offset around the stage for a non-lead row, so
        // the two variants stay one set of measurements rather than two.
        const pillStart = lead ? 0 : STAGE.W - STAGE.PILL_W;
        const discStart = pillStart + (lead ? STAGE.DISC_CX : STAGE.PILL_W - STAGE.DISC_CX) - STAGE.DISC / 2;
        const textStart = pillStart + (lead ? STAGE.TEXT_START : STAGE.PILL_W - STAGE.TEXT_START - STAGE.TEXT_W);
        const notchStart = lead ? STAGE.PILL_W : STAGE.W - STAGE.PILL_W - STAGE.NOTCH_W;
        const metaStart = lead ? STAGE.META_START : STAGE.W - STAGE.META_START - STAGE.META_W;

        return (
          <Box
            key={step.icon}
            className="processCard"
            sx={{ position: "absolute", insetInlineStart: 0, top: rowTop(i), width: STAGE.W, height: STAGE.PILL_H }}
          >
            <Box sx={{ ...pillFace(step.color), insetInlineStart: pillStart }} />
            <Box sx={{ ...notch(step.color, lead), insetInlineStart: notchStart }} />

            <Box
              sx={{
                position: "absolute",
                insetInlineStart: textStart,
                top: STAGE.TEXT_PAD,
                width: STAGE.TEXT_W,
                height: STAGE.PILL_H - 2 * STAGE.TEXT_PAD,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  fontFamily: theme.custom.font.display,
                  fontSize: STAGE.TITLE_FS,
                  lineHeight: 1.25,
                  mb: 0.875,
                  color: pillText,
                  ...alignText("center"),
                }}
              >
                {step.text}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontSize: STAGE.BODY_FS,
                  lineHeight: 1.5,
                  color: alpha(pillText, 0.92),
                  textWrap: "pretty",
                  ...alignText("start"),
                }}
              >
                {step.description}
              </Typography>
            </Box>

            <Box sx={{ ...disc(step.color, lead), insetInlineStart: discStart }}>
              <StepIcon sx={{ color: marker, fontSize: Math.round(STAGE.DISC * 0.34) }} />
            </Box>

            <Box
              className="processNode"
              sx={{
                position: "absolute",
                insetInlineStart: ringCx(i) - STAGE.RING / 2,
                top: (STAGE.PILL_H - STAGE.RING) / 2,
                width: STAGE.RING,
                height: STAGE.RING,
                boxSizing: "border-box",
                borderRadius: "50%",
                border: `${STAGE.RING_BORDER}px solid ${marker}`,
                backgroundColor: surfaceRaised,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ width: STAGE.RING_DOT, height: STAGE.RING_DOT, borderRadius: "50%", backgroundColor: marker }} />
            </Box>

            <Box
              sx={{
                position: "absolute",
                insetInlineStart: metaStart,
                top: STAGE.META_TOP,
                width: STAGE.META_W,
                ...alignText(lead ? "start" : "end"),
              }}
            >
              <Typography
                sx={{ ...stepWordSx, fontSize: STAGE.STEP_FS, letterSpacing: ".02em", textTransform: "uppercase", lineHeight: 1, color: alpha(ink, 0.42) }}
              >
                {t("step")}
              </Typography>
              <Typography sx={{ ...stepNumSx(marker), fontSize: STAGE.NUM_FS, lineHeight: 1.05, mt: 0.75 }}>{num}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  // Narrower than lg: the SAME pill vocabulary in one column — gradient pill
  // card, overlapping icon disc, STEP/0N inside the pill, and a dotted vertical
  // rail whose ring dots line up with each card. Fully fluid, so it holds from
  // a 320px phone up to the lg breakpoint; the rail is a repeating dotted
  // background rather than an SVG path, since a straight line needs no
  // hand-aligned geometry.
  const RAIL_INSET = 44;

  const renderRail = () => (
    <Box sx={{ position: "relative", paddingInlineStart: `${RAIL_INSET}px` }}>
      <Box
        className="processTrail"
        aria-hidden="true"
        sx={{
          position: "absolute",
          insetInlineStart: 13,
          top: 26,
          bottom: 26,
          width: 2,
          backgroundImage: `radial-gradient(circle, ${alpha(ink, 0.42)} 0 1.6px, transparent 1.9px)`,
          backgroundSize: "2px 15px",
          backgroundRepeat: "repeat-y",
        }}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {processSteps.map((step, i) => {
          const StepIcon = STEP_ICONS[step.icon];
          const pillText = theme.palette.getContrastText(step.color);
          const num = String(i + 1).padStart(2, "0");
          const isNotif = step.icon === "notif";

          return (
            <Box key={step.icon} sx={{ position: "relative" }}>
              <Box
                className="processNode"
                sx={{ ...trailDot(onPanel(step.color)), insetInlineStart: -RAIL_INSET, top: 18, boxSizing: "border-box" }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: onPanel(step.color) }} />
              </Box>

              <Box
                className="processCard"
                sx={{
                  position: "relative",
                  borderRadius: "22px",
                  p: 2.25,
                  // The disc overhangs the inline-end edge, so the pill's own
                  // text is inset to clear it — except on the notify step,
                  // where the hint chips sit below the disc and use full width.
                  paddingInlineEnd: isNotif ? 2.25 : "74px",
                  backgroundImage: `linear-gradient(150deg, ${lighten(step.color, 0.12)} 0%, ${step.color} 55%, ${darken(step.color, 0.1)} 100%)`,
                  boxShadow: `0 12px 26px ${alpha(step.color, isDark ? 0.45 : 0.34)}`,
                }}
              >
                <Box sx={{ paddingInlineEnd: isNotif ? "54px" : 0 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.125, mb: 0.625 }}>
                    <Typography
                      sx={{ ...stepWordSx, fontSize: 10, color: alpha(pillText, 0.82) }}
                    >
                      {t("step")}
                    </Typography>
                    <Typography sx={{ ...stepNumSx(pillText), fontSize: 26 }}>{num}</Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ fontFamily: theme.custom.font.display, fontSize: "1.05rem", mb: 0.625, color: pillText }}
                  >
                    {step.text}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ fontFamily: theme.custom.font.body, fontSize: "0.85rem", lineHeight: 1.5, color: pillText, textWrap: "pretty" }}
                  >
                    {step.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    insetInlineEnd: -8,
                    top: 22,
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: `radial-gradient(120% 120% at 30% 25%, ${surfaceRaised} 0%, ${
                      isDark ? lighten(surfaceRaised, 0.06) : darken(surfaceRaised, 0.05)
                    } 100%)`,
                    boxShadow: theme.custom.elevation.e3,
                  }}
                >
                  <StepIcon sx={{ color: onPanel(step.color), fontSize: 28 }} />
                </Box>

                {/* On the pill, the status tokens' own bg tints are too light to
                    sit on a saturated ground, so the chips take a dark scrim and
                    a lightened token for text — same pairing logic, restated for
                    this background. */}
                {isNotif && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.75 }}>
                    {notifyHints.map((hint) => (
                      <Box
                        key={hint.key}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          p: 1.25,
                          borderRadius: `${theme.custom.radius.sm}px`,
                          backgroundColor: alpha(darken(step.color, 0.75), 0.42),
                          textAlign: "start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            mt: "6px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            backgroundColor: lighten(hint.token.main, 0.3),
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: theme.custom.font.body,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            lineHeight: 1.45,
                            color: lighten(hint.token.main, 0.65),
                          }}
                        >
                          {hint.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box
      ref={rootRef}
      sx={{
        position: "relative",
        overflow: "hidden",
        // Flat surfaceRaised with elevation and no border, per Phase 8 — and
        // because the reference this section reproduces stands the whole
        // composition on a clean ground; a brand wash behind pills that are
        // themselves the brand ramp only muddies them.
        backgroundColor: surfaceRaised,
        borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
        boxShadow: theme.custom.elevation.e2,
        padding: { xs: "1.5rem", sm: "2.5rem", md: "3rem" },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: 560, mx: "auto", mb: { xs: 4, md: 2 }, ...alignText("center") }}>
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

        {isStage ? renderStage() : renderRail()}

        {/* The reference has no counterpart for these two lines, and the pill
            they belong to is a fixed shape with no room for them — so they sit
            under the stage as their own row rather than distorting step 3. The
            rail keeps its own copy inside the notify pill, where the saturated
            ground needs a dark scrim instead of the tokens' own bg tint. */}
        {isStage && (
          <Box className="processCard" sx={{ width: STAGE.W, mx: "auto", mt: 3, display: "flex", gap: 1.5 }}>
            {notifyHints.map((hint) => (
              <Box
                key={hint.key}
                sx={{
                  flex: "1 1 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1.5,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: hint.token.bg,
                  ...alignText("start"),
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
        )}

        <Box className="processSocial" sx={{ mt: { xs: 4, md: 3 } }}>
          <Typography
            variant="overline"
            sx={{ display: "block", fontWeight: 600, letterSpacing: 1, color: alpha(ink, 0.6), mb: 1.5, ...alignText("center") }}
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
