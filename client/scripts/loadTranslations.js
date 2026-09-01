// Reads the app's translation table from plain Node, for the build-time SEO
// scripts.
//
// src/utils/translations.js is ESM and imports React-only modules
// (languageContext), so it cannot be require()d from a build script. The parts
// that matter here are none of that: the file is one big
// `export const translations = { en: {...}, fr: {...}, ar: {...} };` object
// literal, followed by the useTranslation hook.
//
// So the object literal is sliced out by its two known boundaries and evaluated
// on its own. That keeps the prerendered <h1> and intro copy reading from the
// same source the React app renders, instead of a hand-mirrored second copy
// that silently drifts - which is the failure mode the rest of this directory
// already lives with for page titles.
//
// If either boundary ever moves, this throws rather than guessing, and
// prerenderSeo.js falls back to shipping meta without body copy.

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_PATH = path.join(__dirname, '..', 'src', 'utils', 'translations.js');

const OPEN = 'export const translations =';
const CLOSE = '\nexport const useTranslation';

let cached = null;

const loadTranslations = () => {
  if (cached) return cached;

  const source = fs.readFileSync(TRANSLATIONS_PATH, 'utf8');

  const start = source.indexOf(OPEN);
  if (start === -1) {
    throw new Error(`loadTranslations: could not find "${OPEN}" in translations.js`);
  }
  const end = source.indexOf(CLOSE, start);
  if (end === -1) {
    throw new Error(`loadTranslations: could not find "${CLOSE.trim()}" in translations.js`);
  }

  // Trim back to the object literal's own closing brace: the text between the
  // two boundaries ends with `};` followed by the blank line and the comment
  // that introduces useTranslation, none of which is part of the expression.
  const between = source.slice(start + OPEN.length, end);
  const closingBrace = between.lastIndexOf('};');
  if (closingBrace === -1) {
    throw new Error('loadTranslations: could not find the end of the translations object literal');
  }
  const literal = between.slice(0, closingBrace + 1).trim();

  // eslint-disable-next-line no-new-func
  const value = new Function(`return (${literal});`)();

  if (!value || !value.ar || !value.en) {
    throw new Error('loadTranslations: parsed object is missing the ar/en language blocks');
  }

  cached = value;
  return cached;
};

// Looks a key up in one language, falling back to English the same way
// useTranslation() does, and returns '' rather than the key name when neither
// exists - a prerendered page must never print a raw translation key.
const translator = (language) => {
  const table = loadTranslations();
  return (key) => {
    const value = (table[language] && table[language][key]) || (table.en && table.en[key]);
    return typeof value === 'string' ? value : '';
  };
};

module.exports = { loadTranslations, translator };
