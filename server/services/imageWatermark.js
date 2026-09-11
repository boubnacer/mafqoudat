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
 * The image a listing is published to the Facebook Page and the Instagram
 * account with: the listing's own photo, stamped with a tiled
 * "mafqoudat.com", and shaped so Instagram will actually accept it.
 *
 * The site's image is never touched. A watermark on the page a visitor is
 * already reading would sit between them and the object they are trying to
 * recognise, which is the one thing a listing exists to help them do. Off the
 * site the photo travels without the page around it - reshared,
 * screenshotted, saved - so that copy carries the domain it came from.
 *
 * The mark is drawn from `assets/domainWordmark.svg` - the same outlined
 * Cairo 700 wordmark scripts/buildCategorySocialImages.js sets on the
 * category graphics - rather than from a supplied PNG. It is vector, so the
 * tile is rasterised at whatever size this particular photo needs instead of
 * a fixed bitmap being scaled up into a blur, and being outlined it needs no
 * font installed on the machine doing the rendering. A domain name nobody can
 * read is the one way this feature fails completely, so resolution is the
 * thing it spends on.
 *
 * INSTAGRAM'S RULES ARE THE SHAPE OF THIS FILE. Its Content Publishing API
 * does not crop or convert what it is given: a container built from anything
 * outside its specification simply fails, and the listing never reaches the
 * account at all. Those rules - JPEG only, sRGB, 8 MB, 320-1440px wide, and
 * an aspect ratio between 4:5 and 1.91:1 - are enforced here rather than
 * hoped for, because the same photo also has to satisfy them *after* the
 * watermark is composited onto it.
 *
 * https://developers.facebook.com/docs/instagram-platform/content-publishing
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

// ------------------------------------------------------- Instagram's rules
//
// Every one of these is a refusal, not a correction: Instagram answers an
// out-of-specification container with an error and publishes nothing.

// JPEG is the only format its publishing API accepts - not PNG, and not the
// WebP the site's own upload path usually stores (utils/imageOptimizer.js
// converts on upload), which is why the published copy is always re-encoded
// here rather than the site's URL being handed over as it is.
const JPEG_QUALITY = 92;

// Anything wider is scaled down by Instagram anyway, and 1440 is sharper
// source material for it to resize than the 1080 that is merely the working
// standard.
const MAX_WIDTH = 1440;

// ...and anything narrower is scaled up by Instagram, which would take the
// watermark with it. Better to hand over something already legible.
const MIN_WIDTH = 320;

// Portrait 4:5 and landscape 1.91:1. A phone photo is 3:4 (0.75) and a
// panorama is well past 1.91, so this is the common case, not the exception.
const MIN_ASPECT = 0.8;
const MAX_ASPECT = 1.91;

// Instagram's own ceiling. The images this produces land far below it; the
// quality ladder further down exists so that a photograph which somehow does
// not is published smaller rather than refused.
const MAX_BYTES = 8 * 1024 * 1024;
const QUALITY_LADDER = [JPEG_QUALITY, 82, 72, 62];

// Baseline, never progressive. Meta's own spec singles out "extended JPEG
// formats such as MPO and JPS" as unsupported, and progressive-scan JPEGs are
// a documented soft spot for exactly this class of automated fetcher (several
// unrelated Meta-adjacent upload pipelines - WhatsApp Cloud API among them -
// have the same baseline-only expectation even where it is not spelled out in
// the public docs). A baseline encode costs nothing here: these files are
// small and read once by a crawler, never progressively rendered by a person
// scrolling a slow connection, which is the only case progressive encoding
// was ever for.
const JPEG_PROGRESSIVE = false;

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
/**
 * The frame the photo has to be published in: never wider than Instagram's
 * ceiling, never narrower than its floor, and inside its aspect range.
 *
 * Padding, never cropping. Instagram refuses an out-of-range ratio outright,
 * so something has to give - and on a lost-property listing the thing in the
 * picture is the whole point. A crop tight enough to bring a phone photo from
 * 3:4 into 4:5 can take the keys out of the corner of the frame, which is an
 * expensive way to satisfy a specification. The bars carry the listing's own
 * photo, blurred, so the result reads as a composition rather than as an
 * image that did not fit.
 */
function resolveFrame(width, height) {
  // Fit inside the width ceiling first, so the padding below is computed
  // against the size the image is actually published at.
  const scale = Math.min(1, MAX_WIDTH / width);
  let innerWidth = Math.max(1, Math.round(width * scale));
  let innerHeight = Math.max(1, Math.round(height * scale));

  const aspect = innerWidth / innerHeight;
  let canvasWidth = innerWidth;
  let canvasHeight = innerHeight;

  // Too tall: widen the canvas. Too wide: heighten it. Either way the photo
  // itself keeps every pixel it had.
  if (aspect < MIN_ASPECT) canvasWidth = Math.round(innerHeight * MIN_ASPECT);
  else if (aspect > MAX_ASPECT) canvasHeight = Math.round(innerWidth / MAX_ASPECT);

  // Widening a portrait can push past the ceiling again (a 1440-tall 9:16
  // photo pads to 1152, but a wider one would not). Scale the whole frame
  // back down rather than re-cropping.
  if (canvasWidth > MAX_WIDTH) {
    const fit = MAX_WIDTH / canvasWidth;
    canvasWidth = MAX_WIDTH;
    canvasHeight = Math.max(1, Math.round(canvasHeight * fit));
    innerWidth = Math.max(1, Math.round(innerWidth * fit));
    innerHeight = Math.max(1, Math.round(innerHeight * fit));
  }

  // Under the floor, Instagram scales the image up itself - and the watermark
  // with it. Doing it here means the mark is drawn at the published size
  // instead of being resampled from something smaller.
  if (canvasWidth < MIN_WIDTH) {
    const lift = MIN_WIDTH / canvasWidth;
    canvasWidth = MIN_WIDTH;
    canvasHeight = Math.max(1, Math.round(canvasHeight * lift));
    innerWidth = Math.max(1, Math.round(innerWidth * lift));
    innerHeight = Math.max(1, Math.round(innerHeight * lift));
  }

  return {
    canvasWidth,
    canvasHeight,
    innerWidth,
    innerHeight,
    padded: canvasWidth !== innerWidth || canvasHeight !== innerHeight,
  };
}

/** The photo itself, blurred and dimmed, filling the frame behind it. */
async function buildBackdrop(source, frame) {
  const blur = Math.min(40, Math.max(8, Math.round(Math.max(frame.canvasWidth, frame.canvasHeight) * 0.02)));
  return sharp(source.data, { raw: source.raw })
    .resize(frame.canvasWidth, frame.canvasHeight, { fit: 'cover', position: 'centre' })
    .blur(blur)
    // Dimmed so the bars stay behind the photo rather than competing with it.
    .modulate({ brightness: 0.82, saturation: 0.9 })
    .raw()
    .toBuffer({ resolveWithObject: true });
}

/**
 * Composites the tiled watermark onto an image buffer and answers a JPEG
 * that Instagram's publishing API will accept.
 *
 * Throws rather than returning the original on failure: the caller decides
 * what an un-watermarked social copy is worth, and silently publishing one
 * would look exactly like success.
 */
async function buildSocialImage(buffer, { watermark = true } = {}) {
  if (!sharp) throw new Error('Sharp is not available');

  // Decoded to raw pixels once, rather than resized and composited in a
  // single pipeline: `metadata()` on a pipeline reports the *source* image,
  // so an oversized photo would be handed an overlay built for its original
  // dimensions, which sharp refuses to composite. The published frame has to
  // be measured, not predicted.
  //
  // `rotate()` with no argument applies the EXIF orientation and drops the
  // tag, so the mark is laid over the photo the right way up - without it a
  // phone portrait shot gets a watermark running across what a reader sees as
  // the side of the picture. `toColourspace` is Instagram's sRGB rule: a
  // camera JPEG in Adobe RGB or CMYK is converted here rather than being
  // handed over and refused. `flatten` is for PNGs, whose transparency
  // composites as black otherwise - a listing published as a black square.
  const decoded = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const source = {
    data: decoded.data,
    raw: { width: decoded.info.width, height: decoded.info.height, channels: decoded.info.channels },
  };

  if (!source.raw.width || !source.raw.height) throw new Error('Could not read the image dimensions');

  const frame = resolveFrame(source.raw.width, source.raw.height);

  const photo = await sharp(source.data, { raw: source.raw })
    .resize(frame.innerWidth, frame.innerHeight, { fit: 'fill' })
    .png()
    .toBuffer();

  const canvas = frame.padded ? await buildBackdrop(source, frame) : null;

  // One composite call, not two: sharp's `composite()` replaces whatever was
  // set before it, so chaining a second one would silently drop the photo and
  // publish the blurred backdrop on its own. The order inside the array is
  // the stacking order - photo first, then the watermark over the whole
  // frame, bars included, since a mark that stopped at the edge of the photo
  // would announce where the padding starts.
  //
  // `watermark: false` skips only the last layer. It exists for
  // socialImageService's second attempt when the full pipeline throws - a
  // corrupt or unreadable wordmark asset should cost a listing its mark, not
  // its whole publish, and the geometry/format compliance above is worth
  // keeping either way.
  const layers = [];
  if (canvas) {
    layers.push({
      input: photo,
      left: Math.round((frame.canvasWidth - frame.innerWidth) / 2),
      top: Math.round((frame.canvasHeight - frame.innerHeight) / 2),
    });
  }
  if (watermark) {
    layers.push({ input: Buffer.from(buildOverlaySvg(frame.canvasWidth, frame.canvasHeight)), blend: 'over' });
  }

  const base = canvas
    ? sharp(canvas.data, { raw: { width: canvas.info.width, height: canvas.info.height, channels: canvas.info.channels } })
    : sharp(photo);

  // Nothing to composite (no padding, no mark) - `photo` is already the
  // finished PNG buffer to re-encode below, no canvas involved.
  const marked = layers.length > 0
    ? await base.composite(layers).png().toBuffer()
    : photo;

  // Quality is stepped down only if the encode somehow lands over the size
  // Instagram accepts - at these dimensions the first rung always wins, but
  // "published smaller" beats "refused". Baseline, never progressive: Meta's
  // own spec calls out "extended JPEG formats" as unsupported, and progressive
  // scans are a documented soft spot for exactly this class of automated
  // fetcher - there is no reader here to benefit from progressive rendering,
  // only a crawler that has to decode the file in one pass.
  let output = null;
  for (const quality of QUALITY_LADDER) {
    // eslint-disable-next-line no-await-in-loop
    output = await sharp(marked)
      .jpeg({ quality, progressive: JPEG_PROGRESSIVE, chromaSubsampling: quality >= 82 ? '4:4:4' : '4:2:0' })
      .toBuffer();
    if (output.length <= MAX_BYTES) break;
  }

  return output;
}

/**
 * Confirms a buffer actually satisfies Instagram's rules, rather than trusting
 * that it does because this file built it.
 *
 * This exists for one reason: `buildSocialImage`'s output is only as good as
 * what actually ends up hosted at the URL Meta is given, and that step - a
 * Cloudinary upload - happens outside this file and outside sharp's control.
 * A wrong `format` option, an account-level delivery setting, a stale cache
 * entry under a reused public id - any of those could hand Instagram
 * something other than the JPEG that was uploaded, and the first anyone would
 * know is another refused publish with no way to tell why. socialImageService
 * calls this on the bytes actually served back from the URL it just created,
 * before trusting that URL for a listing.
 */
async function verifyPublishable(buffer) {
  if (!sharp) throw new Error('Sharp is not available');
  const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
  const problems = [];

  if (metadata.format !== 'jpeg') problems.push(`format is ${metadata.format || 'unknown'}, not jpeg`);
  if (metadata.space && metadata.space !== 'srgb') problems.push(`colour space is ${metadata.space}, not srgb`);
  if (!metadata.width || !metadata.height) problems.push('has no readable dimensions');
  if (metadata.width && (metadata.width < MIN_WIDTH || metadata.width > MAX_WIDTH)) {
    problems.push(`width ${metadata.width} is outside ${MIN_WIDTH}-${MAX_WIDTH}`);
  }
  if (metadata.width && metadata.height) {
    const ratio = metadata.width / metadata.height;
    if (ratio < MIN_ASPECT - 0.01 || ratio > MAX_ASPECT + 0.01) {
      problems.push(`aspect ratio ${ratio.toFixed(2)}:1 is outside ${MIN_ASPECT}-${MAX_ASPECT}`);
    }
  }
  if (buffer.length > MAX_BYTES) problems.push(`${(buffer.length / 1024 / 1024).toFixed(1)} MB is over the 8 MB cap`);

  if (problems.length > 0) throw new Error(`Not publishable to Instagram: ${problems.join('; ')}`);
}

module.exports = {
  buildSocialImage,
  buildOverlaySvg,
  resolveFrame,
  verifyPublishable,
  isAvailable: () => !!sharp,
  LIMITS: { MAX_WIDTH, MIN_WIDTH, MIN_ASPECT, MAX_ASPECT, MAX_BYTES },
};
