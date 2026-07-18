// Per-step validation for the NewPost wizard. Mirrors the validation that
// used to live inline in handleSubmit, split by step so "Next" can gate
// each step individually. Field priority order matches the original
// handleSubmit scroll-to-error chain.

const FIELD_TESTID = {
  foundLost: 'foundLost',
  category: 'category',
  country: 'country-select',
  city: 'city-select',
  exactLocation: 'exactLocation',
  contact: 'contact',
};

const PRIORITY_ORDER = ['foundLost', 'category', 'country', 'city', 'exactLocation', 'contact'];

export const validateStep1 = (values, t) => {
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

// Scrolls to and focuses the first field with an error, matching the
// original handleSubmit scroll-and-focus behavior.
export const scrollToFirstErrorField = (fieldErrors) => {
  setTimeout(() => {
    const key = PRIORITY_ORDER.find((k) => fieldErrors[k]);
    const testId = key && FIELD_TESTID[key];
    const fieldToScroll = testId ? document.querySelector(`[data-testid="${testId}"]`) : null;

    if (fieldToScroll) {
      const rect = fieldToScroll.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = rect.top + scrollTop - 100;

      window.scrollTo({ top: targetPosition, behavior: 'smooth' });

      setTimeout(() => {
        fieldToScroll.focus();
      }, 500);
    }
  }, 100);
};
