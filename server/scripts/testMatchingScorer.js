/**
 * Offline check of the lost/found matching logic.
 *
 *   node scripts/testMatchingScorer.js
 *
 * Runs against the pure pieces only - text normalization, mainDate parsing and
 * pair scoring - so it needs no database and no configuration. It exists
 * because those three are where a silent regression would be invisible: a
 * broken Arabic normalization or a mis-parsed date does not throw, it just
 * quietly stops matching anything.
 *
 * Exits non-zero on the first failed assertion.
 */

const mongoose = require('mongoose');
const { normalizeText, tokenize, tokenSet, tokenSimilarity } = require('../utils/textMatching');
const { parseMainDate, resolveEventDate } = require('../utils/postDates');
const {
  scorePair,
  STORE_MIN_SCORE,
  NOTIFY_MIN_SCORE,
  STRONG_MATCH_SCORE,
} = require('../services/matchingService');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

// ---------------------------------------------------------------------------
console.log('\n--- text normalization ---');

check(
  'strips Latin accents and punctuation',
  normalizeText('Chatte perdue — Café Élysée #4512'),
  'chatte perdue cafe elysee 4512'
);
check(
  'strips Arabic diacritics and normalizes letter shapes',
  normalizeText('قِطَّةٌ ضائعة'),
  'قطه ضايعه'
);
check(
  'converts Arabic-Indic digits to ASCII',
  normalizeText('رقم ٤٥١٢'),
  'رقم 4512'
);
checkThat(
  'drops stopwords and keeps distinctive nouns',
  tokenize('Lost my brown cat with a red collar').join(',') === 'brown,cat,red,collar',
  tokenize('Lost my brown cat with a red collar').join(',')
);
checkThat(
  'strips the Arabic definite article',
  tokenize('القطة').includes('قطه'),
  tokenize('القطة').join(',')
);

const similar = tokenSimilarity(
  tokenSet('Brown cat with a red collar'),
  tokenSet('Found brown cats, red collars')
);
checkThat('plural forms still score as similar', similar > 0.6, `similarity=${similar.toFixed(2)}`);

const unrelated = tokenSimilarity(tokenSet('Brown cat red collar'), tokenSet('Black leather wallet'));
checkThat('unrelated descriptions score near zero', unrelated === 0, `similarity=${unrelated}`);

// ---------------------------------------------------------------------------
console.log('\n--- mainDate parsing ---');

check('English form', parseMainDate('March 5, 2026')?.toISOString(), '2026-03-05T00:00:00.000Z');
check('French form', parseMainDate('5 mars 2026')?.toISOString(), '2026-03-05T00:00:00.000Z');
check('Arabic (ar-MA) form', parseMainDate('5 غشت 2025')?.toISOString(), '2025-08-05T00:00:00.000Z');
check('Arabic (legacy) form', parseMainDate('5 ديسمبر 2024')?.toISOString(), '2024-12-05T00:00:00.000Z');
check('month-only defaults to mid-month', parseMainDate('August 2025')?.toISOString(), '2025-08-15T00:00:00.000Z');
check('unparseable value', parseMainDate('sometime last summer'), null);
check('empty value', parseMainDate(''), null);
checkThat(
  'falls back to createdAt when mainDate is unusable',
  resolveEventDate({ mainDate: '', createdAt: '2026-01-02T00:00:00Z' }).isExact === false
);

// ---------------------------------------------------------------------------
console.log('\n--- pair scoring ---');

const oid = () => new mongoose.Types.ObjectId();
const CAT_PET = oid();
const CAT_PHONE = oid();
const CITY_A = oid();
const CITY_B = oid();

const lostPost = {
  _id: oid(),
  user: oid(),
  categories: [CAT_PET],
  city: CITY_A,
  exactLocation: 'Parc de la Ligue Arabe, Casablanca',
  description: 'Chatte tigrée avec collier rouge, répond au nom de Luna, puce 4512',
  mainDate: '5 mars 2026',
  createdAt: new Date('2026-03-06'),
};
const roles = { lostPostId: String(lostPost._id) };

const candidate = (overrides) => ({
  _id: oid(),
  user: oid(),
  categories: [CAT_PET],
  city: CITY_A,
  exactLocation: 'Ligue Arabe park Casablanca',
  description: 'Found tabby cat, red collar, chip 4512',
  mainDate: 'March 7, 2026',
  createdAt: new Date('2026-03-07'),
  ...overrides,
});

const strong = scorePair(lostPost, candidate(), roles);
checkThat('near-identical pair scores in the strong band', strong && strong.score >= 75, `score=${strong?.score}`);
checkThat('near-identical pair cites the city', strong?.reasons.includes('same_city'));
checkThat('near-identical pair cites the shared chip number', strong?.reasons.includes('shared_reference'));

// Cross-language: a French "lost" post and an Arabic "found" post describing
// the same animal must still pair up.
const crossLanguage = scorePair(
  lostPost,
  candidate({
    exactLocation: 'حديقة الجامعة العربية الدار البيضاء',
    description: 'وجدت قطة بطوق أحمر رقم الشريحة 4512',
    mainDate: '7 مارس 2026',
  }),
  roles
);
checkThat(
  'French lost post pairs with an Arabic found post',
  crossLanguage && crossLanguage.score >= 70,
  `score=${crossLanguage?.score}`
);

check(
  'a different category never pairs',
  scorePair(lostPost, candidate({ categories: [CAT_PHONE] }), roles),
  null
);

check(
  'same category alone, far apart in time and place, is rejected',
  scorePair(lostPost, candidate({
    city: CITY_B,
    exactLocation: 'Somewhere else entirely',
    description: 'Found a dog',
    mainDate: 'August 1, 2026',
    createdAt: new Date('2026-08-01'),
  }), roles),
  null
);

const beforeLoss = scorePair(lostPost, candidate({
  mainDate: 'January 25, 2026',
  createdAt: new Date('2026-01-25'),
  description: 'Found tabby cat, red collar',
}), roles);
checkThat(
  'a find dated well before the loss is discounted',
  beforeLoss && beforeLoss.breakdown.date <= 3,
  `date points=${beforeLoss?.breakdown.date}`
);

const noText = scorePair(lostPost, candidate({ description: '', exactLocation: '' }), roles);
checkThat(
  'category + city + close dates alone still clears the storage floor',
  noText && noText.score >= STORE_MIN_SCORE,
  `score=${noText?.score}`
);

// ---------------------------------------------------------------------------
console.log('\n--- same category + same city is always a strong match ---');

// Nothing in common but the category and the city: no description, no shared
// location wording, and dates half a year apart so the date signal is spent.
const coreOnly = scorePair(lostPost, candidate({
  description: '',
  exactLocation: '',
  mainDate: 'September 20, 2026',
  createdAt: new Date('2026-09-20'),
}), roles);

checkThat(
  'bare category + city pair is not rejected',
  coreOnly !== null
);
checkThat(
  'bare category + city pair lands in the strong band',
  coreOnly && coreOnly.score >= STRONG_MATCH_SCORE,
  `score=${coreOnly?.score}`
);
checkThat(
  'bare category + city pair clears the notification floor',
  coreOnly && coreOnly.score >= NOTIFY_MIN_SCORE,
  `score=${coreOnly?.score} floor=${NOTIFY_MIN_SCORE}`
);
check(
  'bare category + city pair cites both reasons',
  coreOnly && coreOnly.reasons.includes('same_category') && coreOnly.reasons.includes('same_city'),
  true
);
checkThat(
  'the floor does not cap a pair that earned more on its own',
  strong && strong.score > STRONG_MATCH_SCORE,
  `score=${strong?.score}`
);
checkThat(
  'a different city is left to the other signals',
  (() => {
    const otherCity = scorePair(lostPost, candidate({
      city: CITY_B,
      description: '',
      exactLocation: '',
      mainDate: 'September 20, 2026',
      createdAt: new Date('2026-09-20'),
    }), roles);
    return otherCity === null;
  })(),
  'same category in another city, months apart, still rejected'
);

// ---------------------------------------------------------------------------
console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
