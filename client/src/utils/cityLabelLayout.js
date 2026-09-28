/**
 * Where to put each city label and active city chip on the world activity map.
 *
 * Dots have been removed: the city name is the city's representation on the map.
 *
 * For cities with new posts today:
 *   The city is rendered as a Unified Map Chip:
 *   - In LTR mode: Restored full-size pill [ • CityName  [+3] ]
 *       • Live pulsing beacon dot (r=3, size=8)
 *       • City name (font=10px, starting right after beacon)
 *       • Dedicated solid pill container for +number (h=14, font=9.5px)
 *       • Comfortable 5px gap, 8px padding, 22px chip height
 *
 *   - In RTL mode: Ultra-compact, tight pill [ +3 CityName • ]
 *       • Live pulsing beacon dot (r=1.8, size=4)
 *       • Precise Arabic text width calculation (getArabicTextWidth)
 *       • Bold +number directly in brand accent (no bulky container box!)
 *       • Tight 2.5px gaps and 4px padding so there are no empty gaps
 *       • Compact 15px chip height preserving neighbouring cities' visibility
 *
 * Pure geometry, no DOM and no react-native: mirrored 1:1 at
 * mobile/src/utils/cityLabelLayout.js so both web and mobile place labels identically.
 */

// LTR tokens (restored full-size design with pill badge)
export const LTR_CITY_LABEL_FONT_SIZE = 10;
export const LTR_CHIP_HEIGHT = 22;
export const LTR_CHIP_PADDING = 8;
export const LTR_CHIP_GAP = 5;
export const LTR_BEACON_SIZE = 8;
export const LTR_BADGE_FONT_SIZE = 9.5;
export const ltrBadgeWidth = (label) => Math.max(10, String(label || "").length * 5.5);

// RTL tokens (ultra-compact, tight 2.5px gap, no bulky badge container)
export const RTL_CITY_LABEL_FONT_SIZE = 8;
export const RTL_CHIP_HEIGHT = 15;
export const RTL_CHIP_PADDING = 4;
export const RTL_CHIP_GAP = 2.5;
export const RTL_BEACON_SIZE = 4;
export const RTL_BADGE_FONT_SIZE = 7.5;
export const rtlCountWidth = (label) => Math.max(7, String(label || "").length * 4.2);

// Default exports for backwards compatibility
export const CITY_LABEL_FONT_SIZE = LTR_CITY_LABEL_FONT_SIZE;
export const CHIP_HEIGHT = LTR_CHIP_HEIGHT;
export const CHIP_PADDING = LTR_CHIP_PADDING;
export const CHIP_GAP = LTR_CHIP_GAP;
export const BEACON_SIZE = LTR_BEACON_SIZE;
export const BADGE_HEIGHT = LTR_CHIP_HEIGHT;
export const BADGE_FONT_SIZE = LTR_BADGE_FONT_SIZE;
export const BADGE_GAP = LTR_CHIP_GAP;
export const countBadgeWidth = ltrBadgeWidth;
export const badgeWidth = ltrBadgeWidth;

// Arabic char width map for precise text bounding without oversized gaps
const ARABIC_CHAR_WIDTHS = {
  'ا': 0.32, 'أ': 0.32, 'إ': 0.32, 'آ': 0.32, 'ل': 0.32, '1': 0.35,
  'ر': 0.40, 'ز': 0.40, 'د': 0.40, 'ذ': 0.40, 'و': 0.42, 'ؤ': 0.42,
  ' ': 0.30,
  'ن': 0.45, 'ب': 0.45, 'ت': 0.45, 'ث': 0.45, 'ي': 0.45, 'ى': 0.45, 'ئ': 0.45,
  'س': 0.52, 'ش': 0.52, 'ص': 0.52, 'ض': 0.52, 'ط': 0.50, 'ظ': 0.50,
  'ع': 0.48, 'غ': 0.48, 'ف': 0.48, 'ق': 0.48, 'ك': 0.48, 'م': 0.48,
  'ه': 0.42, 'ة': 0.40, 'ح': 0.48, 'خ': 0.48, 'ج': 0.48,
};

export const getArabicTextWidth = (text, fontSize) => {
  const str = String(text || "");
  let sum = 0;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    sum += (ARABIC_CHAR_WIDTHS[ch] || 0.45) * fontSize;
  }
  return Math.max(sum, fontSize);
};

const GLYPH_WIDTH_RATIO = 0.52;
const LINE_HEIGHT_RATIO = 1.15;

export const estimateLabelSize = (text, fontSize = CITY_LABEL_FONT_SIZE, isRTL = false) => {
  const str = String(text || "");
  const isArabic = /[\u0600-\u06FF]/.test(str);
  if (isArabic) {
    return {
      width: getArabicTextWidth(str, fontSize),
      height: fontSize * LINE_HEIGHT_RATIO,
    };
  }
  return {
    width: Math.max(str.length * fontSize * (isRTL ? 0.48 : GLYPH_WIDTH_RATIO), fontSize),
    height: fontSize * LINE_HEIGHT_RATIO,
  };
};

const SIN_22_5 = 0.3827;
const COS_22_5 = 0.9239;
const DIRECTIONS = [
  [0, 0], // Ring 0: exact center on coordinate
  [0, 1], [1, 0], [-1, 0], [0, -1],
  [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071],
  [SIN_22_5, COS_22_5], [-SIN_22_5, COS_22_5], [SIN_22_5, -COS_22_5], [-SIN_22_5, -COS_22_5],
  [COS_22_5, SIN_22_5], [-COS_22_5, SIN_22_5], [COS_22_5, -SIN_22_5], [-COS_22_5, -SIN_22_5],
];

// Ring offsets for resolving collisions between adjacent cities
const RINGS = [0, 3, 6, 10, 15, 22, 30];
const PADDING = 1;

const rectOf = (cx, cy, width, height) => ({
  x0: cx - width / 2 - PADDING,
  y0: cy - height / 2 - PADDING,
  x1: cx + width / 2 + PADDING,
  y1: cy + height / 2 + PADDING,
});

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Distance from a coordinate point to the nearest edge of a label's box
const distanceToRect = (px, py, rect) => {
  const dx = Math.max(rect.x0 - px, 0, px - rect.x1);
  const dy = Math.max(rect.y0 - py, 0, py - rect.y1);
  return Math.sqrt(dx * dx + dy * dy);
};

// Ensure a placement belongs closest to this city's true coordinate
const ownsLabel = (points, ownIndex, box) => {
  const own = points[ownIndex];
  const ownDistance = distanceToRect(own.x, own.y, box);
  return !points.some((point, index) => (
    index !== ownIndex && distanceToRect(point.x, point.y, box) < ownDistance - 4
  ));
};

/**
 * @param points     [{ x, y, name, weight, todayCount }] in map units
 * @param width      map canvas width in map units
 * @param height     map canvas height in map units
 * @param fontSize   label font size in map units
 * @param isRTL      boolean indicating Right-to-Left (Arabic) mode
 * @param obstacles  extra rects labels must avoid
 * @param dotRadius  deprecated, kept for backwards compatibility
 * @returns array parallel to `points`
 */
export const layoutCityLabels = ({
  points,
  width,
  height,
  fontSize,
  isRTL = false,
  obstacles = [],
  dotRadius = 0,
}) => {
  const chipHeight = isRTL ? RTL_CHIP_HEIGHT : LTR_CHIP_HEIGHT;
  const chipPadding = isRTL ? RTL_CHIP_PADDING : LTR_CHIP_PADDING;
  const chipGap = isRTL ? RTL_CHIP_GAP : LTR_CHIP_GAP;
  const beaconSize = isRTL ? RTL_BEACON_SIZE : LTR_BEACON_SIZE;
  const cityFontSize = fontSize || (isRTL ? RTL_CITY_LABEL_FONT_SIZE : LTR_CITY_LABEL_FONT_SIZE);
  const badgeFontSize = isRTL ? RTL_BADGE_FONT_SIZE : LTR_BADGE_FONT_SIZE;
  const beaconRadius = isRTL ? 1.8 : 3;

  const placements = points.map(() => ({
    cx: 0,
    cy: 0,
    nameX: 0,
    nameY: 0,
    beaconX: 0,
    beaconY: 0,
    countX: 0,
    countY: 0,
    badgeX: 0,
    badgeY: 0,
    labelX: 0,
    labelY: 0,
    chipWidth: 0,
    chipHeight: 0,
    totalWidth: 0,
    totalHeight: 0,
    nameWidth: 0,
    nameHeight: 0,
    countWidth: 0,
    badgeWidth: 0,
    hasNewPosts: false,
    todayCount: 0,
    hidden: true,
    isRTL,
    fontSize: cityFontSize,
    badgeFontSize,
    beaconRadius,
    hasCountPill: false,
    countPillHeight: 0,
  }));

  const taken = [...obstacles];

  const order = points
    .map((point, index) => ({ point, index }))
    .sort((a, b) => (b.point.weight || 0) - (a.point.weight || 0)
      || String(a.point.name).localeCompare(String(b.point.name)));

  order.forEach(({ point, index }) => {
    const hasNewPosts = (point.todayCount || 0) > 0;
    const labelText = String(point.name || "");
    const { width: nameWidth, height: nameHeight } = estimateLabelSize(labelText, cityFontSize, isRTL);

    let totalWidth = nameWidth;
    let totalHeight = nameHeight;
    let countW = 0;

    if (hasNewPosts) {
      const countLabel = `+${point.todayCount}`;
      countW = isRTL ? rtlCountWidth(countLabel) : ltrBadgeWidth(countLabel);
      totalWidth = chipPadding + beaconSize + chipGap + nameWidth + chipGap + countW + chipPadding;
      totalHeight = chipHeight;
    }

    let placed = false;

    for (let ring = 0; ring < RINGS.length && !placed; ring += 1) {
      const ringDist = RINGS[ring];
      const dirs = ring === 0 ? [[0, 0]] : DIRECTIONS.slice(1);

      for (let d = 0; d < dirs.length; d += 1) {
        const [dx, dy] = dirs[d];
        const push = ring === 0
          ? 0
          : ringDist + Math.abs(dx) * (totalWidth * 0.18) + Math.abs(dy) * (totalHeight * 0.28);
        const cx = point.x + dx * push;
        const cy = point.y + dy * push;
        const box = rectOf(cx, cy, totalWidth, totalHeight);

        // Edge bounds check
        if (box.x0 < 0 || box.y0 < 0 || box.x1 > width || box.y1 > height) continue;
        // Collision check with previously placed cities
        if (taken.some((other) => overlaps(box, other))) continue;
        if (!ownsLabel(points, index, box)) continue;

        let nameX = cx;
        let nameY = cy;
        let beaconX = cx;
        let beaconY = cy;
        let countX = cx;
        let countY = cy;

        if (hasNewPosts) {
          const left = cx - totalWidth / 2;
          const right = cx + totalWidth / 2;

          if (isRTL) {
            // In RTL: [ Count | Gap (2.5px) | Name | Gap (2.5px) | Beacon ]
            // Small and tight gaps, no bulky container box around +number
            countX = left + chipPadding + countW / 2;
            countY = cy;
            nameX = countX + countW / 2 + chipGap + nameWidth / 2;
            nameY = cy;
            beaconX = nameX + nameWidth / 2 + chipGap + beaconSize / 2;
            beaconY = cy;
          } else {
            // In LTR: [ Beacon | Gap | Name | Gap | Count Pill ] - Restored original LTR
            beaconX = left + chipPadding + beaconSize / 2;
            beaconY = cy;
            nameX = beaconX + beaconSize / 2 + chipGap;
            nameY = cy;
            countX = right - chipPadding - countW / 2;
            countY = cy;
          }
        }

        placements[index] = {
          cx,
          cy,
          nameX,
          nameY,
          beaconX,
          beaconY,
          countX,
          countY,
          badgeX: countX,
          badgeY: countY,
          labelX: nameX,
          labelY: nameY,
          chipWidth: totalWidth,
          chipHeight: totalHeight,
          totalWidth,
          totalHeight,
          nameWidth,
          nameHeight,
          countWidth: countW,
          badgeWidth: countW,
          hasNewPosts,
          todayCount: point.todayCount || 0,
          hidden: false,
          isRTL,
          fontSize: cityFontSize,
          badgeFontSize,
          beaconRadius,
          hasCountPill: false,
          countPillHeight: 0,
        };

        taken.push(box);
        placed = true;
        break;
      }
    }
  });

  return placements;
};
