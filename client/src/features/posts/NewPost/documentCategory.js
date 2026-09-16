// The one category that changes the shape of the wizard.
//
// A photo of an official document publishes its holder's name, its number and
// often their address and face to every reader - on a site whose whole job is
// handing property back to the person who lost it, that is the one attachment
// that does more harm than good. So a listing filed under DOCUMENTS takes no
// photo at all (the Photo step is removed, not merely emptied) and names the
// document instead, from the vocabulary in server/config/documentTypes.js.
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
