# Post reach: site views + Facebook/Instagram engagement

Every listing is auto-posted to the Mafqoudat Facebook Page and Instagram
account when it is created. This document covers reading the resulting
engagement back into the site, and the site's own view counter alongside it.

## What is shown

| Number | Source | Where |
| --- | --- | --- |
| Views | The site/app itself, counted per visitor | Post cards, post detail |
| Facebook views, reactions, comments, shares | Graph API, Page post | Post detail (breakdown), cards (interactions total) |
| Facebook engaged users, clicks | Graph API, Page post insights | Post detail (breakdown) only |
| Instagram views, likes, comments | Graph API, IG media | Post detail (breakdown), cards (interactions total) |
| Instagram saved | Graph API, IG media insights | Post detail (breakdown) only |

Site views and social views are never added together, and the two platforms are
never pooled into a single figure. A visit to the post page, a reaction on
Facebook and an impression in someone's feed measure different things; one
combined "total reach" number would be a figure nobody actually measured.

Engaged users, clicks and saved are likewise kept out of the card-level
"interactions" total, each for its own reason:
- Facebook's **engaged users** is a rollup that already overlaps with
  reactions/comments/shares - folding it in would double-count the same
  activity under a different name.
- Facebook's **clicks** and Instagram's **saved** genuinely are separate
  actions, but summing them into a number that already shipped would silently
  redefine what that number means for anyone already looking at it.

Each stays its own row on the post detail breakdown instead of being folded
into a total.

A counter that has not been fetched yet is not shown at all — it is not
rendered as zero. So a listing whose numbers have never been read back shows
nothing rather than an unbroken row of zeros, and a listing whose Facebook
copy answers but whose Instagram copy has no `saved` data yet shows the rest
without inventing that one number.

## Requirements on the Meta side

The same System User token already used for auto-posting
(`FACEBOOK_PAGE_ACCESS_TOKEN`) is used for reading. Which numbers appear
depends on what that token is allowed to read:

| Numbers | Permission needed |
| --- | --- |
| Facebook reactions, comments, shares | `pages_read_engagement` (already required for posting) |
| Instagram likes, comments | `instagram_basic` / `instagram_business_basic` |
| Facebook views, engaged users, clicks | `read_insights` |
| Instagram views, saved | `instagram_manage_insights` |

The first two are almost certainly already granted — auto-posting does not work
without the equivalent scopes. **The two insight permissions are separate and
usually require App Review.** Without them everything still works; only the
insight-derived numbers (views, engaged users, clicks, saved) stay empty, and
nothing in the UI breaks.

Each insight number is resolved and requested **independently** — a missing
permission, or a renamed metric, on one never costs the others. A token with
`read_insights` but where Facebook has temporarily stopped serving
`post_clicks` still shows views and engaged users normally.

### Metric names move

Meta renames insight metrics on a roughly yearly cadence — Instagram's
`impressions` was replaced by `views` in Graph API v22 (April 2025) and the
Facebook Page reach/impressions family was retired in favour of views metrics in
June 2026. The server therefore *probes* rather than assumes, separately for
each metric: it tries each candidate name in order and keeps the first one
that answers.

If a rename breaks one of the numbers, set the new name first in the
environment for that specific metric — no code change or deploy of new code
is needed:

```
SOCIAL_STATS_FB_VIEW_METRICS=<new_name>,post_impressions_unique,post_impressions
SOCIAL_STATS_FB_ENGAGED_METRICS=<new_name>,post_engaged_users
SOCIAL_STATS_FB_CLICKS_METRICS=<new_name>,post_clicks
SOCIAL_STATS_IG_VIEW_METRICS=<new_name>,views
SOCIAL_STATS_IG_SAVED_METRICS=<new_name>,saved
```

The log line to look for on startup traffic is
`Social stats: using "<metric>" as the facebook views metric` (and likewise
`facebook engagement`, `facebook clicks`, `instagram views`, `instagram saved`).
If insights are unavailable for one of them you will instead see
`Social stats: facebook clicks insights unavailable - (#10) ...`.

## Configuration

All optional; defaults in brackets.

| Variable | Meaning |
| --- | --- |
| `SOCIAL_STATS_TTL_MINUTES` [180] | How long stored numbers count as fresh before a page view triggers a refetch, for a post older than `SOCIAL_STATS_YOUNG_POST_HOURS` |
| `SOCIAL_STATS_YOUNG_TTL_MINUTES` [10] | The much shorter freshness window that applies instead while a post is younger than `SOCIAL_STATS_YOUNG_POST_HOURS` |
| `SOCIAL_STATS_YOUNG_POST_HOURS` [24] | How long a post counts as "young" after creation |
| `SOCIAL_STATS_BATCH_SIZE` [50] | Objects per batched Graph read (Graph's own maximum is 50) |
| `SOCIAL_STATS_MAX_PER_RUN` [50] | Ceiling on posts refreshed by one pass |
| `SOCIAL_STATS_FB_VIEW_METRICS` | Facebook view metric candidates, in order |
| `SOCIAL_STATS_FB_ENGAGED_METRICS` | Facebook engaged-users metric candidates, in order |
| `SOCIAL_STATS_FB_CLICKS_METRICS` | Facebook clicks metric candidates, in order |
| `SOCIAL_STATS_IG_VIEW_METRICS` | Instagram view metric candidates, in order |
| `SOCIAL_STATS_IG_SAVED_METRICS` | Instagram saved metric candidates, in order |
| `GRAPH_API_VERSION` [v26.0] | Graph version used by all Meta calls |
| `POST_VIEW_DEDUPE_MINUTES` [30] | How long one viewer's visit counts as the same view |

## How refreshing works

Numbers are refreshed opportunistically: whenever a listing page or a post
detail is served, any post on it whose numbers are older than the applicable
TTL is queued for a background refetch. The visitor is never made to wait —
they are served the stored numbers, and the refreshed ones appear on a later
load.

`middleware/postStatsOverlay.js` reads `views`/`social`/`socialStats` fresh on
every request (not projected into the long-lived post response cache), so
this refresh triggers on a cache hit exactly as reliably as on a cache miss —
a busy listing page keeps its numbers current even if the rest of the page
response is being served from cache.

**The TTL is two-tier, not one flat number.** The first
`SOCIAL_STATS_YOUNG_POST_HOURS` (24h) of a post's life use the much shorter
`SOCIAL_STATS_YOUNG_TTL_MINUTES` (10min) window instead of the settled-post
one (180min). Without this, the very first read — moments after creation,
before anyone off-site has had a chance to react yet — stamps `fetchedAt` and
then blocks every re-check for the next three hours, regardless of what
happens on the Page in between. That is exactly the window an owner is most
likely to be checking: post something, go react to it on the Page yourself to
see it work, come back to the site a few minutes later, and under a flat TTL
you'd see nothing new for hours. A young post is cheap to check often — only
its own owner is realistically reloading it — so the tradeoff is a few more
Graph calls on brand-new posts for numbers that catch up in minutes instead of
hours. A post with no `createdAt` available falls back to the long TTL, never
"always young".

That covers everything anyone is actually looking at. For listings nobody has
opened in a while, run the sweep on a schedule (hourly is plenty):

```
cd server && npm run refresh-social-stats            # stale posts, oldest first
cd server && npm run refresh-social-stats -- --all   # ignore the freshness TTL
cd server && npm run refresh-social-stats -- --limit=500
```

## Limitations worth knowing

- **Listings created before this feature shipped have no numbers, ever.** The
  Facebook post id and Instagram media id are captured at publish time; older
  posts were published before anything stored them, and there is no reliable way
  to map an old listing back to its copy on the Page.
- **A post deleted from the Page keeps its last numbers** and is marked
  unavailable — the site stops asking Graph about it and stops linking to it.
  There is no historical record kept anywhere: this is a poll-based reader,
  not a webhook subscriber, so any engagement that happened between the last
  successful read and the deletion is gone for good the moment the Page copy
  is deleted, even if you saw it happen with your own eyes.
- Engagement is not attributed: there is no way to tell whether a Facebook
  reaction or click turned into a visit here.
- Facebook's "engaged users" and "clicks" are Page-post-level metrics, not
  ad metrics — they reflect organic activity on the auto-posted photo, not a
  boosted/paid campaign.

## Checking it offline

```
cd server && npm run test-social-stats           # the Graph reader
cd server && npm run test-post-stats-overlay      # the response-cache fix
```

No database and no network — Graph is stubbed with a fake that answers in Meta's
own error envelope. `test-social-stats` covers batching, what happens when one
Page post has been deleted, independent per-metric probing (including one
metric renaming or losing permission without affecting the others), and a
Graph outage. `test-post-stats-overlay` covers the middleware that keeps these
numbers out of the long-lived response cache.
