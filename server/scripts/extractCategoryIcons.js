#!/usr/bin/env node
/**
 * One-shot helper: reads each category's icon out of the client's
 * @mui/icons-material and the local SVG components, and prints the
 * { viewBox, paths, stroked } data ready to paste into
 * server/config/categoryColors.js.
 *
 * Run from the client directory (where node_modules/@mui/icons-material lives):
 *   node ../server/scripts/extractCategoryIcons.js
 */

const path = require('path');

const CLIENT_ROOT = path.resolve(__dirname, '..', '..', 'client');
const React = require(path.join(CLIENT_ROOT, 'node_modules', 'react'));
const { renderToStaticMarkup } = require(path.join(CLIENT_ROOT, 'node_modules', 'react-dom', 'server'));
const fs = require('fs');

const CATEGORY_CONFIG_FILE = path.join(CLIENT_ROOT, 'src/config/categories.js');

const source = fs.readFileSync(CATEGORY_CONFIG_FILE, 'utf8');

// Parse MUI icon imports
function parseMuiIconImports(src) {
  const modules = {};
  const namedImport = src.match(/import\s*\{([^}]+)\}\s*from\s*'@mui\/icons-material'/);
  if (namedImport) {
    namedImport[1].split(',').map(n => n.trim()).filter(Boolean).forEach(name => { modules[name] = name; });
  }
  const defaultImports = src.matchAll(/import\s+(\w+)\s+from\s+'@mui\/icons-material\/(\w+)'/g);
  for (const [, identifier, moduleName] of defaultImports) modules[identifier] = moduleName;
  return modules;
}

// Parse local SVG icon components
function parseLocalIconComponents(src) {
  const icons = {};
  const components = src.matchAll(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\(\s*(<svg[\s\S]*?<\/svg>)\s*\)/g);
  for (const [, identifier, markup] of components) {
    const viewBox = markup.match(/viewBox="([^"]+)"/);
    if (!viewBox) continue;
    const paths = [...markup.matchAll(/<path\s+d="([^"]+)"\s*\/>/g)].map(m => m[1]);
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

// Parse category config entries
function parseCategoryConfig(src) {
  function extractBalancedBlock(s, startIndex) {
    let depth = 0;
    for (let i = startIndex; i < s.length; i++) {
      if (s[i] === '{') depth++;
      if (s[i] === '}') { depth--; if (depth === 0) return s.slice(startIndex, i + 1); }
    }
    throw new Error('Unbalanced');
  }
  const start = src.indexOf('export const CATEGORY_CONFIG = {');
  const block = extractBalancedBlock(src, src.indexOf('{', start));
  return [...block.matchAll(/(\w+):\s*\{\s*icon:\s*(\w+),[^{}]*?color:\s*'(#[0-9A-Fa-f]{6})'/g)]
    .map(([, code, iconIdentifier, color]) => ({ code, iconIdentifier, color }));
}

function renderMuiIcon(moduleName) {
  const Icon = require(path.join(CLIENT_ROOT, 'node_modules', '@mui', 'icons-material', moduleName)).default;
  const markup = renderToStaticMarkup(React.createElement(Icon));
  const viewBox = markup.match(/viewBox="([^"]+)"/);
  // Extract all path elements
  const paths = [...markup.matchAll(/<path\s+d="([^"]+)"/g)].map(m => m[1]);
  return { viewBox: viewBox ? viewBox[1] : '0 0 24 24', paths, stroked: false };
}

const muiModules = parseMuiIconImports(source);
const localIcons = parseLocalIconComponents(source);
const categories = parseCategoryConfig(source);

const result = {};
for (const { code, iconIdentifier } of categories) {
  let icon;
  if (muiModules[iconIdentifier]) {
    icon = renderMuiIcon(muiModules[iconIdentifier]);
  } else if (localIcons[iconIdentifier]) {
    const local = localIcons[iconIdentifier];
    icon = { viewBox: local.viewBox, paths: local.paths, stroked: local.stroked, strokeWidth: local.strokeWidth };
  } else {
    console.error(`Cannot resolve icon ${iconIdentifier} for ${code}`);
    continue;
  }
  result[code] = icon;
}

console.log(JSON.stringify(result, null, 2));
