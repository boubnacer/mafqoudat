const fs = require('fs');
const path = require('path');

// Sharp is already a dependency (utils/imageOptimizer.js uses it) but the
// server is deliberately written to survive without it - a native module that
// fails to build must not take the whole API down with it. Same guard here:
// no sharp, no watermark, and the social copy falls back to the plain photo.
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('⚠️ Sharp not available, social watermarking disabled');
  sharp = null;
}

/**
 * Tiled "mafqoudat.com" watermark for the copy of a listing photo that goes
 * to the Facebook Page and the Instagram account. The site's own image is
 * never touched: the watermark says where a photo came from once it has left
 * the site, and stamping it on the page a visitor is already reading would
 * only be in the way.
 *
 * The mark is drawn from `assets/domainWordmark.svg` - the same outlined
 * Cairo 700 wordmark scripts/buildCategorySocialImages.js sets on the
 * category graphics - rather than from a supplied PNG. It is vector, so the
 * tile is rasterised at whatever size this particular photo needs instead of
 * a fixed bitmap being scaled up into a blur, and being outlined it needs no
 * font installed on the machine doing the rendering. A domain name nobody can
 * read is the one way this feature fails completely, so resolution is the
 * thing it spends on.
 */

const WORDMARK_FILE = path.join(__dirname, '..', 'assets', 'domainWordmark.svg');

// How wide one "mafqoudat.com" is, as a share of the image's own width. The
// tile scales with the photo, so a small image gets a proportionally sized
// mark rather than one word filling it edge to edge.
const WORDMARK_WIDTH_RATIO = 0.34;

// ...but never below this many pixels: past it the domain stops being
// readable in a feed at all, which is the only thing the watermark is for.
const MIN_WORDMARK_WIDTH = 130;

// Diagonal, like a stamp, and hard to crop out of one corner. Negative =
// rising to the right. Not mirrored for RTL: this is a latin domain name, not
// interface text, and it reads the same way on every copy of the app.
const WORDMARK_ANGLE = -30;

// Space between marks, as a share of the wordmark's own size. Enough of the
// photo has to stay unobstructed for the listing to still be identifiable -
// it is evidence of a lost object before it is a billboard.
const GAP_X_RATIO = 0.55;
const GAP_Y_RATIO = 2.4;

// The light face and the dark one under it. Neither is the "~15%" on its own:
// a single flat tone disappears into a photo of the same tone, so the mark is
// a pale face with a darker copy offset behind it, which keeps it legible on
// a white wall and on a night photo alike. Together they read as the same
// weight a 15% grey would, without depending on what is underneath.
const LIGHT_OPACITY = 0.2;
const SHADOW_OPACITY = 0.16;
const SHADOW_OFFSET_RATIO = 0.035; // of the wordmark's height

// Meta re-encodes whatever it is handed, so there is no point sending more
// than it will keep - but the watermark is thin, light-toned strokes, which
// is exactly what a low JPEG quality smears first.
const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 92;

let wordmarkCache = null;

/** The wordmark's own path data and intrinsic box, read once per process. */
function loadWordmark() {
  if (wordmarkCache) return wordmarkCache;

  const file = fs.readFileSync(WORDMARK_FILE, 'utf8');
  const openTag = file.match(/<svg[^>]*>/i);
  const viewBox = file.match(/viewBox="([\d.\s-]+)"/i);
  if (!openTag || !viewBox) {
    throw new Error('assets/domainWordmark.svg is not a readable SVG');
  }

  const [, , boxWidth, boxHeight] = viewBox[1].trim().split(/\s+/).map(Number);
  const body = file
    .slice(file.indexOf(openTag[0]) + openTag[0].length, file.lastIndexOf('</svg>'))
    .trim();

  wordmarkCache = { body, boxWidth, boxHeight };
  return wordmarkCache;
}

const round = (value) => Math.round(value * 100) / 100;

/**
 * An SVG the size of the image, filled with one tiled, rotated wordmark.
 *
 * A `<pattern>` rather than a tile bitmap composited N times: the whole
 * overlay is then one rasterisation at the final resolution, so the glyph
 * edges are drawn once by the renderer instead of being resampled per tile,
 * and the diagonal comes from `patternTransform` rather than from rotating an
 * already-rasterised tile (which would land every tile on a different subpixel
 * phase).
 */
function buildOverlaySvg(width, height) {
  const { body, boxWidth, boxHeight } = loadWordmark();

  const markWidth = Math.max(MIN_WORDMARK_WIDTH, Math.round(width * WORDMARK_WIDTH_RATIO));
  const scale = markWidth / boxWidth;
  const markHeight = boxHeight * scale;

  const tileWidth = round(markWidth * (1 + GAP_X_RATIO));
  const tileHeight = round(markHeight * (1 + GAP_Y_RATIO));

  // Centred in its own tile, so the gap sits evenly around each mark.
  const insetX = round((tileWidth - markWidth) / 2);
  const insetY = round((tileHeight - markHeight) / 2);
  const shadowOffset = round(markHeight * SHADOW_OFFSET_RATIO);

  const mark = (fill, opacity, dx, dy) => `
      <g fill="${fill}" opacity="${opacity}" transform="translate(${round(insetX + dx)} ${round(insetY + dy)}) scale(${round(scale)})">
        ${body}
      </g>`;

  // The pattern is deliberately larger than the image on both axes before
  // rotation: `patternTransform` turns the grid, not the rect it fills, so a
  // grid sized exactly to the image would leave the corners bare.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="wm" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(${WORDMARK_ANGLE})">
      ${mark('#000000', SHADOW_OPACITY, shadowOffset, shadowOffset)}
      ${mark('#ffffff', LIGHT_OPACITY, 0, 0)}
    </pattern>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#wm)"/>
</svg>`;
}

/**
 * Composites the tiled watermark onto an image buffer and answers a JPEG.
 *
 * Throws rather than returning the original on failure: the caller decides
 * what an un-watermarked social copy is worth, and silently publishing one
 * would look exactly like success.
 */
async function watermarkImageBuffer(buffer) {
  if (!sharp) throw new Error('Sharp is not available');

  // Decoded to raw pixels in one pass, rather than resized and composited in
  // a single pipeline: `metadata()` on a pipeline reports the *source*
  // image, so an oversized photo would be handed an overlay built for its
  // original dimensions, which sharp refuses to composite. The resized frame
  // has to be measured, not predicted.
  //
  // `rotate()` with no argument applies the EXIF orientation and drops the
  // tag, so the mark is laid over the photo the right way up - without it a
  // phone portrait shot gets a watermark running across what a reader sees as
  // the side of the picture. `flatten` is for PNGs: transparency composites
  // as black otherwise, and the listing publishes as a black square.
  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({ background: '#ffffff' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!info.width || !info.height) throw new Error('Could not read the image dimensions');

  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .composite([{ input: Buffer.from(buildOverlaySvg(info.width, info.height)), blend: 'over' }])
    .jpeg({ quality: JPEG_QUALITY, progressive: true, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

module.exports = {
  watermarkImageBuffer,
  buildOverlaySvg,
  isAvailable: () => !!sharp,
};
