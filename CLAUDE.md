# Mafqoudat

Multi-country/multilingual (en/fr/ar, full RTL) lost-and-found classifieds platform. `client/` = CRA + MUI v5 + Emotion, `server/` = Express, `mobile/` = Expo/React Native. `mobile/` historically out of scope for design work, now brought in for specific passes (dashboard header port, category picker parity, border removal, card shadow removal) — check recent commits/CLAUDE.md before assuming mobile screen untouched.

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
- Phase 10 — mobile `HomeScreen.js` statistics section brought to parity with web's `LeftSide.jsx` mobile/xs layout: done. Phase 9 had left the stats panel an opaque `surfaceRaised` card containing an equally opaque `surfaceRaised` Found/Lost strip and stat cards, so the inner boxes vanished into their own parent. Now the panel itself is a bare wrapper (`statsPanelGlass`: transparent, no padding — mirrors web's 14%-opacity wash, which reads as nothing on a flat background), the Found/Lost strip and the two stat cards keep their own fill and are the only shapes that read, and Total items takes web's `brandPrimary` tint (8% light / 14% dark) against Returned's plain `surfaceRaised`. The stats-section icon squares (`statSegmentIcon`/`bigStatCardIcon`) drop the Phase 9 sub-element shadow and go flat-tinted like web's, since the parents carry separation again — the Phase 9 treatment still stands everywhere else. Lost segment icon switched to `search-outline` (web's `SearchOffOutlined`, and what the same screen's recent-posts section already uses) instead of `help-circle-outline`.

- Phase 11 — mobile `HomeScreen.js` world activity map brought to parity with web's `Dash.js` mobile header: done. Map loses its `Panel` wrapper (no `worldActivityCountries` title, no card, no radius, no loading tint) and becomes a chrome-less full-bleed backdrop — absolutely positioned, bottom-anchored in the header stack, pulled out past `scrollContent`'s 16px padding (`SCREEN_PADDING`) to the screen edges, with a square `mapSpacer` below the stats reserving its room (web's spacer row). Stats now float over it, same as web. Web's oversized/CSS-percentage-cropped map layer isn't reproduced (react-native-svg percentage sizing renders corrupted on a `flex: 1` parent); the placement comes from layout instead.

- Phase 12 — neumorphic ("soft UI") treatment for mobile `HomeScreen.js`'s **Browse by category** and **Follow us** sections only: done. Both now paint their elements in the page's own `surfaceBase` tone and read purely from a top-left highlight + bottom-right shade, so the category circles lose their `config.backgroundColor` tint and the social panel/buttons lose their `surfaceRaised` fill and brand tint (category/brand color survives in the icon — a tinted fill would break the one rule the effect rests on). Palette lives in [mobile/src/theme/neumorphism.js](mobile/src/theme/neumorphism.js) (derived from `colorTokens[mode].surfaceBase`, deliberately outside `tokens.js` since that file mirrors web 1:1 and this has no web counterpart), rendered by [mobile/src/components/NeumorphicSurface.js](mobile/src/components/NeumorphicSurface.js): three layers (shade view / highlight view / two-stop gradient face), because RN takes one shadow per view and Android renders only `elevation` — the gradient is what carries the bevel there, and the highlight layer omits `elevation` so it no-ops instead of stacking a second dark drop. Sizing/padding go on the component's `contentStyle`, not `style`. Press state sinks the face (reversed gradient, both shadows dropped) instead of fading it, so these two sections use `Pressable` with a render-prop child rather than `TouchableOpacity`. Light source is fixed at the physical top-left in LTR and RTL alike. Rest of the Home screen (stats, map, recent posts, safety footer) is untouched and still Phase 9-11.

- Phase 13 — neumorphic treatment extended to the mobile first-launch onboarding slides ([mobile/src/screens/onboarding/OnboardingScreen.js](mobile/src/screens/onboarding/OnboardingScreen.js)): done. Same `NeumorphicSurface` + `theme/neumorphism.js` machinery as Phase 12, now on every interactive field of the slides — language chips, light/dark options, filter pills, the country picker button and its list. All lose their `surfaceRaised` fill, borders and brand tints and become faces in the screen's own `surfaceBase` tone; brand blue survives in icons and text only. Selected state is the sunken face (`pressed`), which is also the press affordance, so those controls are `Pressable` with a render-prop child. Three structural consequences: the light/dark segmented control **dropped its track** and became two standalone pebbles beside each other (a raised face nested inside another face gets its shadow clipped by `NeumorphicSurface`'s `overflow: 'hidden'` highlight layer — fine where the parent's padding exceeds the shadow, as in Home's social panel, not at a segmented control's 4px), the country dropdown became a sunken well instead of a floating card, and the selected country row lost its tint in favour of a brand-colored label + checkmark. The footer CTA deliberately stays a filled brand-blue button — a soft UI still needs one shape that outranks the rest, and a face in the page tone cannot be it; only its *disabled* state drops to a sunken face (`ctaFace` is shared by both so the footer never changes height), while the submitting state keeps the filled button and its spinner. Illustrations, headlines, dots and Skip untouched.

- Phase 14 — mobile `PostDetailScreen.js` reorganized: done. The screen had grown one loose row at a time (three full-width fact rows, a stray views row after the description, a metrics paragraph, then two full-width filled moderation buttons) and read as a list of unrelated lines rather than a page. What changed: (1) **one heading treatment** — icon + `fontFamilies.display` 16 for every block (description, contact, reach, matches, comments), replacing the screen's uppercase micro `sectionLabel`; `PostMatchesSection`'s 18 came down to 16 so the whole page uses one heading size. (2) **Info grid** — the date, country and site-views facts are `InfoTile`s (tinted `${ink}0A` tile, `brandPrimary` icon square, micro label + value) in a two-up wrapping grid instead of three rows and a trailing meta row; the tile label is the short `date`/`country`/`viewsLabel` string, with the long "date when the item was lost/found" phrasing kept on the tile's `accessibilityLabel`. (3) **Contact** — Call and WhatsApp are `flex: 1`, so the pair fills the row as one control strip instead of two left-hugging buttons. (4) **Moderation** — Report and Block share one quiet half-width row below a divider (Report on `status.lost.bg` with lost-tone label, Block on a neutral `${ink}0A` wash) instead of two full-width filled buttons that dominated a page whose job is returning property; Report still outranks Block. (5) **Reach** ([SocialReach.js](mobile/src/components/SocialReach.js)) — each platform is a tinted card with its counts as `surfaceRaised` chips, and the permalink is an icon-only brand-tinted square (the platform is named on the same row; the "View on Facebook/Instagram" wording moved to `accessibilityLabel`). Like Phase 10, the sub-elements go flat once a filled parent carries the separation, so the file's `getElevation` helper lost its last caller and was deleted. (6) **Comment composer** ([CommentsSection.js](mobile/src/components/CommentsSection.js)) — the field and its action are a stacked block inside a tinted panel: full-width multiline input on its own row, then a footer with the character counter and a labelled "Post comment" button, replacing the icon-only square that had squeezed the field too narrow for its own placeholder.

- Phase 15 — mobile `HomeScreen.js`'s "Browse by category" section replaced neumorphic circle chips with a bento grid: done, deliberately breaking from Phase 12's neumorphic system for this one section (that system stays as-is everywhere else on Home — categories are the one place a per-category accent color is the point). First category (server priority order, same as web's `Categories.jsx` which just takes `categories.slice(0, 4)` unsorted) renders full-width and tall as `CategoryBentoCard`'s `featured` variant, with a large low-opacity ghost icon bleeding off the trailing corner; the rest render as small cells, 2 per row via `chunkPairs` (plain flexbox row-pairs, not RN percentage/wrap math, to sidestep `gap` + `flexWrap` sizing being unreliable across Yoga versions). Card fill is a translucent tint of the category's own `CATEGORY_CONFIG.color` (`${hex}NN` alpha suffix, same convention as the rest of the file, 0x1F light / 0x33 dark since there's no dark-mode `backgroundColor` variant in `config/categories.js` to read instead) — the same "solid accent, translucent tint of that accent as background" pairing `theme.custom.status` uses for found/lost, just keyed off category color. Icon badge is a frosted white/black circle (not another tint) so it reads against every category color without a per-category badge color to pick. Collapses to featured + `CATEGORY_COLLAPSED_SMALL_COUNT` (4) small cells with a "show all" / "show less" toggle text+chevron button below the grid, mirroring web's `Categories.jsx` `showAllCategories` state (`showAllCategories`/`showLess` translation keys added to mobile to match) — chosen over a horizontal scroll (the section's old layout) or a separate "browse all categories" screen (none exists) because the bento shape is a fixed, non-scrolling arrangement by design, and expand-in-place has direct precedent on web. No border/shadow on the cells (Phase 8/9 rule still applies) — separation comes from each cell's own color tint against the page background.

- Phase 16 — motion pass on the dashboard home page (`/dash`): done. See **Motion (GSAP)** below.

- Phase 17 — the web posts-list card (`/dash/posts`, grid view only): done. Mobile got the
  same design in Phase 18. The card is one centred stack — status badge + open action, the
  **city** as a display-type gradient headline, the photo inset inside the card (not bleeding
  to its edges), then the exact location, the category chip and the date facts —
  in [Post.js](client/src/features/posts/PostsList/Post.js). Decisions worth keeping:
  - **One fixed density.** The card shipped with a control that cycled it through three
    widths (spanning more grid columns, framer-motion `layout` animating the reflow), ported
    from the reference component this design came from. That control was removed on request,
    and the machinery went with it rather than being left unreachable: no `AutoLayoutCard.jsx`,
    no `LayoutGroup` in `PostsList.js`, no framer-motion on this page at all, and the hover
    lift is a plain CSS `transform` again. If steps ever come back, they come back whole.
  - **The city is the headline, the category is a chip.** City is the field every listing has
    and the one a searcher scans; it is the only gradient in the app, and that gradient is
    built from `brandPrimary` + `lighten()` rather than a picked pair of hex values, so it
    follows the token into dark mode.
  - **The copy line is the exact location, not the description.** The city is already the
    headline, so the line under the photo is the one that narrows it down to a street or a
    landmark — a listing's free text is the least reliable part of it (same reasoning the
    matching engine's signal weights carry), and on a card there is only room for one line.
    The description does not appear on the card.
  - **Clicking the card opens the listing**, and the blue circular arrow is the affordance
    that says so; it mirrors with the document direction.
  - **No Tailwind, no shadcn, no TypeScript.** `client/` is CRA + MUI v5 + Emotion in JS, so
    the port is MUI + `theme.custom` throughout. Adding Tailwind would put a second styling
    system beside the design tokens every other surface reads from.
  - **Two local departures, both documented in the file.** `index.css`'s global
    `body[dir="rtl"] * { text-align: inherit }` and `body[dir="rtl"] .MuiTypography-root
    { direction: rtl }` outrank a single Emotion class, so a centred card in Arabic silently
    rendered right-aligned; `centeredText()` in `Post.js` restates alignment at `&&&`
    specificity, scoped to this card (fixing the globals is a pass of its own). And the
    category chip reads its wash from `alpha(catStyle.main, …)` instead of
    `config/categories.js`'s `backgroundColor`, which is light-mode-only and rendered as a
    white pill on a dark card.

- Phase 18 — the same card design on mobile's browse listing
  ([PostsListScreen.js](mobile/src/screens/PostsListScreen.js)): done. Same stack as web —
  status pill + circular open action on one header row, the city as a gradient headline, the
  photo inset with `radius.lg` inside a `radius.xl` card, then the exact location, the
  category pill and the date facts, all centred. Phases 8/9 still hold: the card is
  borderless and shadowless and the pills/action circle inside it carry the depth. The
  screen's skeleton was reshaped to match, so the load-in doesn't jump.
  - **`MyPostsScreen.js` is deliberately not part of this**, exactly as on web, where
    `MyPostsPage.jsx` kept its own pre-redesign card. That screen is an owner's management
    view — lifecycle badge, edit/return/promote/delete actions — not a browse listing, and
    forcing a centred one-column card on it would cost it the row it needs.
  - **The gradient headline is masked text, not SVG text**
    ([GradientHeading.js](mobile/src/components/GradientHeading.js)): a `LinearGradient`
    clipped to real RN text by `@react-native-masked-view/masked-view` (new dependency,
    bundled in Expo Go). Drawing it as `react-native-svg` text would have avoided the
    dependency but given up platform text shaping — Arabic joining, `numberOfLines`,
    the expo-font Cairo family. The native module is `require`d in a `try`/`catch` and the
    heading falls back to solid `brandPrimary` when it is missing: a heading in the brand
    color is a smaller loss than a screen that will not render. The two gradient stops are
    derived from `brandPrimary` by a local `lighten()` mirroring MUI's, so mobile and web
    read the same in both modes rather than carrying two hand-picked palettes.
  - **The category pill washes the category's own color** for the same reason as web:
    `config/categories.js`'s `backgroundColor` is light-mode-only and rendered as a
    near-white pill on a dark card.

- Phase 19 — [Process.jsx](client/src/components/dashboard/Process.jsx) ("What we do" on
  the web dashboard homepage, `/dash` only — not mobile) redesigned: done. The three steps
  were an icon-above-text column threaded by one continuous connector line; they're now
  three elevated, centered `surfaceRaised` cards (Post card DNA's `elevation.e1 -> e2`
  hover-lift, `radius.lg`), each headed by a solid-`brandPrimary` icon disc (contrast-text
  icon, bypassing `RenderIcon` the same way `FoundLostStrip`/`TrendingItem` do — see
  `RenderIcon`'s tokenization debt). A first pass added a `01`/`02`/`03` step number on each
  card and a small arrow between them to spell out the sequence; both were cut on review as
  filler rather than information — reading order alone (which auto-mirrors in RTL, since
  flexbox's row axis already follows inline-start/end) already says "first, second, third"
  without a number or a chevron restating it, and cutting them read as more professional, not
  less finished. The section title takes Phase 17's brand gradient text (`brandPrimary ->
  lighten(brandPrimary, 0.45)`) instead of flat `ink`, and the notify step's Lost/Found
  clarifier lines moved from a bare colored dot into their status token's `bg`/`main`
  pairing, the same tint-plus-solid-text treatment `theme.custom.status` uses everywhere
  else. The reveal itself moved off framer-motion onto local GSAP — see **Motion (GSAP)**'s
  "One system per element" entry.

## Motion (GSAP)

Web animation is GSAP (`gsap` + `@gsap/react`). Plugins are registered once in
[gsapSetup.js](client/src/utils/gsapSetup.js) — import `gsap`/`ScrollTrigger`/`useGSAP`
from there rather than calling `registerPlugin` per component; `gsap.defaults()` there
carries the house feel (0.7s, `power3.out`). Reference material for writing GSAP lives in
`.claude/skills/gsap-*` (GreenSock's official agent skills, vendored).

- **The dashboard home page is marked up, not wired up.**
  [useDashboardMotion.js](client/src/features/dashboard/useDashboardMotion.js) owns the
  whole choreography and finds its targets through data attributes:
  `data-reveal="map|hero|section|divider"`, plus `data-reveal-item` on children that should
  stagger in behind their own section. `Dash.js` keeps reading as layout, and
  `LeftSide`/`RecentSection`/`RecentPosts`/`QuickActions`/`Categories`/`HelpSupportSection`
  only carry attributes — none of them imports GSAP. A section that stops being animated
  loses an attribute, not a hook.
- **Only `y`, `scale` and opacity are ever animated.** GSAP has no logical-property
  equivalent of `insetInlineStart`, so RTL-safety here comes from the choice of properties
  rather than a mirrored variant. Nothing moves along `x`.
- **Reduced motion is a `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`
  wrapper around every setup block**, not an early return: those visitors get the page in
  its final state with no tween created at all, and changing the OS setting mid-session
  reverts whatever was made.
- **`/dash/*` does not scroll the window.** DashLayout's `#dash-scroll-container` is the
  real scroller (it has an explicit height and a non-visible overflow), so every
  ScrollTrigger here passes `scroller`. Against the default scroller `window.scrollY` never
  moves, which leaves every below-the-fold section stuck at `autoAlpha: 0` forever —
  the first version of this shipped exactly that bug. `resolveScroller()` prefers the id,
  falls back to the nearest scrollable ancestor, then the viewport.
- **Reveal hooks are keyed on the loading flag, never on mount.** `Dash.js` returns
  `<DashboardSkeleton />` while its query is in flight, so a `useGSAP` with the default
  empty dependency array runs against a page whose animated elements do not exist yet and
  never runs again — the same trap the WelcomePage hero animation fell into.
- **Failure mode is guarded.** Because the scroll reveal hides elements before revealing
  them, a setup that throws would leave real content invisible; the hook catches, logs, and
  `clearProps`-es everything it touched. Losing the animation is acceptable, losing the
  dashboard is not.
- **Count-ups**: `FoundLostStrip` keeps its own rAF counter for Found/Lost;
  [TotalBox.jsx](client/src/components/TotalBox.jsx) takes an opt-in `countUp` prop (GSAP,
  writing `textContent` so a 1.2s tween doesn't re-render React ~60x/s, with React still
  owning the final value). Both are enabled from `LeftSide`, so all four stats count
  rather than two counting and two appearing.
- **One system per element.** `Process.jsx` moved off framer-motion onto its own local
  GSAP `useGSAP`/`ScrollTrigger` reveal (own step-card redesign, own sequencing — the three
  cards stagger in together in DOM order, then each icon disc pops with `back.out` on top of
  its card, then the social row) and its section stays deliberately unmarked so
  `useDashboardMotion`'s shared reveal never runs a second animation on the same nodes. It
  reuses `useDashboardMotion`'s exported `resolveScroller` rather than re-deriving the
  `#dash-scroll-container` lookup. `Categories.jsx` moved the same
  direction earlier, off framer-motion: its entrance was mount-based, and the section sits
  far below the fold, so it always finished playing before anyone scrolled to it. The cards
  "show all" adds after the reveal has run get a matching local entrance inside
  `Categories.jsx`.

## World activity map (web + mobile)

The dashboard header and the welcome hero render the same map — a chrome-less,
full-bleed backdrop zoomed to the visitor's country, countries tinted by
`worldActivity`, city dots from `cityActivity`. Web:
[WorldActivityMap.jsx](client/src/components/dashboard/WorldActivityMap.jsx)
(`react-simple-maps` + `d3-geo`), mobile:
[WorldActivityMap.js](mobile/src/components/dashboard/WorldActivityMap.js)
(`react-native-svg` + `d3-geo`, projecting by hand).

- **The geometry is generated, not a package file.**
  [buildMapData.js](client/scripts/buildMapData.js) (`npm run build-map-data`
  in `client/`) writes `client/src/data/worldMap.topo.json` and copies it to
  `mobile/src/data/`. It replaced a direct `world-atlas/countries-50m.json`
  import on both platforms. The output is committed; an install or a deploy
  never needs the network, and neither does the app at runtime.
- **Resolution is budgeted, because the map is always zoomed to one country.**
  A world file spends its whole size on countries nobody is looking at while
  leaving the one filling the canvas coarse — countries-50m gave the whole of
  Morocco 369 points. So: the 25 supported countries and their neighbours come
  from Natural Earth 10m, the rest of the world from 110m (off-canvas at every
  zoom this map uses), and each layer is simplified with its own tolerance —
  one global tolerance spends the budget on the backdrop. Net result is
  **700 KB (211 KB gzipped) against countries-50m's 756 KB (230 KB)** — for five
  layers rather than one, with the focus countries' outlines alone carrying
  ~2.8x its detail (11,884 points across the 25 against 4,211).
  `countries-10m.json` wholesale would have been 3.6 MB / 921 KB, and on mobile
  it is a static import parsed at startup.
- **Five layers.** `countries` (unchanged contract: `feature.id` is still the
  numeric Natural Earth id the components' `ISO2_TO_NUMERIC` maps to),
  `subdivisions` (the provinces / wilayas / governorates of the 25), `lakes`,
  `rivers` and `urbanAreas`. Both front ends draw the subdivisions as a **mesh
  filtered to internal borders** (`mesh(topo, subdivisions, (a, b) => a !== b)`),
  never as per-province shapes: the country underneath stays the interactive
  unit, and a mesh is one node with no fill to double up on the fills below it.
  Rivers are a mesh too, unfiltered — one node, each shared arc once. Lakes and
  urban areas stay whole `FeatureCollection`s, which `geoPath` renders into a
  single `d` apiece. So all four of these layers cost one node each, and the
  countries layer is the only per-feature one (it has to be — each country is
  filled by its own activity count).
- **Scalerank is a world-map question, and this is not a world map.** Natural
  Earth's rank says at what scale a lake or river belongs on a globe; here the
  map is always zoomed to one country, so a strict cutoff drops exactly the
  features a visitor expects. Lakes and rivers both cut at rank 6 — that keeps
  Lake Nasser (5), Lake Volta (5), Lake Habbaniyah (6), and the Nile, Tigris,
  Euphrates, Niger, Senegal and Jordan, while leaving out the seasonal wadi
  network that would read as cracks in the fill. Urban areas ignore scalerank
  altogether and filter on their own `area_sqkm` (≥ 100), which is what stops
  it under-selecting in these countries: 14 footprints in Morocco, 13 in Egypt,
  32 in Iraq.
- **City labels are placed, not offset.** They used to hang at a fixed offset
  under their dot, which put Casablanca under Mohammedia and Rabat under Salé —
  the map is always zoomed to one country, so neighbouring cities are the normal
  case. [cityLabelLayout.js](client/src/utils/cityLabelLayout.js), mirrored 1:1
  at [mobile/src/utils/cityLabelLayout.js](mobile/src/utils/cityLabelLayout.js),
  walks each label outwards from its dot — four sides, then diagonals, then
  rings at 13/26/42 — until it finds a box that hits no dot, no already-placed
  label and no badge, and hands back a leader line for any label that had to
  leave its dot's side. Cities are placed in descending activity order, so the
  quietest city is the one that loses its name. Three consequences worth
  keeping: **a label that fits nowhere is dropped, not stacked** (the dot still
  marks the city); **the ring ladder deliberately stops at 42**, because
  further out a name parks in another city's neighbourhood and reads as
  belonging to whatever dot it landed beside — a missing name is a gap, a name
  beside the wrong city is wrong; and **the "+N today" badges are placed first
  and unconditionally**, with labels routing around them, because a badge
  carries a number and a name does not. Leader lines get the same panel-colored
  halo the names and badges use — a hairline in `ink` vanishes against a
  saturated country fill exactly where it matters. Both platforms estimate text
  width from the glyph count (SVG has no render-time metrics; RN only reports a
  width after layout), erring generous: over-estimating reserves space that was
  not needed, under-estimating puts two names back on top of each other.
- **The map's accent is `brandLogo`, not `brandPrimary` (web + mobile).** Every
  other surface renders the brand as a control — a button, a chip, a 6px accent
  bar — where a deep, high-contrast blue is right. This one renders it as a large
  field of color: whole countries filled at up to 90% opacity, with city names
  and a badge on top of them. `brandPrimary` at that size reads as a block of
  ink rather than as the brand. One consequence: the "+N today" badge can no
  longer take `getContrastText`, which answers white — MUI's default
  `contrastThreshold` is 3 and white on the logo blue is 3.15:1, enough to win
  that check and not enough for an 11px number. It picks between the two surface
  tokens by measured ratio instead (ink at 5.9:1 light, the panel tone at 5.5:1
  dark). Deepening the color the way `status.lost`/`status.found` did is not
  available here: being the logo's exact blue is the point.
- **Edge fade, not a drop shadow (web only).** An earlier version of this pass
  gave the city dots and "+N today" badges a shared `feDropShadow` group each
  for depth; that was removed on request — city markers and badges are flat
  fills again (panel fill + brand stroke, brand fill respectively), map color
  alone carries the surface. What stayed: the four edges still dissolve into
  the container's `surfaceBase` via a two-axis linear-gradient overlay, since
  that layer is oversized and offset (165% wide / 271% tall) and needs a fade
  in the visible window rather than a CSS mask on the map layer itself (which
  would land mostly off-screen); it's two per-axis gradients rather than one
  radial because the desktop crop lands the country ~75% across, where a
  centred vignette would dim the subject. Not mirrored to mobile:
  `react-native-svg` has no filter support anyway. A still-earlier version of
  this pass also gave the focus country a blurred brand halo, masked out of
  its own shape; it read as an extra wash of the already-bold logo blue on top
  of the country's own fill and was dropped rather than tuned down.
- **Cities with a post today pulse a ring**, and only those — the same condition
  the "+N today" badge uses, so the motion carries data the map already shows
  instead of giving every dot a heartbeat it has not earned. Stroked in `ink`
  rather than `brandLogo` — the ring crosses whatever the activity fill happens
  to be at that point, from a pale wash to the deep end of the ramp, and `ink`
  is the one tone the map already relies on to stay legible over the whole
  range (near-black in light mode, near-white in dark) rather than one more
  blue that can disappear into a same-toned country. Local GSAP in the
  component rather than a `data-reveal` attribute for `useDashboardMotion` to
  find, because `WelcomePage` mounts this map too and never runs that hook.
  Reduced motion is the usual `gsap.matchMedia("(prefers-reduced-motion:
  no-preference)")` wrapper, and the ring's resting state is `opacity="0"` as a
  presentation attribute, so a visitor for whom no tween is ever created sees
  nothing rather than a ring frozen around a dot.
- **Urban areas are a wash, and never a data layer.** They are drawn under the
  borders in flat `alpha(ink, …)` and say "people live here"; the city dots,
  which are the only thing on this map carrying real numbers, must always
  outrank them.
- **Focus countries are built as the union of their own provinces**
  (`topojson-client`'s `merge`), and the simplification happens *before* the
  merge. That is what lets the mesh work: the country outline is literally made
  of the same arcs as the province boundaries, so the internal-border filter
  drops the coast exactly, with no fringe of one line beside another.
- **The map is decorative, so lakes are filled in the container's sea tone**
  (`surfaceBase`, what `Dash.js`/`WelcomePage.jsx` paint behind the map) rather
  than a blue of their own — inland water reads as water, not as a hole in the
  country.
- **The two "Unrecognized" provinces are kept.** Natural Earth flags
  Laâyoune-Boujdour-Sakia El Hamra and Oued el Dahab `FCLASS_ISO:
  "Unrecognized"`; they are the only such features in this set. They stay in,
  because Natural Earth's admin-0 layer (which world-atlas is a build of, and
  so what this map drew before) already includes them in Morocco and leaves the
  remaining Western Sahara as its own shape — still drawn, from the neighbours
  layer. Filtering them would redraw a disputed border, which is a decision to
  take deliberately, not a side effect of a resolution change. Every other
  supported country's outline matches the previous file to within 2% of area;
  Bahrain differs by 17% because Natural Earth's admin-1 archipelago is a
  different (and closer to correct) geometry than its admin-0 one.
- **Not tiles.** MapLibre/OSM/MapTiler would bring streets and labels, and with
  them a runtime network dependency, an API key or a usage policy, a mandatory
  attribution this design has no chrome for, per-theme restyling, and a native
  module that breaks Expo Go. This map is an activity backdrop, not something
  anyone navigates.
- **The four Natural Earth sources** (`ne_10m_admin_1_states_provinces`,
  `ne_10m_lakes`, `ne_10m_rivers_lake_centerlines`, `ne_10m_urban_areas`,
  ~81 MB together) are downloaded on first run into
  `client/.cache/naturalearth/`, which is gitignored. Public domain, no key,
  no attribution requirement.

## Auth sessions (web + mobile)

Short-lived JWT access token (default 30 min, `JWT_ACCESS_EXPIRES_IN` - do NOT
set this to `30d` anymore; that was the pre-refresh-token era) + long-lived
opaque refresh token (30 days, `REFRESH_TOKEN_EXPIRES_IN`), rotated on every
use. One issuance path for all six entry points (password login, register, the
three OAuth routes, `/auth/refresh`): `issueSession` in
[authSession.js](server/utils/authSession.js).

- **Storage/revocation**: [tokenStore.js](server/services/tokenStore.js) -
  Redis (shared client via `getRedisClient()` from `unifiedCache.js`, so logout
  survives restarts and works across instances) with an in-memory fallback when
  `REDIS_URL` is absent. Refresh tokens stored as SHA-256 hashes only; consumed
  via `GETDEL` so a replayed (stolen-and-rotated-away) token fails atomically.
  Logout denylists the access token's `jti` AND revokes the refresh session,
  and deliberately does **not** require a valid access token - an expired
  session must still be able to revoke its refresh token
  ([authcontroller.js](server/controllers/authcontroller.js) `logoutHandler`).
- **`/auth/refresh` reloads the user from the DB** before minting, so role
  demotion/deactivation takes effect within one access-token lifetime.
  Refresh-token transport is the platform split: web = httpOnly cookie scoped
  to `/auth` (`SameSite=None; Secure` in prod - Vercel→Render is cross-site;
  `Lax` in dev), mobile = JSON body stored in SecureStore. JSON auth responses
  carry `refreshToken` in the body for mobile; web ignores it.
- **Legacy bootstrap**: a pre-deploy 30-day token with no refresh session can
  call `/auth/refresh` with only its Bearer and get upgraded to a real session
  - gated on the token's own issued lifetime (`exp - iat` ≥ 4× the access
  lifetime), so a stolen short-lived token gains nothing. This plus the removal
  of verifyJWT's wall-clock "token too old" check (each token is judged on its
  own `exp`) is what makes the deploy not force anyone to re-login. Web calls
  it once at boot ([useSessionBootstrap.js](client/src/hooks/useSessionBootstrap.js)),
  mobile in `AuthContext.loadStoredAuth` when a token exists without a stored
  refresh token.
- **Silent refresh, both clients**: single-flight refresh + one retry on a 401
  session failure - web in [apiSlice.js](client/src/app/api/apiSlice.js)
  (plain-fetch twin: [refreshClient.js](client/src/utils/refreshClient.js)),
  mobile in [apiService.js](mobile/src/api/apiService.js)
  (`refreshSessionTokens`, `_retriedAfterRefresh` guard). Only when refresh
  fails too does the existing logout-with-sessionExpired path run. The 401
  `code` values in jwtSecurity.js remain a contract with both clients; refresh
  adds `NO_REFRESH_TOKEN`/`REFRESH_INVALID`. `/auth/refresh` has its own rate
  limiter (`refresh` in rateLimiting.js, counts failures only) - never put it
  behind the strict `auth` one.
- **Mobile OAuth browser flows** carry `refreshToken` through the deep link
  (`mobile-callback.js` → `mafqoudat://auth/callback?token=...&refreshToken=...`),
  because the auth-session browser's cookie jar is not the app's. Native
  mobile endpoints return it in the body. Facebook's callback returns
  `{ redirectUrl, webRefreshToken }` from `processFacebookCallback` so the
  in-flight-dedupe duplicate request also sets the web cookie on its own
  response.
- **`PATCH /users`** still mints only a fresh access token on username/country
  change - the refresh session continues untouched (refresh reloads the user
  anyway).

## Match notifications (web + mobile)

Lost↔found matching engine + in-app notifications. The engine and API are shared —
`client/` and `mobile/` are two front ends over the same `/notifications/*` routes,
so a scoring or wording change belongs on the server or in both translation files,
never in one platform's UI.

- **Engine**: [matchingService.js](server/services/matchingService.js). On post create/edit
  (fire-and-forget `scheduleMatchScan`, deferred via `setImmediate` — never blocks or fails
  a post write) it scans the *opposite* `foundLost` side of the same country, sharing ≥1
  category, within `MATCH_LOOKBACK_DAYS`. Scores each pair 0-100 on five weighted signals:
  category 30 / city 20 / location-text 10 / date 15 / keywords 25 (+8 bonus for a shared
  reference number). Category alone never qualifies — a pair needs at least one
  corroborating signal. **Shared category + same city is floored onto the strong-match
  boundary (75)** by `applyCoreMatchFloor`, whatever the other signals say: that pair is the
  product's core promise, and free text is the least reliable part of a listing. Consequence:
  `PostMatch.breakdown` can sum to less than `score` — it's a per-signal record, not the
  arithmetic behind the total. `GOOD_MATCH_SCORE`/`STRONG_MATCH_SCORE` are exported and the
  API's tier bands read them rather than restating the numbers.
  Pure helpers live in [textMatching.js](server/utils/textMatching.js)
  (en/fr/ar script-normalized tokenizer + Dice similarity) and
  [postDates.js](server/utils/postDates.js) (parses the free-text `mainDate` written by
  `DateEntryDialog`, month names in all three languages).
- **Tunables** (all env, all optional): `MATCH_MIN_SCORE` (store floor, 40),
  `MATCH_NOTIFY_MIN_SCORE` (notify floor, 50), `MATCH_EMAIL_MIN_SCORE` (70),
  `MATCH_LOOKBACK_DAYS` (180), `MATCH_CANDIDATE_LIMIT` (300), `MATCH_MAX_PER_RUN` (10).
  `MATCH_LOOKBACK_DAYS` and `MATCH_MAX_PER_RUN` are the two levers on alert volume — with
  the category+city floor in place, every same-category counterpart in the same city within
  the lookback window is a strong match, so a dense city/category combination produces a lot
  of them. The per-user confidence slider caps at 75 (client and API both) so a strong match
  can never be filtered out by a preference; turning match alerts off entirely still works.
- **Models**: [PostMatch.js](server/models/PostMatch.js) (the scored pair — canonical
  `postA`/`postB` ordering for its unique index, per-user `dismissedBy`) and
  [Notification.js](server/models/Notification.js) (one row per recipient, unique on
  user+type+post+matchedPost so re-scoring updates in place). `User.notificationPreferences`
  and `Post.lastMatchScanAt` were added for this.
- **API**: `/notifications/*` ([notificationRoutes.js](server/routes/notificationRoutes.js) /
  [notificationsController.js](server/controllers/notificationsController.js)), all behind
  `verifyJWT` and scoped to `req.user`. The inbox and the unread badge share one pipeline so
  the badge can never claim a count the list won't render; both drop notifications whose
  posts are no longer active/unreturned. Localization happens server-side from a `language`
  query param — reason/tier codes stay stable, wording lives in `translations.js`.
- **The inbox returns groups, not rows.** `GET /notifications` `$group`s by the *recipient's
  own post* and pages over groups: `{ id (own post id), post, matches[], matchCount,
  unreadCount, topScore, topTier, latestAt }`. One new listing in a dense city/category
  produces a notification per pair all at once, and flat that is a wall of near-identical
  rows. Grouping is a **read-time** concern only — the per-pair rows stay the unit of
  read/dismiss state (each counterpart is judged on its own), nothing was migrated, and
  older notifications group retroactively. `unreadCount` everywhere still counts individual
  alerts, so it matches the bell badge exactly; `total`/`totalPages` count groups. Matches
  inside a group are sorted by score in JS (not `$sortArray`, to stay off a server-version
  floor) and capped at 20, with `matchCount` reporting the true total.
- **Client**: [features/notifications/](client/src/features/notifications/) — navbar
  `NotificationBell` (60s unread poll, popover of `NotificationGroupPreview` rows),
  `/dash/notifications` page (tabs + inline `NotificationPreferences`) rendering
  `NotificationGroup` (header + up to 3 `NotificationItem` rows, expandable), and
  `PostMatchesPanel` on post detail for the owner
  (which is also the retroactive path: it triggers an on-demand, 6h-throttled scan, so posts
  predating the engine still get leads). Reuses the paired-panel and status-tag patterns
  above; no new card language.
- **Mobile**: [components/notifications/](mobile/src/components/notifications/) +
  [NotificationsScreen.js](mobile/src/screens/NotificationsScreen.js), over
  [notificationsApi.js](mobile/src/api/notificationsApi.js) (plain axios wrappers, no
  RTK Query on this side). Same three surfaces as web: a badged bell in
  [AppHeader.js](mobile/src/components/AppHeader.js) (plus a counted row in `HeaderMenu`),
  the inbox screen with tabs + inline preferences, and `PostMatchesSection` on
  `PostDetailScreen` for the owner. Unread count lives in
  [NotificationsContext.js](mobile/src/context/NotificationsContext.js) rather than in each
  header — AppHeader remounts on every navigation, so a per-component poll would restart
  its timer constantly; it polls only while signed in *and* foregrounded (`AppState`).
  `NotificationGroupCard` is the mobile twin of web's `NotificationGroup`, with
  `NotificationCard` as the per-counterpart row inside it.
  Follows Phase 9 for parent cards (borderless and shadowless) and routes every
  direction-dependent style through `utils/rtl.js`. The sub-elements are the one
  documented departure from Phase 9: `MatchThumbnail`'s square and `MatchMeta`'s
  confidence badge + reason chips carry a `StyleSheet.hairlineWidth` ink outline
  (`${ink}33` dark / `${ink}1F` light) instead of the sub-element shadow — several
  pills to a row made those shadows read as smudges on the post-detail section.
  Differences from web, both deliberate: the confidence floor is a row of discrete
  options instead of a slider (no slider dependency in this app, and a tap beats a drag
  on a phone), and `formatDaysApart` carries Arabic dual/small-plural forms the way
  `utils/relativeTime.js` does — the web copy was given the same forms so both platforms
  word it identically.
- **Device push (Android only, mobile)**: the third delivery channel, after the in-app
  inbox and the opt-in email, and the only one that reaches a user who is not looking at
  the app. Sent through Expo's push service (one HTTPS POST, no vendor SDK) by
  [pushNotificationService.js](server/services/pushNotificationService.js); tokens live on
  `User.pushTokens` (per device, each carrying the language its messages are written in,
  since a push is composed server-side with no request to read a language from) and are
  registered/revoked via `POST`/`DELETE /notifications/push-token`. Gated by
  `notificationPreferences.pushAlerts` *and* the master `matchAlerts` switch *and* the OS
  permission. **One push per recipient per scan run, never one per pair** — `matchingService`
  collects them (`pushQueue` → `dispatchQueuedPushes`) precisely because the category+city
  floor makes bursts normal; the inbox can group after the fact, a notification tray cannot.
  Only a genuinely new notification row queues one, so a rescan never re-buzzes a seen pair.
  App side: [pushNotifications.js](mobile/src/utils/pushNotifications.js) (permission, token,
  the `match-alerts` Android channel whose id is a contract with the server, tap targets),
  registration in `NotificationsContext`, tap routing in `App.js` (reuses the deferred
  deep-link machinery — a tap can land before either navigator is mounted), revocation on
  sign-out in `AuthContext`. iOS is switched off in exactly one place
  (`SUPPORTED_PLATFORMS`) pending an APNs key; nothing else is platform-specific. Setup,
  FCM credentials and the Expo Go caveat: [PUSH_NOTIFICATIONS.md](mobile/PUSH_NOTIFICATIONS.md).
- **Offline checks**: `npm run test-matching` in `server/` — no DB needed, covers
  normalization, date parsing and scoring. `npm run test-push` — no DB or network, stubs
  the Expo transport and covers what a recipient actually receives (direction wording,
  per-device language, burst collapsing, dead-token pruning).

## Reach: post views + social engagement (web + mobile)

How much attention a listing has had, from two independent sources. Both front
ends read the same fields off the posts API; the numbers are produced entirely
server-side.

- **Site views**: `Post.views`/`lastViewedAt` were on the schema and rendered on
  both platforms long before anything incremented them — every listing reported
  zero forever. [postViewTracker.js](server/middleware/postViewTracker.js) now
  counts them, mounted on `GET /posts/:id` **ahead of** `postsCache` — on a cache
  hit the controller never runs, so a counter incremented inside `getPost` would
  miss most views. One viewer counts once per `POST_VIEW_DEDUPE_MINUTES` (30),
  keyed on account id when a token is present and on IP otherwise, and an author
  viewing their own post is not counted. It reads the token through
  `readBearerUserInfo` (exported from
  [optionalAuth.js](server/middleware/optionalAuth.js)) *without* touching
  `req.user`: the detail cache key includes `req.user`, so populating the request
  there would hand every signed-in viewer their own copy of an identical
  response. Consequence: the stored count is always current, the *displayed* one
  can lag by the detail cache TTL (30 min).
- **Social engagement**: every post is auto-posted to the Facebook Page and the
  Instagram account on creation. Those publish responses used to be logged and
  discarded; `Post.social.{facebook.postId,instagram.mediaId}` + permalinks are
  now persisted by `createNewPost` (each on its own subpath, so the two
  concurrent fire-and-forget writes cannot clobber each other), which is what
  makes it possible to ask Graph anything afterwards. **Posts created before this
  have no ids and can never get stats** — there is no reliable way to map an old
  listing back to its Page copy.
- **Reader**: [socialStatsService.js](server/services/socialStatsService.js) fills
  `Post.socialStats` (fb: views/reactions/comments/shares/engagedUsers/clicks,
  ig: views/likes/comments/saved, plus `fetchedAt` and a per-platform
  `unavailable`). Never on a request's critical path — called fire-and-forget
  via `scheduleRefresh(posts)` and serves whatever is stored. Reads go through
  **Graph's Batch API** (`POST` with a `batch=[...]` form body, 50 objects
  max) — *not* `?ids=`, which **Meta deprecated in v26.0**: it answers every
  such call with `(#100) The ids query parameter is deprecated in v26.0+`, so
  the whole feature silently fetched nothing until this was changed. A
  regression check in `test-social-stats` pins that the parameter never comes
  back. Batch sub-requests each carry their own status code, so one deleted
  Page post costs exactly its own entry and no retry pass is needed; that post
  is marked `unavailable` and never asked about again. Counts and insight
  metrics are fetched as separate
  concerns on purpose: counts (reactions/comments/shares/likes) come off
  ordinary edges the page token already has, while **views, engaged users and
  clicks (FB) / views and saved (IG) all need `read_insights` (FB) /
  `instagram_manage_insights` (IG)** and are simply absent without them.
  Insight metric names are **probed, not assumed — independently per metric,
  not per platform** (Meta replaced `impressions` with `views` on IG in v22
  and retired the Page reach/impressions family in June 2026; `engagedUsers`/
  `clicks`/`saved` are unrelated concepts from views, not alternate names for
  it) — first candidate that answers wins and is memoized per metric for the
  process; a failed probe is remembered for 6h so a missing permission costs
  one probe per metric, not one per refresh, and a rename or missing
  permission on one metric never costs the others. `engagedUsers` (a rollup
  that already overlaps reactions/comments/shares) and `clicks`/`saved` (real
  but separate actions) are deliberately **not** folded into the card-level
  `interactions` total — each stays its own row on the detail-page breakdown
  instead of silently redefining a number that already shipped. Every knob is
  env: `SOCIAL_STATS_TTL_MINUTES` (180), `_BATCH_SIZE` (50), `_MAX_PER_RUN`
  (50), `_FB_VIEW_METRICS`, `_FB_ENGAGED_METRICS`, `_FB_CLICKS_METRICS`,
  `_IG_VIEW_METRICS`, `_IG_SAVED_METRICS`, plus shared `GRAPH_API_VERSION`.
  Graph plumbing common to all three Meta services (version, error predicates)
  lives in [graphApi.js](server/services/graphApi.js). **Freshness is
  two-tier** (`SocialStatsService.ttlFor`): a post younger than
  `SOCIAL_STATS_YOUNG_POST_HOURS` (24) uses `SOCIAL_STATS_YOUNG_TTL_MINUTES`
  (10) instead of the settled-post TTL above. Without this, the very first
  read — moments after creation, before anyone off-site could have reacted —
  stamps `fetchedAt` and blocks every re-check for the next three hours
  regardless of what happens on the Page in between, which is exactly the
  window an owner is most likely checking (post, go react to it yourself,
  come back to look). Requires `createdAt` selected on whatever's passed to
  `isStale`/`refreshStale` — `postStatsOverlay.js` and
  `scripts/refreshSocialStats.js` both select it purely for this, never
  expose it. Missing `createdAt` falls back to the long TTL, never "always
  young". No push/webhook alternative: Instagram doesn't expose a likes
  webhook at all (comments/mentions only), so even a webhook build wouldn't
  make IG likes instant, and it would still need its own public endpoint +
  signature verification + App Review — the two-tier TTL gets most of the
  practical benefit (minutes, not hours) without that project.
  **Deletion is not recoverable**: this is a poll-based reader, not a webhook
  subscriber, so engagement that happened between the last successful read
  and a Page-side deletion is gone the moment the object disappears — the
  post is marked `unavailable` with whatever numbers it last had, not
  whatever activity actually occurred.
- **These three fields never enter the response cache.** `views`,
  `social` and `socialStats` are the fastest-changing fields on a post, while
  `postsCache`/`optimizedPaginatedCache`/`searchResultsCache` (and
  `getUserPosts`' own inline cache) hold the rest of a post response for
  10-30 minutes on purpose — the wrong tradeoff for numbers that change on
  every page view. They first shipped projected straight into the same
  cached aggregate, which froze a fresh view, a just-stored Facebook/
  Instagram id, or a newly-fetched engagement count for up to the cache TTL —
  and because a cache hit skips the controller entirely, the refresh that was
  supposed to keep them current never even fired during that window.
  [postStatsOverlay.js](server/middleware/postStatsOverlay.js) fixes this: none
  of the four read controllers project these fields anymore, and the
  middleware wraps `res.json` **ahead of every cache layer** on all four
  routes, so it runs whether the rest of the response came from a cache hit or
  a fresh aggregate. It reads the three fields fresh (one `findById`/batched
  `find` by `_id`, cheap since it's an indexed point read with no `$lookup`s),
  merges them into the outgoing payload, and is now the *only* place that
  calls `scheduleRefresh` — a listing page's cache hit still triggers a stats
  refresh, which it could never do before. `npm run test-post-stats-overlay`
  covers it offline (both response shapes, a deleted post, an empty page, and
  a DB failure that must not break the response).
- **Refresh paths**: opportunistic on every listing/detail read regardless of
  cache state (see above — covers anything anyone is looking at), plus
  `npm run refresh-social-stats` in `server/` for a scheduler to catch
  listings nobody has opened. A third, optional path:
  [facebookWebhookRoutes.js](server/routes/facebookWebhookRoutes.js) receives
  Meta's Page `feed` webhook (reaction/comment/share on a specific post) and
  calls `scheduleRefreshByFacebookPostIds` — an accelerant on top of the poll,
  never a replacement (webhook delivery is best-effort per Meta's own docs;
  the poll is what guarantees eventual correctness). Signature-verified via
  [facebookWebhookSecurity.js](server/middleware/facebookWebhookSecurity.js)
  against `req.rawBody`, which `server.js`'s global `express.json({ verify })`
  stashes before parsing — HMAC has to run over the exact bytes Meta signed.
  Instagram has no likes webhook at all (comments/mentions only), so IG stays
  entirely poll-based regardless. Fully optional — nothing here does anything
  until `FACEBOOK_WEBHOOK_VERIFY_TOKEN` is set and the Page is subscribed via
  the Meta App Dashboard; setup walkthrough and troubleshooting:
  [facebook-webhooks.md](docs/facebook-webhooks.md). `npm run
  test-facebook-webhook` covers the signature check, the verification
  handshake, and payload parsing offline; the TTL-bypassing refresh path
  itself is covered in `test-social-stats`.
- **Two numbers, never one.** A page visit here, a Facebook reaction and an
  impression in someone's feed are different units — site views and social views
  are never summed, and platforms are never pooled into one total. Same rule as
  the dashboard stat boxes: don't state a measurement nobody took. Counters are
  `null` until actually fetched, so "not fetched", "no insights permission" and
  "genuinely zero" stay distinct; only the last renders.
- **UI**: shared normalizer in [socialStats.js](client/src/utils/socialStats.js)
  mirrored 1:1 at [mobile/src/utils/socialStats.js](mobile/src/utils/socialStats.js).
  Web — [ReachRow.jsx](client/src/components/ReachRow.jsx) on cards (`Post.js`
  grid *and* list layouts, plus `MyPostsPage.jsx`, which still carries its own
  pre-redesign card) and [SocialReach.jsx](client/src/features/posts/PostPage/SocialReach.jsx)
  on the detail page, using the existing eyebrow + icon-and-text vocabulary, no
  new card treatment. Mobile — `PostReachRow` and `SocialReachSection` in
  [SocialReach.js](mobile/src/components/SocialReach.js), used by
  `PostsListScreen`/`MyPostsScreen` cards and `PostDetailScreen`; Phase 9 rules
  apply and direction goes through `utils/rtl.js`. Facebook/Instagram brand
  colors are the one documented exception to the token rule — those rows point at
  Meta, so the palette is not ours to pick.
- **Offline check**: `npm run test-social-stats` in `server/` — no DB, no network,
  stubs Graph with a fake that answers in Meta's error envelope; covers batching,
  the deleted-post fallback, metric probing, permission-less degradation and
  outage handling.

## Comment threads (web + mobile)

One thread per post, merging two sources that are never allowed to look
equivalent: comments written on the site, and comments left on the
auto-posted Facebook/Instagram copies.

- **Model**: [Comment.js](server/models/Comment.js) — site comments only.
  Social comments are *not* stored here; they're cached on
  `Post.socialComments.{facebook,instagram}` by `socialStatsService` and
  merged at read time. Deletion is **soft** (`status: 'removed'`) so a report
  filed against a comment stays judgeable after the author deletes it.
- **Reading is public, writing needs an account.** `GET /posts/:id/comments`
  runs under `optionalAuth` — guests get the thread, a signed-in reader
  additionally gets per-comment `canDelete`/`canReport` flags and has blocked
  authors filtered out. `POST`/`DELETE`/report are all behind `verifyJWT`.
- **Who can delete**: the comment's author, the post's owner (it's their
  listing), or an admin. Reporting reuses the existing `Report` collection
  with a new optional `commentId`, so admins keep **one** moderation queue
  rather than two.
- **Social comments are read-only, for everyone.** No delete, no report-to-us,
  no reply — we have no authority over that platform. `canDelete`/`canReport`
  are hardcoded false and their ids are namespaced (`facebook:<id>`) so they
  can never collide with a site comment id.
- **One-way by deliberate decision — never post to Facebook on a user's
  behalf.** The only mechanism available is the Page token, which would
  publish the user's words as the *Mafqoudat Page itself*, not as them:
  misattribution, a moderation liability on your own Page, confusing for
  Facebook readers, and the kind of bulk automated posting Meta's spam systems
  flag. Don't add this without re-deciding it explicitly.
- **The merge is by time, across sources** (`mergeCommentSources`) — someone
  reading a lost-property thread wants it in the order it happened, not the
  site's half followed by Facebook's. A social comment with no usable
  timestamp sorts last, never first. Every entry keeps its `source`, and both
  UIs keep that badge visible: "a stranger on Facebook said this" and "a
  registered user here said this" are different claims to a reader judging a
  lead about their property.
- **Bounded, not paginated by page number.** The merged list is re-sorted on
  every request, so a later page isn't stable enough to append to (a new
  comment shifts everything down by one). Both clients "load more" by growing
  the first page instead. Site comments cap at `MAX_SITE_COMMENTS` (200),
  social at `SOCIAL_COMMENTS_LIMIT` (25/platform, env) — this is context
  beside the site's own thread, not a mirror of the Page.
- **Comment text rides along with the counts**, in the same batched Graph call
  that already fetched reactions/comments/shares — no extra request. A `null`
  comment list means the edge wasn't readable and keeps whatever was cached;
  `[]` is a real answer and overwrites.
- **Comment text is a separate, stronger permission** — `pages_read_user_content`
  (FB) / `instagram_manage_comments` (IG), distinct from the grant that reads
  the *count*. And Graph does not politely omit a field it won't serve: it
  **rejects the whole object**, so asking for comment text without the
  permission took reactions, shares and insights down with it and left
  listings blank. `readWithFallback` catches that refusal, drops the
  comment-text field and re-reads, then remembers the refusal for 6h (same
  memo shape as `resolvedMetrics`) so it costs one wasted request twice a day,
  not one per refresh — and picks comments up by itself if granted later.
  Covered in `test-social-stats`; the general rule is that an optional field
  must never be able to cost a required one.
- **UI**: [CommentsSection.jsx](client/src/features/posts/PostPage/CommentsSection.jsx)
  and [CommentsSection.js](mobile/src/components/CommentsSection.js). Meta
  brand colors on the source badges are the same documented exception as
  `SocialReach`. Mobile follows Phase 9 (parent borderless/shadowless, badges
  carry the sub-element shadow) and routes direction through `utils/rtl.js`.
- **Comment notifications**: the post's owner gets an in-app alert and,
  preference permitting, a push, when someone comments on a *site* comment
  (social comments read back from Facebook/Instagram never notify — the
  platform's own notifications already cover that, and this app has no
  authority over that side anyway). Never fires on your own comment.
  `Notification.type` gained `new_comment` alongside `match_found`
  ([Notification.js](server/models/Notification.js)); `matchedPost`/`match`/
  `score` are required only for `match_found`, a new `comment` ref only for
  `new_comment`, and the old single unique index was split into two
  `partialFilterExpression`-scoped ones (an unscoped compound unique index
  would treat every comment row's missing `matchedPost` as an equal `null`
  and reject the second comment on any post as a duplicate key) — `server.js`
  runs `Notification.syncIndexes()` on connect so an existing deployment picks
  up the corrected index rather than keeping the stale one.
  [commentNotificationService.js](server/services/commentNotificationService.js)
  writes the row and queues the push, called fire-and-forget from
  `commentsController.createComment` so a failed alert can never fail the
  comment write. Push copy/channel:
  [pushNotificationService.js](server/services/pushNotificationService.js)'s
  `sendCommentAlert` — same Android channel as match alerts (`match-alerts`),
  not a second one; the in-app `commentAlerts` preference is what gates the
  feature, independent of `matchAlerts`/`pushAlerts` which stay match-only.
  **The inbox merges two differently-shaped sources**: match alerts group by
  the reader's own post (see above); comment alerts are flat, one row per
  comment, fetched and paginated separately (bounded at
  `MAX_ITEMS_PER_SOURCE`, 300, per source) then merged and re-sorted by
  time in JS in `notificationsController.listNotifications` — not a DB-level
  `$unionWith`, to stay off the same server-version floor `$sortArray` is
  avoided for elsewhere in this doc. `getUnreadCount` sums both sources' exact
  unread counts, so the bell badge and the two list kinds never disagree.
  Client: web's `CommentNotificationItem.jsx` (a `kind: 'comment'` entry
  alongside `NotificationGroup`'s `kind: 'match'` in `NotificationsPage.jsx`
  and the bell popover) and mobile's `CommentNotificationCard.js` (same split
  in `NotificationsScreen.js`), styled from the existing row/badge vocabulary
  rather than inventing new card language — no found/lost tag or confidence
  score, since a comment isn't a counterpart listing to judge.
- **Offline check**: `npm run test-comments` — no DB, no network; covers the
  permission flags per viewer and the cross-source time merge.
  `npm run test-push` also covers `sendCommentAlert` (commenter-name wording,
  the anonymous fallback, truncation).

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
