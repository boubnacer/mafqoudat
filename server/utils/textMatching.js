/**
 * Multilingual text normalization + similarity helpers used by the
 * lost/found matching engine (services/matchingService.js).
 *
 * Posts on this platform are written in English, French or Arabic - often
 * mixing scripts inside a single description - so every comparison has to run
 * on a script-normalized form. Nothing here touches the database or any
 * request context, which keeps it trivially unit-testable.
 */

// Arabic combining marks: tashkeel, superscript alef, hamza marks and the
// purely decorative tatweel. Stripped before comparing so "قِطَّة" and "قطة"
// tokenize identically.
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

// Latin combining marks left over after NFKD (é -> e + U+0301).
const LATIN_MARKS = /[̀-ͯ]/g;

// Letter-shape variants that carry no distinction for matching purposes.
const ARABIC_LETTER_VARIANTS = [
  [/[آأإٱٲٳ]/g, 'ا'], // آ أ إ ٱ -> ا
  [/ى/g, 'ي'], // ى -> ي
  [/ة/g, 'ه'], // ة -> ه
  [/ؤ/g, 'و'], // ؤ -> و
  [/ئ/g, 'ي'], // ئ -> ي
  [/ک/g, 'ك'], // ک -> ك
  [/ی/g, 'ي'], // ی -> ي
];

// Function words that appear in nearly every post and would otherwise inflate
// every similarity score. Kept deliberately small: over-stemming loses the
// distinctive nouns ("collar", "collier", "طوق") that make a match credible.
const STOPWORD_SOURCE = [
  // English
  'the', 'and', 'for', 'with', 'was', 'were', 'has', 'have', 'had', 'this',
  'that', 'these', 'those', 'here', 'there', 'from', 'into', 'near', 'about',
  'please', 'anyone', 'someone', 'his', 'her', 'its', 'our', 'your', 'their',
  'who', 'she', 'they', 'him', 'them', 'not', 'but', 'you', 'are', 'can',
  'contact', 'call', 'phone', 'reward', 'help', 'lost', 'found', 'missing',
  // French
  'les', 'des', 'une', 'aux', 'dans', 'pour', 'avec', 'sur', 'par', 'est',
  'sont', 'etait', 'cette', 'cet', 'ces', 'mon', 'ton', 'son', 'nos', 'vos',
  'leur', 'leurs', 'que', 'qui', 'quoi', 'pas', 'plus', 'tres', 'chez',
  'perdu', 'perdue', 'trouve', 'trouvee', 'contacter', 'appeler', 'merci',
  // Arabic (already normalized: ة -> ه, أ/إ/آ -> ا)
  'في', 'من', 'علي', 'الي', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
  'كان', 'كانت', 'قد', 'لقد', 'ثم', 'او', 'ايضا', 'جدا', 'عند', 'بعد', 'قبل',
  'ضاع', 'ضاعت', 'فقد', 'فقدت', 'وجد', 'وجدت', 'ضائع', 'مفقود', 'اتصال',
  'رجاء', 'شكرا', 'هاتف', 'رقم', 'ضائع', 'ضائعة', 'ضاعت',
];

/**
 * Script-normalized lowercase form of a free-text field.
 * Returns a space-separated string of letters/digits only.
 */
const normalizeText = (input) => {
  if (input === null || input === undefined) return '';

  let text = String(input).toLowerCase();

  // NFKD first so accented Latin (and hamza-carrying Arabic) decomposes into
  // base letter + combining mark, then drop the marks from both scripts.
  text = text.normalize('NFKD').replace(LATIN_MARKS, '').replace(ARABIC_MARKS, '');

  // Safety net for anything NFKD left composed.
  ARABIC_LETTER_VARIANTS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  // Arabic-Indic and extended Arabic-Indic digits -> ASCII, so "٥" and "5"
  // compare equal (plate numbers, phone fragments, ages).
  text = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

  // Everything that isn't a letter or a digit becomes a separator.
  return text.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
};

// Built through normalizeText so the set is stored in exactly the form the
// tokenizer produces - otherwise entries written in their natural spelling
// (ضائعة -> ضايعه) would never match a token and silently do nothing.
const STOPWORDS = new Set(STOPWORD_SOURCE.map((word) => normalizeText(word)).filter(Boolean));

/**
 * Tokens worth comparing: stopwords removed, Arabic definite article stripped,
 * very short noise dropped. Numbers are kept from two digits up because model
 * numbers and plate fragments are among the strongest signals we have.
 */
const tokenize = (input) => {
  const normalized = normalizeText(input);
  if (!normalized) return [];

  const tokens = [];
  normalized.split(' ').forEach((rawToken) => {
    if (!rawToken) return;

    let token = rawToken;

    // Strip the Arabic definite article so "القطه" matches "قطه". Only when
    // enough stem is left for the remainder to still be meaningful.
    if (token.length >= 5 && token.startsWith('ال')) {
      token = token.slice(2);
    }

    const isNumeric = /^\d+$/.test(token);
    if (isNumeric) {
      if (token.length >= 2) tokens.push(token);
      return;
    }

    if (token.length < 3) return;
    if (STOPWORDS.has(token)) return;
    tokens.push(token);
  });

  return tokens;
};

/** Deduplicated token set for a list of free-text fields. */
const tokenSet = (...inputs) => new Set(inputs.flatMap((input) => tokenize(input)));

/**
 * Sørensen-Dice coefficient over two token sets, with a partial credit rule:
 * a token counts as a half match when one side is a prefix of the other and
 * the shared prefix is at least 4 characters. That absorbs plurals and light
 * inflection ("collar"/"collars", "chatte"/"chat") without a real stemmer.
 *
 * Returns 0..1. Empty on either side returns 0.
 */
const tokenSimilarity = (setA, setB) => {
  if (!setA?.size || !setB?.size) return 0;

  // Iterate the smaller set so the prefix scan stays cheap.
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];

  let overlap = 0;
  small.forEach((token) => {
    if (large.has(token)) {
      overlap += 1;
      return;
    }
    if (token.length < 4) return;
    for (const other of large) {
      if (other.length < 4) continue;
      if (other.startsWith(token) || token.startsWith(other)) {
        overlap += 0.5;
        return;
      }
    }
  });

  return Math.min(1, (2 * overlap) / (setA.size + setB.size));
};

/**
 * Numeric tokens present on both sides (plate fragments, model numbers, chip
 * IDs). Distinctive enough to be surfaced as its own match reason.
 */
const sharedNumericTokens = (setA, setB) => {
  const shared = [];
  setA.forEach((token) => {
    if (/^\d{3,}$/.test(token) && setB.has(token)) shared.push(token);
  });
  return shared;
};

module.exports = {
  normalizeText,
  tokenize,
  tokenSet,
  tokenSimilarity,
  sharedNumericTokens,
  STOPWORDS,
};
