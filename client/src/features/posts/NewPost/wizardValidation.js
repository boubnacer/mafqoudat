// Per-step validation for the NewPost wizard. Mirrors the validation that
// used to live inline in handleSubmit, split by step so "Next" can gate
// each step individually. Field priority order matches the original
// handleSubmit scroll-to-error chain.

const FIELD_TESTID = {
  foundLost: 'foundLost',
  category: 'category',
  documentTypes: 'documentTypes',
  documentOwnerName: 'documentOwnerName',
  country: 'country-select',
  city: 'city-select',
  exactLocation: 'exactLocation',
  contact: 'contact',
};

const PRIORITY_ORDER = ['foundLost', 'category', 'documentTypes', 'documentOwnerName', 'country', 'city', 'exactLocation', 'contact'];

// Checked by script rather than by alphabet, so accents and Arabic diacritics
// pass: the point is only that the Arabic field is not holding a Latin name
// and vice versa, which is how one of the two ends up useless to search.
const HAS_ARABIC = /\p{Script=Arabic}/u;
const HAS_LATIN = /\p{Script=Latin}/u;

// `requiresDocumentTitle` is set by the caller when the chosen categories
// include DOCUMENTS: those listings carry no photo, so the document's own
// title is the only thing identifying what was lost, and it is required for
// exactly the same reason a category is.
export const validateStep1 = (values, t, { requiresDocumentTitle = false } = {}) => {
  const missingFields = [];
  const fieldErrors = {};

  if (!values.foundLost) {
    missingFields.push(t('foundOrLost'));
    fieldErrors.foundLost = t('required');
  }

  const selectedCategories = values.categories && Array.isArray(values.categories) && values.categories.length > 0
    ? values.categories
    : (values.category ? [values.category] : []);
  if (selectedCategories.length === 0) {
    missingFields.push(t('category'));
    fieldErrors.category = t('required');
  }

  if (requiresDocumentTitle) {
    if (!(Array.isArray(values.documentTypes) && values.documentTypes.length > 0)) {
      missingFields.push(t('documentTitles'));
      fieldErrors.documentTypes = t('documentTitleRequired');
    }

    // The name on the document is required for the same reason the title is:
    // with no photo published, these two fields are the whole listing.
    const ownerAr = values.documentOwnerName?.ar?.trim() || '';
    const ownerLatin = values.documentOwnerName?.latin?.trim() || '';
    if (!ownerAr || !ownerLatin) {
      missingFields.push(t('documentOwnerSectionTitle'));
      fieldErrors.documentOwnerName = t('documentOwnerNameRequired');
    } else if (!HAS_ARABIC.test(ownerAr)) {
      missingFields.push(t('documentOwnerSectionTitle'));
      fieldErrors.documentOwnerName = t('documentOwnerNameArabicScriptRequired');
    } else if (!HAS_LATIN.test(ownerLatin)) {
      missingFields.push(t('documentOwnerSectionTitle'));
      fieldErrors.documentOwnerName = t('documentOwnerNameLatinScriptRequired');
    }
  }

  return { missingFields, fieldErrors };
};

export const validateStep2 = (values, t) => {
  const missingFields = [];
  const fieldErrors = {};

  if (!values.country) {
    missingFields.push(t('country'));
    fieldErrors.country = t('required');
  }

  if (!values.city || values.city === 'other') {
    missingFields.push(t('city'));
    fieldErrors.city = t('required');
  }

  if (!values.exactLocation?.trim()) {
    missingFields.push(t('exactLocation'));
    fieldErrors.exactLocation = t('required');
  }

  return { missingFields, fieldErrors };
};

// Step 3 (Photo) has no required fields.
export const validateStep3 = () => ({ missingFields: [], fieldErrors: {} });

export const validateStep4 = (values, t) => {
  const missingFields = [];
  const fieldErrors = {};

  const contact = values.contact?.trim() || '';
  if (!contact || contact.length > 100) {
    missingFields.push(t('contact'));
    fieldErrors.contact = t('required');
  }

  return { missingFields, fieldErrors };
};

// All per-step validators, in step order - used by the final safety net on
// submit (S2) to re-check everything and jump to the earliest offending step.
export const STEP_VALIDATORS = [validateStep1, validateStep2, validateStep3, validateStep4];

// The same validators keyed by step, because the wizard's steps are no longer
// a fixed list: a DOCUMENTS listing has no Photo step at all, so a step's
// position is not its identity anymore (see documentCategory.js).
export const VALIDATOR_BY_STEP_KEY = {
  item: validateStep1,
  location: validateStep2,
  photo: validateStep3,
  rest: validateStep4,
};

// Scrolls to and focuses the first field with an error, matching the
// original handleSubmit scroll-and-focus behavior. Scrolls
// #dash-scroll-container (not window) when present - see the id comment in
// DashLayout.js for why that Box, not window/body/html, is the real scroll
// container on /dash/* routes.
export const scrollToFirstErrorField = (fieldErrors) => {
  setTimeout(() => {
    const key = PRIORITY_ORDER.find((k) => fieldErrors[k]);
    const testId = key && FIELD_TESTID[key];
    const fieldToScroll = testId ? document.querySelector(`[data-testid="${testId}"]`) : null;

    if (fieldToScroll) {
      const scrollContainer = document.getElementById('dash-scroll-container');
      const rect = fieldToScroll.getBoundingClientRect();

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetPosition = scrollContainer.scrollTop + (rect.top - containerRect.top) - 100;
        scrollContainer.scrollTo({ top: targetPosition, behavior: 'smooth' });
      } else {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = rect.top + scrollTop - 100;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }

      setTimeout(() => {
        fieldToScroll.focus();
      }, 500);
    }
  }, 100);
};
