#!/usr/bin/env node
/**
 * Renders one branded 1080x1080 PNG per category into
 * public/category-social/, used by the server when it auto-posts a listing
 * that has no photo of its own (server/services/socialCaption.js).
 *
 *   npm run build-category-images
 *
 * The output is committed, the way client/src/data/worldMap.topo.json is:
 * a deploy never runs this, and the site serves the PNGs as ordinary static
 * assets. Re-run it after changing a category's icon or colour.
 *
 * Everything the card is drawn from already lives in this package:
 *   - icon + accent colour per category: src/config/categories.js, parsed
 *     rather than copied, so the social image cannot drift from the UI. The
 *     Material icons it names are rendered straight out of
 *     @mui/icons-material; the four bespoke ones are read back out of their
 *     own JSX in that same file.
 *   - the brand lockup: public/maficonSVG.svg + public/maflogoSVG.svg.
 *   - the domain line: scripts/assets/domainWordmark.svg, "mafqoudat.com"
 *     outlined from Cairo 700 (designTokens' `display` face) so rasterising
 *     needs no font installed and renders identically on any machine.
 *
 * The palette is the existing no-image-placeholder.png's, not the app's
 * light/dark tokens: a social post is one image seen on someone else's feed,
 * so there is no mode to resolve.
 */

const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');

const CLIENT_ROOT = path.resolve(__dirname, '..');
const CATEGORY_CONFIG_FILE = path.join(CLIENT_ROOT, 'src/config/categories.js');
const OUTPUT_DIR = path.join(CLIENT_ROOT, 'public/category-social');

const CANVAS = 1080;

// Sampled from public/no-image-placeholder.png so the two graphics read as one
// family; BRAND is colorTokens.brandLogo and TEXT is colorTokens.dark.ink.
const BACKDROP = '#272F45';
const DOT = '#343B50';
const BRAND = '#3498DB';
const TEXT = '#EDEFF5';

// The Arabic name above the wordmark. A lighter step of BRAND rather than the
// logo blue itself: it sits at a smaller size than the wordmark it heads, and
// the logo blue at that weight reads as a shadow of the word below it.
const BRAND_ARABIC = '#4AA8E0';

// The placeholder's dot grid, same origin/step/radius.
const DOT_ORIGIN = 59.5;
const DOT_STEP = 108;
const DOT_RADIUS = 3;

// An accent picked to sit on white cards in the app can be too dark to read as
// an icon on the backdrop above (#795548, #3F51B5, #5E35B1...), so those get a
// lighter twin - the same move brandPrimary makes for dark mode. See
// legibleOnBackdrop.
const MIN_CONTRAST = 4.5;

const SVG_NS = 'http://www.w3.org/2000/svg';

function readFile(relativeToClient) {
  return fs.readFileSync(path.join(CLIENT_ROOT, relativeToClient), 'utf8');
}

/* ---------------------------------------------------------------- colour -- */

function toRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

function toHex(rgb) {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function relativeLuminance(hex) {
  const channels = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function toHsl(hex) {
  const [r, g, b] = toRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return { h: ((hue * 60) + 360) % 360, s: saturation, l: lightness };
}

function fromHsl({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][sector];
  return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

/**
 * Lifts lightness, keeping the hue - mixing toward white would work too, but
 * it desaturates as it goes and turns #795548 into beige, which stops reading
 * as "the brown one". Muted accents get a saturation floor for the same
 * reason; a deliberately neutral one (OTHER's grey) is left neutral.
 */
function legibleOnBackdrop(hex) {
  const { h, s, l } = toHsl(hex);
  if (contrastRatio(hex, BACKDROP) >= MIN_CONTRAST) return hex.toUpperCase();

  const saturation = s > 0.2 ? Math.max(s, 0.35) : s;
  for (let lightness = l; lightness <= 0.94; lightness += 0.02) {
    const candidate = fromHsl({ h, s: saturation, l: lightness });
    if (contrastRatio(candidate, BACKDROP) >= MIN_CONTRAST) return candidate;
  }
  return '#FFFFFF';
}

/* ------------------------------------------------- categories.js parsing -- */

function extractBalancedBlock(source, startIndex) {
  let depth = 0;
  for (let i = startIndex; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
  }
  throw new Error('Unbalanced block in categories.js');
}

/** identifier -> @mui/icons-material module name, from the file's imports. */
function parseMuiIconImports(source) {
  const modules = {};

  const namedImport = source.match(/import\s*\{([^}]+)\}\s*from\s*'@mui\/icons-material'/);
  if (namedImport) {
    namedImport[1]
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => { modules[name] = name; });
  }

  const defaultImports = source.matchAll(/import\s+(\w+)\s+from\s+'@mui\/icons-material\/(\w+)'/g);
  for (const [, identifier, moduleName] of defaultImports) modules[identifier] = moduleName;

  return modules;
}

/**
 * identifier -> drawable, for the icons written by hand as JSX in
 * categories.js. They are plain <path d="..."/> children under an <svg> whose
 * paint is declared in a `style={{ ... }}` block, so both are read off here
 * rather than guessed.
 */
function parseLocalIconComponents(source) {
  const icons = {};
  const components = source.matchAll(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\(\s*(<svg[\s\S]*?<\/svg>)\s*\)/g);

  for (const [, identifier, markup] of components) {
    const viewBox = markup.match(/viewBox="([^"]+)"/);
    if (!viewBox) throw new Error(`${identifier} in categories.js has no viewBox`);

    const paths = [...markup.matchAll(/<path\s+d="([^"]+)"\s*\/>/g)].map((m) => m[1]);
    if (paths.length === 0) throw new Error(`${identifier} in categories.js has no <path d="...">`);

    const stroked = /stroke:\s*'currentColor'/.test(markup);
    const strokeWidth = markup.match(/strokeWidth:\s*'([^']+)'/);

    icons[identifier] = {
      viewBox: viewBox[1],
      paths,
      stroked,
      strokeWidth: stroked ? Number(strokeWidth ? strokeWidth[1] : 1) : null,
    };
  }

  return icons;
}

/** code -> { color, iconIdentifier }, in the order categories.js declares. */
function parseCategoryConfig(source) {
  const start = source.indexOf('export const CATEGORY_CONFIG = {');
  if (start === -1) throw new Error('CATEGORY_CONFIG not found in categories.js');

  const block = extractBalancedBlock(source, source.indexOf('{', start));
  const entries = [...block.matchAll(/(\w+):\s*\{\s*icon:\s*(\w+),[^{}]*?color:\s*'(#[0-9A-Fa-f]{6})'/g)];
  if (entries.length === 0) throw new Error('No categories parsed out of CATEGORY_CONFIG');

  return entries.map(([, code, iconIdentifier, color]) => ({ code, iconIdentifier, color }));
}

/** The Material icon's own artwork, rendered rather than transcribed. */
function renderMuiIcon(moduleName) {
  const Icon = require(`@mui/icons-material/${moduleName}`).default;
  const markup = renderToStaticMarkup(React.createElement(Icon));
  const viewBox = markup.match(/viewBox="([^"]+)"/);
  const children = markup.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

  return {
    viewBox: viewBox ? viewBox[1] : '0 0 24 24',
    markup: children,
    stroked: false,
  };
}

function resolveCategories() {
  const source = fs.readFileSync(CATEGORY_CONFIG_FILE, 'utf8');
  const muiModules = parseMuiIconImports(source);
  const localIcons = parseLocalIconComponents(source);

  return parseCategoryConfig(source).map(({ code, iconIdentifier, color }) => {
    let icon;
    if (muiModules[iconIdentifier]) {
      icon = renderMuiIcon(muiModules[iconIdentifier]);
    } else if (localIcons[iconIdentifier]) {
      const local = localIcons[iconIdentifier];
      icon = {
        viewBox: local.viewBox,
        markup: local.paths.map((d) => `<path d="${d}"/>`).join(''),
        stroked: local.stroked,
        strokeWidth: local.strokeWidth,
      };
    } else {
      throw new Error(`${code}: cannot resolve icon ${iconIdentifier} to a Material icon or a local component`);
    }

    return { code, color, icon };
  });
}

/* ------------------------------------------------------------- drawing --- */

// Replaced on the nested <svg> below; everything else the source file
// declares on its root - `fill="none"` above stroked paths, most of all - has
// to survive, or paths that inherit their paint come out solid black.
const REPLACED_ROOT_ATTRIBUTES = /^(x|y|width|height|viewBox|version|id|xmlns(:\w+)?)$/;

/** Inlines one of the brand SVGs as a nested <svg>, scaled into a box. */
function placeSvgFile(relativeToClient, { x, y, width, height }) {
  const markup = readFile(relativeToClient)
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  const rootTag = markup.match(/<svg([^>]*)>/);
  if (!rootTag) throw new Error(`${relativeToClient} has no <svg> root`);

  const attributes = [...rootTag[1].matchAll(/([\w:-]+)="([^"]*)"/g)];
  const viewBox = attributes.find(([, name]) => name === 'viewBox');
  if (!viewBox) throw new Error(`${relativeToClient} has no viewBox`);

  const inherited = attributes
    .filter(([, name]) => !REPLACED_ROOT_ATTRIBUTES.test(name))
    .map(([attribute]) => attribute)
    .join(' ');

  const children = markup.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox[2]}" ${inherited}>${children}</svg>`;
}

/** width / height of a source SVG's own viewBox. */
function svgAspect(relativeToClient) {
  const viewBox = readFile(relativeToClient).match(/viewBox="([^"]+)"/);
  if (!viewBox) throw new Error(`${relativeToClient} has no viewBox`);
  const [, , width, height] = viewBox[1].split(/[\s,]+/).map(Number);
  return width / height;
}

function dotGrid() {
  const dots = [];
  for (let y = DOT_ORIGIN; y < CANVAS; y += DOT_STEP) {
    for (let x = DOT_ORIGIN; x < CANVAS; x += DOT_STEP) {
      dots.push(`<circle cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`);
    }
  }
  return `<g fill="${DOT}">${dots.join('')}</g>`;
}

// The lockup keeps the placeholder's proportions (a 150px tile, a 48px gap,
// then the wordmark at the same height), scaled down and moved to the top so
// the category icon owns the middle of the card.
const LOCKUP_SCALE = 0.62;
const LOCKUP_TILE = 150 * LOCKUP_SCALE;
const LOCKUP_GAP = 48 * LOCKUP_SCALE;
const LOCKUP_WORDMARK_HEIGHT = 141 * LOCKUP_SCALE;
const LOCKUP_WORDMARK_WIDTH = LOCKUP_WORDMARK_HEIGHT * (328 / 71);
const LOCKUP_CENTER_Y = 186;

// The Arabic name heads the Latin wordmark rather than sitting beside it, and
// is set to the wordmark's trailing edge - which in Arabic is where the word
// begins.
const ARABIC_WORDMARK_FILE = 'scripts/assets/arabicWordmark.svg';
const ARABIC_WORDMARK_HEIGHT = 46;
// Near enough to touch: the two words read as one lockup rather than as a
// caption above a logo. Measured off the descender, which is the word's real
// bottom edge.
const ARABIC_WORDMARK_GAP = 3;
// A requested nudge off the trailing-edge/gap position above - 0.2cm left,
// 0.1cm down, at the 96px/inch (37.795px/cm) a browser assumes for an
// unitless SVG.
const CM_TO_PX = 96 / 2.54;
const ARABIC_WORDMARK_OFFSET_X = 0.2 * CM_TO_PX;
const ARABIC_WORDMARK_OFFSET_Y = 0.1 * CM_TO_PX;

function brandLockup() {
  const totalWidth = LOCKUP_TILE + LOCKUP_GAP + LOCKUP_WORDMARK_WIDTH;
  const left = (CANVAS - totalWidth) / 2;
  const tileY = LOCKUP_CENTER_Y - LOCKUP_TILE / 2;
  const glyph = LOCKUP_TILE * 0.6;
  const arabicWidth = ARABIC_WORDMARK_HEIGHT * svgAspect(ARABIC_WORDMARK_FILE);

  return [
    `<g fill="${BRAND_ARABIC}">${placeSvgFile(ARABIC_WORDMARK_FILE, {
      x: left + totalWidth - arabicWidth - ARABIC_WORDMARK_OFFSET_X,
      y: tileY - ARABIC_WORDMARK_GAP - ARABIC_WORDMARK_HEIGHT + ARABIC_WORDMARK_OFFSET_Y,
      width: arabicWidth,
      height: ARABIC_WORDMARK_HEIGHT,
    })}</g>`,
    `<rect x="${left}" y="${tileY}" width="${LOCKUP_TILE}" height="${LOCKUP_TILE}" rx="${LOCKUP_TILE * 0.28}" fill="${BRAND}" fill-opacity="0.13"/>`,
    placeSvgFile('public/maficonSVG.svg', {
      x: left + (LOCKUP_TILE - glyph * (47 / 53)) / 2,
      y: tileY + (LOCKUP_TILE - glyph) / 2,
      width: glyph * (47 / 53),
      height: glyph,
    }),
    placeSvgFile('public/maflogoSVG.svg', {
      x: left + LOCKUP_TILE + LOCKUP_GAP,
      y: LOCKUP_CENTER_Y - LOCKUP_WORDMARK_HEIGHT / 2,
      width: LOCKUP_WORDMARK_WIDTH,
      height: LOCKUP_WORDMARK_HEIGHT,
    }),
  ].join('');
}

const HERO_TILE = 468;
const HERO_CENTER_Y = 566;
const HERO_ICON = 252;

function heroTile(color, icon) {
  const tileLeft = (CANVAS - HERO_TILE) / 2;
  const tileTop = HERO_CENTER_Y - HERO_TILE / 2;

  // A stroked icon has to keep its own line weight relative to its viewBox, so
  // it is scaled by the viewBox rather than given a width in canvas pixels.
  const paint = icon.stroked
    ? `fill="none" stroke="${color}" stroke-width="${icon.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${color}"`;

  return [
    `<rect x="${tileLeft}" y="${tileTop}" width="${HERO_TILE}" height="${HERO_TILE}" rx="${HERO_TILE * 0.26}" fill="${color}" fill-opacity="0.14"/>`,
    `<svg x="${(CANVAS - HERO_ICON) / 2}" y="${HERO_CENTER_Y - HERO_ICON / 2}" width="${HERO_ICON}" height="${HERO_ICON}" viewBox="${icon.viewBox}" ${paint}>${icon.markup}</svg>`,
  ].join('');
}

const DOMAIN_FILE = 'scripts/assets/domainWordmark.svg';
const DOMAIN_WIDTH = 296;
const DOMAIN_CENTER_Y = 902;

function domainWordmark() {
  const height = DOMAIN_WIDTH / svgAspect(DOMAIN_FILE);

  return `<g fill="${TEXT}" fill-opacity="0.72">${placeSvgFile(DOMAIN_FILE, {
    x: (CANVAS - DOMAIN_WIDTH) / 2,
    y: DOMAIN_CENTER_Y - height / 2,
    width: DOMAIN_WIDTH,
    height,
  })}</g>`;
}

function buildCard({ color, icon }) {
  return [
    `<svg xmlns="${SVG_NS}" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `<rect width="${CANVAS}" height="${CANVAS}" fill="${BACKDROP}"/>`,
    dotGrid(),
    brandLockup(),
    heroTile(color, icon),
    domainWordmark(),
    '</svg>',
  ].join('');
}

/* ------------------------------------------------------------------ run --- */

async function main() {
  // Category codes may be passed as arguments to rebuild only those - for
  // looking at one card while tuning the layout, rather than rewriting all 19.
  const only = process.argv.slice(2).map((code) => code.toUpperCase());
  const all = resolveCategories();
  const categories = only.length > 0 ? all.filter(({ code }) => only.includes(code)) : all;

  if (categories.length === 0) throw new Error(`No category matches ${only.join(', ')}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const category of categories) {
    const color = legibleOnBackdrop(category.color);
    const svg = buildCard({ color, icon: category.icon });
    const file = path.join(OUTPUT_DIR, `${category.code.toLowerCase()}.jpg`);

    // JPEG, not PNG, because these files exist to be published: Instagram's
    // Content Publishing API accepts JPEG only and fails the container for
    // anything else, which would take a photo-less listing off the account
    // entirely. `flatten` is belt and braces - the card is opaque - and
    // 4:4:4 keeps the wordmark's thin strokes off a chroma-subsampled grid.
    await sharp(Buffer.from(svg))
      .flatten({ background: BACKDROP })
      .toColourspace('srgb')
      .jpeg({ quality: 92, progressive: true, chromaSubsampling: '4:4:4' })
      .toFile(file);

    const adjusted = color === category.color.toUpperCase() ? '' : ` (lightened from ${category.color})`;
    console.log(`  ${category.code.padEnd(12)} ${color}${adjusted}`);
  }

  console.log(`\n${categories.length} category images written to ${path.relative(CLIENT_ROOT, OUTPUT_DIR)}`);
  console.log('Add any new category code to server/config/categorySocialImages.js too.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
