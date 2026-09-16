const DocumentType = require("../models/DocumentType");
const { DEFAULT_DOCUMENT_TYPES } = require("../config/documentTypes");

/**
 * Creates the seeded document titles this build ships with, once, on boot.
 *
 * The picker on the New Post form is the only way to file a DOCUMENTS listing,
 * and it lists what the collection holds - so an empty collection is not a
 * degraded feature, it is a form nobody can complete. Leaving that behind a
 * manual `npm run sync-document-types` made the deploy itself the missing step,
 * and the symptom (a picker with no rows and a search that finds nothing) says
 * nothing about the cause.
 *
 * Idempotent and additive: it creates only the codes that are missing, never
 * touches an existing row's labels, priority or `isActive` (a title an admin
 * retired stays retired), and never deletes anything - the contributed titles
 * readers add from the form live in the same collection.
 *
 * `scripts/sync-document-types.js` is still the deliberate tool for inspecting
 * and re-syncing that vocabulary; this is only the floor under it.
 */
const ensureDocumentTypesSeeded = async () => {
  const existing = await DocumentType.find({})
    .select("code")
    .lean()
    .exec();
  const known = new Set(existing.map((row) => row.code));

  const missing = DEFAULT_DOCUMENT_TYPES.filter((seed) => !known.has(seed.code));
  if (missing.length === 0) return { created: 0 };

  let created = 0;
  for (const seed of missing) {
    try {
      // One at a time rather than insertMany: a duplicate normalized label
      // (another instance seeding at the same moment) must skip that one row,
      // not abort the rest of the list.
      await DocumentType.create({
        code: seed.code,
        labels: seed.labels,
        priority: seed.priority || 0,
        searchTerms: seed.searchTerms || [],
        isCustom: false,
        isActive: true,
      });
      created += 1;
    } catch (error) {
      if (error?.code !== 11000) {
        console.error(`Failed to seed document type ${seed.code}:`, error?.message || error);
      }
    }
  }

  return { created };
};

module.exports = { ensureDocumentTypesSeeded };
