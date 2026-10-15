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

- Phase 20 — [Process.jsx](client/src/components/dashboard/Process.jsx)'s **desktop**
  layout (lg and up) rebuilt as a strict reproduction of a supplied vector infographic:
  done. Each step is a fully-rounded colored pill with a large light disc overlapping its
  inner end, a triangular notch pointing out of that end at a ring marker, and an oversized
  `STEP` / `01` block beside it; rows alternate sides and a single dotted S-curve threads
  every ring, ending in a solid dot above the first row and below the last. Decisions worth
  keeping:
  - **The geometry is one measured set, not per-element taste.** Every number in the
    `STAGE` constant is a measurement taken off the reference (2044px wide) divided by one
    scale factor, k = 0.55 — pill 2.56:1, disc 0.80 x pill height, row pitch 1.55 x pill
    height, numeral cap height 0.54 x pill height. They cannot be tuned individually: the
    notch has to meet the ring, and the ring has to sit on the trail. The two trail
    control-point ratios (`S_EASE` 0.74, `CAP_EASE` 0.55) were fitted to the reference's own
    dot positions rather than eyeballed — 0.74 of the vertical gap is what flattens the
    middle of each S until it runs almost horizontally between two rows.
  - **Only the type scale departs from the reference**, because the reference is a poster set
    in placeholder Latin and this carries real en/fr/ar copy: a proportional title would be
    31px and wrap French headings to three lines inside a fixed-height pill. Title 23 / body
    15 keep the reference's own title:body ratio (1.5) while fitting the longest string in
    all three languages; `STEP` (48) and the numeral (104) are left at the reference's
    proportions, since those are what the composition rests on.
  - **Three steps, not the reference's four.** The step count is content, and `buildTrail`
    plus the stage height are both derived from `processSteps.length`, so a fourth step
    extends the curve instead of leaving it ending in mid-air.
  - **The ramp is two tokens, and each stop answers to two surfaces.** `brandLogo` darkened,
    `brandPrimary`, `brandPrimary` darkened again — descending in luminance the way the
    reference's teal-to-navy does, each pinned dark enough that `getContrastText`'s white
    clears 4.5:1 on the pill. In dark mode `brandPrimary` is darkened *first*, because its
    dark-mode token value is lightened for use as an accent ON a dark surface, not as a field
    UNDER white text. The same tone then has to read on the panel too — the ring, the numeral
    and the disc icon all sit on `surfaceRaised`, where the deepest stop falls under 3:1 in
    dark mode — so `onPanel()` lifts it there and is the identity in light mode.
  - **The disc's shadow is the one value that cannot be logical.** It falls inward, onto the
    pill it overlaps, which is what separates the two; `box-shadow` has no inline-aware form,
    so the offset is mirrored by hand against `theme.direction`. It is tinted from the pill's
    own color rather than a fixed slate, so it stays a shadow on that surface in dark mode
    instead of a white smear. Everything else on the stage is `insetInlineStart` /
    `borderInline*` and mirrors by itself; the trail SVG is flipped wholesale, since it
    carries no text.
  - **`index.css`'s RTL globals had to be answered here too**, exactly as in Phase 17:
    `body[dir="rtl"] * { text-align: inherit }` outranks a single Emotion class, so the
    centred pill title and the mirrored row's end-aligned numeral column would silently take
    the document's right alignment in Arabic. `alignText()` restates alignment at `&&&`,
    scoped to this section.
  - **The two Lost/Found clarifier lines sit under the stage, not in step 3's pill.** The
    reference has no counterpart for them and the pill is a fixed shape; widening or
    heightening one pill to fit them would break the row rhythm the whole layout depends on.
  - **The panel lost its border and its brand wash.** Borderless is Phase 8; the wash went
    because the reference stands its composition on a clean ground, and a brand tint behind
    pills that are themselves the brand ramp only muddies them.
  - **The narrow layout carries the same vocabulary, re-proportioned.** Below the width the
    stage can be scaled into, the section stacks: the dotted trail runs straight down the
    inline-start edge with a cap dot at each end, every pill sits on the same side of it with
    its notch pointing back at its ring, and the disc still overlaps the pill's inline-start
    end. Two things change, and both are forced. The `STEP` label and numeral move *inside*
    the pill (a 104px numeral has nowhere to stand beside a 250px pill), and the corner radius
    is **capped** rather than left at half the height — the pill grows with its copy here, and
    a true stadium on a 250x300 box is an ellipse whose caps eat the text column from both
    ends. The trail is a repeating background rather than a path through the rings, because
    row heights depend on how the copy wraps and a path would have to be measured for nothing
    a straight line does not already say.
  - **In between, the stage is scaled, not re-flowed.** It is one fixed composition whose
    parts have to stay in register, so `useHostWidth` measures the container and the whole
    820px stage takes a `transform: scale()`, down to `STAGE_MIN_SCALE` (0.76, where body copy
    would drop under ~11.5px). The measuring host wraps *both* layouts — parked inside the
    stage only, it would stop reporting the moment a narrow container sent the section to the
    stacked layout, and the stage could never come back. A media query is the pre-measurement
    guess so the first paint does not pick the wrong layout, and the container's own width
    overrules it once measured: a sidebar or a narrower page shell leaves less room than the
    viewport implies. This also fixes what shipped first — the stage was gated at `lg`
    (1200px), so a phone in desktop-site mode (~980px) never saw it.

- Phase 21 — [Process.jsx](client/src/components/dashboard/Process.jsx) desktop sizing:
  done. A wide `/dash` panel gave `useHostWidth` more than the stage's own 820px, so
  `scale` clamped to 1 and the section rendered its full 820x916 artwork — oversized next
  to the three-sentence copy inside it and next to the rest of the page. An earlier attempt
  at this replaced the zig-zag with a horizontal-rail layout for wide containers; that was
  reverted on request in favor of keeping Phase 20's design exactly and just sizing it down.
  The fix is a `maxWidth: 640` (md+) on the host `Box` `useHostWidth` measures — capping the
  *measured* width, not adding a second scale knob, so every existing ratio in `STAGE` still
  holds and the composition is identical, just smaller. `xs`/`sm` are already narrower than
  640 in practice, so mobile is unaffected.

- Phase 23 — the admin console at `/dash/admin`: done. Its own section below
  (**Admin console (web)**) rather than a phase note, because it is a
  nine-route section with its own primitives and its own server half, not a
  redesign of one screen. It is also the pass that added `status.pending` to
  the design tokens.

- Phase 22 — [Process.jsx](client/src/components/dashboard/Process.jsx) **desktop only**:
  the wide view is a second composition, reproducing a supplied horizontal reference,
  while the narrow view stays Phase 20/21's zig-zag stage exactly as it was. Three pills
  side by side on one horizontal wave: steps 1 and 3 hang above the trail with their notch
  pointing down at a ring below them, step 2 sits below it with its notch pointing up, and
  each `STEP` / numeral block is centred on the far side of its own ring. Every pill keeps
  its disc at the inline-end, so the three read as one repeated shape rather than mirrored
  pairs. Decisions worth keeping:
  - **`HSTAGE` is the same kind of measured set as `STAGE`**, taken off the new reference
    (pills 530x185, disc 162, gap 80 in its own pixels) and carried across as ratios: pill
    2.85:1, disc 0.875 x pill height at 0.818 x pill width, text column half the pill,
    gap 0.151 x pill width, ring lines 1.54 x pill height apart. **The two ring gaps are
    deliberately not equal** — 0.514 x pill height below a pill, 0.378 above — which is what
    staggers the middle pill only a third of a pill height below its neighbours; averaging
    them into one number reads as a half-height step and stops matching the reference.
  - **The trail is the vertical stage's curve transposed**, same `S_EASE`/`CAP_EASE`, with
    one deliberate exception: the two end tails (`CAP_DX`/`CAP_DY`) leave their ring
    horizontally and rise only slightly, instead of climbing to the mid-line between the ring
    lines the way a straight transpose would. A tail that climbs ends up *behind* an outer
    pill, so the wave appears to stop at the ring; the reference's tails terminate in the
    open below the outer pills, and so do these.
  - **The body type is the one departure from the reference**, exactly as in Phase 20 and
    for the same reason: proportionally it would be 11px, and the longest French description
    would then spill out of a fixed-height pill. Held at 13 (title keeps its ratio at 17),
    which fits en/fr/ar in all three pills.
  - **Which composition renders is a measured decision, not a breakpoint.** The host `Box`
    wraps *both* and measures the container; the wide stage is used whenever it can be scaled
    at `HSTAGE_MIN_SCALE` (0.84) or better, and below that the section falls back to the
    zig-zag stage — with the `maxWidth: 640` md+ cap Phase 21 gave it, so the narrow and
    mobile views are unchanged down to the pixel. `WIDE_VIEWPORT_GUESS` is only the
    pre-measurement guess for the first paint and the prerendered shell.
  - **Both stages are step-count driven.** `hStageWidth(rows)` and `buildTrailWide(rows)`
    take the count the way `stageHeight`/`buildTrail` already did, so a fourth step lengthens
    the wave rather than running off the end of it.
  - **The notch grows out of the gradient stop it touches.** `notchBlock` points along the
    block axis (so it needs no mirroring, unlike the zig-zag's `notch`) and takes the pill's
    darkened bottom going down, its lightened top going up.
  - **Two header changes came with it.** The heading gets a wider `maxWidth` under the wide
    stage (the reference sets it on one line, which 560 cannot hold), and the `whatWeDo`
    overline is now `display: block` like the `followUs` one beside it — it only *looked*
    like its own line in en/fr, where the heading under it wraps; in Arabic, where the
    heading is short, the two shared a line. That is the one narrow-view pixel that moved:
    LTR is byte-identical to Phase 21 at every width below the wide stage's floor.

- Phase 24 — mobile `PostsListScreen.js`'s filter brought to parity with web's
  mobile/tablet posts-list filter panel (Phase 17's `PostsList.js`): done. The
  screen's filter trigger moved out of `AppHeader`'s top bar (a plain pill
  inline among the bell/theme/menu buttons) to a floating launcher pill docked
  to the inline-start edge, flush there and rounded only on the protruding
  side — the same "tab sliding in from off-screen" shape as web's fixed
  pop-up launcher, minus `position: fixed` (RN has no scroll-fixed overlay
  the way the page does, and this screen has no separate fixed navbar to
  clear), so it sits in-flow at the top of the list instead.
  [PostFilterDialog.js](mobile/src/components/PostFilterDialog.js) replaces
  `PostFilterSheet.js`'s sliding bottom sheet with a centered "SaaS panel"
  card (`surfaceRaised` + brand-tinted border + elevation, gradient header
  icon and Apply button via `expo-linear-gradient` — RN has no CSS
  radial-gradient glow, so the border+shadow alone carry the brand accent
  web's Dialog glow gives), and adopts the same staged-draft logic as web's
  Dialog: opening it seeds a local draft from whatever is currently applied,
  every field edits that draft, and nothing reaches the posts query until
  Apply is pressed — Reset only clears the draft, and Cancel/backdrop/close
  discard it untouched. The old sheet applied every pick immediately (no
  Apply step) and additionally carried a Country field with its own search;
  Country is dropped from the panel entirely, matching web (country isn't
  part of the posts-list filter there — it's `AppHeader`'s own picker, which
  this screen already wires through `countryId`/`onSelectCountry`). Category
  and City keep their existing accordion-with-checklist / accordion-with-
  search shape (already the functional equivalent of web's `CategoryPickerField`
  tappable-checklist and `Autocomplete`), staged the same way. The active-filter
  chip strip above the list (unchanged in structure) picked up a border to
  match web's tinted-chip look. `applyFilters` was added to
  [translations.js](mobile/src/utils/translations.js) in all three languages;
  `postType`'s existing "Type" wording already matched web's `filterType`
  caption, so no new key was needed there.

  A first pass at this phase also ported the *card* to what Phase 17/18's own
  notes above describe (a centred stack with a gradient city headline and a
  circular open action) and left a search bar on the screen - both wrong: the
  actual `Post.js`/`PostsList.js` on `main` had moved on from that design
  without this file's phase notes catching up, and `PostsList.js` has never
  rendered a search box at all (`?search=` is only ever seeded from a URL
  param, for Google's sitelinks searchbox). Corrected in the same phase:
  `PostsListScreen.js`'s card is now the photo-top block the real `Post.js`
  renders - status pill and category pill(s) overlaid at the photo's top
  corners, a resolved badge and a "posted X ago" scrim pill at its bottom
  corners, the no-image state's centred `CategoryIconLabel`(s) on a
  per-category tint - then a plain city row (location pin + bold text, no
  gradient), then a 3-column stats bar (site views / reactions / comments,
  read via the existing `summarizeSocialStats`/`readSiteViews` mirror in
  [socialStats.js](mobile/src/utils/socialStats.js), the same numbers
  `Post.js` computes rather than the more elaborate `PostReachRow`). The
  search bar (state, debounce, the visible `TextInput` row, its active-filter
  chip) was removed outright rather than left wired to nothing. `GradientHeading`
  is no longer used by this screen (still used elsewhere - Phase 18's note
  above about it stands for wherever it's still rendered).

- Phase 25 — mobile `HomeScreen.js`'s "Browse by category" section reverted from
  Phase 15's neumorphic bento grid to an exact port of web's `Categories.jsx`
  card, on explicit request for strict parity with the `/dash` mobile-responsive
  view: done. `CategoryBentoCard`/`CategoryBentoGrid` (a featured full-width tile
  plus small half-width cells with a bleeding ghost icon) are replaced by
  `CategoryGridCard`/`CategoryGrid` — every cell the same size, a plain tint of
  the category's own accent color (`${hex}1F`/`${hex}33`, i.e. web's
  `alpha(color, 0.12/0.2)`), a centered frosted circular icon badge and a
  centered label, in a uniform 2-up grid with no featured cell. Collapsed count
  stays 4 (`CATEGORY_COLLAPSED_SMALL_COUNT`, unchanged — already web's own
  count at its `xs`/`sm` breakpoint), and the "show all"/"show less" toggle is
  now web's outlined-pill shape (`radius.sm`, `ink` border at ~24% alpha, `ink`
  text/chevron) instead of the bento grid's borderless brand-colored text link.
  This is a deliberate reversal of Phase 15's own reasoning ("categories are the
  one place a per-category accent color is the point" for staying off the token
  system) — the accent-tint-as-background idea survives (it's what web's own
  card already does), but the featured/bento layout and neumorphic-adjacent
  bespoke shape are gone in favor of matching web exactly, cell for cell. Rest
  of Phase 15's grid mechanics (`sortCategoriesForBrowse` for priority order,
  `chunkPairs` for 2-up rows, an odd trailing row's spacer) carry over unchanged
  since web does the same thing structurally.

- Phase 26 — mobile `PostDetailScreen.js` gained the claim-item card web's
  `SinglePostPage.js` has always had (`ClaimItemDialog.jsx`'s inline sidebar
  card, not the dialog itself — mobile has no equivalent modal flow yet): done.
  The card (brand-tinted icon circle, title, subtitle, full-width CTA, a
  shield-icon safety note) renders in place for anyone but the post's owner on
  an unresolved listing (`showClaimCard = !isOwner && !isResolved`, mirroring
  web's `!isAuthor && !returned`), reading the same six title/subtitle/button
  strings and the two directional safety-note variants
  (`contactSafetyNote`/`contactSafetyNoteFinder`) added to web's own
  translations just before this phase — copied into `mobile/src/utils/
  translations.js` verbatim in all three languages rather than re-translated,
  so the two platforms read identically. Logic differs from web by necessity:
  web opens `ClaimItemDialog` as a modal with its own congrats copy and a
  "mark as returned" mutation; mobile has neither, so pressing the card's
  button (`handleClaimItemPress`) just gates the screen's existing "Contact
  seller" section behind it inline (`contactRevealed` state) instead of
  opening a new dialog — the section itself, its Call/WhatsApp/email buttons
  and `getContactAction` are all untouched, only newly wrapped in
  `showContactSection = isOwner || (contactRevealed && !isResolved)`. An
  unauthenticated tap follows the same `requireLogin` + `navigate('Login')`
  pattern this screen already uses for Report/Block, with a new
  `loginRequiredClaimItem` key rather than web's redirect-after-login
  localStorage flow. The card is a deliberate exception to Phase 8/9's
  borderless/shadowless rule — same carve-out web's own bordered sidebar CTA
  cards (this one and the Promotion panel beside it) already take, since it's
  a new component being ported for parity rather than one of the audited
  Phase 8/9 containers.
