/**
 * Maximum lengths for the free-text fields users submit.
 *
 * One place, read by both halves of the enforcement:
 *   - the mongoose `maxlength` validators (models/Post.js, models/Comment.js,
 *     models/Report.js), which are the backstop no write path can bypass, and
 *   - the express-validator rules (middleware/validation.js), which turn the
 *     same limits into a clean 400 naming the field instead of a 500 from a
 *     mongoose ValidationError.
 *
 * They used to be enforced by nothing at all on the model, with a global
 * middleware silently cutting every string at 1000 characters on the way in -
 * so a long description was accepted, stored short, and the author never told.
 * Length is a schema concern; the two layers here are the schema and the
 * message about it, and keeping the numbers in one file is what stops them
 * drifting apart.
 */
const FIELD_LIMITS = {
  post: {
    // A phone number, an email, or a short "call me on ..." line.
    contact: 100,
    // A street, a landmark, a bus line - the line the posts-list card renders
    // under the photo, so it has to stay one line's worth of text.
    exactLocation: 200,
    // The only genuinely long field on a listing. Renders as body copy on the
    // detail page and is truncated to 300 characters in the JSON-LD.
    description: 2000,
    // Free-text date written by the client's DateEntryDialog ("12 mars 2024"),
    // parsed by utils/postDates.js.
    mainDate: 100,
    // Digits and separators.
    promotionPhoneNumber: 30,
    tag: 50,
    // Cloudinary URLs, set server-side; the cap is only here so a client that
    // passes `image` on an update cannot store an unbounded string.
    imageUrl: 2048,
  },
  comment: {
    // A comment is a lead about someone's property ("saw this near the
    // station, called the number") - a few paragraphs, not an article. Matches
    // what the web and mobile threads are laid out to render.
    text: 1000,
  },
  query: {
    // Search terms reach the posts query as a `$regex` (see
    // controllers/postsController.js), so an unbounded one is a needlessly
    // expensive scan to hand a stranger. Nothing anyone actually types to find
    // a lost phone is longer than this. The global truncation middleware used
    // to cap query strings at 1000 as a side effect; this replaces that with
    // something deliberate and refused rather than silently rewritten.
    search: 200,
  },
  report: {
    // The reason label or the reporter's own words behind it.
    reason: 500,
    adminNotes: 2000,
  },
};

module.exports = { FIELD_LIMITS };
