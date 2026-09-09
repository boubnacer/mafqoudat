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
// Because it is one fixed composition, it is fitted to narrower containers —
// mobile/responsive included — by scaling the whole thing down rather than by
// re-flowing it into a different layout: see `useHostWidth`. The mobile view
// is this same stage at a smaller scale, not a re-proportioned alternative.
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

// ---------------------------------------------------------------------------
// The wide (desktop) stage.
//
// The same vocabulary as the zig-zag above — pill, overlapping disc, notch,
// ring, STEP/numeral block, dotted trail — laid out the way the desktop
// reference does it: three pills side by side on one horizontal wave, the
// odd ones hanging above their ring with the notch pointing down, the even one
// below its ring with the notch pointing up, and every STEP/numeral block
// centred outside the pair. Every number is one measurement off that reference
// (pills 530x185, disc 162, gap 80 in its own pixels) carried across as a
// ratio, so the composition is the reference's and only its size is ours:
// pill 2.85:1, disc 0.875 x pill height, disc centre 0.818 x pill width, text
// column 0.50 x pill width, gap 0.151 x pill width, ring line separation
// 1.54 x pill height, and the two ring gaps below.
//
// The one departure is the body type, for the same reason Phase 20's was: the
// reference is set in placeholder Latin, this carries en/fr/ar. Proportionally
// the body would be 11px here; it is held at 13 so the longest French
// description still fits the fixed pill rather than spilling out of it. The
// title keeps the reference's ratio.
// ---------------------------------------------------------------------------
const HSTAGE = {
  PAD_X: 10,
  PAD_Y: 10,
  PILL_W: 388,
  PILL_H: 136,
  GAP: 59, // between two pills
  DISC: 119,
  DISC_CX: 317, // disc centre, from the pill's inline-start edge
  NOTCH_W: 18,
  NOTCH_H: 10,
  TEXT_START: 44,
  TEXT_W: 194,
  TEXT_PAD: 12,
  RING: 34,
  RING_BORDER: 3.5,
  RING_DOT: 13,
  // The two ring gaps are not the same number, because the reference's are
  // not: a pill hanging above the trail clears its ring by 0.514 x pill
  // height, one sitting below it by 0.378 — which is what staggers the middle
  // pill only a third of a pill height below its neighbours instead of half.
  RING_GAP_DOWN: 70, // pill's bottom edge to the ring centre below it
  RING_GAP_UP: 51, // ring centre to the pill's top edge below it
  RING_RISE: 209, // between the upper and the lower ring line
  META_GAP: 56, // ring centre to the near edge of the STEP / numeral block
  TITLE_FS: 17,
  BODY_FS: 13,
  STEP_FS: 35,
  NUM_FS: 76,
  // The trail's two end tails run outward from the outer rings and rise only
  // slightly toward the mid-line — in the reference they stay on their own
  // ring's side of the wave and terminate in the open below the outer pills,
  // rather than climbing to the middle and disappearing behind one.
  CAP_DX: 85,
  CAP_DY: 29,
  DOT_R: 2.9,
  DOT_GAP: 22,
  CAP_R: 6.2,
};

// The STEP word, its gap and the numeral — one block, the same height above
// the upper ring as below the lower one, which is what keeps the two rows'
// meta columns reading as one pair rather than two separate labels.
HSTAGE.META_H = Math.round(HSTAGE.STEP_FS + 6 + HSTAGE.NUM_FS * 1.05);
HSTAGE.RING_HIGH = HSTAGE.PAD_Y + HSTAGE.META_H + HSTAGE.META_GAP;
HSTAGE.RING_LOW = HSTAGE.RING_HIGH + HSTAGE.RING_RISE;
HSTAGE.H = HSTAGE.RING_LOW + HSTAGE.META_GAP + HSTAGE.META_H + HSTAGE.PAD_Y;

// Like the zig-zag stage's height, the wide stage's width comes from the step
// count, so a fourth step lengthens the wave instead of running off the end.
const hStageWidth = (rows) => HSTAGE.PAD_X * 2 + rows * HSTAGE.PILL_W + (rows - 1) * HSTAGE.GAP;

// Below this the wide stage's body copy drops under ~11px, so the section
// falls back to the zig-zag stage — which is the narrow/mobile view, unchanged.
const HSTAGE_MIN_SCALE = 0.84;

// The pre-measurement guess: the wide stage at its floor scale, plus the
// panel's own padding and page margins around it. Only ever used for the first
// paint and the prerendered shell — the measured container width decides after
// that, and this is deliberately a viewport query rather than a breakpoint,
// since the width that matters is not one of the theme's.
const WIDE_VIEWPORT_GUESS = Math.round(hStageWidth(3) * HSTAGE_MIN_SCALE) + 120;

// A down row hangs above its ring and points its notch at it; the next row is
// the mirror about the trail. Positions are logical, so RTL mirrors the whole
// wave without a second set of measurements.
const hIsDown = (i) => i % 2 === 0;
const hPillStart = (i) => HSTAGE.PAD_X + i * (HSTAGE.PILL_W + HSTAGE.GAP);
const hRingCx = (i) => hPillStart(i) + HSTAGE.PILL_W / 2;
const hRingCy = (i) => (hIsDown(i) ? HSTAGE.RING_LOW : HSTAGE.RING_HIGH);
const hPillTop = (i) =>
  hIsDown(i)
    ? HSTAGE.RING_LOW - HSTAGE.RING_GAP_DOWN - HSTAGE.PILL_H
    : HSTAGE.RING_HIGH + HSTAGE.RING_GAP_UP;

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

// The wide stage's trail is the same curve transposed: the S-segments run
// between rings along x instead of y, with the same eased control points, so
// both stages' waves are the one shape. The end tails are the one part that
// is not a transpose — see CAP_DX / CAP_DY: they leave their ring
// horizontally, the way every S-segment does, and rise only a little.
const buildTrailWide = (rows) => {
  const mid = (HSTAGE.RING_HIGH + HSTAGE.RING_LOW) / 2;
  const last = rows - 1;
  const capY = (i) => hRingCy(i) + Math.sign(mid - hRingCy(i)) * HSTAGE.CAP_DY;
  const head = { x: hRingCx(0) - HSTAGE.CAP_DX, y: capY(0) };
  const tail = { x: hRingCx(last) + HSTAGE.CAP_DX, y: capY(last) };

  const d = [
    `M ${head.x} ${head.y}`,
    `C ${head.x + HSTAGE.CAP_DX * 0.3} ${head.y}, ${hRingCx(0) - HSTAGE.CAP_DX * CAP_EASE} ${hRingCy(0)}, ${hRingCx(0)} ${hRingCy(0)}`,
  ];
  for (let i = 0; i < last; i += 1) {
    const c = S_EASE * (hRingCx(i + 1) - hRingCx(i));
    d.push(`C ${hRingCx(i) + c} ${hRingCy(i)}, ${hRingCx(i + 1) - c} ${hRingCy(i + 1)}, ${hRingCx(i + 1)} ${hRingCy(i + 1)}`);
  }
  d.push(
    `C ${hRingCx(last) + HSTAGE.CAP_DX * CAP_EASE} ${hRingCy(last)}, ${tail.x - HSTAGE.CAP_DX * 0.3} ${tail.y}, ${tail.x} ${tail.y}`
  );

  return { d: d.join(" "), head, tail };
};

// index.css ships `body[dir="rtl"] * { text-align: inherit }`, which outranks a
// single Emotion class — so in Arabic every line here would silently take the
// document's right alignment. The centred pill title and the mirrored row's
// end-aligned numeral column have to say so at a specificity that global
// cannot override. Scoped to this section on purpose: the globals are older
// than it, and fixing them is a pass of its own.
const alignText = (value) => ({ "&&&": { textAlign: value } });

// The stage is a fixed-pixel composition, so it is fitted to its container —
// mobile width included — by measuring the container and scaling. Returns 1
// until the first measurement lands; the host clips, so an unscaled first
// frame cannot widen the page.
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

  const { hostRef, width: hostWidth } = useHostWidth();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  // The pre-measurement guess only: the prerendered shell has no layout to
  // measure, and the first paint must not pick the wrong composition. The
  // container's own width overrules it once measured, since a sidebar or a
  // narrower page shell leaves less room than the viewport implies.
  const isWideViewport = useMediaQuery(`(min-width:${WIDE_VIEWPORT_GUESS}px)`);

  // The zig-zag stage keeps its own md+ cap: it is measured off the same host,
  // then clamped to the width it used to be given directly.
  const narrowWidth = isMdUp ? Math.min(hostWidth, 640) : hostWidth;
  const scale = narrowWidth ? Math.min(1, narrowWidth / STAGE.W) : 1;

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
  const wideTrailPath = useMemo(() => buildTrailWide(processSteps.length), [processSteps.length]);

  // Two compositions, one measured host. The wide stage is the desktop
  // reference; it is used whenever the container can render it at
  // HSTAGE_MIN_SCALE or better, and below that the section falls back to the
  // zig-zag stage — which is the narrow/mobile view, unchanged, cap and all.
  const wideWidth = hStageWidth(processSteps.length);
  const wideScale = hostWidth ? Math.min(1, hostWidth / wideWidth) : 1;
  const useWide = hostWidth ? wideScale >= HSTAGE_MIN_SCALE : isWideViewport;

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

  // The wide stage's notch points along the block axis instead, so it needs no
  // mirroring — but it does need the gradient stop it grows out of: the pill's
  // dark bottom edge going down, its light top edge going up.
  const notchBlock = (color, pointsDown, w, h) => ({
    position: "absolute",
    width: 0,
    height: 0,
    borderInlineStart: `${w / 2}px solid transparent`,
    borderInlineEnd: `${w / 2}px solid transparent`,
    ...(pointsDown
      ? { borderBlockStart: `${h}px solid ${darken(color, 0.07)}` }
      : { borderBlockEnd: `${h}px solid ${lighten(color, 0.07)}` }),
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
  }, { scope: rootRef, dependencies: [] });

  // Scaling — and swapping composition — changes how tall the section is, and
  // ScrollTrigger caches that.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [scale, wideScale, useWide]);

  const renderWideStage = () => (
    <Box sx={{ position: "relative", width: "100%", height: HSTAGE.H * wideScale, overflow: "hidden", mt: 5 }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: wideWidth,
          height: HSTAGE.H,
          marginLeft: `${-wideWidth / 2}px`,
          transform: `scale(${wideScale})`,
          transformOrigin: "top center",
        }}
      >
        {/* Decorative: mirrored wholesale in RTL since it carries no text. */}
        <Box
          className="processTrail"
          aria-hidden="true"
          component="svg"
          viewBox={`0 0 ${wideWidth} ${HSTAGE.H}`}
          width={wideWidth}
          height={HSTAGE.H}
          sx={{
            position: "absolute",
            insetInlineStart: 0,
            top: 0,
            pointerEvents: "none",
            transform: isRtl ? "scaleX(-1)" : "none",
          }}
        >
          <path
            d={wideTrailPath.d}
            fill="none"
            stroke={alpha(ink, 0.34)}
            strokeWidth={HSTAGE.DOT_R * 2}
            strokeLinecap="round"
            strokeDasharray={`0.1 ${HSTAGE.DOT_GAP}`}
          />
          <circle cx={wideTrailPath.head.x} cy={wideTrailPath.head.y} r={HSTAGE.CAP_R} fill={alpha(ink, 0.42)} />
          <circle cx={wideTrailPath.tail.x} cy={wideTrailPath.tail.y} r={HSTAGE.CAP_R} fill={alpha(ink, 0.42)} />
        </Box>

        {processSteps.map((step, i) => {
          const StepIcon = STEP_ICONS[step.icon];
          const down = hIsDown(i);
          const marker = onPanel(step.color);
          const pillText = theme.palette.getContrastText(step.color);
          const num = String(i + 1).padStart(2, "0");

          const pillStart = hPillStart(i);
          const pillTop = hPillTop(i);
          const ringCyi = hRingCy(i);
          // The STEP / numeral block sits outside the pair, on the far side of
          // the ring from the pill, and is centred on the ring — so the column
          // reads down as ring, STEP, numeral on a down row and up as ring,
          // STEP, numeral on the row above the trail.
          const metaTop = down ? ringCyi + HSTAGE.META_GAP : ringCyi - HSTAGE.META_GAP - HSTAGE.META_H;

          return (
            <Box
              key={step.icon}
              className="processCard"
              sx={{ position: "absolute", insetInlineStart: 0, top: 0, width: wideWidth, height: HSTAGE.H }}
            >
              <Box
                sx={{
                  ...pillFill(step.color),
                  position: "absolute",
                  top: pillTop,
                  insetInlineStart: pillStart,
                  width: HSTAGE.PILL_W,
                  height: HSTAGE.PILL_H,
                  borderRadius: HSTAGE.PILL_H / 2,
                }}
              />
              <Box
                sx={{
                  ...notchBlock(step.color, down, HSTAGE.NOTCH_W, HSTAGE.NOTCH_H),
                  insetInlineStart: hRingCx(i) - HSTAGE.NOTCH_W / 2,
                  top: down ? pillTop + HSTAGE.PILL_H : pillTop - HSTAGE.NOTCH_H,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  insetInlineStart: pillStart + HSTAGE.TEXT_START,
                  top: pillTop + HSTAGE.TEXT_PAD,
                  width: HSTAGE.TEXT_W,
                  height: HSTAGE.PILL_H - 2 * HSTAGE.TEXT_PAD,
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
                    fontSize: HSTAGE.TITLE_FS,
                    lineHeight: 1.25,
                    mb: 0.625,
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
                    fontSize: HSTAGE.BODY_FS,
                    lineHeight: 1.45,
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
                  ...disc(step.color, HSTAGE.DISC, false, { x: 5, y: 9, blur: 19 }),
                  insetInlineStart: pillStart + HSTAGE.DISC_CX - HSTAGE.DISC / 2,
                  top: pillTop + (HSTAGE.PILL_H - HSTAGE.DISC) / 2,
                }}
              >
                <StepIcon sx={{ color: marker, fontSize: Math.round(HSTAGE.DISC * 0.34) }} />
              </Box>

              <Box
                className="processNode"
                sx={{
                  ...ring(marker, HSTAGE.RING, HSTAGE.RING_BORDER, HSTAGE.RING_DOT),
                  insetInlineStart: hRingCx(i) - HSTAGE.RING / 2,
                  top: ringCyi - HSTAGE.RING / 2,
                }}
              >
                <Box />
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  insetInlineStart: pillStart,
                  top: metaTop,
                  width: HSTAGE.PILL_W,
                  ...alignText("center"),
                }}
              >
                <Typography sx={{ ...stepWordSx, fontSize: HSTAGE.STEP_FS, letterSpacing: ".02em", color: alpha(ink, 0.42) }}>
                  {t("step")}
                </Typography>
                <Typography sx={{ ...stepNumSx(marker), fontSize: HSTAGE.NUM_FS, mt: 0.5 }}>{num}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

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
        <Box sx={{ maxWidth: useWide ? 760 : 560, mx: "auto", mb: { xs: 2, md: 2 }, ...alignText("center") }}>
          <Typography
            variant="overline"
            sx={{ display: "block", fontWeight: 600, letterSpacing: 1, color: alpha(ink, 0.6) }}
          >
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

        {/* The host measures the full container and wraps BOTH compositions —
            parked inside one of them it would stop reporting the moment the
            section swapped, and could never swap back. Desktop gets the wide
            stage; narrower containers keep the zig-zag one, with the md+ cap
            it has always had (the zig-zag is one fixed 820x916 composition,
            and an uncapped panel renders the full-size artwork, dwarfing the
            three-sentence copy inside it). xs/sm are narrower than that cap in
            practice, so the mobile view is exactly what it was. */}
        <Box ref={hostRef} sx={{ width: "100%" }}>
          {useWide ? (
            renderWideStage()
          ) : (
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 640 }, mx: "auto" }}>{renderStage()}</Box>
          )}
        </Box>

        <Box className="processSocial" sx={{ mt: useWide ? 4.5 : { xs: 3.5, md: 3 } }}>
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
