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

/**
 * Builds the SVG card for one or more categories.
 *
 * Single category: full rich background, one centred icon in accent colour.
 * Two categories: 50/50 horizontal gradient meeting at the center between both icons.
 * Three+ categories: 3-stop horizontal gradient across categories.
 */
function buildCategorySvg(categoryCodes) {
  const cats = categoryCodes.map((code) => {
    const colors = getCategoryColors(code);
    const icon = CATEGORY_ICONS[code.toUpperCase()] || CATEGORY_ICONS.OTHER;
    const richBg = richBackground(colors.color, 0.28);
    return { code: code.toUpperCase(), ...colors, richBg, icon };
  });

  // Limit to 3 categories max for the image
  const display = cats.slice(0, 3);
  const count = display.length;

  const parts = [];
  let defs = '<defs>';

  // 1. Background
  if (count === 1) {
    defs += '</defs>';
    parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="${display[0].richBg}"/>`);
  } else if (count === 2) {
    // 50/50 horizontal gradient meeting at the center
    defs += `
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${display[0].richBg}"/>
        <stop offset="35%" stop-color="${display[0].richBg}"/>
        <stop offset="65%" stop-color="${display[1].richBg}"/>
        <stop offset="100%" stop-color="${display[1].richBg}"/>
      </linearGradient>
      <linearGradient id="domainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${display[0].color}"/>
        <stop offset="100%" stop-color="${display[1].color}"/>
      </linearGradient>
    </defs>`;
    parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="url(#bgGradient)"/>`);
  } else {
    // 3 categories: 3-stop gradient
    defs += `
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${display[0].richBg}"/>
        <stop offset="50%" stop-color="${display[1].richBg}"/>
        <stop offset="100%" stop-color="${display[2].richBg}"/>
      </linearGradient>
      <linearGradient id="domainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${display[0].color}"/>
        <stop offset="50%" stop-color="${display[1].color}"/>
        <stop offset="100%" stop-color="${display[2].color}"/>
      </linearGradient>
    </defs>`;
    parts.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="url(#bgGradient)"/>`);
  }

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

  // 3. Category icons centred in the middle
  const iconSize = count === 1 ? 280 : (count === 2 ? 220 : 180);
  const gap = count === 1 ? 0 : (count === 2 ? 80 : 50);
  const totalWidth = count * iconSize + (count - 1) * gap;
  const startX = (CANVAS - totalWidth) / 2;
  const centerY = CANVAS / 2 + 20;

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

  // 4. Domain wordmark at the bottom (raised 160px from bottom, filled with category gradient or single color)
  try {
    const domain = readSvgFile(DOMAIN_FILE);
    if (domain) {
      const domainWidth = 310;
      const domainHeight = domainWidth / (domain.boxWidth / domain.boxHeight);
      const domainX = (CANVAS - domainWidth) / 2;
      const domainBottomMargin = 160;
      const domainY = CANVAS - domainHeight - domainBottomMargin;

      const domainFill = count === 1 ? display[0].color : 'url(#domainGradient)';
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
