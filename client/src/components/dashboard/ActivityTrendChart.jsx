import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { format, parseISO } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { useTranslation } from "../../utils/translations";
import { TrendingItemSkeleton } from "../LoadingStates";

// viewBox geometry — a 340x130 canvas, plot area inset from the edges to
// leave room for date labels below and headroom above the tallest point.
const VB_W = 340;
const VB_H = 130;
const PLOT_X0 = 14;
const PLOT_X1 = 326;
const PLOT_Y0 = 14; // top of plot (max value)
const PLOT_Y1 = 96; // baseline (0)
const LABEL_Y = 114;

// Dark-mode-only override for the chart lines. theme.custom.status.found/
// lost's dark values (#3DDCA6 / #FF6B5E) are tuned to read as pill/badge
// TEXT on a dark surface — running them through the project's color
// validator as *chart marks* against the real dark surfaceRaised (#171B22)
// fails the lightness-band check (both too bright for a thin line/area
// mark). This pair is a deliberately different, separately-validated
// shade for that specific job; light mode uses the real tokens unchanged
// (that pair already passes every check as-is).
const DARK_CHART_FOUND = "#1FAE86";
const DARK_CHART_LOST = "#D9483C";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const xForIndex = (index, count, isRTL) => {
  const t = count > 1 ? index / (count - 1) : 0;
  const x = PLOT_X0 + t * (PLOT_X1 - PLOT_X0);
  return isRTL ? VB_W - x : x;
};

const yForValue = (value, maxValue) => PLOT_Y1 - (value / maxValue) * (PLOT_Y1 - PLOT_Y0);

const buildPath = (values, maxValue, isRTL) =>
  values
    .map((v, i) => `${i === 0 ? "M" : "L"}${xForIndex(i, values.length, isRTL).toFixed(2)},${yForValue(v, maxValue).toFixed(2)}`)
    .join(" ");

const DrawnPath = ({ d, color, animate }) => {
  const ref = useRef(null);
  const [dash, setDash] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const length = el.getTotalLength();
    if (!animate || prefersReducedMotion()) {
      setDash({ length, offset: 0, transition: false });
      return;
    }
    setDash({ length, offset: length, transition: false });
    const raf = requestAnimationFrame(() => {
      setDash({ length, offset: 0, transition: true });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={
        dash
          ? {
              strokeDasharray: dash.length,
              strokeDashoffset: dash.offset,
              transition: dash.transition ? "stroke-dashoffset 900ms ease-out" : "none",
            }
          : undefined
      }
    />
  );
};

// Replaces TrendingItem/SearchPartyHero in the dashboard header: a small
// 14-day Found-vs-Lost line chart paired with LeftSide's stats panel — the
// classic "stat panel + trend chart" pairing, and the only chart on the page.
const ActivityTrendChart = ({ dailyActivity, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const ink = theme.custom.color.ink;
  const panel = theme.custom.color.surfaceRaised;
  const isDark = theme.palette.mode === "dark";
  const foundColor = isDark ? DARK_CHART_FOUND : theme.custom.status.found.main;
  const lostColor = isDark ? DARK_CHART_LOST : theme.custom.status.lost.main;

  const locale = currentLanguage === "ar" ? ar : currentLanguage === "fr" ? fr : enUS;

  const data = useMemo(() => (Array.isArray(dailyActivity) ? dailyActivity : []), [dailyActivity]);

  const maxValue = useMemo(() => {
    const peak = data.reduce((m, d) => Math.max(m, d.found || 0, d.lost || 0), 0);
    return Math.max(peak, 1) * 1.15;
  }, [data]);

  const foundPath = useMemo(() => buildPath(data.map((d) => d.found || 0), maxValue, isRTL), [data, maxValue, isRTL]);
  const lostPath = useMemo(() => buildPath(data.map((d) => d.lost || 0), maxValue, isRTL), [data, maxValue, isRTL]);

  const handlePointerMove = (e) => {
    const svg = svgRef.current;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * VB_W;
    const t = (relX - PLOT_X0) / (PLOT_X1 - PLOT_X0);
    const tClamped = Math.min(1, Math.max(0, isRTL ? 1 - t : t));
    const index = Math.round(tClamped * (data.length - 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  };

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TrendingItemSkeleton />
      </Box>
    );
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const hoveredX = hoverIndex != null ? xForIndex(hoverIndex, data.length, isRTL) : null;
  const firstLabel = data[0] ? format(parseISO(data[0].date), "MMM d", { locale }) : "";
  const lastLabel = data[data.length - 1] ? format(parseISO(data[data.length - 1].date), "MMM d", { locale }) : "";
  const startX = data.length > 0 ? xForIndex(0, data.length, isRTL) : PLOT_X0;
  const endX = data.length > 0 ? xForIndex(data.length - 1, data.length, isRTL) : PLOT_X1;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flex: 1,
          minHeight: isMobile ? undefined : 320,
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${alpha(panel, 0.95)} 0%, ${alpha(panel, 0.95)} 100%)`,
          backdropFilter: "blur(10px)",
          borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
          border: `1px solid ${alpha(ink, isDark ? 0.08 : 0.15)}`,
          padding: isMobile ? "1.5rem" : "2rem",
          boxShadow: theme.custom.elevation.e1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: isMobile ? 2 : 3 }}>
          <Typography
            variant="h5"
            fontWeight="700"
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.65rem" }, color: ink }}
          >
            {t("activityTrend")}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: foundColor }} />
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: alpha(ink, 0.75) }}>{t("found")}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: lostColor }} />
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: alpha(ink, 0.75) }}>{t("lost")}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {/* recessive gridlines */}
            {[0.25, 0.5, 0.75].map((frac) => {
              const y = PLOT_Y1 - frac * (PLOT_Y1 - PLOT_Y0);
              return (
                <line
                  key={frac}
                  x1={PLOT_X0}
                  x2={PLOT_X1}
                  y1={y}
                  y2={y}
                  stroke={alpha(ink, isDark ? 0.1 : 0.08)}
                  strokeWidth={1}
                />
              );
            })}
            <line x1={PLOT_X0} x2={PLOT_X1} y1={PLOT_Y1} y2={PLOT_Y1} stroke={alpha(ink, isDark ? 0.16 : 0.14)} strokeWidth={1} />

            {data.length > 0 && (
              <>
                <DrawnPath d={lostPath} color={lostColor} animate />
                <DrawnPath d={foundPath} color={foundColor} animate />

                {/* today's endpoint, each series */}
                {[
                  { color: foundColor, value: data[data.length - 1].found },
                  { color: lostColor, value: data[data.length - 1].lost },
                ].map(({ color, value }, i) => (
                  <circle
                    key={i}
                    cx={xForIndex(data.length - 1, data.length, isRTL)}
                    cy={yForValue(value || 0, maxValue)}
                    r={4}
                    fill={color}
                    stroke={panel}
                    strokeWidth={2}
                  />
                ))}
              </>
            )}

            {/* date range caption — positioned from the same xForIndex used
                for the data points, so whichever end (oldest/newest) is
                visually on the left always gets the label that actually
                belongs there, instead of a hand-reasoned LTR/RTL swap. */}
            <text
              x={startX < endX ? startX : endX}
              y={LABEL_Y}
              fontSize="10"
              fill={alpha(ink, 0.55)}
              textAnchor="start"
              style={{ direction: isRTL ? "rtl" : "ltr" }}
            >
              {startX < endX ? firstLabel : lastLabel}
            </text>
            <text
              x={startX < endX ? endX : startX}
              y={LABEL_Y}
              fontSize="10"
              fill={alpha(ink, 0.55)}
              textAnchor="end"
              style={{ direction: isRTL ? "rtl" : "ltr" }}
            >
              {startX < endX ? lastLabel : firstLabel}
            </text>

            {/* hover crosshair + tooltip */}
            {hovered && hoveredX != null && (
              <g pointerEvents="none">
                <line x1={hoveredX} x2={hoveredX} y1={PLOT_Y0} y2={PLOT_Y1} stroke={alpha(ink, 0.25)} strokeWidth={1} />
                <circle cx={hoveredX} cy={yForValue(hovered.found || 0, maxValue)} r={4.5} fill={foundColor} stroke={panel} strokeWidth={2} />
                <circle cx={hoveredX} cy={yForValue(hovered.lost || 0, maxValue)} r={4.5} fill={lostColor} stroke={panel} strokeWidth={2} />

                {(() => {
                  const boxW = 108;
                  const boxH = 46;
                  let bx = hoveredX - boxW / 2;
                  bx = Math.min(VB_W - 4 - boxW, Math.max(4, bx));
                  const by = 6;
                  // Mirror the internal layout for RTL (dot+label swap
                  // sides) and set an explicit text direction so mixed
                  // Arabic-word + digit strings ("عثر عليه: 1") shape and
                  // order correctly — SVG <text> doesn't run the full
                  // Unicode bidi algorithm the way HTML block text does.
                  const dotX = isRTL ? boxW - 14 : 14;
                  const labelX = isRTL ? boxW - 22 : 22;
                  const labelAnchor = isRTL ? "end" : "start";
                  const titleX = isRTL ? boxW - 10 : 10;
                  const titleAnchor = isRTL ? "end" : "start";
                  const dir = isRTL ? "rtl" : "ltr";
                  return (
                    <g transform={`translate(${bx},${by})`}>
                      <rect width={boxW} height={boxH} rx={8} fill={panel} stroke={alpha(ink, 0.16)} strokeWidth={1} />
                      <text x={titleX} y={16} fontSize="10.5" fontWeight="700" fill={ink} textAnchor={titleAnchor} style={{ direction: dir }}>
                        {format(parseISO(hovered.date), "MMM d", { locale })}
                      </text>
                      <circle cx={dotX} cy={27} r={3} fill={foundColor} />
                      <text x={labelX} y={30.5} fontSize="10" fill={alpha(ink, 0.85)} textAnchor={labelAnchor} style={{ direction: dir }}>
                        {t("found")}: {hovered.found || 0}
                      </text>
                      <circle cx={dotX} cy={39} r={3} fill={lostColor} />
                      <text x={labelX} y={42.5} fontSize="10" fill={alpha(ink, 0.85)} textAnchor={labelAnchor} style={{ direction: dir }}>
                        {t("lost")}: {hovered.lost || 0}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityTrendChart;
