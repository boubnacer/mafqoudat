Convert the single-page post-creation form into a multi-step wizard.
This is a careful structural refactor with strict constraints. Work on the
current branch. Read ALL of these before writing any code:

- client/src/features/posts/NewPost/NewPostForm.js (~2500 lines — read fully)
- client/src/features/posts/NewPost/NewPost.js
- client/src/features/posts/NewPost/newpost.css
- client/src/components/Textfield.jsx, SelectOption.jsx, LoadingStates.jsx
- client/src/theme.js (light/dark + RTL handling)
- client/src/utils/translations.js (structure + the useTranslation hook usage)
- client/src/app/state/index.js (global slice — note it persists to
  localStorage; do NOT use it for wizard state)

======================== NON-NEGOTIABLE CONSTRAINTS ========================

C1. ONE Formik instance wraps the entire wizard. Steps are views over shared
    state, never separate forms. Navigating between steps must never reset
    or remount Formik. All existing values keys stay as-is.
C2. The submitted payload must remain BYTE-IDENTICAL to today: same
    postData JSON shape (including the legacy `category` alongside
    `categories`, contactPreferences: { whatsapp: true }, the api_<code> /
    cityData handling), same FormData keys ("postData", "image"), same
    useAddNewPostMutation call. Nothing about the request changes.
C3. All four city-selection paths must keep working exactly as they do now:
    (a) preloaded list per country, (b) hybrid search with its two-level
    fallback, (c) API result without _id → api_<code> + selectedCityFromSearch,
    (d) "Add New City" dialog → POST /cities/dynamic. The city search still
    uses raw fetch() — do NOT migrate it to RTK Query in this task.
    The formikRef pattern used by code outside the Formik render-prop (the
    memoized search callback, useEffects, and the Add-New-City dialog which
    is a SIBLING of <Formik> in the JSX) must keep working — verify each
    of these still reads live values after your restructuring.
C4. PromotionDialog on success, navigation to /dash, and the post-submit
    cities refetch (using lastSubmittedValues.country) are unchanged.
C5. Wizard progress lives in component state only. No localStorage, no
    sessionStorage, no Redux. If the user leaves the page, progress is lost
    — that's accepted.
C6. Full en/fr/ar support for every new string (step titles, buttons,
    review labels, photo-step copy), added to translations.js following its
    existing key-naming conventions. Full RTL correctness: in Arabic the
    stepper, back/next buttons, and any directional icons must mirror
    (derive direction from the existing theme mechanism — check how
    theme.js / the app root sets direction, don't hardcode).
C7. Preserve all existing data-testid attributes on fields (the
    scroll-to-error logic depends on them), and keep per-field error props
    (fieldErrors map) working.

======================== TARGET STRUCTURE ========================

Split NewPostForm.js into a folder of focused files (keep the same folder):

  NewPost/
    NewPostForm.js        → becomes the wizard shell: Formik wrapper,
                            stepper UI, step routing, back/next logic,
                            submit handler, dialogs that are Formik siblings
    steps/StepItem.jsx    → step 1 "What happened": foundLost, categories,
                            description
    steps/StepLocation.jsx→ step 2 "Where & when": country, city (the whole
                            custom dropdown + search + Add New City trigger),
                            exactLocation, exactDate
    steps/StepPhoto.jsx   → step 3 "Photo" (optional step)
    steps/StepReview.jsx  → step 4 "Contact & review": contact field +
                            read-only summary of steps 1–3 with per-section
                            Edit buttons that jump back to that step
    wizardValidation.js   → per-step validators (see below)

Move code, don't rewrite it: lift the existing JSX/handlers for each field
into its step component with minimal changes. Shared state (city search
state, image state, dialog state) stays in the shell and is passed down as
props — do not introduce context or new state libraries.

======================== STEP BEHAVIOR ========================

S1. Stepper UI: MUI Stepper (horizontal, labeled) on desktop; on small
    screens (theme breakpoint sm) use a compact variant (MobileStepper or a
    slim progress header showing "Step 2 of 4 — Where & when"). Steps are
    NOT freely clickable ahead — a user can click back to any completed
    step, but forward only via the Next button (so validation gates hold).
S2. Per-step validation on Next: split the existing manual handleSubmit
    validation into per-step validators in wizardValidation.js —
    step 1: foundLost required, ≥1 category;
    step 2: country required, city required (rejecting 'other'),
            exactLocation required after trim;
    step 3: none (photo optional);
    step 4: contact required 1–100 chars.
    Reuse the existing translated error messages and the existing
    fieldErrors + scroll-and-focus mechanism, scoped to the current step.
    handleSubmit on the final step re-runs ALL validators as a safety net
    (in case a field was somehow cleared) and jumps to the earliest
    offending step if anything fails.
S3. Step 3 (Photo) absorbs the planned image-dialog change: REMOVE the
    modal-with-6-second-countdown entirely. Instead, render the privacy
    warning (keep both FOUND and LOST copy variants, all three languages,
    picking the variant from values.foundLost) as a styled inline notice
    ABOVE the upload button — always visible, never blocking. Keep
    client-side compression, the preview, the compression-stats chip, and
    the ability to remove/replace the image. Delete the dialog component,
    its countdown timer state, and its open/close state.
S4. Country change behavior (clearing city + refetching city list) must
    still fire when the country is changed — including when the user goes
    BACK to step 2 and changes country after having picked a city.
S5. Review step: read-only summary rendered from Formik values + the
    derived display labels (country/city/category names in the CURRENT
    language, not raw ids; the selected foundLost label; the image
    thumbnail if present). Each section has an Edit button jumping to its
    step. The final submit button lives ONLY on this step and shows the
    mutation's loading state.
S6. If the submit fails (network/500/rate limit), surface the error message
    on the review step (existing status.validationError / error display
    conventions) — the user must not lose their data or their place.

======================== OPTIONAL — ASK ME FIRST ========================

The exactDate field is currently a free-text TextField. IF AND ONLY IF I
confirm in this session, install @mui/x-date-pickers (date-fns adapter —
date-fns ^4.1.0 is already a dependency; verify version compatibility with
the adapter first and report before installing) and replace it with a
DatePicker inside StepLocation: optional, submits YYYY-MM-DD ISO string,
localized/RTL-correct for ar. If I don't confirm, leave the TextField
exactly as-is. Do not install anything silently.

======================== PROCESS ========================

Work in this order, showing me a diff summary after each phase and WAITING
for my go-ahead before the next phase:
  Phase 1: create the shell + move step 1 fields (other fields temporarily
           still render in a single "everything else" step so the form
           stays functional)
  Phase 2: move step 2 (location — the risky one; verify all four city
           paths and the formikRef consumers after this phase)
  Phase 3: move step 3 (photo) + delete the countdown dialog
  Phase 4: build step 4 (review) + relocate submit + final-step validation
  Phase 5: delete dead code left in the shell, ESLint pass over all new
           files, final diff review

There is no test suite. After Phase 5, produce a manual browser test
checklist covering: each step's validation blocking Next; back-navigation
preserving values; changing country after selecting a city; all four city
paths; photo add/replace/remove and posting with no photo; the full flow in
en, fr, and ar (checking RTL mirroring of the stepper); submit success →
PromotionDialog → /dash; submit failure keeping the user on review with
values intact; and one text-only + one with-image post verified against the
backend (check the created Post document has correct contactPreferences,
city, categories + legacy category).