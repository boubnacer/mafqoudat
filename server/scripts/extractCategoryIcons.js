#!/usr/bin/env node
/**
 * One-shot helper: reads each category's icon out of the client's
 * react-icons/io5 (unified with mobile's Ionicons), and writes the
 * { viewBox, body, stroked } data into server/config/categoryIcons.json.
 *
 * Usage:
 *   node scripts/extractCategoryIcons.js
 */

const path = require('path');
const fs = require('fs');

const CLIENT_ROOT = path.resolve(__dirname, '..', '..', 'client');
const React = require(path.join(CLIENT_ROOT, 'node_modules', 'react'));
const { renderToStaticMarkup } = require(path.join(CLIENT_ROOT, 'node_modules', 'react-dom', 'server'));
const io = require(path.join(CLIENT_ROOT, 'node_modules', 'react-icons', 'io5'));

const CATEGORY_MAP = {
  ELECTRONICS: io.IoPhonePortraitOutline,
  DOCUMENTS: io.IoDocumentTextOutline,
  JEWELRY: io.IoDiamondOutline,
  CLOTHING: io.IoShirtOutline,
  PETS: io.IoPawOutline,
  VEHICLES: io.IoCarOutline,
  KEYS: io.IoKeyOutline,
  WALLET: io.IoWalletOutline,
  BAGS: io.IoBriefcaseOutline,
  WATCHES: io.IoWatchOutline,
  GLASSES: io.IoGlassesOutline,
  HEADPHONES: io.IoHeadsetOutline,
  BOOKS: io.IoBookOutline,
  SPORTS: io.IoFootballOutline,
  TOYS: io.IoGameControllerOutline,
  CAMERAS: io.IoCameraOutline,
  CHARGERS: io.IoBatteryChargingOutline,
  UMBRELLAS: io.IoUmbrellaOutline,
  BICYCLES: io.IoBicycleOutline,
  MONEY: io.IoCashOutline,
  PERSON: io.IoPersonOutline,
  MEDICAL: io.IoMedkitOutline,
  BABY: io.IoBalloonOutline,
  MUSIC: io.IoMusicalNotesOutline,
  OTHER: io.IoEllipsisHorizontalOutline,
};

const result = {};

for (const [code, Component] of Object.entries(CATEGORY_MAP)) {
  if (!Component) {
    console.error(`Missing component for ${code}`);
    continue;
  }
  const markup = renderToStaticMarkup(React.createElement(Component));
  const viewBoxMatch = markup.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';
  const openTag = markup.match(/<svg[^>]*>/);
  const body = markup.slice(openTag[0].length, markup.lastIndexOf('</svg>')).trim();
  const paths = [...markup.matchAll(/<path\s+d="([^"]+)"/g)].map((m) => m[1]);

  result[code] = {
    viewBox,
    body,
    paths,
    stroked: true,
  };
}

const outputPath = path.join(__dirname, '..', 'config', 'categoryIcons.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
console.log(`Successfully extracted ${Object.keys(result).length} category icons to ${outputPath}`);
