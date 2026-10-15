## Design tokens

Source of truth: [client/src/designTokens.js](client/src/designTokens.js), resolved per light/dark mode, consumed by [client/src/theme.js](client/src/theme.js) (`themeSettings(mode, currentLanguage)`, exposed on MUI theme as `theme.custom`). New work reads from `theme.custom.*`, never hardcode. [mobile/src/theme/tokens.js](mobile/src/theme/tokens.js)'s `colorTokens`/`radiusTokens`/`fontFamilies` mirror these 1:1 for RN screens (separate `getElevation(isDark, level)` helper per screen file stands in for `elevationTokens`, since RN has no CSS boxShadow) — mobile also carries older, pre-existing `lightColors`/`darkColors`/`radii` palette most legacy screens read from instead; prefer `colorTokens` for new/touched work there too.

**Palette** (`colorTokens`, light / dark):
- `brandPrimary`: `#1B4DFF` / `#5B7FFF` — brand accent
- `brandLogo`: `#3498DB` / `#3498DB` — the blue the logo itself is drawn in
  (`public/maflogoSVG.svg`, `public/maficonSVG.svg`), and the same value as the
  pre-Phase-1 `palette.secondary.main` still in `theme.js` and mobile's legacy
  `primary`. Identical in both modes, unlike `brandPrimary`, which needs a
  lightened dark-mode twin. Used by the world activity map only — see that
  section for why that one surface takes it over `brandPrimary`.
- `ink`: `#0B1220` / `#EDEFF5` — primary text
- `surfaceBase`: `#F7F8FB` / `#0E1116` — page background
- `surfaceRaised`: `#FFFFFF` / `#171B22` — card/paper background
- `postsListBackdrop`: `#EDEFF6` / `#0E1116` — page-level backdrop (not a card color) for the posts list screens themselves, since plain `surfaceRaised` cards sat directly on flat `surfaceBase` w/ no panel/gradient between them and were only ~3% off it in light mode, nearly invisible. Cards on that page stay plain `surfaceRaised` (white); the page behind them gets this deeper tone instead so the cards read clearly. Dark mode value equals `surfaceBase`'s dark value verbatim (no-op) — `surfaceRaised` already separates from `surfaceBase` enough there. Used by the posts list page container only (web `PostsList.js`/`PostsListSkeleton.jsx` root Box, mobile `PostsListScreen.js`/`MyPostsScreen.js` `container`/`searchRow`) — other pages keep plain `surfaceBase`.
- `status.lost`: main `#D6483B` / `#FF6B5E`, bg `#FBEAE8` / `rgba(255,107,94,0.16)`, border=main — semantic color, "Lost" posts
- `status.found`: main `#1E8F6B` / `#3DDCA6`, bg `#E5F5EF` / `rgba(61,220,166,0.16)`, border=main — semantic color, "Found" posts
- `status.pending`: main `#9A5B00` / `#F5B546`, bg `#FBF0DC` / `rgba(245,181,70,0.16)`, border=main — "waiting on a human". Added for the admin console, the first surface with a third state to show: lost/found are the two halves of the product's vocabulary and neither means "needs attention", so the panel was reaching for MUI's default `warning` palette and leaving the token system behind. Same contrast rule as the two above (white on `main` clears 4.5:1 light; `main` on its own `bg` clears 4.8:1). Mirrored into mobile's `tokens.js` to keep that file the 1:1 mirror it claims to be, though no RN screen renders it yet.

Note: `theme.js` still carries large legacy `palette.floptions` / `palette.categories` block (pre-Phase-1, per-category colors) — leave as-is unless phase targets it; prefer `colorTokens.status` for new Lost/Found UI.

**Typefaces** (`fontFamilies`): `display` = Cairo, `body` = IBM Plex Sans Arabic (both w/ Segoe UI/Roboto/Helvetica/Arial fallbacks). Chosen: both solid Arabic + Latin glyph coverage, no per-language font swap needed — same faces work across en/fr/ar.

**Spacing**: 8px base unit (`theme.spacing(factor) = 8 * factor`px).

**Radius** (`radiusTokens`, 8px-based scale): `sm` 8, `md` 12, `lg` 16, `xl` 24.

**Elevation** (`elevationTokens`): `e1`/`e2`/`e3`, shadow values differ per light/dark mode.
