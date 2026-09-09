import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
// The zig-zag stage.
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
// Because it is one fixed composition, it is fitted to narrower containers by
// scaling the whole thing rather than by re-flowing it — see `useHostWidth`.
// Below STAGE_MIN_SCALE the type would stop being readable, and the stacked
// layout further down takes over instead.
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

// Below this the stage's body copy drops under ~11.5px, so the stacked layout
// takes over. The media query is only the first guess (it avoids a layout
// flash on mount); the measured container width is what actually decides.
const STAGE_MIN_SCALE = 0.76;
const STAGE_LIKELY_FITS = `(min-width:${Math.ceil(STAGE.W * STAGE_MIN_SCALE) + 128}px)`;

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

// ---------------------------------------------------------------------------
// The stacked layout, for anything the stage cannot be scaled into.
//
// Same vocabulary — stadium pill, overlapping disc, notch, ring on a dotted
// trail — re-proportioned for one column: the trail runs straight down the
// inline-start edge, every pill is on the same side of it, and the STEP label
// and numeral move inside the pill, since a 104px numeral has nowhere to stand
// beside a 250px-wide pill. Two consequences worth naming:
//   * the corner radius is capped rather than left at half the height. The pill
//     grows with its copy here, and a true stadium on a 250x300 box is an
//     ellipse whose caps eat the text column from both ends.
//   * the trail is a repeating background with a cap dot at each end of the
//     column, not a path drawn through the rings. Row heights depend on how the
//     copy wraps, so a path through them would have to be measured — and it
//     buys nothing a straight line does not already say.
// ---------------------------------------------------------------------------
const narrowGeometry = (tight) => ({
  RAIL: 15, // trail centre, from the column's inline-start edge
  RING: tight ? 30 : 34,
  RING_BORDER: tight ? 3 : 3.5,
  RING_DOT: tight ? 14 : 16,
  PILL_START: tight ? 46 : 54,
  MIN_H: tight ? 128 : 140,
  RADIUS: tight ? 56 : 64,
  DISC: tight ? 80 : 96,
  DISC_INSET: tight ? 8 : 10,
  NOTCH_W: tight ? 9 : 10,
  NOTCH_H: tight ? 18 : 20,
  PAD_B: tight ? 14 : 16,
  PAD_E: tight ? 20 : 24,
  GAP: tight ? 10 : 12,
  TITLE_FS: tight ? 14.5 : 15.5,
  BODY_FS: tight ? 12 : 12.5,
  STEP_FS: tight ? 9.5 : 10,
  NUM_FS: tight ? 24 : 27,
  ROW_GAP: tight ? 18 : 22,
  DOT_R: 2.6,
  DOT_GAP: 20,
  CAP_R: 5.5,
  CAP: 26,
});

// index.css ships `body[dir="rtl"] * { text-align: inherit }`, which outranks a
// single Emotion class — so in Arabic every line here would silently take the
// document's right alignment. The centred pill title and the mirrored row's
// end-aligned numeral column have to say so at a specificity that global
// cannot override. Scoped to this section on purpose: the globals are older
// than it, and fixing them is a pass of its own.
const alignText = (value) => ({ "&&&": { textAlign: value } });

// The stage is a fixed-pixel composition, so it is fitted to its container by
// measuring the container and scaling. Returns 1 until the first measurement
// lands; the host clips, so an unscaled first frame cannot widen the page. The
// host wraps BOTH layouts, so it keeps reporting after a narrow container has
// sent the section to the stacked one and the stage can come back.
const useHostWidth = () => {
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;

    const measure = () => setWidth(el.clientWidth);
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { hostRef, width };
};

const Process = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const isDark = theme.palette.mode === "dark";
  const isRtl = theme.direction === "rtl";
  const { surfaceRaised, brandPrimary, brandLogo, ink } = theme.custom.color;

  const stageLikelyFits = useMediaQuery(STAGE_LIKELY_FITS);
  const { hostRef, width: hostWidth } = useHostWidth();
  const scale = hostWidth ? Math.min(1, hostWidth / STAGE.W) : 1;
  // The media query is the pre-measurement guess; once the host has reported,
  // the container has the final say — a sidebar or a narrower page shell can
  // leave less room than the viewport width implies.
  const isStage = hostWidth ? scale >= STAGE_MIN_SCALE : stageLikelyFits;
  const tight = useMediaQuery("(max-width:400px)");
  const N = useMemo(() => narrowGeometry(tight), [tight]);

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

  const pillFill = (color) => ({
    backgroundImage: `linear-gradient(180deg, ${lighten(color, 0.07)} 0%, ${color} 52%, ${darken(color, 0.07)} 100%)`,
    boxShadow: theme.custom.elevation.e3,
  });

  // CSS triangle from LOGICAL borders, so it flips with direction.
  const notch = (color, pointsInlineEnd, w, h) => ({
    position: "absolute",
    width: 0,
    height: 0,
    borderBlockStart: `${h / 2}px solid transparent`,
    borderBlockEnd: `${h / 2}px solid transparent`,
    ...(pointsInlineEnd
      ? { borderInlineStart: `${w}px solid ${darken(color, 0.07)}` }
      : { borderInlineEnd: `${w}px solid ${darken(color, 0.07)}` }),
  });

  // The disc's shadow falls INWARD, onto the pill it overlaps, which is what
  // separates the two; an elevation token is centred and cannot say that. It's
  // tinted from the pill's own colour rather than a fixed slate, so it stays a
  // shadow on that surface in both modes instead of a white smear in dark. Its
  // offset is the one value here that cannot be a logical property —
  // box-shadow has no inline-aware form — so `towardInlineEnd`, which says
  // which way the pill's body lies from the disc, is mirrored by hand.
  const disc = (color, size, towardInlineEnd, lift) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `radial-gradient(120% 120% at 30% 25%, ${surfaceRaised} 0%, ${
      isDark ? lighten(surfaceRaised, 0.07) : darken(surfaceRaised, 0.05)
    } 100%)`,
    boxShadow: [
      `${(towardInlineEnd !== isRtl ? 1 : -1) * lift.x}px ${lift.y}px ${lift.blur}px ${alpha(
        darken(color, 0.55),
        isDark ? 0.6 : 0.42
      )}`,
      `0 0 0 1px ${alpha(ink, isDark ? 0.14 : 0.05)}`,
      `inset 0 -3px 8px ${alpha(ink, isDark ? 0.14 : 0.06)}`,
    ].join(", "),
  });

  const ring = (color, size, border, dot) => ({
    position: "absolute",
    width: size,
    height: size,
    boxSizing: "border-box",
    borderRadius: "50%",
    border: `${border}px solid ${color}`,
    backgroundColor: surfaceRaised,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& > *": { width: dot, height: dot, borderRadius: "50%", backgroundColor: color },
  });

  const stepWordSx = {
    fontFamily: theme.custom.font.body,
    fontWeight: 600,
    textTransform: "uppercase",
    lineHeight: 1,
  };

  const stepNumSx = (color) => ({
    fontFamily: theme.custom.font.display,
    fontWeight: 700,
    lineHeight: 1.05,
    color,
  });

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

  // Scaling changes how tall the section is, and ScrollTrigger caches that.
  useEffect(() => {
    if (isStage) ScrollTrigger.refresh();
  }, [isStage, scale]);

  const renderStage = () => (
    <Box sx={{ position: "relative", width: "100%", height: stageHeight * scale, overflow: "hidden", mt: 4.5 }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: STAGE.W,
          height: stageHeight,
          marginLeft: `${-STAGE.W / 2}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
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
              <Box
                sx={{
                  ...pillFill(step.color),
                  position: "absolute",
                  top: 0,
                  insetInlineStart: pillStart,
                  width: STAGE.PILL_W,
                  height: STAGE.PILL_H,
                  borderRadius: STAGE.PILL_H / 2,
                }}
              />
              <Box
                sx={{
                  ...notch(step.color, lead, STAGE.NOTCH_W, STAGE.NOTCH_H),
                  insetInlineStart: notchStart,
                  top: (STAGE.PILL_H - STAGE.NOTCH_H) / 2,
                }}
              />

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

              <Box
                sx={{
                  ...disc(step.color, STAGE.DISC, !lead, { x: 7, y: 12, blur: 24 }),
                  insetInlineStart: discStart,
                  top: (STAGE.PILL_H - STAGE.DISC) / 2,
                }}
              >
                <StepIcon sx={{ color: marker, fontSize: Math.round(STAGE.DISC * 0.34) }} />
              </Box>

              <Box
                className="processNode"
                sx={{
                  ...ring(marker, STAGE.RING, STAGE.RING_BORDER, STAGE.RING_DOT),
                  insetInlineStart: ringCx(i) - STAGE.RING / 2,
                  top: (STAGE.PILL_H - STAGE.RING) / 2,
                }}
              >
                <Box />
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
                <Typography sx={{ ...stepWordSx, fontSize: STAGE.STEP_FS, letterSpacing: ".02em", color: alpha(ink, 0.42) }}>
                  {t("step")}
                </Typography>
                <Typography sx={{ ...stepNumSx(marker), fontSize: STAGE.NUM_FS, mt: 0.75 }}>{num}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const renderStack = () => (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: `${N.ROW_GAP}px`,
        paddingBlock: `${N.CAP}px`,
        mt: 1,
      }}
    >
      <Box
        className="processTrail"
        aria-hidden="true"
        sx={{
          position: "absolute",
          insetInlineStart: N.RAIL - N.DOT_R,
          top: 0,
          bottom: 0,
          width: N.DOT_R * 2,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            insetInlineStart: 0,
            top: N.CAP_R * 2,
            bottom: N.CAP_R * 2,
            width: N.DOT_R * 2,
            backgroundImage: `radial-gradient(circle, ${alpha(ink, 0.34)} 0 ${N.DOT_R}px, transparent ${N.DOT_R + 0.4}px)`,
            backgroundSize: `${N.DOT_R * 2}px ${N.DOT_GAP}px`,
            backgroundRepeat: "repeat-y",
          }}
        />
        {["top", "bottom"].map((edge) => (
          <Box
            key={edge}
            sx={{
              position: "absolute",
              [edge]: 0,
              insetInlineStart: N.DOT_R - N.CAP_R,
              width: N.CAP_R * 2,
              height: N.CAP_R * 2,
              borderRadius: "50%",
              backgroundColor: alpha(ink, 0.42),
            }}
          />
        ))}
      </Box>

      {processSteps.map((step, i) => {
        const StepIcon = STEP_ICONS[step.icon];
        const marker = onPanel(step.color);
        const pillText = theme.palette.getContrastText(step.color);
        const num = String(i + 1).padStart(2, "0");

        return (
          <Box key={step.icon} sx={{ position: "relative" }}>
            <Box
              className="processCard"
              sx={{
                ...pillFill(step.color),
                position: "relative",
                marginInlineStart: `${N.PILL_START}px`,
                minHeight: N.MIN_H,
                borderRadius: `${N.RADIUS}px`,
                boxSizing: "border-box",
                paddingBlock: `${N.PAD_B}px`,
                paddingInlineStart: `${N.DISC_INSET + N.DISC + N.GAP}px`,
                paddingInlineEnd: `${N.PAD_E}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.25 }}>
                <Typography
                  component="span"
                  sx={{ ...stepWordSx, fontSize: N.STEP_FS, letterSpacing: ".14em", color: alpha(pillText, 0.75) }}
                >
                  {t("step")}
                </Typography>
                <Typography component="span" sx={{ ...stepNumSx(pillText), fontSize: N.NUM_FS, lineHeight: 1 }}>
                  {num}
                </Typography>
              </Box>

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  fontFamily: theme.custom.font.display,
                  fontSize: N.TITLE_FS,
                  lineHeight: 1.25,
                  mb: 0.5,
                  color: pillText,
                  ...alignText("start"),
                }}
              >
                {step.text}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontSize: N.BODY_FS,
                  lineHeight: 1.5,
                  color: alpha(pillText, 0.92),
                  textWrap: "pretty",
                  ...alignText("start"),
                }}
              >
                {step.description}
              </Typography>

              <Box
                sx={{
                  ...disc(step.color, N.DISC, true, { x: 6, y: 10, blur: 20 }),
                  insetInlineStart: N.DISC_INSET,
                  top: "50%",
                  marginTop: `${-N.DISC / 2}px`,
                }}
              >
                <StepIcon sx={{ color: marker, fontSize: Math.round(N.DISC * 0.36) }} />
              </Box>
            </Box>

            <Box
              sx={{
                ...notch(step.color, false, N.NOTCH_W, N.NOTCH_H),
                insetInlineStart: N.PILL_START - N.NOTCH_W,
                top: "50%",
                marginTop: `${-N.NOTCH_H / 2}px`,
              }}
            />

            <Box
              className="processNode"
              sx={{
                ...ring(marker, N.RING, N.RING_BORDER, N.RING_DOT),
                insetInlineStart: N.RAIL - N.RING / 2,
                top: "50%",
                marginTop: `${-N.RING / 2}px`,
              }}
            >
              <Box />
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
        <Box sx={{ maxWidth: 560, mx: "auto", mb: { xs: 2, md: 2 }, ...alignText("center") }}>
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

        <Box ref={hostRef} sx={{ width: "100%" }}>{isStage ? renderStage() : renderStack()}</Box>

        <Box className="processSocial" sx={{ mt: { xs: 3.5, md: 3 } }}>
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
