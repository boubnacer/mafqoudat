// Mirrors client/src/features/posts/NewPost/documentCategory.js.
//
// A photo of an official document publishes its holder's name, its number and
// often their address to every reader, so a listing filed under DOCUMENTS
// takes no photo at all - the Photo step is removed from the form - and names
// the document instead (see api/documentTypesApi.js).
export const DOCUMENTS_CATEGORY_CODE = 'DOCUMENTS';

export const isDocumentsListing = (categories, selectedCategoryIds) => {
  const selected = (selectedCategoryIds || []).map(String);
  if (selected.length === 0) return false;

  return (categories || []).some(
    (category) => category?.code === DOCUMENTS_CATEGORY_CODE
      && selected.includes(String(category?._id || category?.id || ''))
  );
};
