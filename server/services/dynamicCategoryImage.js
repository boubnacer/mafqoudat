const path = require('path');

/**
 * Generates a branded 1080×1080 social-media fallback image on-the-fly for a
 * post's categories, using sharp + SVG.
 *
 * When a listing has no photo of its own, this is the image Facebook and
 * Instagram receive. A single-category post gets that category's pale
 * background filling the whole canvas with its icon centred in the accent
 * colour. A multi-category post splits the background diagonally - one pale
 * colour per category - and places the icons side by side, each in its own
 * accent colour, matching the look of the category tiles on the website.
 *
 * The output is a baseline JPEG that satisfies Instagram's Content Publishing
 * API rules (JPEG only, sRGB, ≤8 MB, 320–1440 px wide, aspect 4:5–1.91:1)
 * for the same reason imageWatermark.js re-encodes: Meta fetches the URL
 * itself and refuses anything outside that specification.
 */

let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('⚠️ Sharp not available, dynamic category image generation disabled');
  sharp = null;
}

const { getCategoryColors } = require('../config/categoryColors');

// The same icon SVG data buildCategorySocialImages.js renders from, extracted
// once by scripts/extractCategoryIcons.js and stored here so the server needs
// neither @mui/icons-material nor react-dom/server at runtime.
const CATEGORY_ICONS = require('../config/categoryIcons.json');

const CANVAS = 1080;
const JPEG_QUALITY = 92;

// Logo SVG placed at the top centre of the image, read from the client's
// public directory (the same file the build script uses).
const LOGO_FILE = path.join(__dirname, '..', '..', 'client', 'public', 'maflogoSVG.svg');
const fs = require('fs');

// Domain wordmark at the bottom
const DOMAIN_FILE = path.join(__dirname, '..', 'assets', 'domainWordmark.svg');

/** Reads an SVG file and returns { body, viewBox } */
function readSvgFile(filePath) {
  const file = fs.readFileSync(filePath, 'utf8');
  const viewBoxMatch = file.match(/viewBox="([\d.\s-]+)"/i);
  if (!viewBoxMatch) return null;
  const openTag = file.match(/<svg[^>]*>/i);
  if (!openTag) return null;
  const body = file
    .slice(file.indexOf(openTag[0]) + openTag[0].length, file.lastIndexOf('</svg>'))
    .trim();
  const [, , boxWidth, boxHeight] = viewBoxMatch[1].trim().split(/\s+/).map(Number);
  return { body, boxWidth, boxHeight, viewBox: viewBoxMatch[1].trim() };
}

/** Blend color with white at a given weight (0 = pure white, 1 = pure color) */
function richBackground(hex, weight = 0.28) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(255 * (1 - weight) + r * weight);
  const ng = Math.round(255 * (1 - weight) + g * weight);
  const nb = Math.round(255 * (1 - weight) + b * weight);
  return '#' + [nr, ng, nb].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Dark Slate Blue background with Lighter Gray-Blue 50x50 dot grid
const BG_BASE = '#272B38';
const DOT_COLOR = '#3A3F4E';
const GRID_SIZE = 50;
const DOT_RADIUS = 3;

/**
 * Builds the SVG card for one or more categories.
 *
 * Implements a modern dark slate blue canvas (#272B38) with a 50px dot grid pattern (#3A3F4E).
 * Category icons are rendered inside squircle (rounded rectangle) badges with their
 * category background color and accented borders.
 */
function buildCategorySvg(categoryCodes) {
  const cats = categoryCodes.map((code) => {
    const colors = getCategoryColors(code);
    const icon = CATEGORY_ICONS[code.toUpperCase()] || CATEGORY_ICONS.OTHER;
    const badgeBg = colors.backgroundColor;
    return { code: code.toUpperCase(), ...colors, badgeBg, icon };
  });

  // Limit to 3 categories max for the image
  const display = cats.slice(0, 3);
  const count = display.length;

  const parts = [];

  // 1. Defs: Dot Grid pattern (50px by 50px)
  let defs = `<defs>
    <pattern id="dotGrid" x="0" y="0" width="${GRID_SIZE}" height="${GRID_SIZE}" patternUnits="userSpaceOnUse">
      <circle cx="${GRID_SIZE / 2}" cy="${GRID_SIZE / 2}" r="${DOT_RADIUS}" fill="${DOT_COLOR}" />
    </pattern>
  </defs>`;

  // Base Dark Slate Blue background + dot grid
  parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="${BG_BASE}"/>`);
  parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="url(#dotGrid)"/>`);

  // 2. Logo at top centre (enlarged by ~25%, moved down ~1cm, clean without background)
  let logoSvg = '';
  try {
    const logo = readSvgFile(LOGO_FILE);
    if (logo) {
      const logoHeight = 138;
      const logoWidth = logoHeight * (logo.boxWidth / logo.boxHeight);
      const logoX = (CANVAS - logoWidth) / 2;
      const logoY = 105;
      // Inline the logo SVG preserving its own fills
      const rawFile = fs.readFileSync(LOGO_FILE, 'utf8')
        .replace(/<\?xml[\s\S]*?\?>/g, '')
        .replace(/<!DOCTYPE[\s\S]*?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      const rootTag = rawFile.match(/<svg([^>]*)>/);
      const attrs = [...rootTag[1].matchAll(/([\w:-]+)="([^"]*)"/g)];
      const inherited = attrs
        .filter(([, name]) => !/^(x|y|width|height|viewBox|version|id|xmlns(:\w+)?)$/.test(name))
        .map(([attr]) => attr)
        .join(' ');
      const children = rawFile.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      logoSvg = `<svg x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" viewBox="${logo.viewBox}" ${inherited}>${children}</svg>`;
    }
  } catch (_) { /* logo is optional */ }
  parts.push(logoSvg);

  // 3. Category icons enclosed in squircle badges
  const badgeSize = count === 1 ? 400 : (count === 2 ? 300 : 230);
  const iconSize = Math.round(badgeSize * 0.58);
  const gap = count === 1 ? 0 : (count === 2 ? 60 : 40);
  const borderWidth = count === 1 ? 8 : (count === 2 ? 7 : 6);
  const totalWidth = count * badgeSize + (count - 1) * gap;
  const startX = (CANVAS - totalWidth) / 2;
  const centerY = CANVAS / 2 + 20;

  display.forEach((cat, i) => {
    const badgeX = startX + i * (badgeSize + gap);
    const badgeY = centerY - badgeSize / 2;
    const rx = count === 1 ? 52 : (count === 2 ? 40 : 32);
    const inset = borderWidth / 2;

    // Squircle container
    parts.push(
      `<rect x="${badgeX + inset}" y="${badgeY + inset}" width="${badgeSize - borderWidth}" height="${badgeSize - borderWidth}" rx="${rx}" fill="${cat.badgeBg}" stroke="${cat.color}" stroke-width="${borderWidth}"/>`
    );

    // Centered icon inside badge
    const iconX = badgeX + (badgeSize - iconSize) / 2;
    const iconY = badgeY + (badgeSize - iconSize) / 2;

    const paint = cat.icon.stroked
      ? `fill="none" stroke="${cat.color}" stroke-width="${cat.icon.strokeWidth || 1.5}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${cat.color}"`;

    const pathsMarkup = cat.icon.paths.map((d) => `<path d="${d}"/>`).join('');

    parts.push(
      `<svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="${cat.icon.viewBox}" ${paint}>${pathsMarkup}</svg>`
    );
  });

  // 4. Domain wordmark at the bottom (crisp white on dark background)
  try {
    const domain = readSvgFile(DOMAIN_FILE);
    if (domain) {
      const domainWidth = 310;
      const domainHeight = domainWidth / (domain.boxWidth / domain.boxHeight);
      const domainX = (CANVAS - domainWidth) / 2;
      const domainBottomMargin = 160;
      const domainY = CANVAS - domainHeight - domainBottomMargin;

      const domainFill = '#FFFFFF';
      parts.push(
        `<g fill="${domainFill}"><svg x="${domainX}" y="${domainY}" width="${domainWidth}" height="${domainHeight}" viewBox="${domain.viewBox}">${domain.body}</svg></g>`
      );
    }
  } catch (_) { /* domain wordmark is optional */ }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    defs,
    ...parts,
    '</svg>',
  ].join('');
}

/**
 * Generates a JPEG buffer for the given category codes.
 *
 * Returns null if sharp is unavailable.
 */
async function generateCategoryImage(categoryCodes) {
  if (!sharp) return null;
  const codes = (!categoryCodes || categoryCodes.length === 0) ? ['OTHER'] : categoryCodes;

  const svg = buildCategorySvg(codes);
  const buffer = await sharp(Buffer.from(svg))
    .flatten({ background: BG_BASE })
    .toColourspace('srgb')
    .jpeg({ quality: JPEG_QUALITY, progressive: false, chromaSubsampling: '4:4:4' })
    .toBuffer();

  return buffer;
}

module.exports = {
  generateCategoryImage,
  buildCategorySvg,
  isAvailable: () => !!sharp,
};
