## Document listings: a title instead of a photo (web + mobile + server)

A listing filed under the **DOCUMENTS** category takes no photo at all, and
names the document instead, from a shared vocabulary. Both halves of that are
the point: a photograph of an identity document publishes its holder's full
name, its number, usually their address and often their face to everyone who
opens the listing — on a site whose job is handing property back, that is the
one attachment that does more harm than good. The eye-redaction pass above
covers faces in a photo; it cannot cover the text on an ID card, and the text
is the leak.

- **The photo goes away only when documents are *all* it is about.** A wallet
  found with papers inside it is still a wallet, and the photo of the wallet is
  what its owner recognises - so a listing that also carries another category
  keeps its Photo step, and both forms show a notice naming those other
  categories: photograph the bag, keep the papers out of the frame or cover
  them. `isDocumentsOnlyListing` is what decides the step; `isDocumentsListing`
  still decides the title and the name, which are asked for either way.
- **The Photo step is removed, not emptied.** The New Post wizard's steps are a
  list built per listing, not a fixed four
  ([documentCategory.js](client/src/features/posts/NewPost/documentCategory.js)
  decides, mirrored at
  [mobile/src/config/documentCategory.js](mobile/src/config/documentCategory.js)),
  and every step is addressed by its key — an index is no longer a step's
  identity. That is what the rail icons, the per-step validators, the
  back/next buttons and the Review section's Edit links all read now. A step
  that existed only to say "nothing to do here" would be worse than no step.
  Choosing the category also clears a photo already picked, and both submit
  paths refuse to attach one regardless — the backstop, not the mechanism.
- **The category is read by `code`, never by id.** Category ids are
  per-deployment; `DOCUMENTS` is the contract the client config, the mobile
  mirror and the seed scripts already share.
- **The vocabulary is a collection, not a config file.**
  [DocumentType](server/models/DocumentType.js) seeded from
  [server/config/documentTypes.js](server/config/documentTypes.js) (twenty
  titles: the Moroccan civil-status set, written in Arabic first because that
  is the name on the paper, plus the titles most often lost beside it), listed
  by `GET /document-types` and grown by `POST /document-types`. It has to be a
  collection because the list is meant to grow from use: a reader who cannot
  find their title adds it and it is there for the next person, which a file
  shipped with the build cannot do.
- **The seed rows are created on boot, not by an ops step.** The picker is the
  only way to file a DOCUMENTS listing and it lists what the collection holds,
  so an empty collection is not a degraded feature - it is a form nobody can
  complete, and the symptom (no rows, a search that finds nothing) says nothing
  about the cause. `services/documentTypeSeeder.js` runs on the
  `mongoose.connection` open event, creates only the codes that are missing,
  and never touches an existing row: a title an admin retired stays retired and
  a contributed one survives every deploy. `npm run sync-document-types` is
  still the deliberate tool for inspecting that vocabulary; this is the floor
  under it.
- **"Add new document" is the last thing inside the list's own scroller**, under
  a "Can't find the document in the list?" line - not a footer beneath it. A
  reader reaches for it only after scanning the list, which is exactly where
  scrolling leaves them. Its two fields say which script each one wants by
  example (بطاقة / Card), because "Latin letters" alone is not a reliable
  instruction to give someone typing in Arabic.
- **Every documents listing also carries the name written on the document**
  (`Post.documentOwnerName`, `{ ar, latin }`, required on both forms). With no
  photo published, a page of "national identity card" listings is otherwise
  indistinguishable row by row: the name is what an owner recognises their own
  document by, and the field a searcher types their own name into - so both
  listing queries search it alongside description, location and contact. Both
  scripts are asked for, and each is script-checked, for the same reason the
  titles are: a Moroccan document carries both spellings and a reader may know
  only one of them. It is cleared whenever a listing stops being about
  documents.
- **"Other document" asks for both scripts, and refuses one written in the
  wrong one.** What is contributed is shown to everyone, so a title saved only
  in French is unreadable to half the site — and a French title typed into the
  Arabic field is how the Arabic list fills up with French. Checked by script
  (`\p{Script=Arabic}` / `\p{Script=Latin}`), not by alphabet, so accents and
  diacritics are fine. Only the Arabic and one Latin name are asked for; `en`
  and `fr` both take the Latin one rather than the form asking a reader for
  two spellings of the same word.
- **Duplicates are refused twice, and the second time is the one that
  matters.** `normalizedLabels` holds every label's script-folded form (the
  same `normalizeText` the matching engine uses, so hamza and taa-marbuta
  variants fold together) and carries a **unique multikey index**. The
  controller's lookup catches the ordinary case; the index catches two people
  submitting the same title in the same instant, which the lookup lets both
  through. Either way the reader is answered with the row that won and it is
  ticked for them — never an error telling them to think of a different name
  for the paper in their hand. `server.js` runs `DocumentType.syncIndexes()`
  on connect so an existing deployment builds that index.
- **A deactivated title is the one duplicate that is refused outright** (409).
  Answering with it would silently undo an admin's decision to retire it.
- **Only the detail read joins the titles.** `Post.documentTypes` is looked up
  in `getPost`'s pipeline only — the listing pipelines are already the
  expensive queries on that collection, and this is what a reader judges the
  listing by once they have opened it. The projection re-walks the stored ids
  so the titles render in the order the author ticked them, and drops any whose
  row is gone rather than rendering an empty chip.
- **A title that no longer exists never fails a write.** `resolveDocumentTypeIds`
  drops unknown, inactive or malformed ids and caps the list at six (the few
  papers lost together, not an inventory); the listing is the thing being
  saved. `usageCount` is incremented fire-and-forget.
- **The edit screens follow the same rule.** Both `EditPostForm.js` and
  mobile's shared `PostForm` hide the upload on a documents-only listing — an
  edit screen that offered the photo field back is exactly how a picture of an
  ID card would reach the site anyway — and show the same "photograph the other
  thing" notice on a mixed one.
- **The auto-posted copy names the documents in its header.**
  [socialCaption.js](server/services/socialCaption.js) puts the titles in
  parentheses right after the category in each of the three language blocks
  ("🔴 Lost Document (Passport, National identity card) in the country of…")
  and adds one line with the name on them, each block in its own script,
  falling back to the other when only one was written. Nothing else about the
  caption moves: same emoji, verb, country/city clause, link and hashtags, and
  a listing with no document types gains neither line. Without it a documents
  listing in a feed is indistinguishable from any of the other nineteen titles
  — and it publishes no photo, so the header is all a scroller gets. The ids
  are re-walked in the author's order, since a `$in` query is free to answer in
  any. Covered by `npm run test-social-images`.
- **Offline check**: `npm run test-document-types` in `server/` — no DB, no
  network. Covers the seed config's own consistency, the three-language
  listing in priority order, script-folded search, contributing a title,
  both duplicate paths (the lookup and a lost index race), the two
  wrong-script refusals, a deactivated title staying retired, and the
  boot-time seeding (an empty collection filled once, a second boot creating
  nothing, a retired title not reactivated, a contributed title untouched).
  `npm run sync-document-types [-- --apply]` creates the seeded rows on a
  deployment and never deletes or relabels anything — every contributed title
  lives in that same collection.
