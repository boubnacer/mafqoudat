# Mafqoudat

Multi-country/multilingual (en/fr/ar, full RTL) lost-and-found classifieds platform. `client/` is CRA + MUI v5 + Emotion, `server/` is Express. `mobile/` exists but is OUT OF SCOPE for the current design work — only `client/` is being touched.

## Design tokens

Source of truth: [client/src/designTokens.js](client/src/designTokens.js), resolved per light/dark mode and consumed by [client/src/theme.js](client/src/theme.js) (`themeSettings(mode, currentLanguage)`, exposed on the MUI theme as `theme.custom`). New work should read from `theme.custom.*`, never hardcode.

**Palette** (`colorTokens`, light / dark):
- `brandPrimary`: `#1B4DFF` / `#5B7FFF` — brand accent
- `ink`: `#0B1220` / `#EDEFF5` — primary text
- `surfaceBase`: `#F7F8FB` / `#0E1116` — page background
- `surfaceRaised`: `#FFFFFF` / `#171B22` — card/paper background
- `status.lost`: main `#D6483B` / `#FF6B5E`, bg `#FBEAE8` / `rgba(255,107,94,0.16)`, border matches main — semantic color for "Lost" posts
- `status.found`: main `#1E8F6B` / `#3DDCA6`, bg `#E5F5EF` / `rgba(61,220,166,0.16)`, border matches main — semantic color for "Found" posts

Note: `theme.js` also still carries a large legacy `palette.floptions` / `palette.categories` block (pre-Phase-1, per-category colors) — leave as-is unless a phase specifically targets it; prefer `colorTokens.status` for new Lost/Found UI.

**Typefaces** (`fontFamilies`): `display` = Cairo, `body` = IBM Plex Sans Arabic (both with Segoe UI/Roboto/Helvetica/Arial fallbacks). Chosen because both have solid Arabic + Latin glyph coverage, so no per-language font swap is needed — same faces work across en/fr/ar.

**Spacing**: 8px base unit (`theme.spacing(factor) = 8 * factor`px).

**Radius** (`radiusTokens`, 8px-based scale): `sm` 8, `md` 12, `lg` 16, `xl` 24.

**Elevation** (`elevationTokens`): `e1`/`e2`/`e3`, separate shadow values per light/dark mode.

## Design phases

- Phase 1 — design system / [theme.js](client/src/theme.js) + [designTokens.js](client/src/designTokens.js): done
- Phase 2 — [WelcomePage.jsx](client/src/components/WelcomePage.jsx): done
- Phase 3 — post card + [PublicPostsPage.jsx](client/src/components/PublicPostsPage.jsx): done
- Phase 4 — [NewPostForm.js](client/src/features/posts/NewPost/NewPostForm.js): in progress

## Rules for this work

- Always use existing design tokens (`theme.custom.*` from designTokens.js); never hardcode colors or font-families in component styles.
- Always pull user-facing text from [translations.js](client/src/utils/translations.js) via `useTranslation()`; never hardcode English strings.
- Always verify both light/dark mode and LTR/RTL before considering a page done.
- For `NewPostForm.js` specifically: styling/layout changes only. Never touch Formik state, validation logic, city search `fetch()` calls, or submission logic without explicit confirmation from the user first.
