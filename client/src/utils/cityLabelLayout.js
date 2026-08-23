/**
 * Where to put each city label on the world activity map.
 *
 * The labels used to sit at a fixed offset directly under their dot, which is
 * fine until two cities are close together — then one name lands on top of the
 * other and neither is readable. Casablanca/Mohammedia, Cairo/Giza, Manama and
 * half of Bahrain: the map is always zoomed to one country, so neighbouring
 * cities are normal, not an edge case.
 *
 * This walks the labels outwards from their dot until one fits: the four sides
 * first (so an isolated city still gets the plain "name under the dot" look it
 * has always had), then the diagonals, then progressively further rings. A
 * label that had to leave its dot's side gets a leader line back to it, which
 * is what keeps "this name belongs to that dot" true once the name is no longer
 * touching it. A label that fits nowhere is dropped rather than drawn over a
 * neighbour — the dot still shows the city is there.
 *
 * Cities are placed in descending order of activity, so when something has to
 * give, it is the quietest city that loses its name.
 *
 * Pure geometry, no DOM and no react-native: mirrored 1:1 at
 * mobile/src/utils/cityLabelLayout.js so both maps place labels identically.
 */

export const CITY_LABEL_FONT_SIZE = 10;

// SVG has no text metrics at render time and RN only reports a width after the
// text has already been laid out, so both platforms estimate. 0.58em per glyph
// is a little generous for Latin and a little tight for Arabic, which is the
// right way round: over-estimating reserves space that was never needed, while
// under-estimating puts two names back on top of each other.
const GLYPH_WIDTH_RATIO = 0.58;
const LINE_HEIGHT_RATIO = 1.2;

export const estimateLabelSize = (text, fontSize = CITY_LABEL_FONT_SIZE) => ({
  width: Math.max(String(text || "").length * fontSize * GLYPH_WIDTH_RATIO, fontSize),
  height: fontSize * LINE_HEIGHT_RATIO,
});

// Clockwise from below, so the first candidate that fits is the one closest to
// the label position this map has always used.
const DIRECTIONS = [
  [0, 1], [1, 0], [-1, 0], [0, -1],
  [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071],
];

// Extra distance to try once every direction has failed at the previous one.
// Ring 0 is "touching the dot" and needs no leader line; the rest do.
//
// The ladder stops at 42 on purpose. Going further does find room for every
// last name, but on a canvas this size it parks a label in the middle of a
// different city's neighbourhood, where the leader line is too long to trace at
// a glance and the name reads as belonging to whatever dot it landed next to.
// A missing name is a gap; a name beside the wrong city is wrong. The dot is
// still drawn either way, so nothing disappears from the map — only its label.
const RINGS = [0, 13, 26, 42];

const GAP = 3;
const PADDING = 1;

const rectOf = (cx, cy, width, height) => ({
  x0: cx - width / 2 - PADDING,
  y0: cy - height / 2 - PADDING,
  x1: cx + width / 2 + PADDING,
  y1: cy + height / 2 + PADDING,
});

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Where the line from the dot crosses the label's box, so the leader stops at
// the edge of the name instead of running underneath it.
const clipToRect = (fromX, fromY, rect) => {
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;
  const dx = cx - fromX;
  const dy = cy - fromY;
  if (!dx && !dy) return { x: cx, y: cy };
  const halfWidth = (rect.x1 - rect.x0) / 2;
  const halfHeight = (rect.y1 - rect.y0) / 2;
  // Largest t in [0,1] along dot -> centre that is still outside the box.
  const scaleX = dx ? halfWidth / Math.abs(dx) : Infinity;
  const scaleY = dy ? halfHeight / Math.abs(dy) : Infinity;
  const t = 1 - Math.min(scaleX, scaleY);
  if (t <= 0) return null;
  return { x: fromX + dx * t, y: fromY + dy * t };
};

/**
 * @param points     [{ x, y, name, weight }] already projected into map units
 * @param width      map canvas width in the same units
 * @param height     map canvas height
 * @param dotRadius  radius of the marker each label belongs to
 * @param fontSize   label font size in map units
 * @param obstacles  extra rects labels must avoid (web's "+N today" badges)
 * @returns array parallel to `points`: { labelX, labelY, leader, hidden }
 */
export const layoutCityLabels = ({
  points,
  width,
  height,
  dotRadius,
  fontSize = CITY_LABEL_FONT_SIZE,
  obstacles = [],
}) => {
  const placements = points.map(() => ({ labelX: 0, labelY: 0, leader: null, hidden: true }));
  // Every dot is an obstacle for every label, including labels placed before
  // this one — a name may not sit on a marker that is not its own.
  const taken = points
    .map((point) => rectOf(point.x, point.y, dotRadius * 2, dotRadius * 2))
    .concat(obstacles);

  const order = points
    .map((point, index) => ({ point, index }))
    .sort((a, b) => (b.point.weight || 0) - (a.point.weight || 0)
      || String(a.point.name).localeCompare(String(b.point.name)));

  order.forEach(({ point, index }) => {
    const { width: labelWidth, height: labelHeight } = estimateLabelSize(point.name, fontSize);
    const halfWidth = labelWidth / 2;
    const halfHeight = labelHeight / 2;

    for (let ring = 0; ring < RINGS.length; ring += 1) {
      for (let d = 0; d < DIRECTIONS.length; d += 1) {
        const [dx, dy] = DIRECTIONS[d];
        const push = dotRadius + GAP + RINGS[ring]
          + Math.abs(dx) * halfWidth + Math.abs(dy) * halfHeight;
        const cx = point.x + dx * push;
        const cy = point.y + dy * push;
        const box = rectOf(cx, cy, labelWidth, labelHeight);
        // A label clipped by the edge of the map is as unreadable as one under
        // another label.
        if (box.x0 < 0 || box.y0 < 0 || box.x1 > width || box.y1 > height) continue;
        if (taken.some((other) => overlaps(box, other))) continue;

        placements[index] = {
          labelX: cx,
          labelY: cy,
          leader: RINGS[ring] ? clipToRect(point.x, point.y, box) : null,
          hidden: false,
        };
        taken.push(box);
        return;
      }
    }
  });

  return placements;
};
