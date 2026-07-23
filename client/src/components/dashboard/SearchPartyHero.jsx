import { Box, useTheme, useMediaQuery, alpha } from "@mui/material";
import { useTranslation } from "../../utils/translations";
import { TrendingItemSkeleton } from "../LoadingStates";

// Fixed brand-mark color from client/public/maflogoSVG.svg — kept constant
// across light/dark like a real logo would be, not read from theme.custom
// (it isn't a themeable UI color, it's literally the site's logo icon color).
const LOGO_BLUE = "#3498DB";

// Replaces TrendingItem in the dashboard header (next to LeftSide): a fox,
// cat and dog take turns sweeping a map with the site's own magnifying-glass
// mark, pausing at a checkpoint then a destination pin where they "find"
// something and a speech bubble names it. One shared 8s lap (reused every
// time) plus a 24s meta-cycle deciding which of the three is on duty — the
// two timelines interleave on their own since 24 = 8 x 3, so there's no need
// for one giant hand-written keyframe list.
//
// CSS logical properties (insetInlineStart/End) handle RTL mirroring for
// every static position; the one thing CSS transforms don't mirror on their
// own is translateX, so the traveler's motion keyframes multiply by a
// --dir custom property (1 in LTR, -1 in RTL) instead of hardcoding a
// direction.
const SearchPartyHero = ({ totalReturned, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";

  const ink = theme.custom.color.ink;
  const panel = theme.custom.color.surfaceRaised;
  const belly = theme.custom.color.surfaceBase;
  const brand = theme.custom.color.brandPrimary;
  const found = theme.custom.status.found.main;
  const foundBg = theme.custom.status.found.bg;
  const lost = theme.custom.status.lost.main;
  const fur = ink;
  const furSoft = alpha(ink, 0.7);

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TrendingItemSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        role="img"
        aria-label={t("searchPartyFoundIt")}
        sx={{
          position: "relative",
          flex: 1,
          aspectRatio: isMobile ? "16 / 10" : undefined,
          minHeight: isMobile ? undefined : 320,
          borderRadius: `${theme.custom.radius.xl}px`,
          background: `linear-gradient(135deg, ${alpha(panel, 0.95)} 0%, ${alpha(panel, 0.95)} 100%)`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(ink, theme.palette.mode === "dark" ? 0.08 : 0.15)}`,
          boxShadow: theme.custom.elevation.e1,
          overflow: "hidden",

          "--dir": isRTL ? "-1" : "1",
          "--fur": fur,
          "--fur-soft": furSoft,
          "--belly": belly,
          "--found": found,
          "--panel": panel,
          "--ink": ink,
          "--logo-blue": LOGO_BLUE,
          "--font-body": theme.custom.font.body,
          "--font-display": theme.custom.font.display,

          "& .sky": {
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 90% at 80% 6%, ${alpha(brand, 0.06)} 0%, transparent 55%), ${panel}`,
          },
          "& .graticule": {
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${alpha(ink, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(ink, 0.05)} 1px, transparent 1px)`,
            backgroundSize: "12.5% 16.6%",
            opacity: 0.5,
          },
          "& .landmass": { position: "absolute" },
          "& .landmass svg": { width: "100%", height: "100%", display: "block" },

          "& .mote": {
            position: "absolute",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: lost,
            opacity: 0.26,
            animation: "spMoteDrift 9s ease-in-out infinite",
          },
          "& .mote.m1": { top: "12%", insetInlineStart: "14%", animationDelay: "0s" },
          "& .mote.m2": { top: "8%", insetInlineStart: "46%", animationDelay: "2.4s", width: 4, height: 4 },
          "& .mote.m3": { top: "16%", insetInlineStart: "90%", animationDelay: "5s", width: 3.5, height: 3.5 },
          "@keyframes spMoteDrift": {
            "0%, 100%": { transform: "translateY(0)", opacity: 0.2 },
            "50%": { transform: "translateY(-12px)", opacity: 0.36 },
          },

          "& .pin": {
            position: "absolute",
            width: 13,
            height: 13,
            marginTop: "-6.5px",
            marginInlineStart: "-6.5px",
            borderRadius: "50%",
            border: `2.5px solid ${panel}`,
            boxShadow: theme.custom.elevation.e1,
          },
          "& .pin.checkpoint": { top: "60%", insetInlineStart: "45%", backgroundColor: alpha(ink, 0.55) },
          "& .pin.destination": { top: "58%", insetInlineStart: "74%", backgroundColor: found },
          "& .pin-ring": {
            position: "absolute",
            top: "58%",
            insetInlineStart: "74%",
            width: 13,
            height: 13,
            marginTop: "-6.5px",
            marginInlineStart: "-6.5px",
            borderRadius: "50%",
            border: `2px solid ${found}`,
            animation: "spPinPulse 3s ease-out infinite",
          },
          "@keyframes spPinPulse": {
            "0%": { transform: "scale(0.6)", opacity: 0.6 },
            "100%": { transform: "scale(2.6)", opacity: 0 },
          },

          "& .chrome": {
            position: "absolute",
            top: 16,
            insetInlineStart: 16,
            insetInlineEnd: 16,
            zIndex: 5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
          },
          "& .state-chip": {
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            px: 1.5,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(ink, 0.06),
            border: `1px solid ${alpha(ink, 0.1)}`,
            fontSize: "12.5px",
            fontWeight: 600,
            color: ink,
            fontFamily: theme.custom.font.body,
            minWidth: 168,
          },
          "& .state-chip span": {
            position: "absolute",
            insetInlineStart: 12,
            insetInlineEnd: 12,
            opacity: 0,
            animation: "spStateA 8s ease-in-out infinite",
            whiteSpace: "nowrap",
          },
          "& .state-chip span.b": { animationName: "spStateB", color: found },
          "@keyframes spStateA": {
            "0%, 42%": { opacity: 1 },
            "47%, 68%": { opacity: 0 },
            "73%, 100%": { opacity: 1 },
          },
          "@keyframes spStateB": {
            "0%, 42%": { opacity: 0 },
            "47%, 68%": { opacity: 1 },
            "73%, 100%": { opacity: 0 },
          },

          "& .counter-chip": {
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            height: 28,
            px: 1.25,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: foundBg,
            color: found,
            fontSize: "12.5px",
            fontWeight: 700,
            fontFamily: theme.custom.font.body,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          },
          "& .counter-chip svg": { width: 13, height: 13, flexShrink: 0 },

          "& .stage": { position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, bottom: "4%", height: "62%" },
          "& .traveler": {
            position: "absolute",
            insetInlineStart: "6%",
            bottom: 0,
            width: "46%",
            maxWidth: 300,
            animation: "spPatrol 8s ease-in-out infinite",
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
          },
          "@keyframes spPatrol": {
            "0%": { transform: "translate(0%, 0px)" },
            "10%": { transform: "translate(calc(var(--dir) * 16%), -5px)" },
            "20%": { transform: "translate(calc(var(--dir) * 30%), 0px)" },
            "24%": { transform: "translate(calc(var(--dir) * 32%), 0px) scaleY(0.98)" },
            "30%": { transform: "translate(calc(var(--dir) * 32%), 0px)" },
            "38%": { transform: "translate(calc(var(--dir) * 50%), -4px)" },
            "46%": { transform: "translate(calc(var(--dir) * 66%), 0px)" },
            "50%": { transform: "translate(calc(var(--dir) * 68%), 0px) scaleY(0.97)" },
            "58%": { transform: "translate(calc(var(--dir) * 68%), -2px) scaleY(0.97)" },
            "68%": { transform: "translate(calc(var(--dir) * 68%), -9px)" },
            "76%": { transform: "translate(calc(var(--dir) * 50%), -3px)" },
            "88%": { transform: "translate(calc(var(--dir) * 14%), -4px)" },
            "100%": { transform: "translate(0%, 0px)" },
          },

          "& .creature": { animation: "none" },
          "& .creature.fox": { animation: "spShowFox 24s linear infinite" },
          "& .creature.cat": { animation: "spShowCat 24s linear infinite" },
          "& .creature.dog": { animation: "spShowDog 24s linear infinite" },
          "@keyframes spShowFox": { "0%, 33.3%": { opacity: 1 }, "33.34%, 100%": { opacity: 0 } },
          "@keyframes spShowCat": { "0%, 33.3%": { opacity: 0 }, "33.34%, 66.6%": { opacity: 1 }, "66.7%, 100%": { opacity: 0 } },
          "@keyframes spShowDog": { "0%, 66.6%": { opacity: 0 }, "66.7%, 100%": { opacity: 1 } },

          "& .tail": { animation: "spWag 1.15s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "88% 92%" },
          "@keyframes spWag": { "0%, 100%": { transform: "rotate(-7deg)" }, "50%": { transform: "rotate(9deg)" } },
          "& .ears": { animation: "spPerk 8s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 100%" },
          "@keyframes spPerk": {
            "0%, 36%": { transform: "rotate(0deg)" },
            "40%, 66%": { transform: "rotate(-6deg) translateY(-1px)" },
            "70%, 100%": { transform: "rotate(0deg)" },
          },
          "& .eye": { animation: "spBlink 4.4s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 50%" },
          "@keyframes spBlink": { "0%, 92%, 100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.12)" } },
          "& .glass-arm": { animation: "spSweep 3s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "12% 82%" },
          "@keyframes spSweep": { "0%, 100%": { transform: "rotate(-6deg)" }, "50%": { transform: "rotate(7deg)" } },
          "& .ping": { animation: "spPing 4s ease-out infinite", transformBox: "fill-box", transformOrigin: "50% 50%" },
          "@keyframes spPing": {
            "0%": { transform: "scale(0.3)", opacity: 0.55 },
            "70%, 100%": { transform: "scale(2.2)", opacity: 0 },
          },

          "& .find-item": { animation: "spReveal 8s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 50%" },
          "@keyframes spReveal": {
            "0%, 44%": { opacity: 0, transform: "scale(0.4) translateY(4px)" },
            "50%, 62%": { opacity: 1, transform: "scale(1) translateY(0px)" },
            "70%, 100%": { opacity: 0, transform: "scale(0.5) translateY(-4px)" },
          },
          "& .sparkle": { animation: "spSparkle 8s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 50%" },
          "& .sparkle.s2": { animationDelay: "0.08s" },
          "& .sparkle.s3": { animationDelay: "0.16s" },
          "@keyframes spSparkle": {
            "0%, 46%": { opacity: 0, transform: "scale(0.2) rotate(0deg)" },
            "54%": { opacity: 1, transform: "scale(1) rotate(45deg)" },
            "66%, 100%": { opacity: 0, transform: "scale(0.3) rotate(90deg)" },
          },

          "& .bubble-shell": { animation: "spReveal 8s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 100%" },
          "& .bubble-msg": { opacity: 0 },
          "& .bubble-msg.fox": { animation: "spMsgFox 24s linear infinite" },
          "& .bubble-msg.cat": { animation: "spMsgCat 24s linear infinite" },
          "& .bubble-msg.dog": { animation: "spMsgDog 24s linear infinite" },
          "@keyframes spMsgFox": { "0%, 33.3%": { opacity: 1 }, "33.34%, 100%": { opacity: 0 } },
          "@keyframes spMsgCat": { "0%, 33.3%": { opacity: 0 }, "33.34%, 66.6%": { opacity: 1 }, "66.7%, 100%": { opacity: 0 } },
          "@keyframes spMsgDog": { "0%, 66.6%": { opacity: 0 }, "66.7%, 100%": { opacity: 1 } },

          "@media (prefers-reduced-motion: reduce)": {
            "& .traveler, & .tail, & .ears, & .eye, & .glass-arm, & .ping, & .mote, & .pin-ring": {
              animation: "none !important",
            },
            "& .find-item, & .sparkle, & .bubble-shell": {
              animation: "none !important",
              opacity: "1 !important",
              transform: "none !important",
            },
            "& .creature.fox": { animation: "none !important", opacity: "1 !important" },
            "& .creature.cat, & .creature.dog": { animation: "none !important", opacity: "0 !important" },
            "& .bubble-msg.fox": { animation: "none !important", opacity: "1 !important" },
            "& .bubble-msg.cat, & .bubble-msg.dog": { animation: "none !important", opacity: "0 !important" },
            "& .state-chip span": { animation: "none !important", opacity: "0 !important" },
            "& .state-chip span.b": { opacity: "1 !important" },
          },
        }}
      >
        <div className="sky" />
        <div className="graticule" />

        <div className="landmass" style={{ insetInlineStart: "2%", top: "10%", width: "30%", height: "34%", opacity: 0.5 }}>
          <svg viewBox="0 0 100 60">
            <path d="M8,30 C4,18 16,6 34,8 C50,10 58,4 70,10 C84,16 92,28 82,38 C70,50 50,52 34,48 C18,44 10,42 8,30 Z" fill={alpha(ink, 0.07)} />
          </svg>
        </div>
        <div className="landmass" style={{ insetInlineEnd: "0%", top: "2%", width: "26%", height: "30%", opacity: 0.4 }}>
          <svg viewBox="0 0 100 60">
            <path d="M10,26 C6,14 22,4 42,8 C60,12 76,6 88,18 C96,26 90,40 74,44 C56,48 34,50 20,42 C10,36 12,34 10,26 Z" fill={alpha(brand, 0.07)} />
          </svg>
        </div>
        <div className="landmass" style={{ insetInlineStart: "30%", bottom: "0%", width: "44%", height: "30%", opacity: 0.55 }}>
          <svg viewBox="0 0 140 60">
            <path d="M6,40 C2,26 20,14 44,16 C64,18 78,8 100,12 C122,16 136,26 128,40 C118,54 88,58 60,56 C34,54 10,54 6,40 Z" fill={alpha(ink, 0.06)} />
          </svg>
        </div>

        <div className="mote m1" />
        <div className="mote m2" />
        <div className="mote m3" />

        <div className="pin checkpoint" aria-hidden="true" />
        <div className="pin destination" aria-hidden="true" />
        <div className="pin-ring" aria-hidden="true" />

        <div className="chrome">
          <div className="state-chip">
            <span className="a">{t("searchPartySniffing")}</span>
            <span className="b">{t("searchPartyFoundIt")}</span>
          </div>
          <div className="counter-chip">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("searchPartyCounter", { count: totalReturned ?? 0 })}
          </div>
        </div>

        <div className="stage">
          <div className="traveler">
            <svg viewBox="0 0 260 190" style={{ width: "100%", height: "auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="130" cy="178" rx="52" ry="6" fill="var(--ink)" opacity="0.08" />

              {/* ============ FOX (lap 1) ============ */}
              <g className="creature fox">
                <rect x="96" y="140" width="14" height="30" rx="6" fill="var(--fur-soft)" />
                <g className="tail"><path d="M76,120 C40,110 30,70 58,52 C40,74 48,104 82,116 Z" fill="var(--fur-soft)" /></g>
                <ellipse cx="120" cy="118" rx="56" ry="38" fill="var(--fur)" />
                <ellipse cx="118" cy="132" rx="36" ry="22" fill="var(--belly)" />
                <rect x="150" y="146" width="14" height="30" rx="6" fill="var(--fur)" />
                <g className="ears">
                  <polygon points="150,64 160,18 176,60" fill="var(--fur-soft)" />
                  <polygon points="153,58 160,30 168,56" fill="var(--belly)" />
                  <polygon points="170,62 180,20 194,58" fill="var(--fur)" />
                  <polygon points="173,56 181,32 188,54" fill="var(--belly)" />
                </g>
                <circle cx="178" cy="88" r="35" fill="var(--fur)" />
                <ellipse cx="206" cy="98" rx="17" ry="12" fill="var(--belly)" />
                <circle cx="221" cy="98" r="3.4" fill="var(--ink)" />
                <g className="eye"><circle cx="191" cy="80" r="4.4" fill="var(--ink)" /><circle cx="192.6" cy="78.2" r="1.3" fill="var(--panel)" /></g>

                <g className="glass-arm">
                  <rect x="176" y="112" width="12" height="26" rx="6" fill="var(--fur)" />
                  <line x1="196" y1="140" x2="212" y2="155" stroke="var(--logo-blue)" strokeWidth="6.5" strokeLinecap="round" />
                  <circle cx="222" cy="150" r="16.5" fill={alpha(LOGO_BLUE, 0.1)} stroke="var(--logo-blue)" strokeWidth="4.2" />
                  <path d="M231,144 C229,140 225,137 220,136.3" fill="none" stroke="var(--logo-blue)" strokeWidth="2.4" strokeLinecap="round" />
                  <g className="ping"><circle cx="222" cy="150" r="16.5" fill="none" stroke="var(--logo-blue)" strokeWidth="2" /></g>
                  <g className="find-item"><g transform="translate(213,141)"><circle cx="0" cy="0" r="6" fill="none" stroke="var(--found)" strokeWidth="3" /><rect x="4.5" y="-1.5" width="11" height="3" fill="var(--found)" /><rect x="12.5" y="1.5" width="3" height="4.5" fill="var(--found)" /></g></g>
                  <g className="sparkle s1"><rect x="200" y="128" width="5" height="5" fill="var(--found)" transform="rotate(45 202.5 130.5)" /></g>
                  <g className="sparkle s2"><rect x="238" y="136" width="4" height="4" fill="var(--found)" transform="rotate(45 240 138)" /></g>
                  <g className="sparkle s3"><rect x="230" y="164" width="4.5" height="4.5" fill="var(--found)" transform="rotate(45 232.25 166.25)" /></g>
                </g>
              </g>

              {/* ============ CAT (lap 2) — pointed ears, hooked tail, leaner ============ */}
              <g className="creature cat">
                <rect x="98" y="142" width="12" height="28" rx="6" fill="var(--fur-soft)" />
                <g className="tail"><path d="M78,124 C44,128 30,100 46,76 C40,98 54,116 84,118 Z" fill="var(--fur-soft)" /></g>
                <ellipse cx="120" cy="120" rx="52" ry="34" fill="var(--fur)" />
                <ellipse cx="118" cy="132" rx="32" ry="19" fill="var(--belly)" />
                <rect x="148" y="146" width="12" height="28" rx="6" fill="var(--fur)" />
                <g className="ears">
                  <polygon points="152,62 158,24 172,58" fill="var(--fur-soft)" />
                  <polygon points="154,56 159,36 166,54" fill="var(--belly)" />
                  <polygon points="172,60 180,22 190,56" fill="var(--fur)" />
                  <polygon points="174,54 181,38 186,52" fill="var(--belly)" />
                </g>
                <circle cx="178" cy="90" r="32" fill="var(--fur)" />
                <ellipse cx="203" cy="98" rx="14" ry="10" fill="var(--belly)" />
                <circle cx="216" cy="98" r="3" fill="var(--ink)" />
                <g className="eye"><circle cx="190" cy="82" r="4" fill="var(--ink)" /><circle cx="191.4" cy="80.4" r="1.2" fill="var(--panel)" /></g>
                <path d="M198,98 L212,95 M198,101 L213,101 M198,104 L212,107" stroke="var(--fur-soft)" strokeWidth="1" opacity="0.6" />

                <g className="glass-arm">
                  <rect x="174" y="112" width="12" height="24" rx="6" fill="var(--fur)" />
                  <line x1="194" y1="138" x2="210" y2="153" stroke="var(--logo-blue)" strokeWidth="6.5" strokeLinecap="round" />
                  <circle cx="220" cy="148" r="16.5" fill={alpha(LOGO_BLUE, 0.1)} stroke="var(--logo-blue)" strokeWidth="4.2" />
                  <path d="M229,142 C227,138 223,135 218,134.3" fill="none" stroke="var(--logo-blue)" strokeWidth="2.4" strokeLinecap="round" />
                  <g className="ping"><circle cx="220" cy="148" r="16.5" fill="none" stroke="var(--logo-blue)" strokeWidth="2" /></g>
                  <g className="find-item"><g transform="translate(211,139)"><circle cx="0" cy="0" r="6" fill="none" stroke="var(--found)" strokeWidth="3" /><rect x="4.5" y="-1.5" width="11" height="3" fill="var(--found)" /><rect x="12.5" y="1.5" width="3" height="4.5" fill="var(--found)" /></g></g>
                  <g className="sparkle s1"><rect x="198" y="126" width="5" height="5" fill="var(--found)" transform="rotate(45 200.5 128.5)" /></g>
                  <g className="sparkle s2"><rect x="236" y="134" width="4" height="4" fill="var(--found)" transform="rotate(45 238 136)" /></g>
                  <g className="sparkle s3"><rect x="228" y="162" width="4.5" height="4.5" fill="var(--found)" transform="rotate(45 230.25 164.25)" /></g>
                </g>
              </g>

              {/* ============ DOG (lap 3) — floppy ears, stubby tail, stockier ============ */}
              <g className="creature dog">
                <rect x="94" y="138" width="16" height="32" rx="7" fill="var(--fur-soft)" />
                <g className="tail"><path d="M74,126 C56,120 50,106 60,96 C58,110 66,120 82,122 Z" fill="var(--fur-soft)" /></g>
                <ellipse cx="122" cy="120" rx="60" ry="40" fill="var(--fur)" />
                <ellipse cx="120" cy="135" rx="40" ry="23" fill="var(--belly)" />
                <rect x="152" y="148" width="16" height="32" rx="7" fill="var(--fur)" />
                <g className="ears">
                  <path d="M148,70 C138,66 130,78 136,94 C140,104 150,100 152,88 C154,78 154,74 148,70 Z" fill="var(--fur-soft)" />
                  <path d="M182,66 C192,62 202,74 196,92 C192,102 180,98 178,86 C176,76 176,72 182,66 Z" fill="var(--fur)" />
                </g>
                <circle cx="180" cy="90" r="37" fill="var(--fur)" />
                <ellipse cx="210" cy="102" rx="19" ry="13" fill="var(--belly)" />
                <circle cx="227" cy="102" r="3.6" fill="var(--ink)" />
                <g className="eye"><circle cx="192" cy="82" r="4.6" fill="var(--ink)" /><circle cx="193.6" cy="80.2" r="1.3" fill="var(--panel)" /></g>

                <g className="glass-arm">
                  <rect x="178" y="114" width="13" height="27" rx="6" fill="var(--fur)" />
                  <line x1="199" y1="143" x2="216" y2="159" stroke="var(--logo-blue)" strokeWidth="6.5" strokeLinecap="round" />
                  <circle cx="226" cy="154" r="16.5" fill={alpha(LOGO_BLUE, 0.1)} stroke="var(--logo-blue)" strokeWidth="4.2" />
                  <path d="M235,148 C233,144 229,141 224,140.3" fill="none" stroke="var(--logo-blue)" strokeWidth="2.4" strokeLinecap="round" />
                  <g className="ping"><circle cx="226" cy="154" r="16.5" fill="none" stroke="var(--logo-blue)" strokeWidth="2" /></g>
                  <g className="find-item"><g transform="translate(217,145)"><circle cx="0" cy="0" r="6" fill="none" stroke="var(--found)" strokeWidth="3" /><rect x="4.5" y="-1.5" width="11" height="3" fill="var(--found)" /><rect x="12.5" y="1.5" width="3" height="4.5" fill="var(--found)" /></g></g>
                  <g className="sparkle s1"><rect x="204" y="132" width="5" height="5" fill="var(--found)" transform="rotate(45 206.5 134.5)" /></g>
                  <g className="sparkle s2"><rect x="242" y="140" width="4" height="4" fill="var(--found)" transform="rotate(45 244 142)" /></g>
                  <g className="sparkle s3"><rect x="234" y="168" width="4.5" height="4.5" fill="var(--found)" transform="rotate(45 236.25 170.25)" /></g>
                </g>
              </g>

              {/* shared speech bubble — same position works across all three skins */}
              <g className="bubble-shell" transform="translate(150,26)">
                <rect x="-2" y="-20" width="112" height="30" rx="10" fill="var(--panel)" stroke={alpha(ink, 0.14)} strokeWidth="1.5" />
                <polygon points="26,10 34,10 22,22" fill="var(--panel)" stroke={alpha(ink, 0.14)} strokeWidth="1.5" />
                <rect x="20" y="8" width="18" height="6" fill="var(--panel)" />
                <text className="bubble-msg fox" x="54" y="0" textAnchor="middle" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--found)">{t("searchPartyFoundIt")}</text>
                <text className="bubble-msg cat" x="54" y="0" textAnchor="middle" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--found)">{t("searchPartyReunited")}</text>
                <text className="bubble-msg dog" x="54" y="0" textAnchor="middle" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--found)">{t("searchPartyGotIt")}</text>
              </g>
            </svg>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default SearchPartyHero;
