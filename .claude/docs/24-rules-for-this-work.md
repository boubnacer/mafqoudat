## Rules for this work

- Use existing design tokens (`theme.custom.*` from designTokens.js); never hardcode colors or font-families in component styles.
- Pull user-facing text from [translations.js](client/src/utils/translations.js) via `useTranslation()`; never hardcode English strings.
- Verify light/dark mode + LTR/RTL before considering page done.
- For `NewPostForm.js`: styling/layout changes only. Never touch Formik state, validation logic, city search `fetch()` calls, or submission logic without explicit user confirmation first.
- Don't invent new card/panel visual language where established pattern (above) fits — extend/adapt instead.


SaaS design

<!-- caveman-begin -->
