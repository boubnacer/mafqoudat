const axios = require('axios');
const Post = require('../models/Post');
const {
  GRAPH_BASE_URL,
  isMissingObjectError,
  isInvalidMetricError,
  isPermissionError,
  describeGraphError,
} = require('./graphApi');

/**
 * Reads back how a listing is doing on the Facebook Page and the Instagram
 * account it was auto-posted to, and stores the numbers on the post so the
 * site can show them next to its own view counter.
 *
 * Design constraints worth knowing before changing anything here:
 *  - It is never on a request's critical path. Every entry point is called
 *    fire-and-forget; a Graph outage must degrade to stale numbers, never to
 *    a failed page load. Callers read whatever is already stored.
 *  - Counts and insight metrics are fetched separately on purpose.
 *    Reactions/comments/shares/likes come off ordinary edges the page token
 *    already has; views, engaged users, clicks and saves all come from the
 *    insights edge, which needs read_insights (FB) / instagram_manage_insights
 *    (IG) and whose metric names Meta renames on a yearly cadence. Missing
 *    insights must not cost us the counts.
 *  - Metric names are probed, not assumed - independently per metric, not
 *    just per platform. Meta replaced `impressions` with `views` on Instagram
 *    in v22 and is retiring the Page reach/impressions family in favour of
 *    views metrics; the first candidate that answers wins and is remembered
 *    for the life of the process. `post_engaged_users`/`post_clicks` (FB) and
 *    `saved` (IG) are unrelated concepts from views, not alternate names for
 *    it, so each is resolved against its own candidate list.
 */

const readIntEnv = (name, fallback, { min, max }) => {
  const raw = Number.parseInt(process.env[name], 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(raw, min), max);
};

const readListEnv = (name, fallback) => {
  const raw = (process.env[name] || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  return raw.length > 0 ? raw : fallback;
};

// How long stored numbers are considered fresh. Social counters move slowly
// and the point of the feature is a sense of reach, not a live ticker, so the
// default is deliberately generous - it is what keeps a busy listing page from
// turning into a burst of Graph calls.
const TTL_MS = readIntEnv('SOCIAL_STATS_TTL_MINUTES', 180, { min: 5, max: 1440 }) * 60 * 1000;

// Graph caps a batched `?ids=` read at 50 objects.
const BATCH_SIZE = readIntEnv('SOCIAL_STATS_BATCH_SIZE', 50, { min: 1, max: 50 });

// Ceiling on one refresh pass, so a 50-card listing page can never fan out
// into an unbounded number of Graph calls.
const MAX_POSTS_PER_RUN = readIntEnv('SOCIAL_STATS_MAX_PER_RUN', 50, { min: 1, max: 500 });

const REQUEST_TIMEOUT_MS = 10000;

// Candidates tried in order until one answers, independently per metric.
// `views` is Meta's current name on both platforms; the older impressions
// metrics stay in the list for as long as any Graph version still serves
// them. Override the corresponding SOCIAL_STATS_*_METRICS env var when Meta
// renames one again - that is a deploy setting, not a code change.
const FB_VIEW_METRICS = readListEnv('SOCIAL_STATS_FB_VIEW_METRICS', [
  'post_impressions_unique',
  'post_impressions',
  'post_views',
  'post_views_unique',
]);
const IG_VIEW_METRICS = readListEnv('SOCIAL_STATS_IG_VIEW_METRICS', ['views', 'reach', 'impressions']);

// Unique people who did something with the post, not just saw it - a
// stronger reach signal than views. Single stable name so far; kept as a list
// like the others for the same reason (env override without a code change).
const FB_ENGAGED_METRICS = readListEnv('SOCIAL_STATS_FB_ENGAGED_METRICS', ['post_engaged_users']);

// Link/photo clicks specifically, distinct from a reaction or a comment.
const FB_CLICKS_METRICS = readListEnv('SOCIAL_STATS_FB_CLICKS_METRICS', ['post_clicks']);

// Instagram's bookmark count - often a better "genuine interest" signal than
// a like, since saving takes more intent than tapping once while scrolling.
const IG_SAVED_METRICS = readListEnv('SOCIAL_STATS_IG_SAVED_METRICS', ['saved']);

// A failed probe is remembered too, so an account without insights permission
// costs one probe every 6h rather than one per refresh - and still picks the
// metric up by itself once the permission is granted.
const METRIC_PROBE_RETRY_MS = 6 * 60 * 60 * 1000;

class SocialStatsService {
  constructor() {
    // Resolved lazily, one entry per metric (not per platform): key is e.g.
    // "facebook.views" or "instagram.saved" -> { metric: string|null, probedAt }.
    this.resolvedMetrics = new Map();
    // Post ids currently being refreshed, so overlapping requests for the same
    // listing page do not each start their own pass over the same posts.
    this.inFlight = new Set();
  }

  get accessToken() {
    return process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  }

  isConfigured() {
    return !!this.accessToken;
  }

  /** True when the post was mirrored somewhere we can read numbers back from. */
  static hasSocialTargets(post) {
    return !!(post?.social?.facebook?.postId || post?.social?.instagram?.mediaId);
  }

  /** True when the stored numbers are older than the TTL (or absent). */
  static isStale(post, now = Date.now()) {
    const fetchedAt = post?.socialStats?.fetchedAt;
    if (!fetchedAt) return true;
    return now - new Date(fetchedAt).getTime() >= TTL_MS;
  }

  // ---------------------------------------------------------------- fetching

  /**
   * One batched `?ids=` read. Graph fails the whole batch when a single id is
   * unreadable, so a failed batch of more than one is retried per id - that
   * turns "one deleted Page post" from "no numbers for this page of listings"
   * into "no numbers for that one listing".
   */
  async readBatch(ids, fields) {
    if (ids.length === 0) return { values: {}, missing: [] };

    try {
      const response = await axios.get(GRAPH_BASE_URL, {
        params: { ids: ids.join(','), fields, access_token: this.accessToken },
        timeout: REQUEST_TIMEOUT_MS,
      });
      return { values: response.data || {}, missing: [] };
    } catch (error) {
      if (ids.length === 1) {
        if (isMissingObjectError(error)) return { values: {}, missing: [ids[0]] };
        throw error;
      }
      // Only an unreadable object is worth re-asking one id at a time. A
      // network error or a bad token would fail identically N more times.
      if (!isMissingObjectError(error)) throw error;
    }

    const values = {};
    const missing = [];
    for (const id of ids) {
      const single = await this.readBatch([id], fields);
      Object.assign(values, single.values);
      missing.push(...single.missing);
    }
    return { values, missing };
  }

  /**
   * Picks the insights metric name this account/version actually serves for
   * one concept (views, engaged users, clicks, saves - whichever `cacheKey`
   * names). Probes a single object rather than the whole batch, so a wrong
   * guess costs one cheap request instead of a page of them, and each concept
   * is resolved independently since they are different metrics, not
   * alternate names for the same one.
   */
  async resolveMetric(cacheKey, candidates, probeId) {
    const cached = this.resolvedMetrics.get(cacheKey);
    if (cached && (cached.metric || Date.now() - cached.probedAt < METRIC_PROBE_RETRY_MS)) {
      return cached.metric;
    }

    for (const metric of candidates) {
      try {
        const response = await axios.get(`${GRAPH_BASE_URL}/${probeId}/insights`, {
          params: { metric, access_token: this.accessToken },
          timeout: REQUEST_TIMEOUT_MS,
        });
        if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
          this.resolvedMetrics.set(cacheKey, { metric, probedAt: Date.now() });
          console.log(`Social stats: using "${metric}" as the ${cacheKey.replace('.', ' ')} metric`);
          return metric;
        }
      } catch (error) {
        if (isInvalidMetricError(error)) continue;
        if (isPermissionError(error)) {
          console.warn(`Social stats: ${cacheKey.replace('.', ' ')} insights unavailable - ${describeGraphError(error)}`);
          break;
        }
        if (isMissingObjectError(error)) return null; // Bad probe subject, not a bad metric.
        throw error;
      }
    }

    this.resolvedMetrics.set(cacheKey, { metric: null, probedAt: Date.now() });
    return null;
  }

  /** The value for one named metric out of an `insights` payload, or null. */
  static readInsightValue(insights, metricName) {
    if (!metricName) return null;
    const entry = insights?.data?.find((item) => item.name === metricName);
    const value = entry?.values?.[0]?.value;
    return typeof value === 'number' ? value : null;
  }

  /**
   * Facebook Page posts: reactions/comments/shares off the ordinary edges,
   * views/engaged users/clicks off insights when the token has read_insights
   * - each resolved and requested as its own metric, since a rename or a
   * missing permission on one must not cost the others.
   */
  async fetchFacebook(ids) {
    const [viewsMetric, engagedMetric, clicksMetric] = await Promise.all([
      this.resolveMetric('facebook.views', FB_VIEW_METRICS, ids[0]),
      this.resolveMetric('facebook.engagement', FB_ENGAGED_METRICS, ids[0]),
      this.resolveMetric('facebook.clicks', FB_CLICKS_METRICS, ids[0]),
    ]);

    const insightMetrics = [viewsMetric, engagedMetric, clicksMetric].filter(Boolean);
    const fields = [
      'reactions.summary(total_count)',
      'comments.summary(total_count)',
      'shares',
      insightMetrics.length > 0 && `insights.metric(${insightMetrics.join(',')})`,
    ].filter(Boolean).join(',');

    const { values, missing } = await this.readBatch(ids, fields);

    const stats = {};
    for (const [id, data] of Object.entries(values)) {
      stats[id] = {
        reactions: data?.reactions?.summary?.total_count ?? null,
        comments: data?.comments?.summary?.total_count ?? null,
        // `shares` is absent entirely on a post nobody has shared, which is a
        // zero rather than an unknown - unlike the summaries, which are always
        // returned when readable.
        shares: data?.shares?.count ?? 0,
        views: SocialStatsService.readInsightValue(data?.insights, viewsMetric),
        engagedUsers: SocialStatsService.readInsightValue(data?.insights, engagedMetric),
        clicks: SocialStatsService.readInsightValue(data?.insights, clicksMetric),
      };
    }
    return { stats, missing };
  }

  /**
   * Instagram media: like/comment counts plus the views and saved insights,
   * each resolved and requested as its own metric for the same reason as FB.
   */
  async fetchInstagram(ids) {
    const [viewsMetric, savedMetric] = await Promise.all([
      this.resolveMetric('instagram.views', IG_VIEW_METRICS, ids[0]),
      this.resolveMetric('instagram.saved', IG_SAVED_METRICS, ids[0]),
    ]);

    const insightMetrics = [viewsMetric, savedMetric].filter(Boolean);
    const fields = [
      'like_count',
      'comments_count',
      insightMetrics.length > 0 && `insights.metric(${insightMetrics.join(',')})`,
    ].filter(Boolean).join(',');

    const { values, missing } = await this.readBatch(ids, fields);

    const stats = {};
    for (const [id, data] of Object.entries(values)) {
      stats[id] = {
        likes: typeof data?.like_count === 'number' ? data.like_count : null,
        comments: typeof data?.comments_count === 'number' ? data.comments_count : null,
        views: SocialStatsService.readInsightValue(data?.insights, viewsMetric),
        saved: SocialStatsService.readInsightValue(data?.insights, savedMetric),
      };
    }
    return { stats, missing };
  }

  // --------------------------------------------------------------- refreshing

  static chunk(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
  }

  /**
   * Fetches and stores stats for the given posts. Returns the number of posts
   * whose stored stats were updated. Throws only on programmer error - Graph
   * failures are logged and leave the previous numbers in place.
   */
  async refreshPosts(posts) {
    if (!this.isConfigured() || posts.length === 0) return 0;

    const facebookIds = [];
    const instagramIds = [];
    for (const post of posts) {
      // A post whose Page copy is gone keeps its last numbers and is never
      // asked about again; the other platform is unaffected.
      if (post.social?.facebook?.postId && !post.socialStats?.facebook?.unavailable) {
        facebookIds.push(post.social.facebook.postId);
      }
      if (post.social?.instagram?.mediaId && !post.socialStats?.instagram?.unavailable) {
        instagramIds.push(post.social.instagram.mediaId);
      }
    }

    const facebook = { stats: {}, missing: [] };
    const instagram = { stats: {}, missing: [] };

    for (const batch of SocialStatsService.chunk(facebookIds, BATCH_SIZE)) {
      try {
        const result = await this.fetchFacebook(batch);
        Object.assign(facebook.stats, result.stats);
        facebook.missing.push(...result.missing);
      } catch (error) {
        console.error(`Social stats: Facebook batch failed - ${describeGraphError(error)}`);
      }
    }

    for (const batch of SocialStatsService.chunk(instagramIds, BATCH_SIZE)) {
      try {
        const result = await this.fetchInstagram(batch);
        Object.assign(instagram.stats, result.stats);
        instagram.missing.push(...result.missing);
      } catch (error) {
        console.error(`Social stats: Instagram batch failed - ${describeGraphError(error)}`);
      }
    }

    const fetchedAt = new Date();
    const operations = [];

    for (const post of posts) {
      const fbId = post.social?.facebook?.postId;
      const igId = post.social?.instagram?.mediaId;
      const fb = fbId ? facebook.stats[fbId] : null;
      const ig = igId ? instagram.stats[igId] : null;
      const fbGone = fbId ? facebook.missing.includes(fbId) : false;
      const igGone = igId ? instagram.missing.includes(igId) : false;

      if (!fb && !ig && !fbGone && !igGone) continue;

      const update = { 'socialStats.fetchedAt': fetchedAt };
      if (fb) {
        update['socialStats.facebook.reactions'] = fb.reactions;
        update['socialStats.facebook.comments'] = fb.comments;
        update['socialStats.facebook.shares'] = fb.shares;
        // Insight-derived fields can legitimately be unavailable (no
        // read_insights) while the counts are fine - keep whatever was
        // stored rather than nulling it out.
        if (fb.views !== null) update['socialStats.facebook.views'] = fb.views;
        if (fb.engagedUsers !== null) update['socialStats.facebook.engagedUsers'] = fb.engagedUsers;
        if (fb.clicks !== null) update['socialStats.facebook.clicks'] = fb.clicks;
      }
      if (ig) {
        update['socialStats.instagram.likes'] = ig.likes;
        update['socialStats.instagram.comments'] = ig.comments;
        if (ig.views !== null) update['socialStats.instagram.views'] = ig.views;
        if (ig.saved !== null) update['socialStats.instagram.saved'] = ig.saved;
      }
      if (fbGone) update['socialStats.facebook.unavailable'] = true;
      if (igGone) update['socialStats.instagram.unavailable'] = true;

      operations.push({ updateOne: { filter: { _id: post._id }, update: { $set: update } } });
    }

    if (operations.length === 0) return 0;
    await Post.bulkWrite(operations, { ordered: false });
    return operations.length;
  }

  /**
   * Refreshes whichever of the given posts are mirrored and stale, capped at
   * MAX_POSTS_PER_RUN. Takes the post documents a controller already has in
   * hand, so the common case costs no extra database read.
   */
  async refreshStale(posts) {
    if (!this.isConfigured()) return 0;

    const now = Date.now();
    const due = (Array.isArray(posts) ? posts : [posts])
      .filter((post) => SocialStatsService.hasSocialTargets(post) && SocialStatsService.isStale(post, now))
      .filter((post) => !this.inFlight.has(String(post._id)))
      .slice(0, MAX_POSTS_PER_RUN);

    if (due.length === 0) return 0;

    due.forEach((post) => this.inFlight.add(String(post._id)));
    try {
      return await this.refreshPosts(due);
    } finally {
      due.forEach((post) => this.inFlight.delete(String(post._id)));
    }
  }

  /**
   * Fire-and-forget entry point for request handlers. Deferred past the
   * response the same way match scanning is: reading social numbers must
   * never be something a visitor waits on.
   */
  scheduleRefresh(posts) {
    if (!this.isConfigured()) return;
    setImmediate(() => {
      this.refreshStale(posts).catch((error) => {
        console.error('Social stats refresh failed:', error.message);
      });
    });
  }
}

module.exports = new SocialStatsService();
module.exports.SocialStatsService = SocialStatsService;
module.exports.TTL_MS = TTL_MS;
module.exports.MAX_POSTS_PER_RUN = MAX_POSTS_PER_RUN;
