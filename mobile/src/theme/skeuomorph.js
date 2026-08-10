/**
 * Skeuomorphic surface recipes (Home screen).
 *
 * Everything exported here is *lighting*, never color: neutral white/black
 * alpha overlays, hairline bevel rims, grooves and drop shadows that sit on
 * top of a `colorTokens` surface. The palette still comes from
 * theme/tokens.js - a component keeps painting itself with `tokens.*` and
 * spreads these on top - so nothing here introduces a color of its own.
 *
 * The vocabulary is the physical one skeuomorphism borrows from:
 *
 *  - `skeuoShadow`   - the object casts a shadow onto the page (3 depths).
 *  - `bevelRim`      - its edge catches the light on top and darkens at the
 *                      bottom, so it reads as a solid slab rather than a
 *                      painted rectangle.
 *  - `glossColors`   - a convex plate: brighter on the top half, shaded on the
 *                      bottom, with a hard highlight break across the middle.
 *  - `domeGlossColors` - the same idea on a small round/square tile, where the
 *                      highlight wraps further down.
 *  - `glassSheenColors` - a single soft reflection across the top of glass
 *                      (used over photos, where a full gloss would fog them).
 *  - `insetWell`     - the inverse: a recess pressed *into* the surface, lit
 *                      from the bottom edge instead of the top.
 *  - `groove`        - a 2px score line (dark line + light line) separating two
 *                      areas of the same slab.
 *  - `embossText` / `engraveText` - type that stands off the surface, or is
 *                      stamped into it.
 *
 * Both light and dark variants are provided for every recipe: in dark mode the
 * highlights are weak and the shades are strong, in light mode the opposite,
 * which is what keeps a plate reading as a plate under either theme.
 */

const light = (alpha) => `rgba(255,255,255,${alpha})`;
const shade = (alpha) => `rgba(0,0,0,${alpha})`;

const SHADOW_SPECS = {
  // Small parts sitting on a plate: pills, icon tiles, chips.
  1: { height: 1, radius: 3, light: 0.14, dark: 0.5, elevation: 2 },
  // Plates and cards resting on the page.
  2: { height: 4, radius: 9, light: 0.16, dark: 0.55, elevation: 5 },
  // Hero objects that should look like they sit well above the page.
  3: { height: 8, radius: 16, light: 0.2, dark: 0.62, elevation: 9 },
};

/**
 * Drop shadow, deeper and more directional than the flat-era `getElevation`
 * helper: a skeuomorphic object has to look lit from above, so the offset
 * carries more of the effect than the blur does.
 */
export const skeuoShadow = (isDark, level = 2) => {
  const spec = SHADOW_SPECS[level] || SHADOW_SPECS[2];
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: spec.height },
    shadowOpacity: isDark ? spec.dark : spec.light,
    shadowRadius: spec.radius,
    elevation: spec.elevation,
  };
};

/**
 * Beveled edge. Top edge catches the light, bottom edge falls into shadow,
 * sides sit between the two - the cheapest way to turn a flat rectangle into
 * something with thickness.
 *
 * Uses physical left/right rather than start/end on purpose: a bevel is lit
 * from above, so it is symmetrical horizontally and never needs RTL flipping.
 */
export const bevelRim = (isDark) => ({
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderTopColor: isDark ? light(0.16) : light(0.95),
  borderLeftColor: isDark ? light(0.06) : shade(0.05),
  borderRightColor: isDark ? light(0.06) : shade(0.05),
  borderBottomColor: isDark ? shade(0.5) : shade(0.12),
});

// Convex plate: bright top half, shaded bottom half, hard break in the middle
// (the classic "glossy button" split, kept subtle enough for a whole card).
export const glossColors = (isDark) =>
  isDark
    ? [light(0.1), light(0.025), shade(0.05), shade(0.22)]
    : [light(0.95), light(0.3), shade(0.015), shade(0.08)];
export const GLOSS_LOCATIONS = [0, 0.5, 0.52, 1];

// Small round/square tiles: the highlight wraps further down before the shade
// takes over, which reads as a dome rather than a flat chip.
export const domeGlossColors = (isDark) =>
  isDark ? [light(0.24), light(0.05), shade(0.2)] : [light(0.85), light(0.15), shade(0.12)];
export const DOME_GLOSS_LOCATIONS = [0, 0.55, 1];

// One soft reflection across the top of a glass surface. Used over photos,
// where the full gloss split above would wash the image out.
export const glassSheenColors = () => [light(0.22), light(0.06), light(0)];
export const GLASS_SHEEN_LOCATIONS = [0, 0.28, 0.55];

/**
 * The hairline where glass meets its frame: an even highlight all the way
 * around an opening, rather than the top-lit/bottom-shaded bevel above.
 */
export const glassRim = (isDark) => ({
  borderWidth: 1,
  borderColor: isDark ? light(0.1) : light(0.3),
});

/**
 * A recess pressed into the surface: darker fill, shadow along the top edge
 * where the wall cuts the light, highlight along the bottom edge where it
 * catches it again.
 */
export const insetWell = (tokens, isDark) => ({
  backgroundColor: isDark ? shade(0.26) : `${tokens.ink}0D`,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderTopColor: isDark ? shade(0.5) : shade(0.12),
  borderLeftColor: isDark ? shade(0.28) : shade(0.06),
  borderRightColor: isDark ? shade(0.28) : shade(0.06),
  borderBottomColor: isDark ? light(0.08) : light(0.95),
});

/**
 * Score line between two areas of one slab: a dark line with a light line
 * directly under it, so the seam looks cut rather than drawn.
 */
export const groove = (isDark) => ({
  height: 0,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderTopColor: isDark ? shade(0.42) : shade(0.09),
  borderBottomColor: isDark ? light(0.07) : light(0.9),
});

// Type standing off the surface (numbers, titles).
export const embossText = (isDark) => ({
  textShadowColor: isDark ? shade(0.7) : shade(0.16),
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: isDark ? 3 : 1,
});

// Type stamped into the surface (labels, captions).
export const engraveText = (isDark) => ({
  textShadowColor: isDark ? light(0.09) : light(0.95),
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
});

// Page lighting: the sheet the objects sit on is lit from the top and falls
// off towards the bottom of the scroll.
export const pageWashColors = (isDark) =>
  isDark ? [light(0.035), shade(0), shade(0.18)] : [light(0.7), shade(0), shade(0.045)];
export const PAGE_WASH_LOCATIONS = [0, 0.35, 1];
