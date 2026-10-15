## Admin console (web)

`/dash/admin` — nine routes behind `AdminRoute`, in
[client/src/features/admin/](client/src/features/admin/). Replaced a single
2577-line `AdminDashboard.jsx` holding eight `useState` tabs. The old panel's
own components (`UsersTable`, `PostsTable`, `PostsFilterBar`, `UsersSearchBar`,
`PostDetailsDialog`, `UserPostsDialog`, `VisitorStats`, and its
`ResetPasswordDialog`) are gone; everything is built from the primitives below.

**What was actually broken**, since these are the reasons for most of the shape:

- **Every admin cache invalidation was dead.** `adminApiSlice` tagged with
  `Reports`, `AdminUsers`, `Promotions`… and none of those were declared in
  `apiSlice.tagTypes`. RTK Query discards an undeclared tag, so approving a
  report, deleting a user or processing a promotion succeeded on the server and
  left the table showing the old row until a hard reload. The tags are now
  declared and all prefixed `Admin`.
- **The reports and promotions queues rendered `post.title`.** `Post` has never
  had a `title`; both columns showed "No title" on every row, always. A listing
  is named by its description — `postLabel` on the server, `postTitle()` on the
  client.
- **Comment reports were invisible.** `Report.commentId` has existed since
  comment threads shipped and those reports land in the same queue, but the
  table only knew about listings — so "inappropriate content" appeared attached
  to an ordinary lost-wallet post with the objectionable words nowhere on
  screen.
- **Fourteen queries fired on mount**, none of them skipped, while seven eighths
  of them were behind a hidden tab. Opening the panel now costs one request (the
  overview); every list is fetched by the page that shows it.
- **The maintenance-mode card and the visitor statistics rendered above and
  below *every* tab** — ~600px of the most disruptive switch on the site,
  permanently parked on screens about reports and cities.
- **Tab state was a `useState` index**, so nothing could be linked to, the back
  button did nothing, and a reload always landed on reports.
- `window.confirm` guarded deleting an account (which purges every listing,
  photo, match row and notification it owns) and `alert()` reported the result.
- The panel predated Phase 8 and Phase 1: `1px solid` borders on every card,
  `#1e1e1e`/`#ffffff` hardcoded into the dialogs, `rgba(211,47,47,.12)` in the
  database tab, and hardcoded English in every table header, the maintenance
  controls and the password-strength meter — an Arabic admin read an Arabic
  navbar above an English table.
- Seven-column tables with no narrow-screen fallback at all.

### Structure

`AdminLayout.jsx` is the shell — brand line, navigation, `<Outlet />` — and owns
the *one* query the panel makes on arrival, `GET /admin/overview`, because the
queue counts belong to the navigation. It hands the payload to every page
through the outlet context (`useAdminOverview`), so no page re-fetches it.

Navigation is nine destinations in five groups ([adminNav.js](client/src/features/admin/adminNav.js)),
grouped by what an admin is *doing* rather than by which collection the data
lives in: **Overview**; **Operations** (Moderation, Promotions, Support);
**Catalog** (Listings, Members, Places); **Insights** (Analytics); **System**.
Password-reset requests are folded into Support rather than standing alone —
both are a person asking a human for something, and neither queue is busy
enough to earn a destination. Two shapes, chosen by measured width: a sticky
rail from `lg` up, and the same items as a horizontally scrolling pill row
below it, with the active pill scrolled into view on arrival. A drawer was the
other option for narrow screens and was not taken — nine destinations an admin
switches between constantly should cost one tap, and a scroller shows the
counts without being opened.

**`/dash`'s navbar is `position: fixed` and DashLayout adds no spacer**, so the
shell clears it itself with `pt: 5.5rem` (what `Dash.js` uses) and the sticky
rail sits at `top: 88`. Without it the panel's first 88px sat behind the navbar.

### The primitives

[ui/](client/src/features/admin/ui/) — everything is `theme.custom`, borderless
per Phase 8, `elevation.e1` → `e2` on anything interactive:

- **`AdminCard`** is the panel's one container: `surfaceRaised`, `radius.lg`
  mobile / `radius.xl` from `sm`, no border, optional 6px accent bar (the post
  card's).
- **`DataTable`** is one list component in two shapes: a real table from `md`
  up, and the same columns re-laid as a stack of cards below it, taking the
  card's heading from the column marked `primary` and its subtitle from
  `secondary`. A column is described once and both shapes follow. Columns take
  `align: 'end'`, **not** `'right'` — MUI's `align` prop writes a physical
  `text-align`, which puts a numeric column on the wrong side of an Arabic
  table. Its pager is bespoke rather than `TablePagination` (which is unusable
  at 390px) and its chevrons mirror against `theme.direction`.
- **`adminTones.js`** is the whole colour vocabulary: five tones
  (`brand`/`positive`/`attention`/`critical`/`neutral`) and one `TONE_BY_STATE`
  map from every status word the panel renders — report, listing, promotion,
  support, priority, role — onto them. The old panel had two disagreeing
  `getStatusColor` functions.
- **`adminSx.js`** exists because of one trap worth knowing about anywhere in
  this app: **`theme.palette.primary.main` is `#FFFFFF` in light mode** (and
  `#3C3C3C` in dark) — a legacy palette from before the design tokens. An MUI
  `<Button>` with no explicit colour is therefore *white text on a white card*,
  a `variant="contained"` one is a white block, a focused `TextField` draws a
  white outline and a checked `Switch` a white thumb. Every control in the panel
  states its colour from `theme.custom` through these helpers. This was found by
  screenshotting the built app, not by reading the code — the action column on
  every table was silently blank.
- `ConfirmDialog` replaces `window.confirm`, and for the two irreversible
  actions (deleting an account, deleting a listing) takes a typed confirmation
  of the target's name. `AdminToast` replaces `alert()`, anchored bottom-centre
  so its position needs no mirroring. `AdminDialog` is full-screen below `sm`.
  `StatusPill`, `StatTile`, `SegmentedControl`, `FilterBar`, `EmptyState`,
  `FieldRow`, `PageHeader`, `Section`, `ResetPasswordDialog` round it out.

### Charts

[charts/](client/src/features/admin/charts/) — inline SVG measured with a
`ResizeObserver` and drawn at real pixel coordinates. No charting dependency:
a `viewBox` with `preserveAspectRatio="none"` stretches the axis labels along
with the marks, and the app already hand-draws SVG for the world activity map.

- **The palette is three tokens plus a de-emphasis grey**: `brandPrimary` for
  any single series, `status.lost.main` / `status.found.main` for the two halves
  of the product, `alpha(ink, …)` for context. Lost and found take the app's own
  status tokens rather than a palette picked for charts, which is a deliberate
  departure from the rule that status colours stay out of series work: here they
  are not a severity scale, they are the product's vocabulary, and every other
  surface — the post card's accent bar, the status tag, `FoundLostStrip`, the
  mobile listing pill — already codes them this way.
- **Validated with the colour validator, not by eye.** Light mode passes all six
  checks (adjacent CVD ΔE 8.3 deutan, normal-vision 25.8, contrast ≥ 3:1). Dark
  mode passes everything *except* the lightness band, which the two dark status
  tokens sit above by design — they are lightened precisely because they are used
  ON dark surfaces, which is the surface these charts are drawn on. The
  secondary encoding that relief calls for is present regardless: two series
  always carry a legend, stacked segments are separated by a 2px gap in the card
  colour rather than by hue, and every series is tooltip-labelled.
- **Never a second y axis.** Visitors and listings are different units on wildly
  different scales; they get two charts.
- **The day series is filled in with explicit zeroes** (`buildDaySkeleton` on the
  server). An aggregation only answers for days that have documents, and a chart
  drawn straight off that closes the gap — turning "nothing happened" into a
  straight line between the days either side of it.
- `compactNumber` keeps one decimal on a fractional axis tick (a middle tick is
  half the maximum, and half of an odd maximum is not a whole number — labelling
  a 2.5 gridline "3" prints a number the line is not at) and only compacts past
  a million. `StatTile` does the same: "92K" for 92,411 saves four characters and
  costs the reader the figure, in a panel whose job is to give the figure.

### Server

- **`GET /admin/overview`** replaced `GET /admin/dashboard`, which sent
  `recentReports`, `recentPromotions` and `recentResetRequests` that the client
  destructured two of and rendered none of. It now answers queues, totals,
  period-over-period growth, a 30-day series, the newest listings and members,
  and the top categories/cities/countries.
  [adminInsightsController.js](server/controllers/adminInsightsController.js)
  asks each collection **once**, with a `$facet` producing every number from one
  pass — the deployment target is the free-tier cluster the panel's own System
  page monitors, and `Post` carries no standalone index on `status` or
  `createdAt` (its indexes are all compound and country-led), so those counts
  scan regardless; one scan for fourteen numbers is the cheap version. Everything
  buckets in **UTC**, so the chart and the "today" figure above it agree wherever
  the admin is sitting. A period-over-period delta is `null` rather than `0` or
  `Infinity` when the previous period was empty — "up 100%" from nothing is
  arithmetic, not information — and the client renders null as "no comparison".
- **`GET /admin/analytics?days=7|30|90`** is new and replaces the old visitor
  panel, whose "this month" figure ran from the *first visit ever recorded* to
  the end of the selected month: a running total labelled as a month, which
  could only ever go up. It also finally renders what the `Visitor` collection
  has always stored and nothing ever read — country, city and landing page.
- **Three actions that did not exist**, because deleting was the only lever the
  panel had on anything: `PATCH /admin/posts/:id/status` (suspending is already
  in the schema's enum and already hidden from every public read — nothing
  surfaced it), `PATCH /admin/users/:userId` (deactivate/reactivate, and
  user↔moderator; it takes hold within one access-token lifetime because
  `/auth/refresh` reloads the user from the database before minting), and
  `GET`/`PATCH /admin/comments` for comment moderation. Promotion to admin is
  deliberately **not** available — it is the one change this route could not undo
  afterwards — and neither is changing your own account or another admin's,
  since this is the route that decides who can reach this route.
- **The audit trail.** [AdminAction.js](server/models/AdminAction.js) +
  [adminAudit.js](server/services/adminAudit.js), written fire-and-forget by
  every admin mutation and read by `GET /admin/audit`. The panel could already
  delete a user, wipe their posts and reset anyone's password, and the only
  record was a line appended to `adminActions.log` — a file on a filesystem
  Render throws away on every deploy, that two of the eight mutations wrote and
  the rest did not. `logEvents` still runs beside it (the file survives a
  database problem; the row is the copy an admin can look at). Capped by a TTL
  index at 90 days rather than a cleanup script.
- **Deleting a listing now deletes its comment thread too.** It already deleted
  the reports; the comments were left orphaned, pointing at a post that no
  longer existed, and counted forever.
- **Offline check**: `npm run test-admin-panel` in `server/` — no DB, no
  network. Covers the day skeleton (a missing quiet Tuesday must draw a gap, not
  a straight line), the delta rule, and the listing label.

### Rules that carried over

Everything reads `theme.custom`, every string comes from
[translations.js](client/src/utils/translations.js) in all three languages, and
direction comes from logical properties (`marginInlineStart`, `textAlign: 'end'`,
flex row order) rather than `currentLanguage === 'ar'` checks — with two places
that genuinely cannot be logical and say so: the pager's chevrons, which point at
a page rather than at a screen, and the charts' x axis, which is one `isRtl` flag
feeding `xFor()` so time reads in the direction the language does.
