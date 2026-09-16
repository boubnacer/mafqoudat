// Mirrors client/src/features/posts/NewPost/documentCategory.js.
//
// A photo of an official document publishes its holder's name, its number and
// often their address to every reader, so a listing filed under DOCUMENTS
// names the document instead (see api/documentTypesApi.js). The photo goes
// away only when documents are all it is about: a wallet found with papers in
// it is still a wallet, and the photo of the wallet is what its owner
// recognises - so a listing carrying another category keeps its Photo step and
// is told to leave the papers out of the frame.
export const DOCUMENTS_CATEGORY_CODE = 'DOCUMENTS';

export const isDocumentsListing = (categories, selectedCategoryIds) => {
  const selected = (selectedCategoryIds || []).map(String);
  if (selected.length === 0) return false;

  return (categories || []).some(
    (category) => category?.code === DOCUMENTS_CATEGORY_CODE
      && selected.includes(String(category?._id || category?.id || ''))
  );
};

/** The selected categories a photo on this listing would be *of*. */
export const getNonDocumentCategories = (categories, selectedCategoryIds) => {
  const selected = (selectedCategoryIds || []).map(String);
  if (selected.length === 0) return [];

  return (categories || []).filter(
    (category) => category?.code !== DOCUMENTS_CATEGORY_CODE
      && selected.includes(String(category?._id || category?.id || ''))
  );
};

/** Documents and nothing else: no photo at all. */
export const isDocumentsOnlyListing = (categories, selectedCategoryIds) => (
  isDocumentsListing(categories, selectedCategoryIds)
    && getNonDocumentCategories(categories, selectedCategoryIds).length === 0
);
