/**
 * Offline check of the document-title vocabulary.
 *
 *   node scripts/testDocumentTypes.js
 *
 * No database, no network: models/DocumentType is stubbed with an in-memory
 * collection, and the real controller is driven with fake requests.
 *
 * What matters here, and why each of these is worth a test:
 *
 *  - The list is what replaces the photo on a DOCUMENTS listing, so it has to
 *    come back in all three languages and in priority order. A title nobody
 *    can read in their own language is a listing nobody can judge.
 *  - A contributed title is saved for everyone, so the same paper must not end
 *    up in the list four times under four spellings. Both halves of that are
 *    checked: the lookup, and the unique index behind it (the case where two
 *    people submit at the same instant and the lookup lets both through).
 *  - Both scripts are required, because a title written only in French is
 *    unreadable to half the site and vice versa.
 *  - And the seed config has to stay internally consistent - unique codes,
 *    three labels each - since nothing else checks it before it reaches a DB.
 *
 * Exits non-zero if any assertion failed.
 */

const Module = require('module');

let failures = 0;
let checks = 0;

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

// ------------------------------------------------------- the fake collection
const { normalizeText } = require('../utils/textMatching');

const buildNormalizedLabels = (labels = {}) => [
  ...new Set(['ar', 'en', 'fr'].map((lang) => normalizeText(labels[lang])).filter(Boolean)),
];

let rows = [];
let nextId = 1;
// Set by a test to make the next create() lose the unique-index race, the way
// a second simultaneous submission of the same title does in production.
let duplicateKeyOnNextCreate = false;

const makeQuery = (value) => {
  const q = {
    select: () => q,
    sort: () => q,
    lean: () => q,
    exec: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
};

const matches = (row, filter) => {
  if (filter.isActive !== undefined && row.isActive !== filter.isActive) return false;
  if (filter.normalizedLabels?.$in) {
    const wanted = filter.normalizedLabels.$in;
    if (!row.normalizedLabels.some((label) => wanted.includes(label))) return false;
  }
  if (filter.normalizedLabels?.$regex) {
    const pattern = new RegExp(filter.normalizedLabels.$regex, 'i');
    if (!row.normalizedLabels.some((label) => pattern.test(label))) return false;
  }
  return true;
};

const DocumentTypeStub = {
  buildNormalizedLabels,
  LABEL_MAX_LENGTH: 80,
  find: (filter = {}) => makeQuery(
    rows
      .filter((row) => matches(row, filter))
      .sort((a, b) => (b.priority - a.priority) || a.labels.en.localeCompare(b.labels.en))
  ),
  findOne: (filter = {}) => makeQuery(rows.find((row) => matches(row, filter)) || null),
  create: async (doc) => {
    if (duplicateKeyOnNextCreate) {
      duplicateKeyOnNextCreate = false;
      const error = new Error('E11000 duplicate key error');
      error.code = 11000;
      throw error;
    }
    const row = {
      _id: `id-${nextId++}`,
      isActive: true,
      isCustom: false,
      priority: 0,
      ...doc,
      normalizedLabels: buildNormalizedLabels(doc.labels),
    };
    rows.push(row);
    return row;
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent) {
  const fromController = parent && parent.filename
    && parent.filename.endsWith('controllers/documentTypesController.js');
  if (fromController && request === '../models/DocumentType') return DocumentTypeStub;
  return originalLoad.apply(this, arguments);
};

const { getDocumentTypes, createDocumentType } = require('../controllers/documentTypesController');
const { DEFAULT_DOCUMENT_TYPES } = require('../config/documentTypes');

// ------------------------------------------------------------------ harness
const call = async (handler, req) => {
  let statusCode = 200;
  let payload;
  const res = {
    status(code) { statusCode = code; return res; },
    json(body) { payload = body; return res; },
  };
  await handler({ query: {}, body: {}, ...req }, res);
  return { statusCode, payload };
};

const seed = () => {
  rows = [];
  nextId = 1;
  DEFAULT_DOCUMENT_TYPES.forEach((documentType) => {
    rows.push({
      _id: `seed-${documentType.code}`,
      code: documentType.code,
      labels: documentType.labels,
      priority: documentType.priority,
      isActive: true,
      isCustom: false,
      normalizedLabels: buildNormalizedLabels(documentType.labels),
    });
  });
};

const run = async () => {
  // --- the seed config itself
  const codes = DEFAULT_DOCUMENT_TYPES.map((documentType) => documentType.code);
  checkThat('every seeded code is unique', new Set(codes).size === codes.length);
  checkThat(
    'every seeded title has all three labels',
    DEFAULT_DOCUMENT_TYPES.every((d) => d.labels?.ar && d.labels?.en && d.labels?.fr)
  );
  const normalizedSeeds = DEFAULT_DOCUMENT_TYPES.flatMap((d) => buildNormalizedLabels(d.labels));
  checkThat(
    'no two seeded titles share a normalized spelling',
    new Set(normalizedSeeds).size === normalizedSeeds.length,
    'a collision would make one of them unsavable behind the unique index'
  );

  seed();

  // --- listing
  const listed = await call(getDocumentTypes, {});
  checkThat('list answers 200', listed.statusCode === 200);
  checkThat('list returns every active title', listed.payload.length === DEFAULT_DOCUMENT_TYPES.length);
  checkThat(
    'list is ordered by priority, not alphabetically',
    listed.payload[0].code === 'NATIONAL_ID',
    `first was ${listed.payload[0].code}`
  );
  checkThat(
    'each listed title carries all three languages',
    listed.payload.every((d) => d.labels.ar && d.labels.en && d.labels.fr)
  );

  // Searching is script-folded: an Arabic query written without the hamza
  // still finds the title spelled with it.
  const searched = await call(getDocumentTypes, { query: { search: 'passeport' } });
  checkThat(
    'search finds a title by its French name',
    searched.payload.some((d) => d.code === 'PASSPORT'),
    `${searched.payload.length} result(s)`
  );

  // --- contributing a title
  const created = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: 'بطاقة المكتبة', latinLabel: 'Library card' },
  });
  checkThat('a new title is created', created.statusCode === 201 && created.payload.created === true);
  checkThat('a contributed title is marked custom', created.payload.documentType.isCustom === true);
  checkThat(
    'a contributed title is listed to everyone immediately',
    (await call(getDocumentTypes, {})).payload.some((d) => d.labels.ar === 'بطاقة المكتبة')
  );

  const again = await call(createDocumentType, {
    user: 'user-2',
    body: { arabicLabel: 'بطاقة المكتبة ', latinLabel: 'LIBRARY CARD' },
  });
  checkThat(
    'the same title in another spelling is not added twice',
    again.statusCode === 200 && again.payload.created === false,
    `status ${again.statusCode}`
  );
  checkThat(
    'and the reader is handed the row that already existed',
    again.payload.documentType._id === created.payload.documentType._id
  );

  const existingSeed = await call(createDocumentType, {
    user: 'user-3',
    body: { arabicLabel: 'جواز السفر', latinLabel: 'Passport' },
  });
  checkThat(
    'a title that is already a seeded one resolves to the seed',
    existingSeed.statusCode === 200 && existingSeed.payload.documentType.code === 'PASSPORT'
  );

  // Two people submitting the same new title at the same instant both get
  // past the lookup; the unique index refuses one of them, and that one must
  // still end up with the row rather than an error.
  duplicateKeyOnNextCreate = true;
  const raced = await call(createDocumentType, {
    user: 'user-4',
    body: { arabicLabel: 'بطاقة المكتبة', latinLabel: 'Library card' },
  });
  checkThat(
    'a lost unique-index race answers with the winning row, not an error',
    raced.statusCode === 200 && raced.payload.documentType._id === created.payload.documentType._id
  );

  // --- what is refused
  const missingArabic = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: '', latinLabel: 'Fishing licence' },
  });
  checkThat('a title with no Arabic name is refused', missingArabic.statusCode === 400);
  checkThat(
    'and the refusal names the field',
    missingArabic.payload.fields?.some((f) => f.field === 'arabicLabel')
  );

  const latinInArabicField = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: 'Carte de peche', latinLabel: 'Fishing licence' },
  });
  checkThat(
    'a Latin name in the Arabic field is refused',
    latinInArabicField.statusCode === 400,
    'otherwise the Arabic list fills up with French'
  );

  const arabicInLatinField = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: 'رخصة الصيد', latinLabel: 'رخصة الصيد' },
  });
  checkThat('an Arabic name in the Latin field is refused', arabicInLatinField.statusCode === 400);

  const tooLong = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: 'و'.repeat(200), latinLabel: 'x'.repeat(200) },
  });
  checkThat('an over-long title is refused', tooLong.statusCode === 400);

  // A title an admin deactivated must not be resurrected by someone
  // submitting it again.
  rows.push({
    _id: 'retired-1',
    code: 'RETIRED',
    labels: { ar: 'وثيقة ملغاة', en: 'Retired document', fr: 'Document retiré' },
    priority: 0,
    isActive: false,
    isCustom: true,
    normalizedLabels: buildNormalizedLabels({ ar: 'وثيقة ملغاة', en: 'Retired document', fr: 'Document retiré' }),
  });
  const retired = await call(createDocumentType, {
    user: 'user-1',
    body: { arabicLabel: 'وثيقة ملغاة', latinLabel: 'Retired document' },
  });
  checkThat('a deactivated title is not re-offered or re-created', retired.statusCode === 409);
  checkThat(
    'and it stays out of the list',
    !(await call(getDocumentTypes, {})).payload.some((d) => d.code === 'RETIRED')
  );

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0) process.exit(1);
};

run().catch((error) => {
  console.error('testDocumentTypes crashed:', error);
  process.exit(1);
});
