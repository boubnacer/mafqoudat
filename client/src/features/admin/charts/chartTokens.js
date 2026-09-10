import { alpha } from '@mui/material';

/**
 * The panel's chart palette, and why it is what it is.
 *
 * Three chromatic slots, all of them tokens the rest of the app already draws
 * with, plus a de-emphasis grey derived from `ink`:
 *
 *   slot 1  brandPrimary       the single-series default (visitors, signups)
 *   lost    status.lost.main   lost listings
 *   found   status.found.main  found listings
 *   muted   alpha(ink, ...)    context, "expired", the previous period
 *
 * Lost and found take the app's own status tokens rather than a palette picked
 * for charts. That is a deliberate departure from the usual rule that status
 * colours stay out of series work: here "lost" and "found" are not a severity
 * scale, they are the product's two halves, and every other surface in the app
 * - the post card's accent bar, the status tag, the dashboard's Found/Lost
 * strip, the mobile listing pill - already codes them this way. A reader who
 * has learned that green means found across the whole site must not meet a
 * chart where it means something else.
 *
 * Checked with the colour validator rather than by eye. Light mode passes every
 * check (adjacent CVD ΔE 8.3 deutan, normal-vision 25.8, contrast ≥ 3:1). Dark
 * mode passes all of them except the lightness band, which the two dark status
 * tokens sit above by design - they are lightened precisely because they are
 * used ON dark surfaces, which is the surface these charts are drawn on. The
 * secondary encoding that band relief calls for is present regardless: two
 * series always carry a legend, the stacked marks are separated by a 2px gap in
 * the surface colour rather than by hue alone, and every series is direct- or
 * tooltip-labelled.
 */
export const chartPalette = (theme) => ({
  brand: theme.custom.color.brandPrimary,
  lost: theme.custom.status.lost.main,
  found: theme.custom.status.found.main,
  attention: theme.custom.status.pending.main,
  muted: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.3 : 0.22),
  // Gridlines and axis rules: solid hairlines one step off the surface, never
  // dashed - a dashed grid reads as a threshold when it is only a grid.
  grid: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.12 : 0.08),
  axisText: theme.palette.text.secondary,
  // The colour the 2px separator between touching marks is painted in - it is
  // the card behind them, so the gap reads as air rather than as a stroke.
  surface: theme.custom.color.surfaceRaised,
});

// Area fills are a wash at ~10% of the series hue, never a saturated block.
export const areaFill = (color) => alpha(color, 0.12);

/**
 * A number for an axis tick or a direct label.
 *
 * Two rules, both about not lying:
 *
 * A middle tick is half the axis maximum, and half of an odd maximum is not a
 * whole number - rounding 2.5 to "3" prints a label a gridline is not at. So a
 * fractional tick keeps one decimal.
 *
 * And compaction starts at a million rather than at ten thousand. These are
 * counts an admin acts on; "92K" where the number is 92,411 saves four
 * characters and costs the reader the figure.
 */
export const compactNumber = (value) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (!Number.isInteger(n)) return n.toFixed(1);
  return Math.round(n).toLocaleString();
};

/**
 * Round a maximum up to a clean axis top, so ticks land on numbers a reader
 * recognises (0 / 5 / 10, 0 / 50 / 100) rather than on the data's own maximum.
 */
export const niceMax = (max) => {
  const value = Math.max(1, Math.ceil(max));
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
};

/**
 * Format an ISO day for an axis. Short, and in the reader's own language and
 * numerals - `toLocaleDateString` is what the rest of the app uses for dates.
 */
export const shortDay = (iso, language = 'en') => {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString(language === 'ar' ? 'ar' : language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};
