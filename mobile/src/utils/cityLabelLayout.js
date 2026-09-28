/**
 * Where to put each city label and active city chip on the world activity map (mobile).
 *
 * Dots have been removed: the city name is the city's representation on the map.
 *
 * For cities with new posts today:
 *   The city is rendered as a Unified Map Chip:
 *   A sleek, high-contrast pill that encloses:
 *     - A pulsing live beacon dot
 *     - The city name
 *     - The new posts count badge
 *   In LTR mode: [ • CityName  +3 ]
 *   In RTL mode: [ +3  CityName • ]
 *
 * This completely eliminates ambiguity with nearby neighbouring cities
 * (the count is physically inside the same chip as the city name)
 * and eliminates RTL/bidi text overlapping bugs.
 *
 * Pure geometry, no DOM and no react-native: mirrored 1:1 at
 * client/src/utils/cityLabelLayout.js so both web and mobile place labels identically.
 */

export const CITY_LABEL_FONT_SIZE = 8;
export const CHIP_HEIGHT = 16;
export const CHIP_PADDING = 5;
export const CHIP_GAP = 3.5;
export const BEACON_SIZE = 5;

export const countBadgeWidth = (label) => Math.max(13, String(label || "").length * 4.5 + 6);

// Backwards compatibility aliases
export const BADGE_HEIGHT = CHIP_HEIGHT;
export const BADGE_FONT_SIZE = 7.5;
export const BADGE_GAP = CHIP_GAP;
export const badgeWidth = countBadgeWidth;

// SVG has no text metrics at render time and RN only reports a width after the
// text has already been laid out, so both platforms estimate.
const GLYPH_WIDTH_RATIO = 0.54;
const LINE_HEIGHT_RATIO = 1.15;

export const estimateLabelSize = (text, fontSize = CITY_LABEL_FONT_SIZE) => {
  const str = String(text || "");
  const isArabic = /[\u0600-\u06FF]/.test(str);
  const ratio = isArabic ? 0.60 : GLYPH_WIDTH_RATIO;
  return {
    width: Math.max(str.length * fontSize * ratio, fontSize),
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
const RINGS = [0, 4, 8, 14, 20, 28];
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
    index !== ownIndex && distanceToRect(point.x, point.y, box) < ownDistance - 2
  ));
};

/**
 * @param points     [{ x, y, name, weight, todayCount, badgeWidth }] in map units
 * @param width      map canvas width in map units
 * @param height     map canvas height in map units
 * @param fontSize   label font size in map units
 * @param isRTL      boolean indicating Right-to-Left (Arabic) mode
 * @param obstacles  extra rects labels must avoid
 * @param dotRadius  deprecated, kept for backwards compatibility
 * @returns array parallel to `points`:
 *   {
 *     cx, cy,
 *     nameX, nameY,
 *     beaconX, beaconY,
 *     countX, countY,
 *     badgeX, badgeY,
 *     labelX, labelY,
 *     chipWidth, chipHeight,
 *     totalWidth, totalHeight,
 *     nameWidth, nameHeight,
 *     countWidth,
 *     badgeWidth,
 *     hasNewPosts,
 *     todayCount,
 *     hidden,
 *   }
 */
export const layoutCityLabels = ({
  points,
  width,
  height,
  fontSize = CITY_LABEL_FONT_SIZE,
  isRTL = false,
  obstacles = [],
  dotRadius = 0,
}) => {
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
  }));

  const taken = [...obstacles];

  const order = points
    .map((point, index) => ({ point, index }))
    .sort((a, b) => (b.point.weight || 0) - (a.point.weight || 0)
      || String(a.point.name).localeCompare(String(b.point.name)));

  order.forEach(({ point, index }) => {
    const hasNewPosts = (point.todayCount || 0) > 0;
    const labelText = String(point.name || "");
    const { width: nameWidth, height: nameHeight } = estimateLabelSize(labelText, fontSize);

    let totalWidth = nameWidth;
    let totalHeight = nameHeight;
    let countW = 0;

    if (hasNewPosts) {
      const countLabel = `+${point.todayCount}`;
      countW = countBadgeWidth(countLabel);
      totalWidth = CHIP_PADDING + BEACON_SIZE + CHIP_GAP + nameWidth + CHIP_GAP + countW + CHIP_PADDING;
      totalHeight = CHIP_HEIGHT;
    }

    let placed = false;

    for (let ring = 0; ring < RINGS.length && !placed; ring += 1) {
      const ringDist = RINGS[ring];
      const dirs = ring === 0 ? [[0, 0]] : DIRECTIONS.slice(1);

      for (let d = 0; d < dirs.length; d += 1) {
        const [dx, dy] = dirs[d];
        const push = ring === 0
          ? 0
          : ringDist + Math.abs(dx) * (totalWidth * 0.25) + Math.abs(dy) * (totalHeight * 0.35);
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
            // In RTL: [ Count | Name | Beacon ]
            beaconX = right - CHIP_PADDING - BEACON_SIZE / 2;
            beaconY = cy;
            countX = left + CHIP_PADDING + countW / 2;
            countY = cy;
            const nameLeft = left + CHIP_PADDING + countW;
            const nameRight = right - CHIP_PADDING - BEACON_SIZE;
            nameX = (nameLeft + nameRight) / 2;
            nameY = cy;
          } else {
            // In LTR: [ Beacon | Name | Count ]
            beaconX = left + CHIP_PADDING + BEACON_SIZE / 2;
            beaconY = cy;
            countX = right - CHIP_PADDING - countW / 2;
            countY = cy;
            const nameLeft = left + CHIP_PADDING + BEACON_SIZE;
            const nameRight = right - CHIP_PADDING - countW;
            nameX = (nameLeft + nameRight) / 2;
            nameY = cy;
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
        };

        taken.push(box);
        placed = true;
        break;
      }
    }
  });

  return placements;
};
