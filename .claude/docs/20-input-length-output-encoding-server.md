## Input length + output encoding (server)

Where a user's free text is bounded, and where it is escaped. Two separate
questions that were previously answered by one global middleware doing neither
well.

- **What was there**: `sanitizeInput` in
  [validation.js](server/middleware/validation.js), mounted globally, cut every
  string at 1000 characters and stripped `<`, `>`, `javascript:` and `on\w+=`
  out of it. It has been reduced to trimming whitespace. Both of the things it
  removed were the wrong layer: length is a schema rule, and escaping depends
  entirely on where a value is being written to.
- **Two things it was quietly not doing.** Mounted at `server.js` line 149 it
  runs *ahead of* `express.json()`, so `req.body` was not parsed yet and only
  the query string was ever touched — the truncation everyone assumed was
  protecting the database never ran on a post body at all. The one place it did
  see a body was its per-route mount on `PATCH /contact/:id`. So the JSON-LD
  hole below was live, not hypothetical.
- **Limits live in [fieldLimits.js](server/config/fieldLimits.js)**, read by
  both halves of the enforcement so they cannot drift: the `maxlength`
  validators on [Post.js](server/models/Post.js),
  [Comment.js](server/models/Comment.js) and [Report.js](server/models/Report.js)
  are the backstop (both post write paths are `Post.create` / `doc.save()`, so
  document validation actually runs on them), and the express-validator rules
  in `validation.js` turn the same numbers into a 400 naming the field instead
  of a mongoose `ValidationError` surfacing as a 500. Post: contact 100,
  exactLocation 200, description 2000, mainDate 100. Comment text 1000.
  `Post.socialComments[].text` is deliberately uncapped — those are a mirror of
  what Facebook already published, not a submission, and a limit there would
  only turn someone else's long comment into a failed stats refresh.
- **`PATCH /posts` validated nothing but the id.** Create and update now share
  `assertPostTextLengths`, and both read their payload through
  `readPostPayload` — the clients send the whole listing as a JSON string in a
  multipart `postData` field, so an ordinary `body('description')` rule sees
  nothing on either route.
- **The 400 now carries `error.fields`** (`{ field, message }` per failure)
  alongside the existing generic `message`. Additive, and the point of the
  exercise: an author whose 3000-character description is refused has to be
  told which field and why, or the fix is only a louder version of the silent
  truncation.
- **The JSON-LD in [ogRoutes.js](server/routes/ogRoutes.js) escapes its own
  output.** `<script type="application/ld+json">` content is raw text; the only
  thing that can end it early is a literal `<`, so `escapeJsonLd` rewrites it
  as `\u003C`, which a JSON parser reads straight back as `<`. Escaping, not
  stripping: the crawler still gets the description exactly as written. Every
  other interpolation in that file already went through `escapeHtml`.
- **`textContent` dropped its `<>` rejection.** It only guards comment text,
  and with the stripping gone the rule would have started refusing ordinary
  writing ("a > b") with a generic "cannot contain HTML tags". React and React
  Native escape their own output; the markup question is answered there.
- **`?search=` is bounded at 200** on the three listing routes. It reaches the
  query as a `$regex` (`postsController.js`), so an unbounded term is an
  expensive scan handed to a stranger — the old truncation capped it at 1000 as
  a side effect, this replaces that with something deliberate and refused
  rather than silently rewritten. Note the term is still interpolated into
  `$regex` **unescaped**, unlike the `escapeRegex(value)` calls further down the
  same file; that is pre-existing and untouched.
- **Offline check**: `npm run test-input-validation` in `server/` — no DB, no
  network (models/Post and models/City stubbed for the ogRoutes block). Renders
  the real crawler page for a post whose description is
  `</script><script>alert(1)</script>` and asserts both JSON-LD blocks still
  parse as JSON, the document still contains exactly two `<script` tags, and
  the description survives the round-trip unchanged; then covers the schema
  backstop, the create/update/comment 400s, and that `sanitizeInput` trims but
  no longer truncates or rewrites.
