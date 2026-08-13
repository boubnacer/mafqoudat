# Post reach: site views + Facebook/Instagram engagement

Every listing is auto-posted to the Mafqoudat Facebook Page and Instagram
account when it is created. This document covers reading the resulting
engagement back into the site, and the site's own view counter alongside it.

## What is shown

| Number | Source | Where |
| --- | --- | --- |
| Views | The site/app itself, counted per visitor | Post cards, post detail |
| Facebook views, reactions, comments, shares | Graph API, Page post | Post detail (breakdown), cards (interactions total) |
| Instagram views, likes, comments | Graph API, IG media | Post detail (breakdown), cards (interactions total) |

Site views and social views are never added together, and the two platforms are
never pooled into a single figure. A visit to the post page, a reaction on
Facebook and an impression in someone's feed measure different things; one
combined "total reach" number would be a figure nobody actually measured.

A counter that has not been fetched yet is not shown at all — it is not
rendered as zero. So a listing whose numbers have never been read back shows
nothing rather than an unbroken row of zeros.

## Requirements on the Meta side

The same System User token already used for auto-posting
(`FACEBOOK_PAGE_ACCESS_TOKEN`) is used for reading. Which numbers appear
depends on what that token is allowed to read:

| Numbers | Permission needed |
| --- | --- |
| Facebook reactions, comments, shares | `pages_read_engagement` (already required for posting) |
| Instagram likes, comments | `instagram_basic` / `instagram_business_basic` |
| Facebook views | `read_insights` |
| Instagram views | `instagram_manage_insights` |

The first two are almost certainly already granted — auto-posting does not work
without the equivalent scopes. **The two insight permissions are separate and
usually require App Review.** Without them everything still works; only the view
counts stay empty, and nothing in the UI breaks.

### Metric names move

Meta renames insight metrics on a roughly yearly cadence — Instagram's
`impressions` was replaced by `views` in Graph API v22 (April 2025) and the
Facebook Page reach/impressions family was retired in favour of views metrics in
June 2026. The server therefore *probes* rather than assumes: it tries each
candidate name in order and keeps the first one that answers.

If a rename breaks view counts, set the new name first in the environment — no
code change or deploy of new code is needed:

```
SOCIAL_STATS_FB_VIEW_METRICS=<new_name>,post_impressions_unique,post_impressions
SOCIAL_STATS_IG_VIEW_METRICS=<new_name>,views
```

The log line to look for on startup traffic is
`Social stats: using "<metric>" as the facebook views metric`. If insights are
unavailable you will instead see
`Social stats: facebook insights unavailable - (#10) ...`.

## Configuration

All optional; defaults in brackets.

| Variable | Meaning |
| --- | --- |
| `SOCIAL_STATS_TTL_MINUTES` [180] | How long stored numbers count as fresh before a page view triggers a refetch |
| `SOCIAL_STATS_BATCH_SIZE` [50] | Objects per batched Graph read (Graph's own maximum is 50) |
| `SOCIAL_STATS_MAX_PER_RUN` [50] | Ceiling on posts refreshed by one pass |
| `SOCIAL_STATS_FB_VIEW_METRICS` | Facebook view metric candidates, in order |
| `SOCIAL_STATS_IG_VIEW_METRICS` | Instagram view metric candidates, in order |
| `GRAPH_API_VERSION` [v26.0] | Graph version used by all Meta calls |
| `POST_VIEW_DEDUPE_MINUTES` [30] | How long one viewer's visit counts as the same view |

## How refreshing works

Numbers are refreshed opportunistically: whenever a listing page or a post
detail is served, any post on it whose numbers are older than the TTL is queued
for a background refetch. The visitor is never made to wait — they are served
the stored numbers, and the refreshed ones appear on a later load.

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
- **The displayed view count can lag the stored one** by up to the post detail
  cache TTL (30 minutes). The stored count is always current.
- Engagement is not attributed: there is no way to tell whether a Facebook
  reaction turned into a visit here.

## Checking it offline

```
cd server && npm run test-social-stats
```

No database and no network — Graph is stubbed with a fake that answers in Meta's
own error envelope. It covers batching, what happens when one Page post has been
deleted, metric probing, running without insight permissions, and a Graph
outage.
