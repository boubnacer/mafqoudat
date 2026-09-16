// The one category that changes the shape of the wizard.
//
// A photo of an official document publishes its holder's name, its number and
// often their address and face to every reader - on a site whose whole job is
// handing property back to the person who lost it, that is the one attachment
// that does more harm than good. So a listing filed under DOCUMENTS names the
// document instead, from the vocabulary in server/config/documentTypes.js.
//
// The photo is removed only when documents are *all* this listing is about. A
// wallet found with papers inside it is still a wallet, and the photo of the
// wallet is what its owner recognises - so a listing that also carries another
// category keeps its Photo step, and is told to frame the other thing and
// leave the documents out of the shot.
export const DOCUMENTS_CATEGORY_CODE = 'DOCUMENTS';

const getCategoryId = (category) => String(category?.id || category?._id || '');

/** The category ids a form's values currently carry, new shape or legacy. */
export const getSelectedCategoryIds = (values) => (
  values?.categories && Array.isArray(values.categories) && values.categories.length > 0
    ? values.categories.map(String)
    : (values?.category ? [String(values.category)] : [])
);

/**
 * Whether this listing is about documents. Read off the category's `code`
 * rather than a hardcoded id: the ids are per-deployment, the code is the
 * contract both front ends and the seed scripts already share.
 */
export const isDocumentsListing = (categories, values) => {
  const selectedIds = getSelectedCategoryIds(values);
  if (selectedIds.length === 0) return false;

  return (categories || []).some(
    (category) => category?.code === DOCUMENTS_CATEGORY_CODE && selectedIds.includes(getCategoryId(category))
  );
};

/**
 * The selected categories that are not DOCUMENTS - i.e. the things a photo on
 * this listing would be *of*. Empty means documents are all it is about, which
 * is the only case where the photo goes away entirely.
 */
export const getNonDocumentCategories = (categories, values) => {
  const selectedIds = getSelectedCategoryIds(values);
  if (selectedIds.length === 0) return [];

  return (categories || []).filter(
    (category) => category?.code !== DOCUMENTS_CATEGORY_CODE && selectedIds.includes(getCategoryId(category))
  );
};

/** Documents and nothing else: no photo at all. */
export const isDocumentsOnlyListing = (categories, values) => (
  isDocumentsListing(categories, values) && getNonDocumentCategories(categories, values).length === 0
);
