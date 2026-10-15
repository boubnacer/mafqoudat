## The category taxonomy (web + mobile + server)

Twenty-five categories, held in four places that can each drift from the others.
[client/src/config/categories.js](client/src/config/categories.js) is the one to
change first: it holds every code, its icon and its accent colour.
[mobile/src/config/categories.js](mobile/src/config/categories.js) mirrors it 1:1
with Ionicons names, [server/config/categorySocialImages.js](server/config/categorySocialImages.js)
lists the codes a social card was generated for, and the **DB is what the app
actually lists** — the `Category` collection, which the clients only decorate.

- **The two halves fail silently in opposite directions, which is why they drifted.**
  `getCategoryConfig` answers OTHER's grey ellipsis for a code it does not know, so
  a category seeded on the server alone renders as an unnamed grey tile with no
  error anywhere; and a category in the client config that the DB never got simply
  does not exist to a visitor. Both had happened: a full-replace seed
  (`setup-lost-found-categories.js`) dropped **TOYS** while its icon stayed in the
  client config, and a separate 25-category seed added GAMING/MEDICAL/LUGGAGE/
  SHOPPING/WORK/MUSIC/BEAUTY/CAMERA/TOOLS/GARDEN/HOME/FOOD that no client could
  draw. Those were deleted by hand; TOYS is back, along with CHARGERS, UMBRELLAS,
  BICYCLES, MEDICAL, BABY and MUSIC.
- **`npm run test-social-images` is the drift check**, and it runs in three
  directions now: every code the server offers has a file on disk, every file is a
  code the server knows, and every category the client draws has a card of its own
  (the third one added with this pass — a category with no card still publishes,
  with the generic "no image available" placeholder, on a listing whose category we
  knew all along). Nothing can check the *DB* offline, which is what
  `scripts/sync-categories.js` is for.
- **`npm run sync-categories` in `server/`** creates the categories the client draws
  and the DB lacks, and syncs every colour and priority. Dry-run by default,
  `--apply` writes, `MONGO_TARGET=dev` switches off `MONGODB_URI_PROD` — same shape
  as `rename-categories-plural.js`. It never deletes or deactivates anything: a
  code the client config does not list is reported and left alone. It also leaves
  **labels** alone on categories that already exist, since those are live curated
  copy (plural, per `rename-categories-plural.js`) and a colour sync has no business
  rewriting them.
- **Every accent is at least ~10.4 CIEDE2000 from every other**, which is what stops
  two categories reading as the same colour at a 20px icon. They had collapsed into
  duplicates — jewelry and headphones on one purple, clothing/sports/money on one
  green, keys and toys on one orange, documents and bags a step apart on one brown
  ramp. So the palette is a measured set, not twenty-five independent picks:
  changing one colour means re-checking it against the other twenty-four. The
  semantically locked ones were held (person red, money green, documents brown,
  electronics cyan, other grey) and the rest moved around them.
- **Light mode decides a tie.** The icon sits at full strength on a 12% wash of
  itself, so a pale accent is a pale icon on near-white; dark mode washes at 20% on
  a dark card, where the same accent is easy. Where a colour could only be strong in
  one mode, light won — `CHARGERS` is graphite rather than the more obvious
  charging-yellow for exactly this reason (yellow measured 1.53:1 on its own light
  card).
- **`backgroundColor` is that accent at 12% over white**, kept as a literal for the
  older surfaces that read it directly (`CategoryPickerField`, `RecentPosts`,
  `SinglePostPage`, `Post.js`, mobile's `PostForm`). It is light-mode only, which is
  why newer work derives its own tint from `color` instead — see Phase 17's note on
  the posts-list card.
- **The browse grids order by priority; everything else stays alphabetical.**
  `GET /categories` sorts by `labels.en`, which is right for a picker someone scans
  by name and wrong for a grid showing four tiles before a "show all" — alphabetically
  those four became Baby, Bag, Bicycle and Book, i.e. the rarest things on the site.
  `sortCategoriesForBrowse` (exported from both config files, used by web's
  `Categories.jsx` and mobile's `CategoryBentoGrid`) reorders them by the config's own
  `priority` at render time. Deliberately **not** a change to the API's sort: that one
  response also feeds the New Post picker and the filters, where alphabetical is what
  a reader is scanning. An unknown code sorts last with OTHER, and ties keep the
  API's alphabetical order.
- **Two icons have no Ionicons equivalent**, and the mobile mirror says so where it
  departs: BABY is MUI's `ChildFriendly` stroller on web and a balloon on mobile.
  Ionicons has no baby, stroller or pram glyph at all, and every mobile surface
  renders `<Ionicons name={config.icon}>` directly (eleven call sites), so carrying a
  second icon family for one category would cost more than the mismatch does.
- **Adding a category is four steps**: the client config (code, icon, colour,
  `backgroundColor` at 12% over white, priority), the mobile mirror, `npm run
  build-category-images` in `client/` plus the code in `categorySocialImages.js`, and
  `npm run sync-categories -- --apply` in `server/` to create the row. The offline
  check covers three of the four.
