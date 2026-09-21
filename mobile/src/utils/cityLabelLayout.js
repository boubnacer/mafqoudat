/**
 * Where to put each city label on the world activity map.
 *
 * The labels used to sit at a fixed offset directly under their dot, which is
 * fine until two cities are close together — then one name lands on top of the
 * other and neither is readable. Casablanca/Mohammedia, Cairo/Giza, Manama and
 * half of Bahrain: the map is always zoomed to one country, so neighbouring
 * cities are normal, not an edge case.
 *
 * So each label walks outwards from its dot until one position fits: the four
 * sides first (so an isolated city keeps the plain "name under the dot" look it
 * has always had), then the diagonals, then the angles between them, then one
 * or two slightly wider rings. A label that fits nowhere is dropped rather than
 * drawn over a neighbour — the dot still shows the city is there.
 *
 * **Every label stays against its own dot, and nothing is ever connected by a
 * line.** An earlier version let a name travel up to 42 units away and drew a
 * leader line back to the dot to say which city it belonged to. The lines were
 * the most visible thing on a map whose subject is the country underneath, and
 * a name that needs a line to be attributed is already too far away. Two rules
 * do that job instead:
 *
 *   1. the ladder stops a couple of units past touching (see RINGS), so a name
 *      is always within its own dot's immediate neighbourhood; and
 *   2. a position is only accepted if the label's own dot is the closest dot to
 *      it (`ownsLabel`). Proximity is the only thing saying "this name belongs
 *      to that dot" now, so a placement where some other city's dot is nearer —
 *      or equally near — is refused even if the box itself is clear.
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
// the label position this map has always used. The eight 22.5° angles come
// after the four sides and the four diagonals: they are what finds room for a
// name in a crowded cluster now that it may not simply move further out, and
// trying them in that order means an uncrowded city is never placed at an odd
// angle when the plain position under its dot was free.
const SIN_22_5 = 0.3827;
const COS_22_5 = 0.9239;
const DIRECTIONS = [
  [0, 1], [1, 0], [-1, 0], [0, -1],
  [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071],
  [SIN_22_5, COS_22_5], [-SIN_22_5, COS_22_5], [SIN_22_5, -COS_22_5], [-SIN_22_5, -COS_22_5],
  [COS_22_5, SIN_22_5], [-COS_22_5, SIN_22_5], [COS_22_5, -SIN_22_5], [-COS_22_5, -SIN_22_5],
];

// Extra distance to try once all sixteen directions have failed at the previous
// one. Ring 0 is the label touching its dot; 3 and 6 are the small amount of
// slack a dense cluster needs, and the last of them is where it stops. Nothing
// here is far enough for a name to read as belonging to a neighbour, which is the
// whole point of not drawing a line any more: past this, a label is dropped.
const RINGS = [0, 3, 6];

const GAP = 3;
const PADDING = 1;

const rectOf = (cx, cy, width, height) => ({
  x0: cx - width / 2 - PADDING,
  y0: cy - height / 2 - PADDING,
  x1: cx + width / 2 + PADDING,
  y1: cy + height / 2 + PADDING,
});

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Distance from a dot to the nearest point of a label's box, not to its centre:
// a long name's centre can easily be further from its own dot than from a
// neighbour's while the name itself is plainly sitting against its own.
const distanceToRect = (px, py, rect) => {
  const dx = Math.max(rect.x0 - px, 0, px - rect.x1);
  const dy = Math.max(rect.y0 - py, 0, py - rect.y1);
  return Math.sqrt(dx * dx + dy * dy);
};

// Is this box unambiguously THIS city's name? With no leader line, being the
// closest dot is the only claim a dot has on a name, so an equal distance is a
// refusal too: a name exactly between two cities belongs to neither.
const ownsLabel = (points, ownIndex, box) => {
  const own = points[ownIndex];
  const ownDistance = distanceToRect(own.x, own.y, box);
  return !points.some((point, index) => (
    index !== ownIndex && distanceToRect(point.x, point.y, box) <= ownDistance
  ));
};

/**
 * @param points     [{ x, y, name, weight }] already projected into map units
 * @param width      map canvas width in the same units
 * @param height     map canvas height
 * @param dotRadius  radius of the marker each label belongs to
 * @param fontSize   label font size in map units
 * @param obstacles  extra rects labels must avoid (web's "+N today" badges)
 * @returns array parallel to `points`: { labelX, labelY, hidden }
 */
export const layoutCityLabels = ({
  points,
  width,
  height,
  dotRadius,
  fontSize = CITY_LABEL_FONT_SIZE,
  obstacles = [],
}) => {
  const placements = points.map(() => ({ labelX: 0, labelY: 0, hidden: true }));
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
        if (!ownsLabel(points, index, box)) continue;

        placements[index] = { labelX: cx, labelY: cy, hidden: false };
        taken.push(box);
        return;
      }
    }
  });

  return placements;
};
