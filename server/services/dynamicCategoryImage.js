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

/**
 * Builds the SVG card for one or more categories.
 *
 * Single category: full pale background, one centred icon in accent colour.
 * Two categories: diagonal split of both pale backgrounds, two icons side by
 * side in their accent colours.
 * Three+ categories: vertical strips of pale backgrounds, icons in a row.
 */
function buildCategorySvg(categoryCodes) {
  const cats = categoryCodes.map((code) => {
    const colors = getCategoryColors(code);
    const icon = CATEGORY_ICONS[code.toUpperCase()] || CATEGORY_ICONS.OTHER;
    return { code: code.toUpperCase(), ...colors, icon };
  });

  // Limit to 3 categories max for the image
  const display = cats.slice(0, 3);
  const count = display.length;

  const parts = [];

  // 1. Background
  if (count === 1) {
    parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="${display[0].backgroundColor}"/>`);
  } else if (count === 2) {
    // Diagonal split: first category top-left, second bottom-right
    parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="${display[1].backgroundColor}"/>`);
    parts.push(`<polygon points="0,0 ${CANVAS},0 0,${CANVAS}" fill="${display[0].backgroundColor}"/>`);
  } else {
    // 3 categories: vertical thirds
    const third = CANVAS / 3;
    display.forEach((cat, i) => {
      parts.push(`<rect x="${Math.round(third * i)}" y="0" width="${Math.round(third) + 1}" height="${CANVAS}" fill="${cat.backgroundColor}"/>`);
    });
  }

  // 2. Logo at top centre
  let logoSvg = '';
  try {
    const logo = readSvgFile(LOGO_FILE);
    if (logo) {
      const logoHeight = 112;
      const logoWidth = logoHeight * (logo.boxWidth / logo.boxHeight);
      const logoX = (CANVAS - logoWidth) / 2;
      const logoY = 70;
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

  // 3. Category icons centred in the middle
  const iconSize = count === 1 ? 280 : (count === 2 ? 220 : 180);
  const gap = count === 1 ? 0 : (count === 2 ? 80 : 50);
  const totalWidth = count * iconSize + (count - 1) * gap;
  const startX = (CANVAS - totalWidth) / 2;
  const centerY = CANVAS / 2 + 20; // slightly below centre to account for logo

  display.forEach((cat, i) => {
    const icon = cat.icon;
    const x = startX + i * (iconSize + gap);
    const y = centerY - iconSize / 2;

    const paint = icon.stroked
      ? `fill="none" stroke="${cat.color}" stroke-width="${icon.strokeWidth || 1.5}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${cat.color}"`;

    const pathsMarkup = icon.paths.map((d) => `<path d="${d}"/>`).join('');

    parts.push(
      `<svg x="${x}" y="${y}" width="${iconSize}" height="${iconSize}" viewBox="${icon.viewBox}" ${paint}>${pathsMarkup}</svg>`
    );
  });

  // 4. Domain wordmark at the bottom
  try {
    const domain = readSvgFile(DOMAIN_FILE);
    if (domain) {
      const domainWidth = 296;
      const domainHeight = domainWidth / (domain.boxWidth / domain.boxHeight);
      const domainX = (CANVAS - domainWidth) / 2;
      const domainY = CANVAS - domainHeight - 70;

      // Use a muted colour that works on any pale background
      const domainColor = count === 1 ? display[0].color : '#666666';
      parts.push(
        `<g fill="${domainColor}" fill-opacity="0.45"><svg x="${domainX}" y="${domainY}" width="${domainWidth}" height="${domainHeight}" viewBox="${domain.viewBox}">${domain.body}</svg></g>`
      );
    }
  } catch (_) { /* domain wordmark is optional */ }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
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
  if (!categoryCodes || categoryCodes.length === 0) return null;

  const svg = buildCategorySvg(categoryCodes);
  const buffer = await sharp(Buffer.from(svg))
    .flatten({ background: '#ffffff' })
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
