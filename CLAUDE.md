# Mafqoudat

Multi-country/multilingual (en/fr/ar, full RTL) lost-and-found classifieds platform. `client/` = CRA + MUI v5 + Emotion, `server/` = Express, `mobile/` = Expo/React Native. `mobile/` historically out of scope for design work, now brought in for specific passes (dashboard header port, category picker parity, border removal, card shadow removal) — check recent commits/CLAUDE.md before assuming mobile screen untouched.

## Design tokens

Source of truth: [client/src/designTokens.js](client/src/designTokens.js), resolved per light/dark mode, consumed by [client/src/theme.js](client/src/theme.js) (`themeSettings(mode, currentLanguage)`, exposed on MUI theme as `theme.custom`). New work reads from `theme.custom.*`, never hardcode. [mobile/src/theme/tokens.js](mobile/src/theme/tokens.js)'s `colorTokens`/`radiusTokens`/`fontFamilies` mirror these 1:1 for RN screens (separate `getElevation(isDark, level)` helper per screen file stands in for `elevationTokens`, since RN has no CSS boxShadow) — mobile also carries older, pre-existing `lightColors`/`darkColors`/`radii` palette most legacy screens read from instead; prefer `colorTokens` for new/touched work there too.

**Palette** (`colorTokens`, light / dark):
- `brandPrimary`: `#1B4DFF` / `#5B7FFF` — brand accent
- `ink`: `#0B1220` / `#EDEFF5` — primary text
- `surfaceBase`: `#F7F8FB` / `#0E1116` — page background
- `surfaceRaised`: `#FFFFFF` / `#171B22` — card/paper background
- `status.lost`: main `#D6483B` / `#FF6B5E`, bg `#FBEAE8` / `rgba(255,107,94,0.16)`, border=main — semantic color, "Lost" posts
- `status.found`: main `#1E8F6B` / `#3DDCA6`, bg `#E5F5EF` / `rgba(61,220,166,0.16)`, border=main — semantic color, "Found" posts

Note: `theme.js` still carries large legacy `palette.floptions` / `palette.categories` block (pre-Phase-1, per-category colors) — leave as-is unless phase targets it; prefer `colorTokens.status` for new Lost/Found UI.

**Typefaces** (`fontFamilies`): `display` = Cairo, `body` = IBM Plex Sans Arabic (both w/ Segoe UI/Roboto/Helvetica/Arial fallbacks). Chosen: both solid Arabic + Latin glyph coverage, no per-language font swap needed — same faces work across en/fr/ar.

**Spacing**: 8px base unit (`theme.spacing(factor) = 8 * factor`px).

**Radius** (`radiusTokens`, 8px-based scale): `sm` 8, `md` 12, `lg` 16, `xl` 24.

**Elevation** (`elevationTokens`): `e1`/`e2`/`e3`, shadow values differ per light/dark mode.

## Established component patterns

Reuse these, don't invent new card/panel treatment — now house style:

- **Post card DNA** (canonical in [Post.js](client/src/features/posts/PostsList/Post.js), reused in [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): `surfaceRaised` background, `radius.lg`, `elevation.e1` → `e2` on hover w/ `translateY(-4px)` lift, no border (elevation alone separates from page), `borderInlineStart: 6px solid <status.found|lost main>` accent bar. Status shown as solid-fill tag (`TaskAltOutlined`/`SearchOffOutlined` icon + label, `theme.palette.getContrastText()` for text) at `insetInlineStart`, paired w/ translucent `alpha(surfaceRaised, 0.85)` date badge at `insetInlineEnd`. Also reused as compact variant by `HeroPostCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx) (hero's live-post snapshot row): same surface/radius/accent-bar, hover-lift eased to `translateY(-3px)` for smaller card, but status tag + date move inline into card body/meta row instead of absolute overlay badges on thumbnail — use condensed layout when card small (e.g. 3-up row) and overlay badge would crowd image.
- **Paired dashboard panel** (`SectionPanel` + `SectionTitle` in [LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) / [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): blurred-gradient `surfaceRaised` container, `radius.lg` (16px) mobile / `radius.xl` (24px) desktop, no border, centered `ink`-colored title (`h5`, weight 700, `{xs:1.5rem, sm:1.75rem, md:2rem}`). Use shell for new dashboard section sitting alongside stats/trending row.
- **Generic surface card** (`SurfaceCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): plain `surfaceRaised` box, `radius.xl`, `elevation.e2`, no border — no title treatment, no status accent bar. For one-off content blocks (coverage-stats bar, safety/trust callout, error state) not needing panel title or card accent bar; use instead of bespoke box styling.
- **Header control pill** (`ControlButton`, now living in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `surfaceRaised` background, `radius.md`, no border, `elevation.e1` → `e2` on hover (no lift) — used for language selector, paired w/ matching elevated (borderless) `IconButton` for light/dark mode toggle. Use for any new top-bar/header control instead of bespoke button.
- **No borders on containers**: cards/panels/pills (web `theme.custom`-based components + mobile `colorTokens`-based screens alike) separated from page background by `elevation`/`getElevation()` shadow alone, never `1px solid` border — removed platform-wide in later pass (see Design phases). Does *not* apply to buttons, form inputs, toggle/select controls, dropdown/menu/dialog chrome, or post card's status accent bar — all keep borders.
- **Section eyebrow label** (`SectionEyebrow` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `variant="overline"`, weight 600, `letterSpacing: 1`, `text.secondary` color — small caps-style label introducing subsection inline (e.g. "Recent near you" above hero post snapshot). Lighter-weight than `SectionTitle`'s h5 panel heading; use for inline subsection labels not warranting full panel shell.
- **Found/Lost duality as one connected shape, not two separate cards** ([FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)): when section shows both counts side by side, prefer single component w/ proportional fill (found:lost ratio) over two independent stat boxes — shape should carry relationship, not just two numbers.
- **RTL**: newer components (`FoundLostStrip.jsx`, `TrendingItem.jsx`, `WelcomePage.jsx`) use CSS logical properties (`insetInlineStart/End`, `borderInlineStart/End`, `marginInlineStart/End`) which auto-flip w/ document direction — prefer over manual `currentLanguage === 'ar' ? ... : ...` checks or `'[dir="rtl"] &'` selector overrides (still present in older dashboard components) when writing new UI.
- **Data integrity**: don't decorate real numbers w/ fabricated ones. Found + removed hardcoded fake `increase` percentage (`+14%` etc., never actually rendered) on stat boxes, reframed `TrendingItem` — query is `$limit: 1` sorted by `createdAt desc` (intentionally "latest post," not popularity/engagement metric) — so UI doesn't imply metric not backed by real data.

## Known tokenization debt (not yet fixed — out of scope so far)

- [RenderIcon.jsx](client/src/components/RenderIcon.jsx): `Found`/`Lost`/`total`/`returned` icons carry own hardcoded `sx={{ color: '#...' }}` (e.g. Lost's icon grey, not red) not following `theme.custom.status`. Newer components (`FoundLostStrip.jsx`, `TrendingItem.jsx`) sidestep by importing MUI icons directly instead of going through `RenderIcon` for Found/Lost. Worth real fix if future phase touches icon rendering broadly.
- [LoadingStates.jsx](client/src/components/LoadingStates.jsx): shared `EmptyState` component (used by `NoPosts`, `NoRecentFounds`, `NoTrending`, etc.) still styles off `theme.palette.mode`/`theme.palette[variant]` rather than `theme.custom`. Left alone — shared across many non-redesigned sections; retheming good candidate for whichever phase does broader empty-state pass.

## Design phases

- Phase 1 — design system / [theme.js](client/src/theme.js) + [designTokens.js](client/src/designTokens.js): done
- Phase 2 — [WelcomePage.jsx](client/src/components/WelcomePage.jsx): done
- Phase 3 — post card + the public posts listing: done. (That listing, `PublicPostsPage.jsx`, was later deleted — it duplicated `/dash/posts`, and the `vercel.json` `/posts/:path*` API rewrite meant `/posts` could not reliably serve it. `/dash/posts` is the only listing; the card treatment lives on in `Post.js`.)
- Phase 4 — [NewPostForm.js](client/src/features/posts/NewPost/NewPostForm.js): in progress
- Phase 7 — dashboard header: stats ([LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) + new [FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)) and the trending/latest-post spotlight ([TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)), both in [Dash.js](client/src/features/dashboard/Dash.js): done. (Phases 5-6 aren't tracked in this file — fill in if they happened elsewhere.)
- Phase 8 — remove borders from containers platform-wide (elevation-only surfaces), across both `client/` (WelcomePage, the since-removed PublicPostsPage, dashboard panels/cards in `LeftSide.jsx`/`TrendingItem.jsx`/`RecentPosts.jsx`/`Categories.jsx`/`QuickActions.jsx`/`RecentSection.jsx`/`Process.jsx`/`HelpSupportSection.jsx`/`SearchPartyHero.jsx`/`Dash.js`/`TotalBox.jsx`) and `mobile/` (`HomeScreen.js`, `WelcomeScreen.js`, `PostDetailScreen.js`, `PostsListScreen.js`, `MyPostsScreen.js`, `ProfileScreen.js`, `AppHeader.js`, `LoginScreen.js`, `SignUpScreen.js`): done. This is the first design pass to touch `mobile/`.
- Phase 9 — `mobile/` parent card/panel containers lose their shadow entirely (border was already gone from Phase 8); their nested badge/icon/pill sub-elements (still borderless) pick up a small shadow (`getElevation(isDark, 1)`) instead, so depth reads from the sub-elements rather than the outer card. Touched `HomeScreen.js` (`panelContainer`/`foundLostStrip`/`bigStatCard`/`posterCard`/`recentEmpty`/`socialPanel` parents; `statSegmentIcon`/`bigStatCardIcon`/`posterStatusPill`/`posterReturnedPill`/`socialIconCircle` sub-elements), `PostsListScreen.js` + `MyPostsScreen.js` (`postCard`/`postCardSkeleton` parents; `statusTag`/`dateBadge`/`categoryPill`/`lifecycleBadge` sub-elements), `PostDetailScreen.js` (`body` parent; `statusTag`/`dateBadge`/`categoryChip` sub-elements), `ProfileScreen.js` (`infoCard`/`menuCard` parents; `infoRowIcon`/`menuRowIcon` sub-elements), `SettingsScreen.js` (`card`/`menuCard` parents, no sub-element badges), `WelcomeScreen.js` (`heroCard` parent; `heroStatusTag` sub-element — `createStyles` there now also takes `isDark`), `LoginScreen.js`/`SignUpScreen.js`/`EditProfileScreen.js` (`card` parent only — their inner elements are form inputs/buttons, exempt from this treatment same as the border rule). Buttons, form inputs, and dropdown/menu/dialog chrome (`filterButton`/`paginationBar`/`addPostButton`/`chip`/`countryDropdown`/toast/notice banners) were left with their existing elevation — same exemption list as Phase 8's border removal, not new "cards." Where a screen's `getElevation` helper ended up with no remaining callers (`LoginScreen.js`, `SignUpScreen.js`, `EditProfileScreen.js`, `SettingsScreen.js`), the now-dead helper was deleted rather than left unused: done.

## Rules for this work

- Use existing design tokens (`theme.custom.*` from designTokens.js); never hardcode colors or font-families in component styles.
- Pull user-facing text from [translations.js](client/src/utils/translations.js) via `useTranslation()`; never hardcode English strings.
- Verify light/dark mode + LTR/RTL before considering page done.
- For `NewPostForm.js`: styling/layout changes only. Never touch Formik state, validation logic, city search `fetch()` calls, or submission logic without explicit user confirmation first.
- Don't invent new card/panel visual language where established pattern (above) fits — extend/adapt instead.


SaaS design

<!-- caveman-begin -->
## Response style (caveman mode)

Applies to Claude's response *style* only, not scope of work. The existing
rules above (design tokens, translations, NewPostForm constraints, phase
scope, etc.) govern what Claude does and always win on conflict.

- Terse. Technical substance stays intact — only fluff drops.
- Drop articles (a/an/the), filler (just/really/basically/actually/simply),
  pleasantries (sure/certainly/happy to), hedging. Fragments OK. Short
  synonyms over long phrasing ("fix" not "implement a solution for").
- No tool-call narration, no decorative tables/emoji, no dumping raw error
  logs — quote only the shortest decisive line.
- Standard tech acronyms OK (DB/API/HTTP). Never invent new abbreviations
  (cfg/impl/req/res) — saves no tokens, adds friction. No causal arrows (→).
- Code blocks, technical terms, API names, CLI commands, commit-type
  keywords (feat/fix/...), and error strings: always exact, verbatim.
- Reply in the user's language; compress style, not language.
- Never name or announce the style ("caveman mode on", etc.) — just answer.
- Default shape: state the thing, then the action or fix, then why. Skip
  the shape when it doesn't fit.
- Drop compression for: security warnings, irreversible-action
  confirmations, multi-step sequences where compression risks misreading,
  or when the user asks to clarify — write normal prose there, then resume.
- Code, commit messages, and PR descriptions: always written normal, never
  compressed.
- To get a normal-prose reply for one message, ask: "explain this in full
  prose" or "normal mode for this reply."
<!-- caveman-end -->
