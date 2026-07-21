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

## Established component patterns

Reuse these rather than inventing a new card/panel treatment — they're now the house style:

- **Post card DNA** (canonical in [PublicPostsPage.jsx](client/src/components/PublicPostsPage.jsx), reused in [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): `surfaceRaised` background, `radius.lg`, `elevation.e1` → `e2` on hover with a `translateY(-4px)` lift, 1px divider border, a `borderInlineStart: 6px solid <status.found|lost main>` accent bar. Status is shown as a solid-fill tag (`TaskAltOutlined`/`SearchOffOutlined` icon + label, `theme.palette.getContrastText()` for the text) positioned `insetInlineStart`, paired with a translucent `alpha(surfaceRaised, 0.85)` date badge `insetInlineEnd`. Also reused as a compact variant by `HeroPostCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx) (the hero's live-post snapshot row): same surface/radius/border/accent-bar, hover-lift eased down to `translateY(-3px)` for the smaller card, but the status tag and date move inline into the card body/meta row instead of sitting as absolute overlay badges on the thumbnail — use this condensed layout when the card is small (e.g. a 3-up row) and an overlay badge would crowd the image.
- **Paired dashboard panel** (`SectionPanel` + `SectionTitle` in [LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) / [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): blurred-gradient `surfaceRaised` container, `radius.lg` (16px) mobile / `radius.xl` (24px) desktop, 1px border, centered `ink`-colored title (`h5`, weight 700, `{xs:1.5rem, sm:1.75rem, md:2rem}`). Use this shell for any new dashboard section that should sit alongside the stats/trending row.
- **Generic surface card** (`SurfaceCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): plain `surfaceRaised` box, `radius.xl`, `elevation.e2`, 1px divider border — no title treatment, no status accent bar. For simple one-off content blocks (coverage-stats bar, safety/trust callout, error state) that don't need the paired dashboard panel's title or the post card's accent bar; reach for this instead of inventing bespoke box styling.
- **Header control pill** (`ControlButton` in [PublicPostsPage.jsx](client/src/components/PublicPostsPage.jsx), reused in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `surfaceRaised` background, `radius.md`, 1px divider border, `elevation.e1` → `e2` on hover (no lift) — used for the language selector, paired with a matching bordered/elevated `IconButton` for the light/dark mode toggle. Use this for any new top-bar/header control rather than a bespoke button.
- **Section eyebrow label** (`SectionEyebrow` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `variant="overline"`, weight 600, `letterSpacing: 1`, `text.secondary` color — a small caps-style label introducing a subsection inline (e.g. "Recent near you" above the hero post snapshot). Lighter-weight than `SectionTitle`'s h5 panel heading; use for inline subsection labels that don't warrant a full panel shell.
- **Found/Lost duality as one connected shape, not two separate cards** ([FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)): when a section shows both counts side by side, prefer a single component with a proportional fill (found:lost ratio) over two independent stat boxes — the shape should carry the relationship, not just two numbers.
- **RTL**: newer components (`PublicPostsPage.jsx`, `FoundLostStrip.jsx`, `TrendingItem.jsx`, `WelcomePage.jsx`) use CSS logical properties (`insetInlineStart/End`, `borderInlineStart/End`, `marginInlineStart/End`) which auto-flip with document direction — prefer this over manual `currentLanguage === 'ar' ? ... : ...` checks or `'[dir="rtl"] &'` selector overrides (still present in older dashboard components) when writing new UI.
- **Data integrity**: don't decorate real numbers with fabricated ones. We found and removed a hardcoded fake `increase` percentage (`+14%` etc., never actually rendered) on the stat boxes, and reframed `TrendingItem` — the query is `$limit: 1` sorted by `createdAt desc` (intentionally "latest post," not a popularity/engagement metric) — so the UI doesn't imply a metric that isn't backed by real data.

## Known tokenization debt (not yet fixed — out of scope so far)

- [RenderIcon.jsx](client/src/components/RenderIcon.jsx): the `Found`/`Lost`/`total`/`returned` icons carry their own hardcoded `sx={{ color: '#...' }}` (e.g. Lost's icon is grey, not red) that don't follow `theme.custom.status`. Newer components (`FoundLostStrip.jsx`, `TrendingItem.jsx`) sidestep this by importing MUI icons directly instead of going through `RenderIcon` for Found/Lost. Worth a real fix if a future phase touches icon rendering broadly.
- [LoadingStates.jsx](client/src/components/LoadingStates.jsx): the shared `EmptyState` component (used by `NoPosts`, `NoRecentFounds`, `NoTrending`, etc.) still styles off `theme.palette.mode`/`theme.palette[variant]` rather than `theme.custom`. Left alone so far since it's shared across many non-redesigned sections — retheming it is a good candidate for whichever phase does a broader empty-state pass.

## Design phases

- Phase 1 — design system / [theme.js](client/src/theme.js) + [designTokens.js](client/src/designTokens.js): done
- Phase 2 — [WelcomePage.jsx](client/src/components/WelcomePage.jsx): done
- Phase 3 — post card + [PublicPostsPage.jsx](client/src/components/PublicPostsPage.jsx): done
- Phase 4 — [NewPostForm.js](client/src/features/posts/NewPost/NewPostForm.js): in progress
- Phase 7 — dashboard header: stats ([LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) + new [FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)) and the trending/latest-post spotlight ([TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)), both in [Dash.js](client/src/features/dashboard/Dash.js): done. (Phases 5-6 aren't tracked in this file — fill in if they happened elsewhere.)

## Rules for this work

- Always use existing design tokens (`theme.custom.*` from designTokens.js); never hardcode colors or font-families in component styles.
- Always pull user-facing text from [translations.js](client/src/utils/translations.js) via `useTranslation()`; never hardcode English strings.
- Always verify both light/dark mode and LTR/RTL before considering a page done.
- For `NewPostForm.js` specifically: styling/layout changes only. Never touch Formik state, validation logic, city search `fetch()` calls, or submission logic without explicit confirmation from the user first.
- Don't invent a new card/panel visual language where an established pattern (above) already fits — extend or adapt it instead.


SaaS design
