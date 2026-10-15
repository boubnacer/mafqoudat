## Auto-posting to Facebook/Instagram (server)

Every new listing is mirrored to the Facebook Page and the Instagram account.
That publish is **queued and paced**, never inline — the single design decision
this whole section exists to protect.

- **What it replaced.** `createNewPost` used to call
  `facebookService.postNewListing` and `instagramService.postNewListing`
  directly, fire-and-forget, concurrently, and `.catch(console.error)` whatever
  failed. Correct for one listing at a time; wrong for a burst, in three
  separate ways. Instagram's Content Publishing API refuses everything past 25
  published posts per rolling 24h per account, so listing 26 onwards silently
  never reached Instagram. Facebook has no such count — its limit is a rolling
  per-app/per-Page call budget (BUC) that **concurrency spends fastest**, so ten
  calls in one second is far likelier to be throttled than the same ten over ten
  minutes. And simultaneous near-identical automated posting is the shape Meta's
  spam systems look for regardless of any numeric limit. In all three cases the
  refusal was caught, logged and dropped: the listing existed on the site with
  no Page copy, no retry, and nothing anywhere recording that it had happened.
- **Pacing is unconditional, every limit is a separate gate on top.** The
  worker leaves at least a per-platform floor between two publishes on the
  same platform whether or not any limit is close — "burst until something
  breaks, then slow down" is the behaviour being removed, so the fix cannot be
  a limit check alone. Every gate above it **defers rather than drops**: the
  jobs are dated to when a slot frees up (+ a minute's buffer) and go up by
  themselves. In order of how much each one knows:
  1. the interval, plus jitter redrawn after every publish — see below;
  2. an **hourly** ceiling, `SOCIAL_QUEUE_IG_HOURLY_LIMIT` (5) and
     `SOCIAL_QUEUE_FB_HOURLY_LIMIT` (10);
  3. Instagram's rolling 24h cap, `SOCIAL_QUEUE_IG_DAILY_LIMIT` (25) —
     Facebook has no published-post cap at all, only a call budget;
  4. the account's own figure from Meta (`content_publishing_limit`, below);
  5. the call budget Meta reports on every response (below).
- **The interval is per-platform, not one shared number.** Each publisher
  entry in `socialPublishQueue.js`'s `DEFAULT_PUBLISHERS` carries its own
  `minIntervalMs`/`jitterMs`, and `runPlatform` paces off *that* platform's
  pair — so tuning one platform's cadence can never move the other's. Facebook
  stays at `SOCIAL_QUEUE_MIN_INTERVAL_SECONDS` (60) +
  `SOCIAL_QUEUE_JITTER_SECONDS` (0–45), i.e. 60–105s. Instagram is deliberately
  more conservative — `SOCIAL_QUEUE_IG_MIN_INTERVAL_SECONDS` (180) +
  `SOCIAL_QUEUE_IG_JITTER_SECONDS` (0–120), i.e. 180–300s (3–5 minutes) —
  because the one observed spam block (`error_subcode` 2207051) happened on
  Instagram, at a cadence well inside its documented daily cap, and a fresh
  Page/account has no posting history to fall back on. Bumped from a single
  shared 60s floor after launch review specifically for this reason; kept as
  two independent settings rather than one raised number so Facebook — which
  never showed the problem and has no daily cap to begin with — is not slowed
  down for an issue that was never its own.
- **The hourly ceiling exists because the documented daily cap is not the
  limit that actually bites.** 25 posts per 24h is what Meta publishes, but a
  short interval alone can spend all 25 well inside an hour, and accounts are
  reported blocked for suspected spam at around a dozen posts in one hour —
  well under the documented cap, which is precisely why a daily gate alone
  does not protect anything. At 5/hour Instagram takes five hours to reach its
  daily allowance, which is the point. The ceilings and the interval are the
  levers to reach for if a spam block ever happens; the log line for one says
  so.
- **And the pacing is jittered, because a perfect metronome is itself a
  signal.** A fresh `Math.random()` draw after each publish, so two
  consecutive posts are never exactly as far apart as the two before them. It
  can only ever make the queue slower, never faster, and `random` is a
  constructor seam so every pacing assertion in the offline check stays exact.
- **Instagram's quota is asked for, not only counted.**
  `GET /{ig-user-id}/content_publishing_limit` answers `quota_usage` and
  `config.quota_total` for the *account*. The queue's own window count only
  knows about posts this app published, so anything posted to the account by
  hand — or by another tool — spends slots it never saw, and the first sign of
  that was a listing refused with error code 9, costing an attempt and a full
  cooldown. `quota_total` is also not always the 25 that gets quoted, so it is
  better read than hardcoded. Cached five minutes in `instagramService` and
  invalidated on every publish; unreachable or unanswerable means "carry on",
  since the local count and Meta's own refusal both still stand behind it.
- **Meta says how much budget is left on every response, and that is acted
  on.** `x-app-usage` and `x-business-use-case-usage` carry `call_count`,
  `total_cputime` and `total_time` as percentages of three separate ceilings,
  any one of which throttles at 100, plus `estimated_time_to_regain_access` in
  minutes once already blocked. `readRateLimitUsage` takes the highest figure
  across every object in both headers; the platform stands down at
  `SOCIAL_QUEUE_USAGE_PAUSE_PERCENT` (85). This is the only way to slow down
  *before* being refused rather than after — and when a throttle does arrive
  with `estimated_time_to_regain_access` set, that beats the configured
  cooldown in both directions.
- **Every write goes in a form-encoded body, never the query string.** This is
  the likeliest cause of the "sometimes it doesn't reach Instagram" that this
  pass started from. A caption here is trilingual and up to 2,200 characters,
  most of them Arabic — six bytes each once percent-encoded — so the same
  caption as a query parameter is a URL of well over ten kilobytes, past the
  point where gateways and Graph itself refuse a request outright. And it
  fails *by listing*, not always: a short one goes through and a long one does
  not, depending on how long that listing's city and category names happen to
  be, which is exactly the shape of "it usually works". Both publishers send
  `application/x-www-form-urlencoded` bodies now, token included; bodies have
  no such ceiling.
- **Instagram does not accept an image, it accepts a URL and goes to fetch
  it** — so a container is not publishable until Meta has finished downloading
  and processing the photo, and publishing one that is still `IN_PROGRESS`
  fails. The readiness poll used to be ten attempts two seconds apart: a
  twenty-second budget, against Meta's own guidance to poll for up to five
  minutes, and nowhere near enough for a multi-megabyte JPEG on a slow fetch.
  It is `INSTAGRAM_CONTAINER_TIMEOUT_SECONDS` (300) now, on a ramped interval
  (2s, backing off to `INSTAGRAM_CONTAINER_POLL_MAX_SECONDS`, 30) rather than
  Meta's flat once-a-minute — almost every container is ready in seconds, and
  waiting a full minute to notice would make every publish a minute long.
- **The container's `status` is read alongside its `status_code`**, and all
  five states are handled. `status_code` alone says only "ERROR"; the reason,
  and the subcode the queue classifies on, are in the free-text `status`
  string (`"...could not be created. (2207032)"`), which is what separates a
  temporary download failure from a file Instagram will never accept — the
  difference between resubmitting the same image and regenerating it. A
  container error with no parseable subcode defaults to the *media* class, not
  the credentials one: the synthetic error has to carry a subcode inside
  Instagram's `2207xxx` range or the queue's classifier falls through to its
  `OAuthException` catch-all and pauses a platform that is working.
  `EXPIRED` (a container lives 24h) is terminal for that container; `PUBLISHED`
  is the duplicate case below.
- **Nothing is published twice, part two: a lost answer is not a refusal.**
  Graph has no idempotency key, so a publish whose answer never came back — a
  timeout, a reset, a process killed between the call and the write — is
  indistinguishable from one that was refused, and the retry is how a listing
  reaches the account twice. Three guards, in order of cost: `media_publish`
  re-reads the container's own `status_code` before every retry and stops if
  it says `PUBLISHED`; every attempt after the first asks the platform whether
  the listing is already there (`findPublishedListing`, matching the listing's
  own `/dash/posts/<id>` URL in a caption, which nothing else on the account
  carries — Facebook looks in `/feed` and then in `/photos`, since a photo
  story is not guaranteed to surface in the feed and `page_story_id` is the id
  engagement lives on); and a failed lookup answers null rather than blocking
  the publish, leaving exactly the behaviour that was there before it existed.
  The lookup is skipped on a job that has never run, so the common case pays
  nothing — and `--retry-failed` writes the `REQUEUED_BY_HAND` marker
  precisely because it resets `attempts`, which would otherwise hide the fact
  that the job has already been to the platform once.
- **The failure taxonomy, and what each branch costs the job.** The split that
  matters is *whose problem it is*. A limit, a throttle, a spam block or a
  dead token belongs to the **platform**: the job is put back untouched, the
  whole platform stands down, and no attempt is spent. Only a failure that is
  the job's own costs an attempt. In order:
  1. **spam block** (IG `2207051`, FB code 368) → stand down
     `SOCIAL_QUEUE_SPAM_BLOCK_COOLDOWN_MINUTES` (360). Neither a rate limit
     nor a bad file: nothing about the listing is wrong, and returning at the
     same cadence is what turns a temporary block into a longer one;
  2. **publishing cap** (code 9 / `2207042`) → the existing quota cooldown;
  3. **throttle** (4/17/32/341/613, HTTP 429) → the rate-limit cooldown, or
     `estimated_time_to_regain_access` when Meta states one;
  4. **dead token** (code 190/102, session subcodes 458–492) → stand down
     `SOCIAL_QUEUE_AUTH_COOLDOWN_MINUTES` (60);
  5. **refused media** (a `2207xxx` subcode that is not one of the above and
     not transient) → clear the cached derivative, retry on the backoff ladder;
  6. **transient** (5xx, code 1/2, IG's `please try again` family —
     `2207003` "timeout downloading media", `2207032`, `2207053` — and a
     connection that never answered) → retry on the ladder, **keeping** the
     derivative, since "please try again" says nothing is wrong with the file;
  7. **missing scope** (code 10, 200–299) → stand down like a dead token;
  8. anything else → retry on the ladder, then fail.
- **A refused credential no longer fails the listing.** Both authorisation
  branches above used to mark the job `failed` on the spot, on the reasoning
  that retrying into a wall spends the rate-limit budget the rest of the queue
  needs. That reasoning is right and the platform stand-down is what actually
  implements it — but the *job* being terminal meant a token that went stale
  overnight converted every listing posted overnight into a dead job needing a
  manual `--retry-failed`, one at a time, at the pacing interval. The queue is
  durable and `--status` shows it, so the listings now wait for the
  credentials to be fixed and publish themselves.
- **The media/permission split is a subcode *range*, not a list.** Every
  Instagram content-publishing error is a `2207xxx` subcode and nothing else
  is, so that range is what `isMediaContentError` tests — the alternative is a
  hand-maintained registry Meta extends without announcing, and anything
  missing from it falls through to the `OAuthException` catch-all and gets
  reported as a token problem. For the same reason the queue uses
  `isScopeError` (code 10, 200–299) rather than graphApi's broader
  `isPermissionError` for its stand-down decision: a code 100 "Invalid
  parameter" on one listing must not stop every listing behind it.
- **The queue is a collection, not a library.**
  [SocialPostJob.js](server/models/SocialPostJob.js), one row per (post,
  platform), drained by [socialPublishQueue.js](server/services/socialPublishQueue.js).
  MongoDB rather than Bull/BullMQ + Redis: `MONGODB_URI` is already required at
  boot while `REDIS_URL` is explicitly optional (see the auth-session notes), so
  a Redis-backed queue would be a new hard dependency for the one part of the
  system that must not lose work. It also makes the queue *readable* — `npm run
  social-queue -- --status` answers "did my listing reach the Page?", which
  previously could only be answered by grepping logs.
- **`nextAttemptAt` carries every kind of waiting** — retry backoff,
  rate-limit cooldown, daily-quota deferral. One field, one claim query
  (`{platform, status:'pending', nextAttemptAt:{$lte:now}}` sorted
  `nextAttemptAt, createdAt`), so there is no separate scheduler to keep in step
  with the queue.
- **A limit pauses the whole platform, not just the job that hit it.**
  Deferring one job hands the next job the same refusal a second later, and
  continuing to call a throttled endpoint is what extends a block rather than
  clearing it. `deferPlatform` levels every pending job of that platform onto
  one resume time; the claim's secondary sort on `createdAt` is what keeps the
  queue FIFO through that levelling. An in-memory `pausedUntil` is a fast path
  only — the durable copy is on the jobs, which is what a restart or a second
  instance reads.
- **Being rate-limited is not a failed attempt.** `attempts` counts only real
  failures, so a throttle can never burn through `SOCIAL_QUEUE_MAX_ATTEMPTS` and
  mark a perfectly good listing failed. A missing permission, by contrast, fails
  *immediately* — an OAuth scope error answers the same way however many times
  it is asked, and retrying it just spends the rate-limit budget the rest of the
  queue needs.
- **Classification order is load-bearing.** Meta returns its throttling codes
  (4/17/32/341/613) under `type: "OAuthException"`, so `graphApi.js`'s
  long-standing `isPermissionError` answers true for them too. So every check
  in `handleFailure` is on a specific code or subcode, the ones describing a
  temporary condition come first, and the authorisation checks come last —
  reversed, every throttle would read as a permanent authorisation problem.
  See **The failure taxonomy** below for the full order and what each branch
  costs the job.
- **`isPublishLimitError` exists even though the queue counts publishes
  itself.** The local count only knows about posts *this app* published;
  anything posted to the account by hand spends quota it never saw. The
  platform's own refusal (code 9) is the backstop, and it is always right.
- **Nothing is published twice, and the ordering of the two writes is the
  reason.** After a successful publish the *job* is marked done (with its own
  copy of the returned id and permalink) **before** `Post.social` is updated. The
  other order would leave a published copy nobody can ask Graph about and a
  retry that posts it a second time; this order means a failed second write is
  recoverable — `--repair` reattaches the ids from the jobs. On top of that:
  claiming is an atomic `findOneAndUpdate` (two instances cannot take the same
  job), the `{post, platform}` unique index makes enqueueing idempotent, and the
  publish path re-reads the post and skips it if it already carries that
  platform's id.
- **A job whose worker died is returned to the queue, with `attempts`
  incremented** so an interruption that repeats cannot loop forever. The lock
  timeout is 10 minutes, not seconds, precisely because an Instagram publish
  legitimately takes tens of seconds (container creation, readiness polling,
  publish retries) and reclaiming one that is still running is the one place a
  duplicate Page post is conceivable.
- **A listing that should no longer be published is cancelled, not published.**
  Deleted before its turn, or no longer `active` (resolved/expired/suspended) —
  putting it on the Page then would advertise something the site itself no
  longer shows.
- **Post creation is untouched.** It never waited on social publishing and still
  does not; `enqueuePost` is awaited only because it is two small upserts and the
  work should be durably recorded before the author is told the post exists, and
  it is wrapped so a queue failure can never fail the request.
- **`resolvePermalink` was deliberately left as a second call per publish.**
  Folding it into `socialStatsService`'s existing batch would save one Graph call
  per post, but pacing already removed the burst that made call count matter, and
  it would churn a working path in `facebookService`/`instagramService` for a
  marginal gain. Revisit only if the call budget ever becomes the binding
  constraint.
- **A listing with no photo goes up with its own category's graphic**, not one
  generic card. `resolveListingImage` in
  [socialCaption.js](server/services/socialCaption.js) reads the listing's first
  category code and answers
  `${CLIENT_URL}/category-social/<code>.jpg`; it became async for that one
  indexed point read, which is nothing next to the Graph calls it precedes.
  The nineteen 1080×1080 files are generated by
  [buildCategorySocialImages.js](client/scripts/buildCategorySocialImages.js)
  (`npm run build-category-images` in `client/`) and committed, the way
  `worldMap.topo.json` is — a deploy never runs it, and Vercel serves them as
  static assets. Worth keeping:
  - **The generator parses `src/config/categories.js` rather than restating
    it.** Icon *and* accent colour come from the same `CATEGORY_CONFIG` the app
    draws with, so a card cannot quietly stop matching its category: the Material
    icons it names are rendered out of `@mui/icons-material` through
    `react-dom/server`, and the four bespoke ones are read back out of their own
    JSX. A category whose icon resolves to neither fails the run loudly instead
    of shipping a wrong picture.
  - **An accent picked for white cards is not always legible on the card's
    backdrop** (#795548, #3F51B5, #5E35B1…), so those are lifted in HSL until
    they clear WCAG AA — lightness only, hue kept, with a saturation floor for
    the muted ones. Mixing toward white was the first attempt and turned the
    documents brown into beige, which stops reading as "the brown one".
  - **They are JPEGs, and that is not cosmetic.** They shipped as PNGs, which
    Instagram's publishing API does not accept — so every photo-less listing
    was refused by the media container and reached Facebook only. The
    generator writes sRGB JPEG now, `test-social-images` measures every file
    against Instagram's rules (format, colour space, 4:5–1.91:1, 320–1440px,
    8 MB) alongside its existing code↔file check, and `no-image-placeholder.png`
    stays on disk beside its `.jpg` twin as the original artwork the palette
    was sampled from — it is a public asset of a live site, and never published.
  - **The palette is the existing `no-image-placeholder.png`'s**, not the app's
    light/dark tokens: a social post is one image on someone else's feed, with
    no mode to resolve. The two graphics stay one family — same backdrop, dot
    grid, brand lockup and domain line.
  - **"mafqoudat.com" is an outlined path**
    ([domainWordmark.svg](client/scripts/assets/domainWordmark.svg)), set once in
    Cairo 700 (designTokens' `display` face). Rasterising through librsvg would
    otherwise depend on whatever fonts the machine running the generator happens
    to have installed.
  - **The server keeps its own list of which codes have a file**
    ([categorySocialImages.js](server/config/categorySocialImages.js)) and falls
    back to the generic placeholder for anything else, because Meta fetches the
    URL itself and fails the whole publish on a 404. The server cannot see
    `client/public`, so the two halves are held together by the offline check
    below instead.
  - **`isPlaceholder` stays true** when a category graphic is used, so the
    caption still carries its `🖼️ الصورة: غير متاحة` line. The listing has no
    photo of the item, and without that line a reader takes the icon for the
    thing that was lost.
- **Worker lifecycle**: started from `server.js` on the `mongoose.connection`
  open event (it needs the database), stopped in `gracefulShutdown`, interval
  `unref()`ed so it never holds the process open — anything queued is durable and
  resumes on the next boot. `SOCIAL_QUEUE_ENABLED=false` turns social publishing
  off without touching post creation.
- **Ops**: `npm run social-queue -- --status | --doctor | --drain [--max=N] |
  --retry-failed | --repair` ([socialQueue.js](server/scripts/socialQueue.js)).
  `--doctor` is the pre-launch one: it checks everything a publish needs from
  the outside world without publishing anything — is the token valid, **when
  does it expire** (`debug_token`; a Page token derived from a user token
  does, a System User token does not, and the difference is invisible until
  auto-posting stops dead), does it carry `pages_manage_posts` /
  `pages_read_engagement` / `instagram_basic` / `instagram_content_publish`,
  do the Page and the Instagram account answer, how much publishing quota is
  left, and can the category graphics actually be fetched as JPEG from
  `CLIENT_URL`. Every one of those fails silently otherwise.
  `--drain` runs the same worker from the command line, for a scheduler-only
  deployment or to push a backlog through after fixing what was refusing it.
  `--retry-failed` also clears the cached watermarked derivative
  (`Post.socialImage`, see **the watermark** below) for every listing it
  requeues, not only ones this build's own classifier would recognise —
  `ensureSocialImage` only ever reuses a cache entry, it never re-validates
  one, so a job that failed on a bad image would otherwise be requeued
  straight back onto the exact file that was just refused.
- **A platform refusing the media itself is not a permission error, even
  though Meta nests both under the same `type: "OAuthException"`.** Instagram
  answers a wrong format, an unfetchable URL or a rejected caption with an
  error indistinguishable in shape from a missing scope, and the first version
  of this queue's classifier treated every such error as one — logging "check
  FACEBOOK_PAGE_ACCESS_TOKEN's scopes" for a problem no token change could
  fix, and worse, giving up on the job for good with the bad derivative still
  cached, so even a corrected image was never tried. It is classified and
  handled before the authorisation checks, and `handleFailure` clears the
  post's cached social image and retries through the normal backoff ladder
  instead of failing outright.
- **Offline check**: `npm run test-social-queue` in `server/` — no DB, no
  network, no waiting: both collections are an in-memory fake, the publishers are
  stubs, and the clock is injected, so the 24h quota window is exercised in
  microseconds. Covers pacing, FIFO order, the quota deferral rolling over to the
  next day, the platform-wide throttle stand-down, permission-vs-transient-vs-
  media-content classification (and that the last one clears the cached
  derivative on every attempt, not just the first), cancellation, stall
  recovery, the two double-post guards, and that Instagram's longer pacing
  floor holds independently of Facebook's shorter one on the same clock.
  `npm run test-social-images` covers which graphic a photo-less listing
  publishes with, and — the part that matters — checks both directions between
  the server's code list and the generated files, since a code with no file
  behind it 404s and takes the listing off the Page entirely.
  `npm run test-social-publish` covers the two Graph publish paths themselves
  ([testSocialPublishFlow.js](server/scripts/testSocialPublishFlow.js)): axios
  and the caption builder are stubbed and Instagram's polling intervals are
  constructor options, so a five-minute readiness budget runs in
  milliseconds. It covers the request-body rule, the container state machine
  (IN_PROGRESS → FINISHED, ERROR with and without a parseable subcode,
  EXPIRED, a budget that runs out), both duplicate paths, the usage headers
  and the quota endpoint.
- **A listing with a photo is published with a watermarked copy of it, and the
  site keeps the clean one.** Off the site a photo travels without the page
  around it — reshared, screenshotted, saved — so it carries the domain it came
  from; on the site a mark across the picture would sit between a reader and the
  object they are trying to recognise, which is the one thing a listing exists
  to help them do. So the mark is on a second asset, never on `cloudinaryUrl`.
  - **It is drawn from the outlined Cairo wordmark, not from a supplied PNG.**
    [imageWatermark.js](server/services/imageWatermark.js) tiles
    `server/assets/domainWordmark.svg` — the same outlined "mafqoudat.com"
    `buildCategorySocialImages.js` sets on the category graphics, copied in
    because the server cannot see `client/` — as an SVG `<pattern>` the size of
    the photo. Vector, so the mark is rasterised at whatever size *this* photo
    needs rather than a fixed bitmap being scaled up into a blur; outlined, so
    it needs no font installed; one `<pattern>`, so the whole overlay is a
    single rasterisation at the final resolution instead of one tile resampled
    N times, each landing on a different subpixel phase. A domain nobody can
    read is the only way this feature fails completely, so resolution is what
    it spends on.
  - **Two faces, not one flat 15% grey.** A single tone disappears into a photo
    of the same tone — a pale mark on a white wall, a dark one on a night
    shot — so each mark is a white face with a darker copy offset behind it.
    Measured rather than eyeballed: `test-social-watermark` composites onto a
    white ground and a black one and asserts a peak departure on both, plus a
    mean shift low enough that the photo is still the subject.
  - **Generated at publish time, not at upload.** Post creation has never
    waited on social publishing and still does not; the publish path is already
    queued, paced and retried, so a download, a composite and a second
    Cloudinary upload cost nobody a slower request there. It also means every
    listing created before this gets its mark the first time it is published,
    rather than only new ones.
  - **`socialImage.sourceUrl` is what it was stamped from.** A photo replaced
    while the job is still queued would otherwise publish the mark of the old
    picture; the comparison is what forces a restamp. The derivative lives at a
    deterministic `mafqoudat/social/post-<id>` public id, so a regeneration
    replaces its predecessor instead of accumulating, two jobs for one listing
    cannot duplicate it, and the ordinary cleanup paths (delete a listing,
    replace or remove its photo, purge an account) delete it alongside the
    site's own asset.
  - **Uploaded with no Cloudinary transformation, and always baseline JPEG,
    never progressive.** The mark is thin, light-toned strokes over a
    photograph, which is exactly what a re-encode smears first, so the bytes
    go up at the size and quality they were written at (`quality: auto`
    explicitly not applied). Progressive is turned off explicitly
    (`JPEG_PROGRESSIVE = false`) rather than left at sharp's default: Meta's
    own spec singles out "extended JPEG formats" as unsupported, and
    progressive-scan JPEGs are a documented soft spot for exactly this class
    of automated fetcher elsewhere in the Meta ecosystem. A crawler reading a
    file once has nothing to gain from progressive rendering anyway — that
    encoding exists for a person watching a slow download paint in, which
    never happens here.
  - **Instagram's publishing rules are the shape of the file, because it
    refuses rather than corrects.** Its Content Publishing API does not crop,
    convert or shrink what it is handed: a container built from anything
    outside the specification fails and the listing never reaches the account
    at all. So `buildSocialImage` enforces all of it — sRGB JPEG (the site's
    own asset is usually **WebP**, since `imageOptimizer` converts on upload,
    and WebP is refused), 320–1440px wide, under 8 MB via a quality ladder, and
    an aspect ratio inside **4:5 – 1.91:1**. That last one is the common case,
    not an edge: a 3:4 phone photo is 0.75 and out of range.
  - **Out-of-range photos are padded, never cropped.** A crop tight enough to
    bring a 3:4 photo into 4:5 can take the keys out of the corner of the
    frame, which is an expensive way to satisfy a specification — on a listing
    whose whole job is helping someone recognise their property, the picture is
    not ours to trim. The bars are the listing's own photo, blurred and dimmed,
    and the watermark tiles across the whole frame so it never announces where
    the padding starts. `resolveFrame` is the pure geometry, checked directly:
    every shape a phone or a camera produces has to come out inside the range
    with its own aspect ratio intact.
  - **Two composites in one call.** sharp's `composite()` *replaces* whatever
    was set before it, so building the padding in one call and the watermark in
    a second silently publishes the blurred backdrop on its own — with the
    right dimensions, the right format and the right colours, which is why the
    test drops a marker at the centre of the photo and reads it back rather
    than measuring the frame.
  - **The Instagram caption is capped at its 2,200 characters, by trimming the
    description.** The caption is trilingual and repeats the author's free text
    verbatim in each block, so a listing with a long description was over the
    limit three times over — error 2207010, container refused, nothing
    published. `buildListingCaption` takes an optional `maxLength` (only
    Instagram passes one; Facebook's limit is 63k) and binary-searches the
    longest description that fits, because the room available depends on the
    city, country, category list and hashtags. Cutting the caption at its end
    instead would drop the link and the hashtags — the one line that lets
    anyone act on the listing, and the way it is found — and keep the part a
    reader can already see on the site. Hashtags are capped at 30, Instagram's
    own limit, for the same reason.
  - **A mark that cannot be made never costs the listing its publish — but a
    plain photo is never allowed to mean "whatever the site happened to
    store."** No Sharp, no Cloudinary credentials, a download or upload that
    failed — every one of those answers null and the plain (usually WebP)
    photo is published, because an unmarked listing on the Page is a smaller
    loss than a listing that never reaches it. But the wordmark overlay itself
    failing (a corrupt or unreadable `assets/domainWordmark.svg`) is a
    narrower problem than that, and `buildSocialImage(buffer, { watermark:
    false })` is the answer to it: `socialImageService.generate` tries the
    full pipeline first and, only if that specific step throws, retries with
    the overlay skipped — every format/geometry/size rule above is still
    enforced, `Post.socialImage.watermarked` records which happened, and the
    listing still gets a compliant JPEG rather than falling all the way back
    to whatever format the original upload is in.
  - **The uploaded copy is read back and checked before it is ever trusted.**
    Cloudinary accepting an upload is not proof Instagram can use it — a wrong
    `format` option, a stale cache entry under a reused public id, an account
    delivery setting — and the first version of this shipped without checking,
    which is exactly how one production listing reached Instagram as
    something other than the JPEG that was built for it and came back
    "(#9004/2207052) Only photo or video can be accepted as media type" with
    no way to tell why from the error alone. `verifyPublishable` in
    `imageWatermark.js` re-decodes the bytes actually served from the new URL
    and asserts every rule above holds; a mismatch is logged with specifics
    (format, dimensions, size) and the URL is never cached on the post — the
    caller falls back exactly as it does for a failed download or upload, and
    the plain photo publishes instead of an unverified derivative.
  - **Offline check**: `npm run test-social-watermark` in `server/` — no DB, no
    network; the images are generated in the test and axios, the uploader and
    `models/Post` are stubbed (`imageWatermark.js` is fronted by a passthrough
    stub too, so the watermark-optional fallback tier and the verification
    step can each be driven independently of what the real implementations
    do). Covers legibility on both grounds, the size cap, baseline-not-
    progressive encoding, EXIF orientation, a transparent PNG flattening onto
    white rather than black, restamping after a photo change, the two
    platform jobs sharing one generation, a failed verification never caching
    its URL, the watermark-only fallback still publishing a compliant image
    and recording that it went out unmarked, and each failure answering null —
    plus every shape a camera produces coming out inside Instagram's rules.
    The caption cap and the category graphics' own compliance are covered in
    `test-social-images`.
